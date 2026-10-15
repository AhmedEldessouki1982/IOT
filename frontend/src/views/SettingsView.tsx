import { LayoutGrid, Radio, ShieldCheck } from "lucide-react";
import { ROOMS } from "../dashboard/rooms";
import KpiRail from "./KpiRail";
import ThemeToggle from "../components/ThemeToggle";
import type { useKiosk } from "../hooks/useKiosk";
import type { DeviceRecord, ReadinessSummary } from "../hooks/useDeviceRecords";

interface SettingsViewProps {
  kiosk: ReturnType<typeof useKiosk>;
  readiness: ReadinessSummary;
  records: DeviceRecord[];
  unavailableLiveCount: number;
  online: boolean;
}

export default function SettingsView({
  kiosk,
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
      <section className="kiosk-settings" aria-label="Wall panel settings">
        <label className="kiosk-setting"><span>Wall panel mode</span><button type="button" role="switch" aria-checked={kiosk.enabled} aria-label="Wall panel mode" className="toggle" data-on={kiosk.enabled} onClick={() => kiosk.setEnabled(!kiosk.enabled)}><span className="toggle-knob" /></button></label>
        <label className="kiosk-setting"><span>Idle minutes (0 disables)</span><input type="number" min="0" max="120" step="1" value={kiosk.minutes} disabled={!kiosk.enabled} onChange={e => kiosk.setMinutes(Number(e.target.value))} /></label>
      </section>
    </section>
  );
}
