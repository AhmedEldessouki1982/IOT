import { useState } from "react";
import { Map, Maximize2, Eye } from "lucide-react";
import { Floorplan } from "../../apartment2d/Floorplan";
import "../../apartment2d/apt.css";
import "../../apartment2d/apartment2d.css";

interface HeroStageProps {
  selectedId: string | null;
  focusedRoomId: string | null;
  onSelect: (id: string | null) => void;
  onRoomFocus: (id: string | null) => void;
}

export default function HeroStage({ selectedId, focusedRoomId, onSelect, onRoomFocus }: HeroStageProps) {
  const [expanded, setExpanded] = useState(false);
  const [tod, setTod] = useState<"day" | "night">(() => (localStorage.getItem("apt-time-of-day") as "day" | "night") || "day");

  const toggleTod = () => {
    const next = tod === "day" ? "night" : "day";
    setTod(next);
    localStorage.setItem("apt-time-of-day", next);
  };

  return (
    <div className="cc-hero">
      <div className="cc-hero-head">
        <div className="cc-hero-title">
          <div>
            <h2>Apartment Twin</h2>
            <p>Interactive spatial view · {focusedRoomId ? `Focused · ${focusedRoomId}` : "Tap a room to focus · tap a device to control"}</p>
          </div>
        </div>
        <div className="cc-hero-controls">
          <div className="cc-tod-toggle">
            <button
              type="button"
              data-active={tod === "day"}
              onClick={() => { if (tod !== "day") toggleTod(); }}
            >
              ☀ Day
            </button>
            <button
              type="button"
              data-active={tod === "night"}
              onClick={() => { if (tod !== "night") toggleTod(); }}
            >
              ☾ Night
            </button>
          </div>
          <a
            href="/2d"
            className="cc-hero-badge"
            style={{ textDecoration: "none" }}
          >
            <Map size={12} /> Fullscreen
          </a>
          <button
            type="button"
            className="cc-icon-btn"
            style={{ width: 32, height: 32 }}
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      <div className="cc-hero-stage" style={expanded ? { minHeight: 560 } : undefined}>
        <div className="fp-root" data-tod={tod} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", position: "absolute", inset: 0 }}>
          <div className="fp-stage" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Floorplan
              selectedId={selectedId}
              focusedRoomId={focusedRoomId}
              onSelect={onSelect}
              onRoomFocus={onRoomFocus}
            />
          </div>
        </div>
        <div className="cc-hero-overlay">
          <span className="cc-hero-chip"><Eye size={12} /> Live · {selectedId ? "Device selected" : focusedRoomId ? "Room focused" : "Overview"}</span>
          <span className="cc-hero-chip"><strong>8</strong> rooms · <strong>18</strong> devices</span>
        </div>
      </div>
    </div>
  );
}
