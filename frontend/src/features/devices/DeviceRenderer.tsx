import type { DeviceConfig } from "../rooms/roomsConfig";
import { deviceIcon } from "../rooms/roomsConfig";
import DeviceToggle from "../../shared/DeviceToggle";
import TempSensorReadout from "../../shared/TempSensorReadout";
import GasLeakSensor from "../../shared/GasLeakSensor";
import { useHomeStore } from "../../store/useHomeStore";

export default function DeviceRenderer({ config }: { config: DeviceConfig }) {
  const device = useHomeStore((s) => s.device);
  const toggle = useHomeStore((s) => s.toggle);
  const icon = deviceIcon(config.kind);
  const isLive = config.id === "light1";

  switch (config.kind) {
    case "light":
      return (
        <DeviceToggle
          label={config.label}
          defaultState={config.defaultOn}
          state={isLive ? device?.state.on === true : undefined}
          onToggle={isLive ? toggle : undefined}
          icon={icon}
          badge={isLive ? "live" : "demo"}
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
