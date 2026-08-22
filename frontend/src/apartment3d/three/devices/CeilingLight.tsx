import { useMemo } from "react";
import { useMergedState } from "../../hooks/useDeviceState";
import { kelvinToHex } from "./kelvin";

export function CeilingLight({ deviceId }: { deviceId: string }) {
  const state = useMergedState(deviceId, "ceilingLight");
  const on = Boolean(state.on);
  const brightness = Number(state.brightness ?? 80);
  const hex = useMemo(() => kelvinToHex(Number(state.kelvin ?? 3400)), [state.kelvin]);

  return (
    <group>
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.04, 32]} />
        <meshStandardMaterial color="#f2f0ea" roughness={0.6} />
      </mesh>
      {/* diffuser: lower hemisphere */}
      <mesh position={[0, -0.055, 0]}>
        <sphereGeometry args={[0.16, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial
          color="#fffdf5"
          emissive={on ? hex : "#000000"}
          emissiveIntensity={on ? 1.7 : 0}
          roughness={0.35}
        />
      </mesh>
      {on && (
        <pointLight
          position={[0, -0.3, 0]}
          color={hex}
          intensity={(brightness / 100) * 26}
          distance={9}
          decay={1.7}
        />
      )}
    </group>
  );
}
