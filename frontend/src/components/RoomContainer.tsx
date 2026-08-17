import { Children, type ReactNode } from "react";
import Cursor from "./Cursor";

interface RoomContainerProps {
  name: string;
  accent?: "green" | "amber";
  index?: number;
  icon?: ReactNode;
  art?: string;
  children: ReactNode;
}

export default function RoomContainer({
  name,
  accent = "green",
  index = 0,
  icon,
  art,
  children,
}: RoomContainerProps) {
  const count = Children.count(children);

  return (
    <section
      className={`room-panel room-${accent} animate-flicker`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <header className="flex items-center gap-2.5 border-b border-term-dim/70 px-4 py-2.5">
        <span className="flex gap-1.5 text-[0.6rem] leading-none" aria-hidden="true">
          <span className="text-term-red">●</span>
          <span className="text-term-amber">●</span>
          <span className="text-term-green">●</span>
        </span>
        {icon && <span className="text-(--accent) [&_svg]:drop-shadow-[0_0_4px_var(--accent-glow)]">{icon}</span>}
        <span className="text-(--accent) text-[0.72rem] font-semibold uppercase tracking-[0.22em] glow-text">
          {name}
        </span>
        <Cursor className="ml-1 text-(--accent) text-[0.7rem]" />
        <span className="ml-auto text-[0.6rem] tracking-[0.18em] text-term-muted">
          {count} DEVICE{count === 1 ? "" : "S"}
        </span>
      </header>
      <div className="divide-y divide-term-dim/60">
        {art && <pre className="art-block">{art}</pre>}
        {children}
      </div>
    </section>
  );
}