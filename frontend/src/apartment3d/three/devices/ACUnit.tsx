import { useRef } from "react";
import type { Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Html } from "@react-three/drei";
import { useMergedState } from "../../hooks/useDeviceState";

export function ACUnit({ deviceId }: { deviceId: string }) {
  const state = useMergedState(deviceId, "ac");
  const on = Boolean(state.on);
  const tempC = Number(state.tempC ?? 23);
  const louver = useRef<Mesh>(null!);

  useFrame(({ clock }) => {
    if (louver.current) {
      louver.current.rotation.x = Math.sin(clock.elapsedTime * 2.2) * 0.3 - 0.35;
    }
  });

  return (
    <group>
      <RoundedBox args={[0.92, 0.32, 0.26]} radius={0.03} smoothness={3} castShadow>
        <meshStandardMaterial color="#f4f4f0" roughness={0.45} />
      </RoundedBox>
      {/* oscillating louver flap */}
      <mesh ref={louver} position={[0, -0.075, 0.125]}>
        <boxGeometry args={[0.78, 0.1, 0.012]} />
        <meshStandardMaterial color={on ? "#dfe6ea" : "#c9ccc8"} roughness={0.5} />
      </mesh>
      {/* status LED */}
      <mesh position={[0.38, 0.08, 0.132]}>
        <sphereGeometry args={[0.012, 10, 8]} />
        <meshStandardMaterial
          color="#7dffa8"
          emissive="#33ff99"
          emissiveIntensity={on ? 1.6 : 0.05}
        />
      </mesh>
      {on && (
        <Html position={[0, 0.34, 0]} center distanceFactor={6} className="apt-ac-chip">
          {tempC.toFixed(0)}°C
        </Html>
      )}
    </group>
  );
}
