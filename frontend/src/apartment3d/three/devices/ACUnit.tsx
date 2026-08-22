import { RoundedBox, Html } from "@react-three/drei";
import { useMergedState } from "../../hooks/useDeviceState";

export function ACUnit({ deviceId }: { deviceId: string }) {
  const state = useMergedState(deviceId, "ac");
  const on = Boolean(state.on);
  const tempC = Number(state.tempC ?? 23);

  return (
    <group>
      <RoundedBox args={[0.92, 0.32, 0.26]} radius={0.03} smoothness={3} castShadow>
        <meshStandardMaterial color="#f4f4f0" roughness={0.45} />
      </RoundedBox>
      {/* louver slot */}
      <mesh position={[0, -0.09, 0.132]}>
        <boxGeometry args={[0.78, 0.045, 0.012]} />
        <meshStandardMaterial color="#c9ccc8" roughness={0.6} />
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
