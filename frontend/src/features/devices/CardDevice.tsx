import { useHomeStore } from "../../store/useHomeStore";
import type { DeviceConfig } from "./deviceKinds";
import { deviceIcon } from "./deviceKinds";
import { Device } from "./index";

/** Room-card device — wires the live `useHomeStore` (only `light1` is real),
 *  then delegates rendering to the shared per-kind `Device` component. */
export default function CardDevice({ config }: { config: DeviceConfig }) {
  const device = useHomeStore((s) => s.device);
  const toggle = useHomeStore((s) => s.toggle);
  const icon = deviceIcon(config.kind);

  switch (config.kind) {
    case "light": {
      const isLive = config.id === "light1";
      return (
        <Device
          kind="light"
          variant="card"
          label={config.label}
          defaultOn={config.defaultOn}
          state={isLive ? device?.state.on === true : undefined}
          onToggle={isLive ? toggle : undefined}
          icon={icon}
          badge={isLive ? "live" : "demo"}
        />
      );
    }
    case "temp":
      return (
        <Device
          kind="temp"
          variant="card"
          label={config.label}
          value={config.value}
          unit={config.unit}
          trend={config.trend}
          icon={icon}
        />
      );
    case "gas":
      return <Device kind="gas" variant="card" detected={config.detected} icon={icon} />;
  }
}
