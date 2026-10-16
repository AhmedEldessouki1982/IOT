import { apiPost } from "../../lib/api";
import { useTimers } from "../../hooks/useTimers";
import SwitchCard from "../../components/SwitchCard";
import type { GangView } from "./routineTypes";

/**
 * One gang of a room routine: a live switch card carrying the gang's role text
 * and its cycle hint (e.g. "10m → 30m → off"), wired to the routine API.
 *
 * Every gesture advances exactly ONE stage:
 *
 *   click -> POST /api/rooms/:roomId/gangs/:gang/press
 *
 * The backend decides from the stage list + running timer whether that means
 * "arm 10 min", "arm 30 min", or "switch off" (the exhaust fan has a single
 * 10m stage, so its second click turns it off). A tap and a long press are both
 * one click, matching the wall switch.
 */
export default function RoutineGangCard({
  roomId,
  gang,
}: {
  roomId: string;
  gang: GangView;
}) {
  const timers = useTimers();
  const live = timers.find(
    (timer) => timer.deviceId === gang.deviceId && timer.gang === gang.gang,
  );

  const handlePress = () => {
    void apiPost(`/api/rooms/${roomId}/gangs/${gang.gang}/press`, {}).catch(
      () => {},
    );
  };

  return (
    <SwitchCard
      deviceId={gang.deviceId}
      label={gang.label}
      hint={gang.hint}
      remainingSeconds={live?.remainingSeconds ?? gang.timer?.remainingSeconds}
      durationSeconds={live?.durationSeconds ?? gang.timer?.durationSeconds}
      expiresAt={live?.expiresAt ?? gang.timer?.expiresAt}
      onPress={handlePress}
    />
  );
}
