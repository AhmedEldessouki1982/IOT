import ActivityPanel, { type ActivityItem } from "../components/ActivityPanel";
import HomeStatusStrip, {
  type HomeStatusItem,
} from "../components/HomeStatusStrip";
import SceneControls from "../components/SceneControls";
import EmergencyShutdown from "../components/EmergencyShutdown";
import type { ScenePreset } from "../dashboard/scenes";
import { deviceIcon, type DeviceConfig } from "../features/devices";
import DeviceMotion from "../components/DeviceMotion";
import { liveDeviceId } from "../features/devices/deviceRuntime";

export interface ActiveHomeItem {
  config: DeviceConfig;
  roomName: string;
  roomId: string;
}

interface HomeViewProps {
  statusItems: HomeStatusItem[];
  activityItems: ActivityItem[];
  activeItems: ActiveHomeItem[];
  scenes: ScenePreset[];
  onApplyScene: (id: string) => void;
  onShutdown: () => void;
  shutdownActive: boolean;
  onOpenRoom: (id: string) => void;
}

export default function HomeView({
  statusItems,
  activityItems,
  activeItems,
  scenes,
  onApplyScene,
  onShutdown,
  shutdownActive,
  onOpenRoom,
}: HomeViewProps) {
  return (
    <>
      <section className="home-summary" aria-label="Home overview">
        <HomeStatusStrip items={statusItems} />
        <section className="home-quick-actions" aria-label="Quick actions">
          <div className="home-section-head"><h2>Quick actions</h2></div>
          <SceneControls scenes={scenes} onApply={onApplyScene} />
          <EmergencyShutdown onShutdown={onShutdown} active={shutdownActive} />
        </section>
        <section className="home-active" aria-label="Active now">
          <div className="home-section-head"><h2>On now</h2></div>
          {activeItems.length ? <ul className="home-active-list">{activeItems.slice(0, 6).map(({ config, roomName, roomId }) => {
            return <li key={config.id}><DeviceMotion deviceKey={liveDeviceId(config) ?? config.id} label={config.label} value={true} kind={config.kind}><span className="home-active-icon" aria-hidden="true">{deviceIcon(config.kind)}</span><span><strong>{config.label}</strong><small>{roomName}</small></span><button type="button" onClick={() => onOpenRoom(roomId)} aria-label={`Open ${roomName}`}>View</button></DeviceMotion></li>;
          })}</ul> : <p className="home-empty">Devices that are on will appear here.</p>}
        </section>
        <ActivityPanel items={activityItems} maxItems={4} />
      </section>
    </>
  );
}
