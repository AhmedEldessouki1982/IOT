import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid, Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { Mesh, MeshBasicMaterial } from "three";
import { DEVICES } from "../../config/apartment";
import type { DevicePlacement } from "../../config/apartment";
import type { Vec3 } from "../../types";
import { ApartmentShell } from "../shell/ApartmentShell";
import { Furniture } from "../furniture/Furniture";
import { CeilingLight } from "../devices/CeilingLight";
import { FloorLamp } from "../devices/FloorLamp";
import { ACUnit } from "../devices/ACUnit";
import { TVSet } from "../devices/TVSet";
import { Curtains } from "../devices/Curtains";
import { SensorTag } from "../devices/SensorTag";

export interface ScenePose {
  position: Vec3;
  target: Vec3;
}

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

/* ------------------------------------------------------------ camera rig */

interface ControlsLike {
  target: THREE.Vector3;
  update: () => void;
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

export interface ApartmentSceneProps {
  theme: "dark" | "light";
  pose: ScenePose;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClearSelection: () => void;
}

export function ApartmentScene({ theme, pose, selectedId, onSelect, onClearSelection }: ApartmentSceneProps) {
  const dark = theme === "dark";
  const bg = dark ? "#0d1117" : "#d8dee3";
  const selected = DEVICES.find((dev) => dev.deviceId === selectedId) ?? null;

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      camera={{ position: pose.position, fov: 42, near: 0.1, far: 120 }}
      onPointerMissed={() => onClearSelection()}
    >
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 38, 85]} />

      <hemisphereLight args={[dark ? "#dbe6ef" : "#ffffff", dark ? "#8a7a66" : "#b0a48e", 0.55]} />
      <ambientLight intensity={dark ? 0.22 : 0.35} />
      <directionalLight
        castShadow
        position={[8, 12, 6]}
        intensity={dark ? 2.0 : 2.6}
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
      <directionalLight position={[-8, 8, -6]} intensity={dark ? 0.4 : 0.6} />

      {/* digital-twin ground grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.095, 0]} receiveShadow>
        <circleGeometry args={[60, 48]} />
        <meshStandardMaterial color={dark ? "#10151b" : "#ccd2d6"} roughness={1} />
      </mesh>
      <Grid
        position={[0, -0.088, 0]}
        args={[80, 80]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor={dark ? "#242e3a" : "#bfc7cd"}
        sectionSize={2.5}
        sectionThickness={1}
        sectionColor={dark ? "#37465a" : "#9aa6ae"}
        fadeDistance={46}
        fadeStrength={1.4}
        infiniteGrid
      />

      <ApartmentShell />
      {["kitchen", "living", "bedroom", "bathroom", "corridor"].map((id) => (
        <Furniture key={id} roomId={id} />
      ))}

      {DEVICES.map((d) => (
        <DeviceHost key={d.deviceId} d={d} selected={d.deviceId === selectedId} onSelect={onSelect} />
      ))}

      {selected && <SelectionRing x={selected.position[0]} z={selected.position[2]} />}

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={45}
        maxPolarAngle={Math.PI / 2 - 0.06}
      />
      <CameraRig pose={pose} />
      <DebugProbe />
    </Canvas>
  );
}
