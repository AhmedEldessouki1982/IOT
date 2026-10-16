import RoomCard from "../dashboard/RoomCard";
import { ROOMS } from "../dashboard/rooms";

interface RoomGridProps {
  dummyOn: Record<string, boolean>;
  onDummyToggle: (id: string) => void;
  onExpand: (id: string) => void;
}

export default function RoomGrid({
  dummyOn,
  onDummyToggle,
  onExpand,
}: RoomGridProps) {
  return (
    <main className="dash-grid">
      {ROOMS.map((room) => (
        <RoomCard
          key={room.id}
          id={room.id}
          name={room.name}
          devices={room.devices}
          switches={room.switches}
          routineId={room.routineId}
          dummyOn={dummyOn}
          onDummyToggle={onDummyToggle}
          onExpand={onExpand}
        />
      ))}
    </main>
  );
}
