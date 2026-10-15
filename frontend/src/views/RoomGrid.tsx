import RoomCard from "../dashboard/RoomCard";
import { ROOMS } from "../dashboard/rooms";

interface RoomGridProps {
  limit?: number;
  dummyOn: Record<string, boolean>;
  onDummyToggle: (id: string) => void;
  onExpand: (id: string) => void;
}

export default function RoomGrid({
  limit,
  dummyOn,
  onDummyToggle,
  onExpand,
}: RoomGridProps) {
  return (
    <main className="dash-grid">
      {ROOMS.slice(0, limit).map((room) => (
        <RoomCard
          key={room.id}
          id={room.id}
          name={room.name}
          devices={room.devices}
          switches={room.switches}
          span={room.span}
          dummyOn={dummyOn}
          onDummyToggle={onDummyToggle}
          onExpand={onExpand}
        />
      ))}
    </main>
  );
}
