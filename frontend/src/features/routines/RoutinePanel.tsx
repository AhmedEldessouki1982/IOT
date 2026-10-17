import SwitchCard from "../../components/SwitchCard";
import { useTimers } from "../../hooks/useTimers";
import { useRoomRoutine } from "./useRoomRoutine";
import RoutineGangCard from "./RoutineGangCard";

export interface FallbackGang {
  deviceId: string;
  label: string;
}

/**
 * Reusable room-routine panel.
 *
 * Given a `roomId`, it renders every gang as a routine card (role text =
 * "LED profile" / "Spotlights" / "Exhaust fan", press hint, live state and
 * countdown) fetched from the backend. If the backend is unreachable it falls
 * back to the room's static switch config so the controls still render.
 *
 * The SAME component drives the main toilet today and the master toilet later —
 * only the room config changes.
 */
export default function RoutinePanel({
  roomId,
  fallback = [],
}: {
  roomId?: string;
  fallback?: FallbackGang[];
}) {
  const { routine } = useRoomRoutine(roomId);
  const timers = useTimers();

  if (routine && routine.gangs.length > 0) {
    return (
      <>
        {routine.gangs.map((gang) => (
          <RoutineGangCard
            key={gang.deviceId}
            roomId={routine.roomId}
            gang={gang}
          />
        ))}
      </>
    );
  }

  // Backend offline / not yet configured: render the plain live switches.
  return (
    <>
      {fallback.map((gang) => {
        const live = timers.find((timer) => timer.deviceId === gang.deviceId);
        return (
          <SwitchCard
            key={gang.deviceId}
            deviceId={gang.deviceId}
            label={gang.label}
            // Only a room with a backend routine advances stages on press; a
            // routine-less room (registry roomType "none", e.g. the master
            // bedroom) just toggles its relay from the app.
            routine={Boolean(roomId)}
            remainingSeconds={live?.remainingSeconds}
            durationSeconds={live?.durationSeconds}
            expiresAt={live?.expiresAt}
          />
        );
      })}
    </>
  );
}
