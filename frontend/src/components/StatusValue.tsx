import { useContext } from "react";
import { MotionReadiness } from "../hooks/MotionReadiness";
import { useAnimatedNumber } from "../hooks/useAnimatedNumber";
import { useStateChange } from "../hooks/useStateChange";
import { motionMs } from "../hooks/motionTokens";

export default function StatusValue({ value }: { value: string }) {
  const ready = useContext(MotionReadiness);
  const match = /^(\d+)\/(\d+)$/.exec(value);
  const number = useAnimatedNumber(match ? Number(match[1]) : 0, ready ? motionMs("number") : 0);
  const revision = useStateChange(value);
  return <span className="home-status-value" data-numeric={!!match}><span key={match ? "numeric" : revision} className={!match && revision ? "changed-label" : undefined}>{match ? `${number}/${match[2]}` : value}</span></span>;
}
