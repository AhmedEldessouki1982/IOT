import { Lightbulb, Thermometer, Flame, Fan, SlidersHorizontal, Activity, ShieldCheck, AlertTriangle } from "lucide-react";
import { ROOMS } from "../../rooms";
import { DEVICES_2D, ROOMS_2D } from "../../apartment2d/config/apartment";
import { useMergedState, useRawState } from "../../apartment/hooks/useDeviceState";
import { useDeviceStore } from "../../apartment/store/useDeviceStore";
import { useHomeStore } from "../../store/useHomeStore";
import EnvOverview from "./EnvOverview";

interface InspectorProps {
  selectedId: string | null;
  focusedRoomId: string | null;
  onCloseDevice: () => void;
  onSelectDevice: (id: string) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="cc-control-group">
      <h4>{title}</h4>
      {children}
    </div>
  );
}

function PremiumPower({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="cc-power-btn" data-on={on} onClick={onToggle}>
      <span className="cc-power-dot" />
      {on ? "ON" : "OFF"}
    </button>
  );
}

function PremiumSlider({
  label,
  value,
  unit,
  min,
  max,
  step,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="cc-slider-wrap">
      <div className="cc-slider-head">
        <span className="cc-slider-label">{label}</span>
        <span className="cc-slider-value">{value}{unit}</span>
      </div>
      <input
        type="range"
        className="cc-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function Seg({ options, value, onChange }: { options: string[]; value: unknown; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            border: "1px solid var(--cc-border)",
            background: value === o ? "var(--cc-accent-soft)" : "var(--cc-surface-2)",
            color: value === o ? "var(--cc-accent)" : "var(--cc-text-muted)",
            cursor: "pointer",
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function DeviceDetail({ deviceId, onClose }: { deviceId: string; onClose: () => void }) {
  const placement = DEVICES_2D.find((d) => d.deviceId === deviceId);
  const kind = placement?.kind ?? "sensor";
  const state = useMergedState(deviceId, kind as any);
  const raw = useRawState(deviceId);
  const send = useDeviceStore((s) => s.sendCommand);

  // also support light1 via home store for backward compat
  const homeDevice = useHomeStore((s) => s.device);
  const homeToggle = useHomeStore((s) => s.toggle);
  const isLight1 = deviceId === "light1";

  if (!placement && !isLight1) return null;

  const roomName = ROOMS_2D.find((r) => r.id === placement?.roomId)?.name ?? placement?.roomId ?? "Reception";
  const displayName = placement?.name ?? "Reception Ceiling Light";
  const isOn = isLight1 ? homeDevice?.state.on === true : Boolean(state.on);
  const num = (k: string, fb: number) => Number(state[k] ?? fb);

  let body: React.ReactNode = null;

  if (kind === "ceilingLight" || kind === "lamp" || isLight1) {
    const toggle = isLight1 ? homeToggle : () => send(deviceId, { on: !isOn });
    body = (
      <>
        <Section title="Power">
          <div className="cc-control-row">
            <span className="cc-control-label"><Lightbulb size={14} /> {displayName}</span>
            <PremiumPower on={isOn} onToggle={toggle} />
          </div>
        </Section>
        <PremiumSlider label="Brightness" value={num("brightness", 80)} unit="%" min={0} max={100} step={1} disabled={!isOn} onChange={(v) => send(deviceId, { brightness: v })} />
        <PremiumSlider label="Color temp" value={num("kelvin", 3400)} unit="K" min={2200} max={6500} step={100} disabled={!isOn} onChange={(v) => send(deviceId, { kelvin: v })} />
      </>
    );
  } else if (kind === "ac") {
    body = (
      <>
        <Section title="Climate">
          <div className="cc-control-row">
            <span className="cc-control-label"><Fan size={14} /> AC · {roomName}</span>
            <PremiumPower on={isOn} onToggle={() => send(deviceId, { on: !isOn })} />
          </div>
        </Section>
        <div className="cc-slider-wrap">
          <div className="cc-slider-head"><span className="cc-slider-label">Target</span><span className="cc-slider-value">{num("tempC", 23)}°C</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="cc-icon-btn" onClick={() => send(deviceId, { tempC: num("tempC", 23) - 1 })} disabled={num("tempC", 23) <= 16}>−</button>
            <div style={{ flex: 1, height: 4, background: "var(--cc-border-strong)", borderRadius: 2, position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${((num("tempC", 23) - 16) / 14) * 100}%`, background: "var(--cc-accent)", borderRadius: 2 }} />
            </div>
            <button className="cc-icon-btn" onClick={() => send(deviceId, { tempC: num("tempC", 23) + 1 })} disabled={num("tempC", 23) >= 30}>+</button>
          </div>
        </div>
        <Section title="Mode"><Seg options={["cool", "heat", "dry", "fan"]} value={state.mode} onChange={(v) => send(deviceId, { mode: v })} /></Section>
        <Section title="Fan"><Seg options={["auto", "low", "medium", "high"]} value={state.fan} onChange={(v) => send(deviceId, { fan: v })} /></Section>
      </>
    );
  } else if (kind === "sensor") {
    const metric = placement?.sensorOf ?? "tempC";
    const alarm = metric === "smoke" && state.smoke === "alarm";
    const readout = metric === "tempC" ? `${num("tempC", 24.5).toFixed(1)}°C` : metric === "humidity" ? `${num("humidity", 48).toFixed(0)}%` : alarm ? "ALERT" : "CLEAR";
    body = (
      <div style={{ padding: 16, background: alarm ? "var(--cc-danger-soft)" : "var(--cc-surface-2)", border: `1px solid ${alarm ? "var(--cc-danger)" : "var(--cc-border)"}`, borderRadius: "var(--cc-radius-sm)", textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "var(--cc-text-muted)", fontWeight: 600 }}>{metric.toUpperCase()}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: alarm ? "var(--cc-danger)" : "var(--cc-accent)", marginTop: 6, fontVariantNumeric: "tabular-nums" }}>{readout}</div>
        <div style={{ fontSize: 11, color: "var(--cc-text-muted)", marginTop: 6 }}>{alarm ? "Smoke detected — ventilate immediately" : "Nominal · last update just now"}</div>
      </div>
    );
  } else {
    body = (
      <div className="cc-control-row">
        <span className="cc-control-label"><SlidersHorizontal size={14} /> {displayName}</span>
        <PremiumPower on={isOn} onToggle={() => send(deviceId, { on: !isOn })} />
      </div>
    );
  }

  return (
    <div className="cc-inspector">
      <div className="cc-inspector-head">
        <div className="cc-inspector-kicker">{roomName} · {kind}</div>
        <h3 className="cc-inspector-title">{displayName}</h3>
        <p className="cc-inspector-sub">{raw ? `Updated ${new Date(raw.timestamp).toLocaleTimeString()}` : "Awaiting device heartbeat · showing defaults"}</p>
        <button
          type="button"
          onClick={onClose}
          style={{ position: "absolute", top: 12, right: 12, background: "var(--cc-surface-2)", border: "1px solid var(--cc-border)", borderRadius: 8, width: 28, height: 28, display: "grid", placeItems: "center", color: "var(--cc-text-muted)", cursor: "pointer" }}
        >
          ×
        </button>
      </div>
      <div className="cc-inspector-body">{body}</div>
    </div>
  );
}

function RoomDetail({ roomId, onSelectDevice }: { roomId: string; onSelectDevice: (id: string) => void }) {
  const room = ROOMS.find((r) => r.id === roomId) ?? ROOMS_2D.find((r) => r.id === roomId) as any;
  const roomName = room?.name ?? roomId;
  const devices = DEVICES_2D.filter((d) => d.roomId === roomId);
  const roomConfig = ROOMS.find((r) => r.id === roomId);

  return (
    <div className="cc-inspector">
      <div className="cc-inspector-head">
        <div className="cc-inspector-kicker">Room · Focus</div>
        <h3 className="cc-inspector-title">{roomName}</h3>
        <p className="cc-inspector-sub">{devices.length} devices · {roomConfig ? `${roomConfig.devices.length} controls` : "spatial view"}</p>
      </div>
      <div className="cc-inspector-body">
        {roomConfig ? (
          <Section title="Devices in this room">
            {roomConfig.devices.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => d.kind !== "temp" && onSelectDevice(d.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "12px 14px",
                  background: "var(--cc-surface-2)",
                  border: "1px solid var(--cc-border)",
                  borderRadius: "var(--cc-radius-sm)",
                  color: "var(--cc-text)",
                  cursor: d.kind === "temp" ? "default" : "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 500 }}>
                  {d.kind === "light" ? <Lightbulb size={14} /> : d.kind === "temp" ? <Thermometer size={14} /> : <Flame size={14} />}
                  {d.label}
                </span>
                <span style={{ fontSize: 11, color: "var(--cc-text-muted)" }}>{d.kind === "temp" ? "sensor" : "tap →"}</span>
              </button>
            ))}
          </Section>
        ) : devices.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--cc-text-muted)", textAlign: "center", padding: 16 }}>No devices mapped to this room.</div>
        ) : (
          <Section title="Spatial devices">
            {devices.map((d) => (
              <button
                key={d.deviceId}
                type="button"
                onClick={() => onSelectDevice(d.deviceId)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "12px 14px",
                  background: "var(--cc-surface-2)",
                  border: "1px solid var(--cc-border)",
                  borderRadius: "var(--cc-radius-sm)",
                  color: "var(--cc-text)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 500 }}>
                  <Activity size={14} /> {d.name}
                </span>
                <span style={{ fontSize: 11, color: "var(--cc-text-muted)" }}>tap →</span>
              </button>
            ))}
          </Section>
        )}

        <div className="cc-env-grid" style={{ marginTop: 8 }}>
          <div className="cc-env-card">
            <div className="cc-env-kicker"><Thermometer size={12} /> Temp</div>
            <div className="cc-env-value">23.8<span>°C</span></div>
          </div>
          <div className="cc-env-card">
            <div className="cc-env-kicker"><ShieldCheck size={12} /> Status</div>
            <div className="cc-env-value" style={{ fontSize: 14 }}>All clear</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InspectorPanel({ selectedId, focusedRoomId, onCloseDevice, onSelectDevice }: InspectorProps) {
  if (selectedId) {
    return <DeviceDetail deviceId={selectedId} onClose={onCloseDevice} />;
  }
  if (focusedRoomId) {
    return <RoomDetail roomId={focusedRoomId} onSelectDevice={onSelectDevice} />;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <EnvOverview />
      <div className="cc-inspector">
        <div className="cc-inspector-head">
          <div className="cc-inspector-kicker">System</div>
          <h3 className="cc-inspector-title">Residence Overview</h3>
          <p className="cc-inspector-sub">Tap a room or device on the floorplan to inspect</p>
        </div>
        <div className="cc-inspector-body">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ROOMS.map((r) => (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--cc-border-subtle)", fontSize: 12 }}>
                <span style={{ color: "var(--cc-text-2)", fontWeight: 500 }}>{r.name}</span>
                <span style={{ color: "var(--cc-text-muted)", fontVariantNumeric: "tabular-nums" }}>{r.devices.length} devices</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <span style={{ flex: 1, padding: "10px 12px", background: "var(--cc-accent-soft)", border: "1px solid var(--cc-accent-glow)", borderRadius: "var(--cc-radius-sm)", fontSize: 11, fontWeight: 600, color: "var(--cc-accent)", textAlign: "center" }}>
              <ShieldCheck size={12} style={{ verticalAlign: -2, marginRight: 6 }} />All systems secure
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--cc-text-muted)", justifyContent: "center", marginTop: 4 }}>
            <AlertTriangle size={12} /> Gas sensor · Safe · Dining Area
          </div>
        </div>
      </div>
    </div>
  );
}
