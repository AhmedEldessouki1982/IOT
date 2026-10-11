import DeviceRow from "../shared/DeviceRow";
import { useLongPress } from "../hooks/useLongPress";
import TimerBadge from "./TimerBadge";

interface GangSwitchProps {
  gang: number;
  label: string;
  icon?: React.ReactNode;
  isOn: boolean;
  remainingSeconds?: number;
  onToggle?: (on: boolean) => void;
  onPress?: (pressType: "single" | "long") => void;
  onLongPress?: (pressType: "long") => void;
}

export default function GangSwitch({
  label,
  icon,
  isOn,
  remainingSeconds,
  onToggle,
  onPress,
  onLongPress,
}: GangSwitchProps) {
  const press = useLongPress(
    () => onPress?.("single"),
    () => onLongPress?.("long") ?? onPress?.("long"),
  );

  const handleClick = () => {
    onToggle?.(!isOn);
  };

  return (
    <DeviceRow
      label={label}
      icon={icon}
      iconAttrs={{ "data-on": String(isOn) }}
      status={
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {remainingSeconds !== undefined && <TimerBadge seconds={remainingSeconds} />}
          <button
            type="button"
            onClick={handleClick}
            {...press}
            data-on={isOn}
            aria-pressed={isOn}
            aria-label={`${label}: ${isOn ? "on" : "off"}`}
            className="toggle"
          >
            <span className="toggle-knob" />
          </button>
        </div>
      }
    />
  );
}
