import { useMergedState } from "../../hooks/useDeviceState";

const FABRIC = "#b98d5f";
const ROD = "#6b6257";

/** Curtains slide along the host wall (local X after rotationY).
 *  `open` 0 => panels meet in the middle, 100 => fully tucked aside. */
export function Curtains({ deviceId, width = 2 }: { deviceId: string; width?: number }) {
  const state = useMergedState(deviceId, "curtains");
  const openFrac = Math.min(100, Math.max(0, Number(state.open ?? 70))) / 100;

  const halfW = width / 2;
  const pw = width * 0.32;
  const offsetX = pw / 2 + (halfW - pw) * openFrac;
  const rodY = 1.14;
  const panelCY = 0.07;

  return (
    <group>
      {/* rod */}
      <mesh position={[0, rodY, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, width + 0.3, 12]} />
        <meshStandardMaterial color={ROD} roughness={0.4} metalness={0.6} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={`finial-${s}`} position={[s * (halfW + 0.15), rodY, 0]}>
          <sphereGeometry args={[0.028, 12, 10]} />
          <meshStandardMaterial color={ROD} roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
      {/* panels */}
      {[-1, 1].map((s) => (
        <mesh key={`panel-${s}`} castShadow position={[s * offsetX, panelCY, 0.05]}>
          <boxGeometry args={[pw, 2.06, 0.07]} />
          <meshStandardMaterial color={FABRIC} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
