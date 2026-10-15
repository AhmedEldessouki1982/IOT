import { useEffect, useState } from "react";
import { useHomeStore } from "../store/useHomeStore";

export default function DeviceConnection({ deviceId }: { deviceId: string }) {
  const online = useHomeStore((s) => s.online);
  const device = useHomeStore((s) => s.devices[deviceId]);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  const timestamp = Date.parse(device?.timestamp ?? "");
  const reporting = online && Number.isFinite(timestamp) && now - timestamp < 300000;
  const label = !online ? "Hub offline" : reporting ? "Live" : "No recent data";
  return <small className="device-connection"><span className="cc-live-dot--sm" data-live={reporting} aria-hidden="true" />{label}</small>;
}
