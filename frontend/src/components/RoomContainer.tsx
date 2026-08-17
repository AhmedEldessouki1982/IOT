import type { ReactNode } from "react";
import Cursor from "./Cursor";

interface RoomContainerProps {
  name: string;
  accent?: "green" | "amber";
  index?: number;
  children: ReactNode;
}

export default function RoomContainer({
  name,
  accent = "green",
  index = 0,
  children,
}: RoomContainerProps) {
  return (
    <section
      className={`room-panel room-${accent} animate-flicker`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <header className="flex items-center gap-2 border-b border-term-dim/70 px-3 py-2">
        <span className="flex gap-1.5 text-[0.55rem] leading-none" aria-hidden="true">
          <span className="text-term-red">●</span>
          <span className="text-term-amber">●</span>
          <span className="text-term-green">●</span>
        </span>
        <span className="ml-2 text-(--accent) text-[0.72rem] font-semibold uppercase tracking-[0.2em] glow-text">
          {name}
        </span>
        <Cursor className="ml-1 text-(--accent) text-[0.7rem]" />
        <span className="ml-auto text-[0.65rem] tracking-[0.3em] text-term-muted">
          ────────
        </span>
      </header>
      <div className="divide-y divide-term-dim/60">{children}</div>
    </section>
  );
}