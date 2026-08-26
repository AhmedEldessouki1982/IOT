import { AlertTriangle, ShieldCheck } from "lucide-react";
import DeviceRow from "./DeviceRow";

interface GasLeakSensorProps {
  detected?: boolean;
  icon?: React.ReactNode;
}

export default function GasLeakSensor({ detected = false, icon }: GasLeakSensorProps) {
  return (
    <DeviceRow
      label="Gas Leak Sensor"
      icon={icon}
      iconAttrs={{ "data-gas": detected ? "danger" : "safe" }}
      status={
        <span className={`gas-badge ${detected ? "gas-badge--danger" : "gas-badge--safe"}`}>
          {detected ? (
            <><AlertTriangle size={12} strokeWidth={2} /> Detected</>
          ) : (
            <><ShieldCheck size={12} strokeWidth={2} /> Safe</>
          )}
        </span>
      }
    />
  );
}
