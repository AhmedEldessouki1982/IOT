import { useEffect, useState, useMemo } from "react";
import { Home, Sparkles, Zap, Shield, Flame, Thermometer } from "lucide-react";
import NavRail, { type NavTab } from "./components/premium/NavRail";
import HeroStage from "./components/premium/HeroStage";
import RoomDock from "./components/premium/RoomDock";
import InspectorPanel from "./components/premium/InspectorPanel";
import { ROOMS } from "./rooms";
import { DEVICES_2D } from "./apartment2d/config/apartment";
import { useHomeStore } from "./store/useHomeStore";
import { useThemeStore } from "./store/useThemeStore";
import { useDeviceStore } from "./apartment/store/useDeviceStore";
import RoomCard from "./components/RoomCard";
import DeviceRenderer from "./components/DeviceRenderer";

function TopBar({
  online,
  activeTab,
  onTabChange,
}: {
  online: boolean;
  activeTab: NavTab;
  onTabChange: (t: NavTab) => void;
}) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  const tabs: Array<{ id: NavTab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "rooms", label: "Rooms" },
    { id: "devices", label: "Devices" },
    { id: "scenes", label: "Scenes" },
    { id: "energy", label: "Energy" },
    { id: "security", label: "Security" },
  ];

  return (
    <header className="cc-topbar">
      <div className="cc-topbar-left">
        <div className="cc-brand">
          <span className="cc-brand-mark">
            <Home size={16} strokeWidth={2} />
          </span>
          <span className="cc-brand-text">
            <h1>NOVA RESIDENCE</h1>
            <span>Smart Home · Digital Twin</span>
          </span>
        </div>
      </div>

      <div className="cc-topbar-center">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className="cc-nav-tab"
            data-active={activeTab === t.id}
            onClick={() => onTabChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="cc-topbar-right">
        <div className="cc-live" data-online={online}>
          <span className="cc-live-dot" />
          <span className="cc-live-label">{online ? "Online" : "Offline"}</span>
          <span className="cc-live-count">{DEVICES_2D.length} devices</span>
        </div>

        <div className="cc-time">
          <span className="cc-time-clock">{timeStr}</span>
          <span className="cc-time-date">{dateStr}</span>
        </div>

        <button
          type="button"
          className="cc-icon-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"}`}
          title={theme}
        >
          {theme === "dark" ? "☾" : "☀"}
        </button>
      </div>
    </header>
  );
}

function Placeholder({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="cc-placeholder">
      <Icon size={28} strokeWidth={1.4} style={{ color: "var(--cc-accent)", margin: "0 auto", display: "block" }} />
      <h3 style={{ marginTop: 12 }}>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

export default function App() {
  const online = useHomeStore((s) => s.online);
  const homeLoad = useHomeStore((s) => s.load);
  const deviceOnline = useDeviceStore((s) => s.online);
  const theme = useThemeStore((s) => s.theme);

  const isOnline = online || deviceOnline;

  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [focusedRoomId, setFocusedRoomId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    homeLoad();
  }, [homeLoad]);

  const filteredRooms = useMemo(() => {
    if (!focusedRoomId) return ROOMS;
    return ROOMS.filter((r) => r.id === focusedRoomId);
  }, [focusedRoomId]);

  // keep selection in sync: if room changes, clear device if not in room
  useEffect(() => {
    if (selectedId && focusedRoomId) {
      const dev = DEVICES_2D.find((d) => d.deviceId === selectedId);
      if (dev && dev.roomId !== focusedRoomId) {
        // keep it — allow cross-room device inspection
      }
    }
  }, [focusedRoomId, selectedId]);

  return (
    <div className="cc-root">
      <TopBar online={isOnline} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="cc-shell">
        <NavRail active={activeTab} onChange={setActiveTab} />

        <main className="cc-main">
          {activeTab === "overview" && (
            <>
              <HeroStage
                selectedId={selectedId}
                focusedRoomId={focusedRoomId}
                onSelect={setSelectedId}
                onRoomFocus={setFocusedRoomId}
              />
              <RoomDock activeId={focusedRoomId} onChange={setFocusedRoomId} />

              <div className="cc-grid">
                <div className="cc-room-grid">
                  {filteredRooms.map((room) => {
                    const tempDev = room.devices.find((d) => d.kind === "temp") as { value: number } | undefined;
                    const tempStr = tempDev ? `${tempDev.value.toFixed(1)}°` : "";
                    const activeCount = room.devices.filter((d) => (d as any).defaultOn).length;
                    return (
                    <div
                      key={room.id}
                      className="cc-room-card"
                      data-selected={focusedRoomId === room.id}
                      onClick={() => setFocusedRoomId(focusedRoomId === room.id ? null : room.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setFocusedRoomId(focusedRoomId === room.id ? null : room.id);
                        }
                      }}
                    >
                      <div className="cc-room-head">
                        <span className="cc-room-icon">{room.icon}</span>
                        <span className="cc-room-info">
                          <h3>{room.name}</h3>
                          <p>{room.devices.length} devices · {activeCount} active</p>
                        </span>
                        <span className="cc-room-meta">
                          {tempStr && <span className="cc-room-temp">{tempStr}</span>}
                          <span className="cc-room-chevron">›</span>
                        </span>
                      </div>
                      <div className="cc-room-body" onClick={(e) => e.stopPropagation()}>
                        {room.devices.map((dev) => (
                          <DeviceRenderer key={dev.id} config={dev} />
                        ))}
                      </div>
                    </div>
                  );})}
                </div>

                <InspectorPanel
                  selectedId={selectedId}
                  focusedRoomId={focusedRoomId}
                  onCloseDevice={() => setSelectedId(null)}
                  onSelectDevice={setSelectedId}
                />
              </div>
            </>
          )}

          {activeTab === "rooms" && (
            <>
              <RoomDock activeId={focusedRoomId} onChange={setFocusedRoomId} />
              <div className="cc-room-grid">
                {(focusedRoomId ? ROOMS.filter((r) => r.id === focusedRoomId) : ROOMS).map((room) => (
                  <RoomCard key={room.id} name={room.name} icon={room.icon}>
                    {room.devices.map((dev) => (
                      <DeviceRenderer key={dev.id} config={dev} />
                    ))}
                  </RoomCard>
                ))}
              </div>
              {focusedRoomId && (
                <div style={{ marginTop: 16 }}>
                  <HeroStage
                    selectedId={selectedId}
                    focusedRoomId={focusedRoomId}
                    onSelect={setSelectedId}
                    onRoomFocus={setFocusedRoomId}
                  />
                </div>
              )}
            </>
          )}

          {activeTab === "devices" && (
            <div className="cc-room-grid">
              {ROOMS.map((room) => (
                <RoomCard key={room.id} name={room.name} icon={room.icon}>
                  {room.devices.map((dev) => (
                    <DeviceRenderer key={dev.id} config={dev} />
                  ))}
                </RoomCard>
              ))}
              <div className="cc-inspector">
                <div className="cc-inspector-head">
                  <div className="cc-inspector-kicker">Inventory</div>
                  <h3 className="cc-inspector-title">{DEVICES_2D.length} Spatial Devices</h3>
                  <p className="cc-inspector-sub">Tap any device on the floorplan to control it</p>
                </div>
                <div className="cc-inspector-body">
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {DEVICES_2D.slice(0, 8).map((d) => (
                      <button
                        key={d.deviceId}
                        type="button"
                        onClick={() => setSelectedId(d.deviceId)}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          background: selectedId === d.deviceId ? "var(--cc-accent-soft)" : "var(--cc-surface-2)",
                          border: `1px solid ${selectedId === d.deviceId ? "var(--cc-accent-glow)" : "var(--cc-border)"}`,
                          borderRadius: "var(--cc-radius-sm)",
                          color: "var(--cc-text)",
                          cursor: "pointer",
                          textAlign: "left",
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        <span>{d.name}</span>
                        <span style={{ color: "var(--cc-text-muted)", fontSize: 11 }}>{d.roomId}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "scenes" && (
            <div style={{ maxWidth: 720 }}>
              <Placeholder icon={Sparkles} title="Scenes" desc="One-tap atmospheres — Evening, Away, Night, Entertain. Backend scenes not yet exposed; visual architecture ready." />
              <div className="cc-scene-grid">
                {[
                  { name: "Evening", desc: "Warm lights · 40% · Curtains closed", icon: "🌙" },
                  { name: "Away", desc: "All off · Lock engaged · Sensors armed", icon: "🔒" },
                  { name: "Entertain", desc: "Living bright · Kitchen warm · Music", icon: "✨" },
                  { name: "Night", desc: "Bedroom dim · Hallway 10% · AC 22°", icon: "🌃" },
                ].map((s) => (
                  <div key={s.name} className="cc-scene-card">
                    <div style={{ fontSize: 20 }}>{s.icon}</div>
                    <h4>{s.name}</h4>
                    <p>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "energy" && (
            <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
              <div className="cc-energy-card">
                <div className="cc-energy-head">
                  <div>
                    <h4>Energy · Live</h4>
                    <p>Whole-home consumption</p>
                  </div>
                  <span className="cc-energy-delta">Live</span>
                </div>
                <div className="cc-energy-main">
                  <span className="cc-energy-value">1.2 kW</span>
                  <span style={{ fontSize: 12, color: "var(--cc-text-muted)" }}>now</span>
                </div>
                <svg viewBox="0 0 200 44" preserveAspectRatio="none" style={{ width: "100%", height: 44, display: "block" }}>
                  <defs>
                    <linearGradient id="cc-energy2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--cc-accent)" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="var(--cc-accent)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 30 C 20 18, 40 34, 60 14 C 80 6, 100 18, 120 8 C 140 12, 160 20, 200 10 L 200 44 L 0 44 Z" fill="url(#cc-energy2)" />
                  <path d="M0 30 C 20 18, 40 34, 60 14 C 80 6, 100 18, 120 8 C 140 12, 160 20, 200 10" fill="none" stroke="var(--cc-accent)" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <Placeholder icon={Zap} title="Analytics ready" desc="Historical kWh, per-room breakdown and peak indicators will render here once the backend exposes metering. Visual shell is live." />
            </div>
          )}

          {activeTab === "security" && (
            <div style={{ maxWidth: 720 }}>
              <Placeholder icon={Shield} title="Security" desc="Access, locks and sensors. The apartment's smart lock is live on the floorplan — tap the entrance door to control it." />
              <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
                <div className="cc-control-row">
                  <span className="cc-control-label"><Shield size={14} /> Main Entrance · Smart Lock</span>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", padding: "4px 10px", borderRadius: 999, background: "var(--cc-success-soft)", color: "var(--cc-success)", border: "1px solid rgba(34,197,94,0.2)" }}>LOCKED</span>
                </div>
                <div className="cc-control-row">
                  <span className="cc-control-label"><Flame size={14} /> Smoke · Kitchen</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--cc-success)" }}>Clear</span>
                </div>
                <div className="cc-control-row">
                  <span className="cc-control-label"><Thermometer size={14} /> Gas · Dining</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--cc-success)" }}>Safe</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <footer style={{ textAlign: "center", padding: "16px 24px 24px", fontSize: 11, color: "var(--cc-text-dim)", letterSpacing: "0.06em" }}>
        NOVA RESIDENCE · IoT Command Center · {new Date().getFullYear()} · Premium Engineering
      </footer>
    </div>
  );
}
