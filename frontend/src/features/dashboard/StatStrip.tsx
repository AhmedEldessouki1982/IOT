import { LayoutGrid, Cpu, Radio, Map } from "lucide-react";

interface StatStripProps {
  rooms: number;
  devices: number;
  online: boolean;
}

export default function StatStrip({ rooms, devices, online }: StatStripProps) {
  return (
    <div className="stat-strip">
      <span className="stat-chip">
        <span className="stat-chip-icon"><LayoutGrid size={13} strokeWidth={1.5} /></span>
        <span className="stat-chip-value">{rooms}</span> Rooms
      </span>
      <span className="stat-chip">
        <span className="stat-chip-icon"><Cpu size={13} strokeWidth={1.5} /></span>
        <span className="stat-chip-value">{devices}</span> Devices
      </span>
      <span className="stat-chip">
        <span className="stat-chip-icon"><Radio size={13} strokeWidth={1.5} /></span>
        <span className="stat-chip-value">{online ? "1" : "0"}</span> Live
      </span>
      <span className="stat-strip-spacer" />
      <a href="/2d" className="floorplan-btn">
        <Map size={13} strokeWidth={2} />
        Floorplan
      </a>
    </div>
  );
}
