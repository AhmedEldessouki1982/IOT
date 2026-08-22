import { ROOMS } from "../config/apartment";

interface RoomNavProps {
  /** null = overview */
  activeId: string | null;
  onChange: (id: string | null) => void;
}

export function RoomNav({ activeId, onChange }: RoomNavProps) {
  return (
    <nav className="apt-roomnav">
      <button
        type="button"
        className="apt-roomnav-item"
        data-active={activeId === null}
        onClick={() => onChange(null)}
      >
        OVERVIEW
      </button>
      {ROOMS.map((room) => (
        <button
          key={room.id}
          type="button"
          className="apt-roomnav-item"
          data-active={activeId === room.id}
          onClick={() => onChange(room.id)}
        >
          {room.name.toUpperCase()}
        </button>
      ))}
    </nav>
  );
}
