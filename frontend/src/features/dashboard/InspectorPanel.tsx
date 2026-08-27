import { Lightbulb, Thermometer, Flame, Fan, SlidersHorizontal, Activity, ShieldCheck, AlertTriangle } from "lucide-react";
import { ROOMS } from "../rooms/roomsConfig";
import { DEVICES_2D, ROOMS_2D } from "../../apartment2d/config/apartment";
import { useMergedState, useRawState } from "../../apartment2d/hooks/useDeviceState";
import { useDeviceStore } from "../../apartment2d/store/useDeviceStore";
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
    <div className="cc-seg-row">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          className="cc-seg-btn"
          data-active={value === o}
          onClick={() => onChange(o)}
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
            <span className="cc-control-label">
              <Lightbulb size={14} /> {displayName}
              {isLight1 && <span className="cc-badge cc-badge--live" style={{ marginLeft: 6 }}>Live</span>}
            </span>
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
        <PremiumSlider label="Target" value={num("tempC", 23)} unit="°C" min={16} max={30} step={1} disabled={!isOn} onChange={(v) => send(deviceId, { tempC: v })} />
        <Section title="Mode"><Seg options={["cool", "heat", "dry", "fan"]} value={state.mode} onChange={(v) => send(deviceId, { mode: v })} /></Section>
        <Section title="Fan"><Seg options={["auto", "low", "medium", "high"]} value={state.fan} onChange={(v) => send(deviceId, { fan: v })} /></Section>
      </>
    );
  } else if (kind === "sensor") {
    const metric = placement?.sensorOf ?? "tempC";
    const alarm = metric === "smoke" && state.smoke === "alarm";
    const readout = metric === "tempC" ? `${num("tempC", 24.5).toFixed(1)}°C` : metric === "humidity" ? `${num("humidity", 48).toFixed(0)}%` : alarm ? "ALERT" : "CLEAR";
    body = (
      <div className={`cc-sensor-readout${alarm ? " is-alarm" : ""}`}>
        <div className="cc-sensor-readout-label">{metric.toUpperCase()}</div>
        <div className="cc-sensor-readout-value">{readout}</div>
        <div className="cc-sensor-readout-sub">{alarm ? "Smoke detected — ventilate immediately" : "Nominal · last update just now"}</div>
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
          className="cc-inspector-close"
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
                className="cc-dev-item"
                onClick={() => d.kind !== "temp" && onSelectDevice(d.id)}
                style={{ cursor: d.kind === "temp" ? "default" : "pointer" }}
              >
                <span className="cc-dev-item-label">
                  {d.kind === "light" ? <Lightbulb size={14} /> : d.kind === "temp" ? <Thermometer size={14} /> : <Flame size={14} />}
                  <span>{d.label}</span>
                </span>
                <span className="cc-dev-item-meta">{d.kind === "temp" ? "sensor" : "tap →"}</span>
              </button>
            ))}
          </Section>
        ) : devices.length === 0 ? (
          <div className="cc-empty-msg">No devices mapped to this room.</div>
        ) : (
          <Section title="Spatial devices">
            {devices.map((d) => (
              <button
                key={d.deviceId}
                type="button"
                className="cc-dev-item"
                onClick={() => onSelectDevice(d.deviceId)}
              >
                <span className="cc-dev-item-label">
                  <Activity size={14} /> {d.name}
                </span>
                <span className="cc-dev-item-meta">tap →</span>
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
    <div className="cc-inspector-stack">
      <EnvOverview />
      <div className="cc-inspector">
        <div className="cc-inspector-head">
          <div className="cc-inspector-kicker">System</div>
          <h3 className="cc-inspector-title">Residence Overview</h3>
          <p className="cc-inspector-sub">Tap a room or device on the floorplan to inspect</p>
        </div>
        <div className="cc-inspector-body">
          <div className="cc-room-list">
            {ROOMS.map((r) => (
              <div key={r.id} className="cc-room-list-row">
                <span className="cc-room-list-name">{r.name}</span>
                <span className="cc-room-list-count">{r.devices.length} devices</span>
              </div>
            ))}
          </div>
          <div className="cc-status-banner">
            <ShieldCheck size={12} style={{ verticalAlign: -2, marginRight: 6 }} />All systems secure
          </div>
          <div className="cc-status-footer">
            <AlertTriangle size={12} /> Gas sensor · Safe · Dining Area
          </div>
        </div>
      </div>
    </div>
  );
}
