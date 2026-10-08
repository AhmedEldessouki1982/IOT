import { Clock3 } from "lucide-react";

export interface ActivityItem {
  id: string;
  label: string;
  detail: string;
  at: string;
  tone?: "good" | "warn" | "danger" | "info";
}

interface ActivityPanelProps {
  items: ActivityItem[];
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function ActivityPanel({ items }: ActivityPanelProps) {
  return (
    <aside className="activity-panel" aria-label="Recent activity">
      <header className="activity-panel-head">
        <span className="activity-panel-title">
          <Clock3 size={14} strokeWidth={1.8} aria-hidden="true" />
          Recent activity
        </span>
      </header>
      {items.length > 0 ? (
        <ol className="activity-list">
          {items.slice(0, 4).map((item) => (
            <li key={item.id} className="activity-item" data-tone={item.tone ?? "info"}>
              <span className="activity-dot" aria-hidden="true" />
              <span className="activity-copy">
                <span className="activity-label">{item.label}</span>
                <span className="activity-detail">{item.detail}</span>
              </span>
              <time className="activity-time" dateTime={item.at}>
                {formatTime(item.at)}
              </time>
            </li>
          ))}
        </ol>
      ) : (
        <p className="activity-empty">Activity appears when live devices report state.</p>
      )}
    </aside>
  );
}
