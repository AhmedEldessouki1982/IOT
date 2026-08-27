import { ROOMS } from "./roomsConfig";

interface RoomDockProps {
  activeId: string | null;
  onChange: (id: string | null) => void;
}

export default function RoomDock({ activeId, onChange }: RoomDockProps) {
  return (
    <div className="cc-room-dock">
      <button
        type="button"
        className="cc-room-pill"
        data-active={activeId === null}
        onClick={() => onChange(null)}
      >
        <span className="cc-room-pill-dot" />
        All Rooms
      </button>
      {ROOMS.map((r) => (
        <button
          key={r.id}
          type="button"
          className="cc-room-pill"
          data-active={activeId === r.id}
          onClick={() => onChange(activeId === r.id ? null : r.id)}
        >
          <span className="cc-room-pill-dot" />
          {r.name}
          <span className="cc-room-pill-count">{r.devices.length}</span>
        </button>
      ))}
    </div>
  );
}
