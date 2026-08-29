import DeviceToggle from "../../../shared/DeviceToggle";

export interface LightDeviceProps {
  variant: "card";
  label: string;
  defaultOn?: boolean;
  state?: boolean;
  onToggle?: (on: boolean) => void;
  icon?: React.ReactNode;
  badge?: "live" | "demo";
}

/** Overhead / ceiling light — renders as an on/off toggle row. */
export default function LightDevice(props: LightDeviceProps) {
  return (
    <DeviceToggle
      label={props.label}
      defaultState={props.defaultOn}
      state={props.state}
      onToggle={props.onToggle}
      icon={props.icon}
      badge={props.badge}
    />
  );
}
