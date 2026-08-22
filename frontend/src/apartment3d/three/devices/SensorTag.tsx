import { useRef } from "react";
import type { Mesh, MeshStandardMaterial } from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useMergedState } from "../../hooks/useDeviceState";
import type { DevicePlacement } from "../../config/apartment";

function readout(state: Record<string, unknown>, metric: NonNullable<DevicePlacement["sensorOf"]>) {
  switch (metric) {
    case "tempC":
      return `${Number(state.tempC ?? 24.5).toFixed(1)}°C`;
    case "humidity":
      return `${Number(state.humidity ?? 48).toFixed(0)}%RH`;
    case "smoke":
      return state.smoke === "alarm" ? "ALERT" : "OK";
  }
}

export function SensorTag({
  deviceId,
  sensorOf = "tempC",
}: {
  deviceId: string;
  sensorOf: NonNullable<DevicePlacement["sensorOf"]>;
}) {
  const state = useMergedState(deviceId, "sensor");
  const led = useRef<Mesh>(null!);
  const alarm = sensorOf === "smoke" && state.smoke === "alarm";

  useFrame(({ clock }) => {
    if (!led.current) return;
    const mat = led.current.material as MeshStandardMaterial;
    mat.emissiveIntensity = alarm
      ? Math.sin(clock.elapsedTime * 8) > 0 ? 2 : 0.1
      : Math.sin(clock.elapsedTime * 2.5) > 0 ? 1.4 : 0.15;
  });

  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.016, 24]} />
        <meshStandardMaterial color="#dfe3e6" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.022]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.065, 0.065, 0.03, 24]} />
        <meshStandardMaterial color="#eef1f2" roughness={0.35} />
      </mesh>
      <mesh ref={led} position={[0.03, 0.03, 0.04]}>
        <sphereGeometry args={[0.009, 10, 8]} />
        <meshStandardMaterial
          color={alarm ? "#ff6a5e" : "#7dffa8"}
          emissive={alarm ? "#ff5f56" : "#33ff99"}
          emissiveIntensity={1}
        />
      </mesh>
      <Html
        position={[0, -0.17, 0.08]}
        center
        distanceFactor={7}
        className={`apt-sensor-tag${alarm ? " apt-alarm" : ""}`}
      >
        {readout(state, sensorOf)}
      </Html>
    </group>
  );
}
