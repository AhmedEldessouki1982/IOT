import { LayoutGrid, Radio, ShieldCheck } from "lucide-react";
import { ROOMS } from "../dashboard/rooms";
import KpiRail from "./KpiRail";
import type { DeviceRecord, ReadinessSummary } from "../hooks/useDeviceRecords";

interface SettingsViewProps {
  readiness: ReadinessSummary;
  records: DeviceRecord[];
  unavailableLiveCount: number;
  online: boolean;
}

export default function SettingsView({
  readiness,
  records,
  unavailableLiveCount,
  online,
}: SettingsViewProps) {
  return (
    <section className="business-panel">
      <div className="panel-headline">
        <span className="panel-kicker">Framework</span>
        <h2>Business-ready defaults</h2>
        <p>
          This app is now structured as a reusable local-first smart-home
          framework. The next backend milestone is moving this room/device
          registry out of code and into customer configuration.
        </p>
      </div>
      <KpiRail readiness={readiness} online={online} />
      <div className="settings-grid">
        <article>
          <Radio size={18} />
          <strong>Local-first MQTT</strong>
          <span>{online ? "Backend reachable" : "Backend offline"}</span>
        </article>
        <article>
          <LayoutGrid size={18} />
          <strong>Config model</strong>
          <span>
            {ROOMS.length} rooms · {records.length} devices
          </span>
        </article>
        <article>
          <ShieldCheck size={18} />
          <strong>Deployment readiness</strong>
          <span>{unavailableLiveCount} live devices need attention</span>
        </article>
      </div>
    </section>
  );
}
