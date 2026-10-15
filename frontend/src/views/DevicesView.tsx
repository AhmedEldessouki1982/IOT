import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Filter,
  ListChecks,
  Radio,
  Search,
  WifiOff,
} from "lucide-react";
import KpiRail from "./KpiRail";
import type { DeviceRecord, ReadinessSummary } from "../hooks/useDeviceRecords";

type DeviceHealthFilter = "all" | DeviceRecord["health"];
type DeviceSourceFilter = "all" | DeviceRecord["source"];

interface DevicesViewProps {
  records: DeviceRecord[];
  readiness: ReadinessSummary;
  online: boolean;
}

function formatLastSeen(value?: string) {
  if (!value) return "No data yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function DevicesView({
  records,
  readiness,
  online,
}: DevicesViewProps) {
  const [deviceSearch, setDeviceSearch] = useState("");
  const [deviceHealthFilter, setDeviceHealthFilter] =
    useState<DeviceHealthFilter>("all");
  const [deviceSourceFilter, setDeviceSourceFilter] =
    useState<DeviceSourceFilter>("all");

  const filteredDeviceRecords = useMemo(() => {
    const query = deviceSearch.trim().toLowerCase();
    return records.filter((record) => {
      const matchesQuery =
        !query ||
        record.config.label.toLowerCase().includes(query) ||
        record.roomName.toLowerCase().includes(query) ||
        record.config.kind.toLowerCase().includes(query) ||
        (record.liveId ?? "").toLowerCase().includes(query);
      const matchesHealth =
        deviceHealthFilter === "all" || record.health === deviceHealthFilter;
      const matchesSource =
        deviceSourceFilter === "all" || record.source === deviceSourceFilter;
      return matchesQuery && matchesHealth && matchesSource;
    });
  }, [deviceHealthFilter, deviceSearch, deviceSourceFilter, records]);

  return (
    <section className="business-panel">
      <div className="panel-headline">
        <h2>Devices</h2>
        <p>Check device status, room assignment, and recent connection time.</p>
      </div>
      <KpiRail readiness={readiness} online={online} />
      <div className="device-toolbar" aria-label="Device filters">
        <label className="field-control field-control--search">
          <Search size={14} strokeWidth={1.8} aria-hidden="true" />
          <input
            value={deviceSearch}
            onChange={(event) => setDeviceSearch(event.target.value)}
            placeholder="Search room, device, type, or live id"
            type="search"
          />
        </label>
        <label className="field-control">
          <Filter size={14} strokeWidth={1.8} aria-hidden="true" />
          <select
            value={deviceHealthFilter}
            onChange={(event) =>
              setDeviceHealthFilter(event.target.value as DeviceHealthFilter)
            }
          >
            <option value="all">All health</option>
            <option value="online">Online</option>
            <option value="pending">Pending</option>
            <option value="stale">Stale</option>
            <option value="unavailable">Unavailable</option>
            <option value="demo">Demo</option>
          </select>
        </label>
        <label className="field-control">
          <Radio size={14} strokeWidth={1.8} aria-hidden="true" />
          <select
            value={deviceSourceFilter}
            onChange={(event) =>
              setDeviceSourceFilter(event.target.value as DeviceSourceFilter)
            }
          >
            <option value="all">All sources</option>
            <option value="live">Live only</option>
            <option value="demo">Demo only</option>
          </select>
        </label>
        <span className="device-result-count">
          {filteredDeviceRecords.length}/{records.length} shown
        </span>
      </div>
      {filteredDeviceRecords.length ? <div className="device-admin-list">
        <table className="device-admin-table">
          <thead><tr><th scope="col">Name</th><th scope="col">Room</th><th scope="col">Type</th><th scope="col">ID</th><th scope="col">State</th><th scope="col">Last seen</th></tr></thead>
          <tbody>{filteredDeviceRecords.map((record) => <tr key={record.config.id} data-health={record.health}>
            <td data-label="Name"><span className="device-admin-state" aria-hidden="true">
              {record.health === "online" && <CheckCircle2 size={15} />}
              {(record.health === "stale" || record.health === "pending") && <Clock3 size={15} />}
              {record.health === "unavailable" && <WifiOff size={15} />}
              {record.health === "demo" && <ListChecks size={15} />}
            </span><strong>{record.config.label}</strong></td>
            <td data-label="Room">{record.roomName}</td>
            <td data-label="Type">{record.config.kind}</td>
            <td data-label="ID"><code>{record.liveId ?? "Demo"}</code></td>
            <td data-label="State"><span className="device-admin-pill">{record.config.kind === "room-temp" ? `${(record.config.current ?? 22).toFixed(1)} °C` : record.stateText}</span>{record.source === "demo" && <small className="device-demo-label">Demo</small>}</td>
            <td data-label="Last seen">{record.source === "live" ? formatLastSeen(record.lastSeen) : "Demo device"}</td>
          </tr>)}</tbody>
        </table>
      </div> : <div className="empty-state"><strong>No devices match these filters</strong><span>Clear the search or choose different filters.</span></div>}
    </section>
  );
}
