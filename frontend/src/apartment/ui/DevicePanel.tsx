import type { ReactNode } from "react";
import { Lightbulb, Lamp, Fan, Tv, Blinds, Thermometer, Droplets, Flame, Lock } from "lucide-react";
import type { DevicePlacement } from "../types";
import { useMergedState, useRawState } from "../hooks/useDeviceState";
import { useDeviceStore } from "../store/useDeviceStore";

function kindIcon(p: DevicePlacement) {
  switch (p.kind) {
    case "ceilingLight":
      return <Lightbulb size={15} strokeWidth={1.5} />;
    case "lamp":
      return <Lamp size={15} strokeWidth={1.5} />;
    case "ac":
      return <Fan size={15} strokeWidth={1.5} />;
    case "tv":
      return <Tv size={15} strokeWidth={1.5} />;
    case "curtains":
      return <Blinds size={15} strokeWidth={1.5} />;
    case "lock":
      return <Lock size={15} strokeWidth={1.5} />;
    case "sensor":
      if (p.sensorOf === "humidity") return <Droplets size={15} strokeWidth={1.5} />;
      if (p.sensorOf === "smoke") return <Flame size={15} strokeWidth={1.5} />;
      return <Thermometer size={15} strokeWidth={1.5} />;
  }
}

function PowerButton({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="apt-power" data-on={on} onClick={onToggle}>
      <span className="apt-power-dot" />
      {on ? "ON" : "OFF"}
    </button>
  );
}

function SliderRow({
  label,
  min,
  max,
  step,
  value,
  unit,
  disabled,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit: string;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <label className="apt-row">
      <span className="apt-row-label">
        {label}
        <b>
          {value}
          {unit}
        </b>
      </span>
      <input
        type="range"
        className="apt-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: unknown;
  onChange: (v: string) => void;
}) {
  return (
    <div className="apt-seg">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          data-active={value === opt}
          onClick={() => onChange(opt)}
        >
          {opt.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function Stepper({
  label,
  min,
  max,
  value,
  unit,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="apt-row">
      <span className="apt-row-label">{label}</span>
      <div className="apt-stepper">
        <button type="button" disabled={value <= min} onClick={() => onChange(value - 1)}>
          −
        </button>
        <b>
          {value}
          {unit}
        </b>
        <button type="button" disabled={value >= max} onClick={() => onChange(value + 1)}>
          +
        </button>
      </div>
    </div>
  );
}

export function DevicePanel({
  deviceId,
  onClose,
  placements,
  rooms,
}: {
  deviceId: string;
  onClose: () => void;
  placements: DevicePlacement[];
  rooms: Array<{ id: string; name: string }>;
}) {
  const placement = placements.find((d) => d.deviceId === deviceId);
  const state = useMergedState(deviceId, placement?.kind ?? "sensor");
  const raw = useRawState(deviceId);
  const sendCommand = useDeviceStore((s) => s.sendCommand);

  if (!placement) return null;

  const roomName = rooms.find((r) => r.id === placement.roomId)?.name ?? placement.roomId;
  const num = (key: string, fallback: number) => Number(state[key] ?? fallback);
  const isOn = Boolean(state.on);

  let body: ReactNode = null;

  if (placement.kind === "ceilingLight" || placement.kind === "lamp") {
    body = (
      <>
        <PowerButton on={isOn} onToggle={() => sendCommand(deviceId, { on: !isOn })} />
        <SliderRow
          label="BRIGHTNESS"
          min={0}
          max={100}
          step={1}
          value={num("brightness", 80)}
          unit="%"
          disabled={!isOn}
          onChange={(brightness) => sendCommand(deviceId, { brightness })}
        />
        <SliderRow
          label="COLOR TEMP"
          min={2200}
          max={6500}
          step={100}
          value={num("kelvin", 3400)}
          unit="K"
          disabled={!isOn}
          onChange={(kelvin) => sendCommand(deviceId, { kelvin })}
        />
      </>
    );
  } else if (placement.kind === "ac") {
    body = (
      <>
        <PowerButton on={isOn} onToggle={() => sendCommand(deviceId, { on: !isOn })} />
        <Stepper
          label="TARGET"
          min={16}
          max={30}
          value={num("tempC", 23)}
          unit="°C"
          onChange={(tempC) => sendCommand(deviceId, { tempC })}
        />
        <div className="apt-row">
          <span className="apt-row-label">MODE</span>
          <Segmented
            options={["cool", "heat", "dry", "fan"]}
            value={state.mode}
            onChange={(mode) => sendCommand(deviceId, { mode })}
          />
        </div>
        <div className="apt-row">
          <span className="apt-row-label">FAN</span>
          <Segmented
            options={["auto", "low", "medium", "high"]}
            value={state.fan}
            onChange={(fan) => sendCommand(deviceId, { fan })}
          />
        </div>
      </>
    );
  } else if (placement.kind === "tv") {
    body = <PowerButton on={isOn} onToggle={() => sendCommand(deviceId, { on: !isOn })} />;
  } else if (placement.kind === "lock") {
    const locked = state.locked !== false;
    body = (
      <>
        <button
          type="button"
          className="apt-power"
          data-on={locked}
          onClick={() => sendCommand(deviceId, { locked: !locked })}
        >
          <span className="apt-power-dot" />
          {locked ? "LOCKED" : "UNLOCKED"}
        </button>
        <div className="apt-readout">
          MAIN DOOR · {locked ? "SECURE" : "OPEN — RE-LOCK?"}
        </div>
      </>
    );
  } else if (placement.kind === "curtains") {
    body = (
      <SliderRow
        label="OPEN"
        min={0}
        max={100}
        step={1}
        value={num("open", 70)}
        unit="%"
        onChange={(open) => sendCommand(deviceId, { open })}
      />
    );
  } else {
    const metric = placement.sensorOf ?? "tempC";
    const alarm = metric === "smoke" && state.smoke === "alarm";
    const readout =
      metric === "tempC"
        ? `${num("tempC", 24.5).toFixed(1)}°C`
        : metric === "humidity"
          ? `${num("humidity", 48).toFixed(0)}% RH`
          : alarm
            ? "ALERT"
            : "CLEAR";
    body = (
      <div className={`apt-readout${alarm ? " is-alarm" : ""}`}>{readout}</div>
    );
  }

  return (
    <aside className="apt-panel">
      <header className="apt-panel-head">
        <div>
          <h2>
            <span className="apt-panel-icon">{kindIcon(placement)}</span>
            {placement.name.toUpperCase()}
          </h2>
          <span className="apt-panel-room">{roomName.toUpperCase()}</span>
        </div>
        <button type="button" className="apt-close" onClick={onClose}>
          ×
        </button>
      </header>

      <div className="apt-panel-body">{body}</div>

      <footer className="apt-panel-foot">
        <span>
          {raw
            ? `LAST UPDATE ${new Date(raw.timestamp).toLocaleTimeString()}`
            : "NO BACKEND STATE YET · DEFAULTS SHOWN"}
        </span>
        <code>POST /devices/{deviceId}/command</code>
      </footer>
    </aside>
  );
}
