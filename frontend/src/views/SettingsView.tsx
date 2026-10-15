import { LayoutGrid, Radio, ShieldCheck } from "lucide-react";
import { ROOMS } from "../dashboard/rooms";
import KpiRail from "./KpiRail";
import ThemeToggle from "../components/ThemeToggle";
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
        <h2>Settings</h2>
        <p>Review this home's setup and choose the display theme.</p>
      </div>
      <KpiRail readiness={readiness} online={online} />
      <div className="settings-grid">
        <article>
          <Radio size={18} />
          <strong>Hub connection</strong>
          <span>{online ? "Connected" : "Offline"}</span>
        </article>
        <article>
          <LayoutGrid size={18} />
          <strong>Config model</strong>
          <span>
            {ROOMS.length} rooms, {records.length} devices
          </span>
        </article>
        <article>
          <ShieldCheck size={18} />
          <strong>Live devices needing attention</strong>
          <span>{unavailableLiveCount}</span>
        </article>
      </div>
      <div className="settings-theme"><strong>Appearance</strong><ThemeToggle /></div>
    </section>
  );
}
