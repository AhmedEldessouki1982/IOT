import { useEffect, useRef, useState } from "react";
import { Check, Hourglass, RotateCcw } from "lucide-react";
import type { ScenePreset } from "../dashboard/scenes";
import { motionMs } from "../hooks/motionTokens";

export default function SceneActionButton({ scene, onApply }: { scene: ScenePreset; onApply: (id: string) => void | Promise<void> }) {
  const [state, setState] = useState<"idle" | "applying" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const timer = useRef<number>();
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; clearTimeout(timer.current); }; }, []);
  const apply = async () => {
    if (state === "applying") return;
    clearTimeout(timer.current);
    setState("applying");
    setError("");
    try {
      await onApply(scene.id);
      // Allow the dispatch indicator to paint without delaying any command.
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      if (!mounted.current) return;
      setState("done");
      timer.current = window.setTimeout(() => setState("idle"), motionMs("done"));
    } catch (e) {
      if (!mounted.current) return;
      setState("error");
      setError(e instanceof Error ? e.message : "Scene could not finish. Try again.");
    }
  };
  const Icon = state === "done" ? Check : state === "applying" ? Hourglass : state === "error" ? RotateCcw : scene.icon;
  return <div className="scene-action">
    <button type="button" className="scene-button" data-state={state} disabled={state === "applying"} aria-busy={state === "applying"}
      onClick={() => void apply()} title={`Apply ${scene.label} scene`}>
      <Icon size={20} aria-hidden="true" /><span>{state === "error" ? `Retry ${scene.label}` : scene.label}</span>
    </button>
    <span className={state === "error" ? "scene-error" : "visually-hidden"} role="status">
      {state === "error" ? error : state === "done" ? `${scene.label} scene applied` : state === "applying" ? `Applying ${scene.label}` : ""}
    </span>
  </div>;
}
