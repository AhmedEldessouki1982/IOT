import type { ReactNode } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

interface GasLeakSensorProps {
  detected?: boolean;
  icon?: ReactNode;
}

export default function GasLeakSensor({ detected = false, icon }: GasLeakSensorProps) {
  return (
    <div className="device-row">
      <div className="device-info">
        <span className="device-icon" data-gas={detected ? "danger" : "safe"}>
          {icon}
        </span>
        <span className="device-label">Gas Leak Sensor</span>
      </div>
      <span className={`gas-badge ${detected ? "gas-badge--danger" : "gas-badge--safe"}`}>
        {detected ? (
          <>
            <AlertTriangle size={12} strokeWidth={2} />
            Detected
          </>
        ) : (
          <>
            <ShieldCheck size={12} strokeWidth={2} />
            Safe
          </>
        )}
      </span>
    </div>
  );
}
