import { Flame } from "lucide-react";
import type { ReactNode } from "react";

export interface GasLeakSensorProps {
  variant: "card";
  label: string;
  /** Dummy reading for now — swap for a backend value later. */
  current?: boolean;
}

/** Gas leak detector — a quiet status row that only turns red when triggered. */
export default function GasLeakSensor({ label, current }: GasLeakSensorProps) {
  const detected = current === true;

  let icon: ReactNode;
  if (detected) {
    icon = <Flame size={15} strokeWidth={1.8} />;
  } else {
    icon = (
      <span style={{ position: "relative", display: "inline-flex" }}>
        <Flame size={15} strokeWidth={1.2} style={{ opacity: 0.5 }} />
      </span>
    );
  }

  return (
    <div
      className="device-row gasleak"
      data-state={detected ? "danger" : "safe"}
    >
      <div className="device-info">
        <span className="device-icon" data-on={String(!detected)}>
          {icon}
        </span>
        <span className="device-label">{label}</span>
      </div>
      <span className="gasleak-status" data-state={detected ? "danger" : "safe"}>
        {detected ? "Leak Detected" : "Safe"}
      </span>
    </div>
  );
}
