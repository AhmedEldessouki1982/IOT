import { useMemo } from "react";
import { useMergedState } from "../../hooks/useDeviceState";
import { kelvinToHex } from "./kelvin";

export function FloorLamp({ deviceId }: { deviceId: string }) {
  const state = useMergedState(deviceId, "lamp");
  const on = Boolean(state.on);
  const brightness = Number(state.brightness ?? 80);
  const hex = useMemo(() => kelvinToHex(Number(state.kelvin ?? 3400)), [state.kelvin]);

  return (
    <group>
      <mesh castShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.15, 0.17, 0.04, 24]} />
        <meshStandardMaterial color="#2f3338" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh castShadow position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 1.4, 12]} />
        <meshStandardMaterial color="#8a8f94" roughness={0.35} metalness={0.7} />
      </mesh>
      {/* shade: open cylinder */}
      <mesh position={[0, 1.52, 0]}>
        <cylinderGeometry args={[0.17, 0.23, 0.3, 24, 1, true]} />
        <meshStandardMaterial
          color="#d8c9ae"
          emissive={on ? hex : "#000000"}
          emissiveIntensity={on ? 0.6 : 0}
          roughness={1}
          side={2 /* DoubleSide */}
        />
      </mesh>
      <mesh position={[0, 1.48, 0]}>
        <sphereGeometry args={[0.05, 16, 12]} />
        <meshStandardMaterial
          color="#fff6e0"
          emissive={hex}
          emissiveIntensity={on ? 2 : 0}
        />
      </mesh>
      {on && (
        <pointLight
          position={[0, 1.45, 0]}
          color={hex}
          intensity={(brightness / 100) * 11}
          distance={5.5}
          decay={1.8}
        />
      )}
    </group>
  );
}
