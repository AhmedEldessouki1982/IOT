import RoomGrid from "./RoomGrid";

interface RoomsViewProps {
  dummyOn: Record<string, boolean>;
  onDummyToggle: (id: string) => void;
  onExpand: (id: string) => void;
}

export default function RoomsView({
  dummyOn,
  onDummyToggle,
  onExpand,
}: RoomsViewProps) {
  return (
    <RoomGrid
      dummyOn={dummyOn}
      onDummyToggle={onDummyToggle}
      onExpand={onExpand}
    />
  );
}
