import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";
import { Box, Loader2, X } from "lucide-react";
import { ROOM_ASSETS, roomTitle } from "./roomAssets";

/**
 * Reusable 3D popup for a room. Takes a 3D asset room id (`roomId`, e.g.
 * `r02`), looks its GLB up from the ROOM_ASSETS manifest, and renders an
 * interactive view (orbit/zoom) with the room's IoT markers wired to the same
 * dashboard state via `onDeviceClick`. Fully mounted/unmounted by the caller
 * so the WebGL context never accumulates across open/close sessions.
 */

/* ------------------------------------------------------------------ */
/*  Marker identification: Blender `extras` OR the `IOT_` name pattern  */
/* ------------------------------------------------------------------ */

/** Derive a device id from a node, preferring Blender custom props (older
 *  exports carry `extras.clickable` + `extras.device_id`), else falling back
 *  to the `IOT_` node-name convention of newer exports. Compass sub-marker
 *  empties collapse onto their parent id
 *  (`IOT_LIGHT_PROFILE_KITCHEN_INNER_E` → `light_profile_kitchen_inner`). */
function markerDeviceId(o: THREE.Object3D): string | undefined {
  const ud = o.userData as Record<string, unknown> | undefined;
  if (ud?.clickable && typeof ud.device_id === "string") return ud.device_id;
  const name = o.name;
  if (!name.startsWith("IOT_")) return undefined;
  return name.slice(4).toLowerCase().replace(/_[ensw]$/, "");
}

/** Walk up from the raycast hit to the nearest node that resolves to a
 *  device id (markers are an "empty" node whose spawned child sprite is hit). */
function clickableNode(hit: THREE.Object3D): THREE.Object3D | null {
  let cur: THREE.Object3D | null = hit;
  while (cur) {
    if (markerDeviceId(cur)) return cur;
    cur = cur.parent;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  WiFi icon markers (sprites), tinted by state                        */
/* ------------------------------------------------------------------ */

const WIFI_ON_COLOR = new THREE.Color("#22c55e");
const WIFI_OFF_COLOR = new THREE.Color("#ef4444");
/** World-space size of the icon as rendered in the room (sprite height). */
const WIFI_BASE_SCALE = 0.38;
/** Lift the icon slightly above its anchor so close-set wall/ceiling marker
 *  empties (e.g. ceiling light vs smoke sensor, ~3cm apart) read separately. */
const WIFI_LIFT = 0.12;
/** Anchor distance below which two wifi icons visibly overlap. */
const WIFI_OVERLAP_DIST = 0.3;
/** Extra vertical gap for the lifted icon of an overlapping pair — sized so
 *  badge halves (chip Ø ≈ 0.36m at WIFI_BASE_SCALE) no longer overlap. */
const WIFI_LIFT_GAP = 0.4;

/** Resolve per-id icon lifts so overlapping marker empties (authorable only
 *  centimetres apart inside one LED profile) separate cleanly: any two anchors
 *  closer than the icon size get their lexicographically-later id pushed DOWN
 *  below its anchor by a fixed gap — down, not up, so the separated badge
 *  hangs into open room space instead of clipping into the ceiling slab.
 *  Deterministic across mounts, so icons never twitch. */
function resolveMarkerLifts(clickables: THREE.Object3D[]): Map<string, number> {
  const lift = new Map<string, number>();
  const entries = clickables
    .map((m) => ({
      id: markerDeviceId(m)!,
      pos: m.getWorldPosition(new THREE.Vector3()),
    }))
    .filter((e) => e.id);
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i];
      const b = entries[j];
      if (a.id === b.id) continue;
      if (a.pos.distanceTo(b.pos) < WIFI_OVERLAP_DIST) {
        const down = a.id < b.id ? b : a;
        lift.set(down.id, WIFI_LIFT - WIFI_LIFT_GAP);
      }
    }
  }
  return lift;
}

/** Draw the standard (MDI-style) white wifi glyph on a dark "badge" chip once
 *  per variant. Sprites tint the whole map via SpriteMaterial.color — the near-
 *  black chip stays neutral so the glyph and its state ring pop on any surface.
 *  `off` variant carries the wifi-strength-off slash (red when tinted). */
function buildWifiTexture(withSlash: boolean): THREE.CanvasTexture {
  const size = 192;
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;

  // Dark backing chip + soft colored inner glow (both tint-multiplied).
  const chip = ctx.createRadialGradient(cx, cy, size * 0.1, cx, cy, size * 0.47);
  chip.addColorStop(0, "rgba(255,255,255,0.10)");
  chip.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = "rgba(10, 13, 20, 0.72)";
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.47, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = chip;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.47, 0, Math.PI * 2);
  ctx.fill();

  // Colored state ring around the chip (readable even at small size).
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = size * 0.05;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.425, 0, Math.PI * 2);
  ctx.stroke();

  // Wifi glyph: dot at the bottom, three nested arcs flaring up from it.
  const dotY = cy + size * 0.18;
  ctx.strokeStyle = "#ffffff";
  ctx.lineCap = "round";
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx, dotY, size * 0.07, 0, Math.PI * 2);
  ctx.fill();
  // Half-angle 85° around the top (270°), matched to the standard wifi fan.
  const arcs: Array<[radius: number, lineWidth: number]> = [
    [size * 0.16, size * 0.06],
    [size * 0.29, size * 0.07],
    [size * 0.42, size * 0.08],
  ];
  for (const [r, lw] of arcs) {
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(cx, dotY, r, (185 * Math.PI) / 180, (355 * Math.PI) / 180);
    ctx.stroke();
  }

  // wifi-strength-off slash: diagonal through the fan, tinted red when off.
  if (withSlash) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = size * 0.075;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.34, cy - size * 0.04);
    ctx.lineTo(cx + size * 0.34, cy + size * 0.30);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
const WIFI_TEXTURE = buildWifiTexture(false);
const WIFI_TEXTURE_OFF = buildWifiTexture(true);

/** Deterministic per-id phase offset so "on" icons heartbeat in stagger. */
function wifiPhaseOffset(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h % 1000) / 1000;
}

/* ------------------------------------------------------------------ */
/*  Scene: fit camera, light, raycast clicks, live marker state        */
/* ------------------------------------------------------------------ */

interface InternalSceneProps {
  url: string;
  deviceStates?: Record<string, boolean>;
  onDeviceClick?: (deviceId: string) => void;
}

/** Marker hotspots in the GLB are EMPTY nodes (Blender empties, no geography)
 *  that the exporter tags for IoT devices. We spawn one wifi "tag" sprite per
 *  clickable empty, parented to the empty so the ancestor walk (sprite →
 *  empty) resolves the device id and raycasts hit it. The GLB scene is cached
 *  across mounts, so guard by scene identity to avoid duplicate sprites. */

const spawnWifiMarker = (): THREE.Sprite =>
  new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: WIFI_TEXTURE_OFF,
      color: WIFI_OFF_COLOR.clone(),
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );

function RoomScene({ url, deviceStates, onDeviceClick }: InternalSceneProps) {
  const { scene } = useGLTF(url);
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const controls = useThree((s) => s.controls) as unknown as
    | { target: THREE.Vector3; minDistance: number; maxDistance: number; update: () => void }
    | null;

  // Marker nodes: every node that resolves to a device id, deduped by id and
  // intersected with the ids wired into the dashboard — so e.g. the ceiling
  // strip `light_profile_*` empties (present in the GLB, not in the dashboard)
  // stay inert instead of spawning dead markers.
  const clickables = useMemo(() => {
    const byId = new Map<string, THREE.Object3D>();
    const wired = new Set(Object.keys(deviceStates ?? {}));
    scene.traverse((o) => {
      const id = markerDeviceId(o);
      if (id && wired.has(id) && !byId.has(id)) byId.set(id, o);
    });
    return Array.from(byId.values());
  }, [scene, deviceStates]);

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // One-time per-mount bookkeeping.
  const fitted = useRef(false);
  const lastFit = useRef<{ center: number[]; size: number[]; maxDim: number } | null>(null);

  const markerById = useRef<Map<string, THREE.Sprite>>(new Map());
  // Mutable mirrors so the per-frame pulse loop never reads staleness.
  const deviceStatesRef = useRef(deviceStates);
  const hoverRef = useRef<string | null>(null);
  useEffect(() => {
    deviceStatesRef.current = deviceStates;
  }, [deviceStates]);
  useEffect(() => {
    hoverRef.current = hoveredId;
  }, [hoveredId]);

  // The GLB scene is cached across mounts, so a mount-scoped guard can never
  // prevent duplicates. Instead look the wifi tag up by name on each marker
  // empty and only spawn when missing; always repopulate the id→sprite map so
  // tint/pulse/fit keep working on every remount. Overlapping anchors get a
  // deterministic per-id lift so nested profile markers separate visually.
  useEffect(() => {
    scene.updateWorldMatrix(true, true);
    const lifts = resolveMarkerLifts(clickables);
    for (const m of clickables) {
      const id = markerDeviceId(m);
      if (!id) continue;
      let sprite = m.getObjectByName(`iot_wifi_${id}`) as THREE.Sprite | null;
      if (!sprite) {
        sprite = spawnWifiMarker();
        sprite.name = `iot_wifi_${id}`;
        sprite.userData.base = WIFI_BASE_SCALE;
        sprite.position.set(0, lifts.get(id) ?? WIFI_LIFT, 0);
        m.add(sprite);
      }
      markerById.current.set(id, sprite);
    }
  }, [scene, clickables]);

  /* Live marker state: tint each wifi icon off its device state. Green = on,
     red = off. Pulsing is driven per-frame below, not by state changes. */
  useEffect(() => {
    for (const [id, sprite] of markerById.current) {
      const on = !!deviceStates?.[id];
      const mat = sprite.material as THREE.SpriteMaterial;
      mat.map = on ? WIFI_TEXTURE : WIFI_TEXTURE_OFF;
      sprite.userData.variant = on ? "wifi" : "wifi-off";
      mat.color.copy(on ? WIFI_ON_COLOR : WIFI_OFF_COLOR);
    }
  }, [deviceStates]);

  /* Heartbeat pulse for "on" markers only: a double-thump (lub-DUB) every
     ~1.1s, phased per device so icons don't thump in lockstep. Off markers
     hold a static red icon — no motion. */
  useFrame(() => {
    const t = performance.now() / 1000;
    const CYCLE = 1.1;
    for (const [id, sprite] of markerById.current) {
      const on = !!deviceStatesRef.current?.[id];
      let beat = 0;
      if (on) {
        const ph = (t + wifiPhaseOffset(id)) % CYCLE;
        if (ph < 0.13) beat = Math.sin((ph / 0.13) * Math.PI);
        else if (ph < 0.26) beat = Math.sin(((ph - 0.13) / 0.13) * Math.PI) * 0.55;
        else if (ph >= 0.58 && ph < 0.7) beat = Math.sin(((ph - 0.58) / 0.12) * Math.PI);
      }
      const hover = hoverRef.current === id;
      const s = (sprite.userData.base as number) * (on ? 1 + 0.2 * beat : 1) * (hover ? 1.12 : 1);
      sprite.scale.set(s, s, 1);
    }
  });

  /* Manual hit-testing on the wrapper div. Important: GLB child meshes are
     plain three objects without `__r3f` nodes, so R3F's object-level click/
     hover props on the <primitive> root never fire for them. We raycast from
     the DOM pointer position against the whole scene ourselves and climb the
     parent chain for the nearest `clickable` + `device_id` marker node. */
  const raycaster = useRef(new THREE.Raycaster());
  const lastMove = useRef<{ x: number; y: number } | null>(null);
  const moveRaf = useRef(0);
  const downPos = useRef<{ x: number; y: number } | null>(null);

  const pick = useCallback(
    (clientX: number, clientY: number): string | null => {
      const el = gl.domElement;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      const ndc = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -(((clientY - rect.top) / rect.height) * 2 - 1),
      );
      raycaster.current.setFromCamera(ndc, camera);
      const hits = raycaster.current.intersectObjects(scene.children, true);
      // Markers are the only interactive objects. When overlapping markers are
      // both under the cursor (e.g. overlapping wifi icons or 3cm-apart points
      // like the ceiling light and smoke sensor), pick the one whose CENTER is
      // closest to the ray — that is the marker being visually pointed at.
      let best: { ang: number; id: string } | null = null;
      for (const h of hits) {
        const node = clickableNode(h.object);
        if (!node) continue;
        const id = markerDeviceId(node) as string;
        const world = new THREE.Vector3().setFromMatrixPosition(node.matrixWorld);
        const toMarker = world.sub(camera.position).normalize();
        const ang = raycaster.current.ray.direction.angleTo(toMarker);
        if (!best || ang < best.ang) best = { ang, id };
      }
      return best?.id ?? null;
    },
    [gl, camera, scene],
  );

  useEffect(() => {
    const onMove = () => {
      if (!lastMove.current) return;
      const { x, y } = lastMove.current;
      const id = pick(x, y);
      setHoveredId(id);
      document.body.style.cursor = id ? "pointer" : "auto";
    };
    const schedule = () => {
      if (moveRaf.current) return;
      moveRaf.current = requestAnimationFrame(() => {
        moveRaf.current = 0;
        onMove();
      });
    };
    const handlePointerMove = (e: PointerEvent) => {
      lastMove.current = { x: e.clientX, y: e.clientY };
      schedule();
    };
    const handlePointerDown = (e: PointerEvent) => {
      downPos.current = { x: e.clientX, y: e.clientY };
    };
    const handleClick = (e: MouseEvent) => {
      if (downPos.current) {
        const dx = e.clientX - downPos.current.x;
        const dy = e.clientY - downPos.current.y;
        // Ignore clicks that were actually orbit/pan drags.
        if (dx * dx + dy * dy > 36) return;
        downPos.current = null;
      }
      const id = pick(e.clientX, e.clientY);
      if (id) onDeviceClick?.(id);
    };
    const handlePointerLeave = () => {
      lastMove.current = null;
      setHoveredId(null);
      document.body.style.cursor = "auto";
    };
    const el = gl.domElement;
    el.addEventListener("pointermove", handlePointerMove);
    el.addEventListener("pointerdown", handlePointerDown);
    el.addEventListener("click", handleClick);
    el.addEventListener("pointerleave", handlePointerLeave);
    return () => {
      if (moveRaf.current) cancelAnimationFrame(moveRaf.current);
      el.removeEventListener("pointermove", handlePointerMove);
      el.removeEventListener("pointerdown", handlePointerDown);
      el.removeEventListener("click", handleClick);
      el.removeEventListener("pointerleave", handlePointerLeave);
      document.body.style.cursor = "auto";
      const w = window as unknown as { __roomViewerDev?: { raycastAt?: unknown } };
      if (w.__roomViewerDev?.raycastAt) delete w.__roomViewerDev.raycastAt;
    };
  }, [pick, onDeviceClick, gl]);

  /* Auto-fit: frame the scene's own bounding box — camera distance, target
     and near/far all derive from Box3, so no room-specific numbers. */
  useEffect(() => {
    if (!scene || fitted.current) return;
    const box = new THREE.Box3().setFromObject(scene);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const dir = new THREE.Vector3(1, 0.55, 1).normalize();
    camera.position.copy(center).addScaledVector(dir, maxDim * 1.6);
    camera.near = Math.max(maxDim / 100, 0.01);
    camera.far = maxDim * 8;
    camera.updateProjectionMatrix();
    if (controls) {
      // OrbitControls registers via makeDefault after first render — only
      // mark the fit complete once the orbit target is actually centred.
      controls.target.copy(center);
      controls.minDistance = maxDim * 0.2;
      controls.maxDistance = maxDim * 5;
      controls.update();
      fitted.current = true;
    } else {
      camera.lookAt(center);
    }
    lastFit.current = { center: center.toArray(), size: size.toArray(), maxDim };
  }, [scene, camera, controls]);

  /* DEV-only handles surfaced to the browser test (plain DOM automation
     cannot raycast WebGL): camera/target introspection, direct click, marker
     state, and world→screen projection for a real synthetic pointer click. */
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const project = (deviceId: string) => {
      const hit = clickables.find((m) => markerDeviceId(m) === deviceId);
      if (!hit) return null;
      const v = new THREE.Vector3();
      // Aim at the spawned icon (which sits at its resolved lift), not the
      // anchor empty, so synthetic clicks land on the visible badge.
      const sprite = hit.getObjectByName(`iot_wifi_${deviceId}`);
      (sprite ?? hit).getWorldPosition(v);
      v.project(camera);
      const canvas = document.querySelector<HTMLCanvasElement>(".room-viewer canvas");
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return {
        x: rect.left + (v.x * 0.5 + 0.5) * rect.width,
        y: rect.top + (-v.y * 0.5 + 0.5) * rect.height,
        ndc: [v.x, v.y],
      };
    };
    const api = {
      box: lastFit,
      cameraPos: () => camera.position.toArray(),
      target: () => controls?.target.toArray() ?? null,
      markers: () =>
        clickables.map((m) => ({
          device_id: markerDeviceId(m),
          world: new THREE.Vector3().setFromMatrixPosition(m.matrixWorld).toArray(),
        })),
      project,
      wifi: () =>
        Array.from(markerById.current, ([id, s]) => ({
          id,
          variant: s.userData.variant as string | undefined,
          lift: +s.position.y.toFixed(3),
          color: "#" + (s.material as THREE.SpriteMaterial).color.getHexString(),
          scale: +s.scale.x.toFixed(3),
        })),
      clickDevice: (deviceId: string) => onDeviceClick?.(deviceId),
      getMarkerState: (deviceId: string) => !!deviceStatesRef.current?.[deviceId],
      raycastAt: (clientX: number, clientY: number) => {
        const first = pick(clientX, clientY);
        const el = gl.domElement;
        const rect = el.getBoundingClientRect();
        const ndc = new THREE.Vector2(
          ((clientX - rect.left) / rect.width) * 2 - 1,
          -(((clientY - rect.top) / rect.height) * 2 - 1),
        );
        raycaster.current.setFromCamera(ndc, camera);
        const hit = raycaster.current.intersectObjects(scene.children, true)[0];
        return { topObject: hit?.object.name ?? null, marker: first };
      },
      markerReport: () =>
        clickables.map((m) => {
          const world = new THREE.Vector3().setFromMatrixPosition(m.matrixWorld);
          const p = project(markerDeviceId(m)!);
          const self = (() => {
            if (!p) return null;
            const r = new THREE.Raycaster();
            r.setFromCamera(new THREE.Vector2(p.ndc[0], p.ndc[1]), camera);
            const hits = r.intersectObject(m, true);
            return hits.length
              ? { dist: hits[0].distance, name: hits[0].object.name, type: hits[0].object.type }
              : null;
          })();
          let ancestorsHidden = false;
          let p2 = m.parent;
          while (p2) {
            if (!p2.visible) ancestorsHidden = true;
            p2 = p2.parent;
          }
          const mesh = m as THREE.Mesh;
          return {
            device_id: markerDeviceId(m),
            type: m.type,
            visible: m.visible,
            ancestorsHidden,
            children: m.children.length,
            hasGeom: !!mesh.geometry,
            matSide: Array.isArray(mesh.material)
              ? (mesh.material[0] as THREE.Material | null)?.side ?? null
              : (mesh.material as THREE.Material | null)?.side ?? null,
            rayHitsSelf: self,
            world,
          };
        }),
    };
    const w = window as unknown as { __roomViewerDev?: object };
    w.__roomViewerDev = api;
    return () => {
      if (w.__roomViewerDev === api) delete w.__roomViewerDev;
    };
  }, [camera, controls, clickables, deviceStates, onDeviceClick, scene, gl, pick]);

  return (
    <group>
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 9, 4]} intensity={1.5} />
      <directionalLight position={[-6, 5, -3]} intensity={0.45} color="#a8c8ff" />
      <pointLight position={[0, 3.2, 0]} intensity={0.35} color="#fff2df" />
      <primitive
        object={scene}
      />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Popup: modal shell + Canvas + loading overlay                       */
/* ------------------------------------------------------------------ */

export interface RoomViewer3DProps {
  /** 3D manifest room id (e.g. `r02`) — resolved via ROOM_ASSETS. */
  roomId: string;
  /** Current on/off state per device id, mirrored from the dashboard store. */
  deviceStates?: Record<string, boolean>;
  /** Clicking a marker fires the same handler the 2D cards use. */
  onDeviceClick?: (deviceId: string) => void;
  onClose: () => void;
}

export default function RoomViewer3D({ roomId, deviceStates, onDeviceClick, onClose }: RoomViewer3DProps) {
  const asset = ROOM_ASSETS[roomId];
  const { active, progress } = useProgress();
  const loading = active || progress < 100;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Hooks may run even when the asset is unknown — bail after them.
  if (!asset) return null;

  return (
    <motion.div
      className="room-viewer-backdrop"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.section
        className="room-viewer"
        role="dialog"
        aria-modal="true"
        aria-label={`${roomTitle(roomId)} 3D view`}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2 }}
      >
        <header className="room-viewer-head">
          <div className="room-viewer-title">
            <span className="room-viewer-icon" aria-hidden="true">
              <Box size={16} strokeWidth={1.6} />
            </span>
            <div>
              <h2>{roomTitle(roomId)} · 3D</h2>
              <p className="room-viewer-sub">Orbit to inspect · click a marker to toggle</p>
            </div>
          </div>
          <button type="button" className="room-viewer-close" onClick={onClose} aria-label="Close 3D view">
            <X size={17} strokeWidth={1.8} />
          </button>
        </header>
        <div className="room-viewer-body">
          {loading && (
            <div className="room-viewer-loading" role="status">
              <Loader2 className="room-viewer-spin" size={18} strokeWidth={1.6} />
              <span>Loading room…</span>
            </div>
          )}
          <Canvas
            camera={{ fov: 50, near: 0.1, far: 200 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          >
            <Suspense fallback={null}>
              <RoomScene url={asset.glb} deviceStates={deviceStates} onDeviceClick={onDeviceClick} />
            </Suspense>
          </Canvas>
        </div>
      </motion.section>
    </motion.div>
  );
}

