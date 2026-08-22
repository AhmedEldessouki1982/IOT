import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Grid, Html, Lightformer, OrbitControls } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import type { Mesh, MeshBasicMaterial } from "three";
import { DEVICES } from "../../config/apartment";
import type { DevicePlacement } from "../../config/apartment";
import { defaultStateFor } from "../../config/apartment";
import type { Vec3 } from "../../types";
import { useDeviceStore } from "../../store/useDeviceStore";
import { ApartmentShell } from "../shell/ApartmentShell";
import { Furniture } from "../furniture/Furniture";
import { CeilingLight } from "../devices/CeilingLight";
import { FloorLamp } from "../devices/FloorLamp";
import { ACUnit } from "../devices/ACUnit";
import { TVSet } from "../devices/TVSet";
import { Curtains } from "../devices/Curtains";
import { SensorTag } from "../devices/SensorTag";

export type TimeOfDay = "day" | "night";

export interface ScenePose {
  position: Vec3;
  target: Vec3;
}

const INTRO_POSITION: Vec3 = [30, 24, 36];

const PRESETS = {
  day: {
    bg: "#d8dee3",
    ground: "#ccd2d6",
    cell: "#bfc7cd",
    section: "#9aa6ae",
    hemiSky: "#ffffff",
    hemiGround: "#b0a48e",
    hemiInt: 0.55,
    ambient: 0.35,
    sunInt: 2.6,
    sunColor: "#fff4e0",
    fillInt: 0.6,
    bloom: 0.22,
  },
  night: {
    bg: "#070b12",
    ground: "#090d13",
    cell: "#141b26",
    section: "#223043",
    hemiSky: "#1c2740",
    hemiGround: "#05070a",
    hemiInt: 0.18,
    ambient: 0.07,
    sunInt: 0.35,
    sunColor: "#7f9bd1",
    fillInt: 0.05,
    bloom: 1.15,
  },
} as const;

/* ------------------------------------------------------------- selection */

function SelectionRing({ x, z }: { x: number; z: number }) {
  const ref = useRef<Mesh>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    ref.current.scale.setScalar(1 + Math.sin(t * 3) * 0.07);
    (ref.current.material as MeshBasicMaterial).opacity = 0.6 + Math.sin(t * 3 + 1.2) * 0.2;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.028, z]}>
      <ringGeometry args={[0.27, 0.34, 40]} />
      <meshBasicMaterial color="#d4af6a" transparent opacity={0.75} depthWrite={false} />
    </mesh>
  );
}

/** Glanceable "live floorplan": soft pulsing dot under every ACTIVE device. */
function ActiveMarker({ x, z }: { x: number; z: number }) {
  const ref = useRef<Mesh>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    ref.current.scale.setScalar(1 + Math.sin(t * 2.2) * 0.12);
    (ref.current.material as MeshBasicMaterial).opacity = 0.3 + Math.sin(t * 2.2) * 0.13;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, z]}>
      <ringGeometry args={[0.11, 0.16, 32]} />
      <meshBasicMaterial color="#33ff99" transparent depthWrite={false} />
    </mesh>
  );
}

const ACTIVATABLE = new Set(["ceilingLight", "lamp", "ac", "tv"]);

function ActiveMarkers({ selectedId }: { selectedId: string | null }) {
  const states = useDeviceStore((s) => s.states);
  const actives = DEVICES.filter((d) => {
    if (!ACTIVATABLE.has(d.kind)) return false;
    if (d.deviceId === selectedId) return false;
    const merged = { ...defaultStateFor(d.kind), ...(states[d.deviceId]?.state ?? {}) };
    return Boolean(merged.on);
  });
  return (
    <group>
      {actives.map((d) => (
        <ActiveMarker key={`am-${d.deviceId}`} x={d.position[0]} z={d.position[2]} />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------ camera rig */

interface ControlsLike {
  target: THREE.Vector3;
  update: () => void;
  autoRotate: boolean;
  autoRotateSpeed: number;
  addEventListener: (type: string, fn: () => void) => void;
  removeEventListener: (type: string, fn: () => void) => void;
}

/** Eases camera toward the requested pose; user input cancels the flight. */
function CameraRig({ pose }: { pose: ScenePose }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as ControlsLike | null;
  const active = useRef(true);

  const desiredPos = useMemo(() => new THREE.Vector3(...pose.position), [pose]);
  const desiredTarget = useMemo(() => new THREE.Vector3(...pose.target), [pose]);

  useEffect(() => {
    active.current = true;
  }, [pose]);

  useEffect(() => {
    if (!controls) return;
    const stop = () => {
      active.current = false;
    };
    controls.addEventListener("start", stop);
    return () => controls.removeEventListener("start", stop);
  }, [controls]);

  useFrame((_, dt) => {
    if (!active.current || !controls) return;
    const k = 1 - Math.pow(0.0015, dt);
    camera.position.lerp(desiredPos, k);
    controls.target.lerp(desiredTarget, k);
    controls.update();
    if (camera.position.distanceTo(desiredPos) < 0.03 && controls.target.distanceTo(desiredTarget) < 0.03) {
      active.current = false;
    }
  });
  return null;
}

/** Showroom feel: after 14s without input the twin slowly orbits itself. */
function IdleOrbit({ enabled }: { enabled: boolean }) {
  const controls = useThree((s) => s.controls) as unknown as ControlsLike | null;
  const lastInput = useRef(Date.now());

  useEffect(() => {
    const bump = () => {
      lastInput.current = Date.now();
    };
    window.addEventListener("pointerdown", bump);
    window.addEventListener("wheel", bump);
    window.addEventListener("touchstart", bump);
    return () => {
      window.removeEventListener("pointerdown", bump);
      window.removeEventListener("wheel", bump);
      window.removeEventListener("touchstart", bump);
    };
  }, []);

  useEffect(() => {
    if (!controls) return;
    controls.autoRotateSpeed = 0.55;
    const timer = window.setInterval(() => {
      controls.autoRotate = enabled && Date.now() - lastInput.current > 14000;
    }, 700);
    return () => {
      window.clearInterval(timer);
      controls.autoRotate = false;
    };
  }, [controls, enabled]);

  return null;
}

/* ----------------------------------------------------------- device host */

function DeviceVisual({ d }: { d: DevicePlacement }) {
  switch (d.kind) {
    case "ceilingLight":
      return <CeilingLight deviceId={d.deviceId} />;
    case "lamp":
      return <FloorLamp deviceId={d.deviceId} />;
    case "ac":
      return <ACUnit deviceId={d.deviceId} />;
    case "tv":
      return <TVSet deviceId={d.deviceId} />;
    case "curtains":
      return <Curtains deviceId={d.deviceId} width={d.width} />;
    case "sensor":
      return d.sensorOf ? <SensorTag deviceId={d.deviceId} sensorOf={d.sensorOf} /> : null;
  }
}

function DeviceHost({
  d,
  selected,
  onSelect,
}: {
  d: DevicePlacement;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  return (
    <group
      position={d.position}
      rotation={[0, d.rotationY ?? 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(d.deviceId);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* invisible generous hit area */}
      <mesh visible={false} scale={d.kind === "curtains" ? [d.width ? d.width / 2 : 1, 0.55, 0.25] : [1, 1, 1]}>
        <sphereGeometry args={[d.kind === "curtains" ? 1 : 0.3, 8, 8]} />
      </mesh>

      <DeviceVisual d={d} />

      {(hovered || selected) && (
        <Html
          position={[0, d.kind === "ceilingLight" ? -0.55 : 0.52, 0]}
          center
          distanceFactor={9}
          className={`apt-dev-label${selected ? " is-selected" : ""}`}
        >
          {d.name}
        </Html>
      )}
    </group>
  );
}

/* ----------------------------------------------------------------- scene */

/** Offline studio environment — no HDRI fetch, reflections only. */
function StudioEnv({ night }: { night: boolean }) {
  return (
    <Environment resolution={128} frames={1}>
      <color attach="background" args={[night ? "#000000" : "#20242a"]} />
      <Lightformer form="rect" intensity={night ? 0.5 : 3.2} position={[0, 7, -9]} scale={[12, 4, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={night ? 0.25 : 1.8} position={[-9, 4, 2]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={night ? 0.25 : 1.4} position={[9, 4, -2]} rotation-y={-Math.PI / 2} scale={[10, 3, 1]} target={[0, 0, 0]} />
      <Lightformer form="circle" intensity={night ? 0.6 : 2.2} position={[0, 9, 0]} rotation-x={Math.PI / 2} scale={5} target={[0, 0, 0]} />
    </Environment>
  );
}

export interface ApartmentSceneProps {
  timeOfDay: TimeOfDay;
  pose: ScenePose;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClearSelection: () => void;
}

export function ApartmentScene({
  timeOfDay,
  pose,
  selectedId,
  onSelect,
  onClearSelection,
}: ApartmentSceneProps) {
  const night = timeOfDay === "night";
  const p = PRESETS[timeOfDay];
  const selected = DEVICES.find((dev) => dev.deviceId === selectedId) ?? null;

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        preserveDrawingBuffer: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: night ? 1.15 : 1,
      }}
      camera={{ position: INTRO_POSITION, fov: 42, near: 0.1, far: 120 }}
      onPointerMissed={() => onClearSelection()}
    >
      <color attach="background" args={[p.bg]} />
      <fog attach="fog" args={[p.bg, night ? 30 : 38, night ? 70 : 85]} />

      <hemisphereLight args={[p.hemiSky, p.hemiGround, p.hemiInt]} />
      <ambientLight intensity={p.ambient} />
      <directionalLight
        castShadow
        position={[8, 12, 6]}
        intensity={p.sunInt}
        color={p.sunColor}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-8, 8, -6]} intensity={p.fillInt} />

      {/* digital-twin ground grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.095, 0]} receiveShadow>
        <circleGeometry args={[60, 48]} />
        <meshStandardMaterial color={p.ground} roughness={1} />
      </mesh>
      <Grid
        position={[0, -0.088, 0]}
        args={[80, 80]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor={p.cell}
        sectionSize={2.5}
        sectionThickness={1}
        sectionColor={p.section}
        fadeDistance={night ? 36 : 46}
        fadeStrength={1.4}
        infiniteGrid
      />

      <StudioEnv night={night} />

      <ApartmentShell night={night} />
      {["kitchen", "living", "bedroom", "bathroom", "corridor"].map((id) => (
        <Furniture key={id} roomId={id} />
      ))}

      {DEVICES.map((d) => (
        <DeviceHost key={d.deviceId} d={d} selected={d.deviceId === selectedId} onSelect={onSelect} />
      ))}

      <ActiveMarkers selectedId={selectedId} />
      {selected && <SelectionRing x={selected.position[0]} z={selected.position[2]} />}

      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={1} intensity={p.bloom} />
        <Vignette eskil={false} offset={0.25} darkness={night ? 0.75 : 0.45} />
      </EffectComposer>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={45}
        maxPolarAngle={Math.PI / 2 - 0.06}
      />
      <CameraRig pose={pose} />
      <IdleOrbit enabled={!selectedId} />

      {/* Dev/verification hook */}
      <DebugProbe />
    </Canvas>
  );
}

/** Dev/verification hook: exposes live render state on window.__APT */
function DebugProbe() {
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__APT = { scene, gl, camera };
  });
  return null;
}
