import ActivityPanel, { type ActivityItem } from "../components/ActivityPanel";

interface ActivityViewProps {
  activityItems: ActivityItem[];
}

export default function ActivityView({ activityItems }: ActivityViewProps) {
  return (
    <section className="business-panel">
      <ActivityPanel
        items={activityItems}
        maxItems={20}
        title="Activity history"
      />
    </section>
  );
}
