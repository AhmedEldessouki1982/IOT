import type { CSSProperties, ReactNode } from "react";
import { useStateChange } from "../hooks/useStateChange";
import { useExternalChange } from "../hooks/useExternalChange";
import { markLocalAction } from "../hooks/localActions";

export default function DeviceMotion({ deviceKey, label, value, kind, children }: {
  deviceKey: string; label: string; value: boolean | undefined; kind: string; children: ReactNode;
}) {
  const revision = useStateChange(value);
  const flash = useExternalChange(deviceKey, value);
  const action = (event: React.SyntheticEvent) => {
    if ((event.target as Element).closest("button")) markLocalAction(deviceKey);
  };
  const state = kind === "lock" ? value ? "locked" : "unlocked" : value ? "turned on" : "turned off";
  return <div className="device-motion" data-device-key={deviceKey} data-kind={kind} data-on={value}
    data-changed={revision > 0} data-revision={revision % 2}
    onPointerDownCapture={action} onClickCapture={action}>
    {children}
    {flash.revision > 0 && <span key={flash.revision} className="row-flash" aria-hidden="true" style={{ "--flash-delay": `${flash.delay}ms` } as CSSProperties} />}
    <span className="visually-hidden" aria-live="polite" aria-atomic="true">{flash.external ? `${label} ${state}` : ""}</span>
  </div>;
}
