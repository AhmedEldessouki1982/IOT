import type { DeviceConfig } from "../rooms";
import { deviceIcon } from "../rooms";
import DeviceToggle from "./DeviceToggle";
import TempSensorReadout from "./TempSensorReadout";
import GasLeakSensor from "./GasLeakSensor";
import { useHomeStore } from "../store/useHomeStore";

export default function DeviceRenderer({ config }: { config: DeviceConfig }) {
  const device = useHomeStore((s) => s.device);
  const toggle = useHomeStore((s) => s.toggle);
  const icon = deviceIcon(config.kind);

  switch (config.kind) {
    case "light":
      return (
        <DeviceToggle
          label={config.label}
          defaultState={config.defaultOn}
          state={config.id === "light1" ? device?.state.on === true : undefined}
          onToggle={config.id === "light1" ? toggle : undefined}
          icon={icon}
        />
      );
    case "temp":
      return (
        <TempSensorReadout
          label={config.label}
          value={config.value}
          unit={config.unit}
          trend={config.trend}
          icon={icon}
        />
      );
    case "gas":
      return (
        <GasLeakSensor
          detected={config.detected}
          icon={icon}
        />
      );
  }
}
