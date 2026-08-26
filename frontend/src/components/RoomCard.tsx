import { Children, type ReactNode } from "react";

interface RoomCardProps {
  name: string;
  icon?: ReactNode;
  children: ReactNode;
}

export default function RoomCard({ name, icon, children }: RoomCardProps) {
  const count = Children.count(children);

  return (
    <section className="room-card">
      <header className="room-card-header">
        {icon && <span className="room-card-icon">{icon}</span>}
        <span className="room-card-name">{name}</span>
        <span className="room-card-meta">
          {count} device{count === 1 ? "" : "s"}
        </span>
      </header>
      <div className="room-card-body">{children}</div>
    </section>
  );
}
