import { BellRing, ShieldCheck } from "lucide-react";
import ActivityPanel, { type ActivityItem } from "../components/ActivityPanel";
import type { DeviceRecord } from "../hooks/useDeviceRecords";
import EmergencyShutdown from "../components/EmergencyShutdown";

interface SecurityViewProps {
  records: DeviceRecord[];
  activityItems: ActivityItem[];
  onShutdown: () => void;
  shutdownActive: boolean;
}

export default function SecurityView({
  records,
  activityItems,
  onShutdown,
  shutdownActive,
}: SecurityViewProps) {
  return (
    <section className="business-panel business-panel--split">
      <div>
        <div className="panel-headline">
          <h2>Security</h2>
          <p>Check locks and safety sensors, or shut down the home.</p>
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
          {records.length === 0 && <p className="empty-state">Locks and safety sensor status will appear here when configured.</p>}
        </div>
        <div className="security-quick-action">
          <h3>Quick actions</h3>
          <EmergencyShutdown onShutdown={onShutdown} active={shutdownActive} />
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
