import DeviceToggle from "../../../shared/DeviceToggle";

export interface ApplianceDeviceProps {
  variant: "card";
  label: string;
  state?: boolean;
  onToggle?: (on: boolean) => void;
  icon?: React.ReactNode;
  badge?: "live" | "demo";
}

/** Kitchen / submetered appliance (oven, dishwasher, …) — the same on/off
 *  toggle row as a light, so it can sit in the shared device list. */
export default function ApplianceDevice(props: ApplianceDeviceProps) {
  return (
    <DeviceToggle
      label={props.label}
      state={props.state}
      onToggle={props.onToggle}
      icon={props.icon}
      badge={props.badge}
    />
  );
}