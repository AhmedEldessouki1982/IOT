import type { DeviceConfig } from "../features/devices";
import CardDevice from "../features/devices/CardDevice";

interface RoomCardProps {
  name: string;
  devices: DeviceConfig[];
  /** light id => on state for dummy (non-live) lights, shared across the grid */
  dummyOn?: Record<string, boolean>;
  /** toggle a dummy light by id */
  onDummyToggle?: (id: string) => void;
}

/** One room card — header + a list of that room's device rows. Nothing else. */
export default function RoomCard({ name, devices, dummyOn, onDummyToggle }: RoomCardProps) {
  return (
    <section className="room-card">
      <header className="room-card-head">
        <h2 className="room-card-name">{name}</h2>
      </header>
      <ul className="room-card-list">
        {devices.map((config) => (
          <li key={config.id} className="room-card-item">
            <CardDevice
              config={config}
              state={config.kind === "light" ? dummyOn?.[config.id] ?? false : undefined}
              onToggle={config.kind === "light" ? () => onDummyToggle?.(config.id) : undefined}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
