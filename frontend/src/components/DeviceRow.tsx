import type { ReactNode } from "react";

interface DeviceRowProps {
  label: string;
  icon?: ReactNode;
  status?: ReactNode;
  iconAttrs?: Record<string, string>;
  children?: ReactNode;
}

export default function DeviceRow({ label, icon, status, iconAttrs, children }: DeviceRowProps) {
  return (
    <div className="device-row">
      <div className="device-info">
        {icon && (
          <span className="device-icon" {...iconAttrs}>
            {icon}
          </span>
        )}
        <span className="device-label">{label}</span>
      </div>
      {status ?? children}
    </div>
  );
}
