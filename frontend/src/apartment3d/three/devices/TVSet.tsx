import { useRef } from "react";
import type { MeshStandardMaterial } from "three";
import { useFrame } from "@react-three/fiber";
import { useMergedState } from "../../hooks/useDeviceState";

export function TVSet({ deviceId }: { deviceId: string }) {
  const state = useMergedState(deviceId, "tv");
  const on = Boolean(state.on);
  const screen = useRef<MeshStandardMaterial>(null!);

  useFrame(({ clock }) => {
    if (!screen.current || !on) return;
    const t = clock.elapsedTime;
    // subtle broadcast flicker
    screen.current.emissiveIntensity = 0.85 + Math.sin(t * 13.7) * 0.06 + Math.sin(t * 7.3) * 0.05;
  });

  return (
    <group>
      {/* wall mount + bezel */}
      <mesh position={[0, 0, -0.055]}>
        <boxGeometry args={[0.34, 0.34, 0.03]} />
        <meshStandardMaterial color="#22262a" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh castShadow>
        <boxGeometry args={[1.5, 0.86, 0.06]} />
        <meshStandardMaterial color="#101418" roughness={0.35} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.034]}>
        <planeGeometry args={[1.42, 0.78]} />
        <meshStandardMaterial
          ref={screen}
          color="#05070a"
          emissive={on ? "#8fc1ff" : "#000000"}
          emissiveIntensity={on ? 0.85 : 0}
          roughness={0.25}
        />
      </mesh>
      {on && (
        <pointLight position={[0, 0, 0.55]} color="#86b8ff" intensity={2.2} distance={2.8} decay={2} />
      )}
    </group>
  );
}
