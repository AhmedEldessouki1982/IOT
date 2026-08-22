import { useMergedState } from "../../hooks/useDeviceState";

export function TVSet({ deviceId }: { deviceId: string }) {
  const state = useMergedState(deviceId, "tv");
  const on = Boolean(state.on);

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
