import { Activity, Lightbulb, Lock, Radio, ShieldCheck } from "lucide-react";
import StatusValue from "./StatusValue";

export interface HomeStatusItem {
  id: string;
  label: string;
  value: string;
  tone: "good" | "warn" | "danger" | "info";
  icon: typeof Activity;
}

interface HomeStatusStripProps {
  items: HomeStatusItem[];
}

const ICONS = {
  lights: Lightbulb,
  doors: Lock,
  sensors: ShieldCheck,
  hub: Radio,
  activity: Activity,
};

export function statusIcon(id: keyof typeof ICONS) {
  return ICONS[id];
}

export default function HomeStatusStrip({ items }: HomeStatusStripProps) {
  return (
    <section className="home-status-strip" aria-label="Home status">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <article key={item.id} className="home-status-card" data-tone={item.tone}>
            <span className="home-status-icon" aria-hidden="true">
              <Icon size={15} strokeWidth={1.8} />
            </span>
            <span>
              <StatusValue value={item.value} />
              <span className="home-status-label">{item.label}</span>
            </span>
          </article>
        );
      })}
    </section>
  );
}
