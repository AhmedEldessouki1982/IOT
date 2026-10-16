import type { DeviceConfig } from "../devices";
import { liveDeviceId } from "../devices/deviceRuntime";
import RoutinePanel from "./RoutinePanel";

/**
 * A room's live switch row — the single place a room's gangs are rendered.
 *
 * Given the room's backend routine id and its static switch config, it shows
 * the shared RoutinePanel (role text, press hints, live state and countdowns),
 * falling back to the static config while the backend is unreachable.
 *
 * Shared by the room card, the room detail view and nested rooms, so a room is
 * rendered the same way wherever it appears.
 */
export default function RoutineSwitchRow({
  roomId,
  switches,
  stopPropagation = false,
}: {
  /** Backend routine room id (`GET /api/rooms/<roomId>`). */
  roomId?: string;
  switches: DeviceConfig[];
  /** Set inside a clickable room card so a switch press never expands the room. */
  stopPropagation?: boolean;
}) {
  if (switches.length === 0) return null;

  return (
    <div
      className="switch-row"
      onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
    >
      <RoutinePanel
        roomId={roomId}
        fallback={switches.map((sw) => ({
          deviceId: liveDeviceId(sw) ?? sw.id,
          label: sw.label,
        }))}
      />
    </div>
  );
}
