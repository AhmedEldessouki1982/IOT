import ActivityPanel, { type ActivityItem } from "../components/ActivityPanel";
import HomeStatusStrip, {
  type HomeStatusItem,
} from "../components/HomeStatusStrip";
import RoomGrid from "./RoomGrid";

interface HomeViewProps {
  statusItems: HomeStatusItem[];
  activityItems: ActivityItem[];
  dummyOn: Record<string, boolean>;
  onDummyToggle: (id: string) => void;
  onExpand: (id: string) => void;
}

export default function HomeView({
  statusItems,
  activityItems,
  dummyOn,
  onDummyToggle,
  onExpand,
}: HomeViewProps) {
  return (
    <>
      <section className="dash-overview" aria-label="Home overview">
        <HomeStatusStrip items={statusItems} />
        <ActivityPanel items={activityItems} />
      </section>
      <RoomGrid
        limit={4}
        dummyOn={dummyOn}
        onDummyToggle={onDummyToggle}
        onExpand={onExpand}
      />
    </>
  );
}
