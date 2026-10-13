import { BellRing, ShieldCheck } from "lucide-react";
import ActivityPanel, { type ActivityItem } from "../components/ActivityPanel";
import type { DeviceRecord } from "../hooks/useDeviceRecords";

interface SecurityViewProps {
  records: DeviceRecord[];
  activityItems: ActivityItem[];
}

export default function SecurityView({
  records,
  activityItems,
}: SecurityViewProps) {
  return (
    <section className="business-panel business-panel--split">
      <div>
        <div className="panel-headline">
          <span className="panel-kicker">Security</span>
          <h2>Locks and life-safety at a glance</h2>
          <p>
            This view collects the devices a customer checks before sleeping,
            leaving, or handing over the home.
          </p>
        </div>
        <div className="security-grid">
          {records.map((record) => (
            <article
              key={record.config.id}
              className="security-card"
              data-health={record.health}
            >
              <span className="security-card-icon" aria-hidden="true">
                {record.config.kind === "lock" ? (
                  <ShieldCheck size={18} />
                ) : (
                  <BellRing size={18} />
                )}
              </span>
              <span>
                <strong>{record.config.label}</strong>
                <small>{record.roomName}</small>
              </span>
              <em>{record.stateText}</em>
            </article>
          ))}
        </div>
      </div>
      <ActivityPanel
        items={activityItems}
        maxItems={8}
        title="Security trail"
      />
    </section>
  );
}
