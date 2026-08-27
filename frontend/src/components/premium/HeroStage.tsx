import { useEffect, useState } from "react";
import { Map, Maximize2, Eye } from "lucide-react";
import { Floorplan } from "../../apartment2d/Floorplan";
import { useDeviceStore } from "../../apartment/store/useDeviceStore";
import "../../apartment/apartment.css";
import "../../apartment2d/apartment2d.css";

interface HeroStageProps {
  selectedId: string | null;
  focusedRoomId: string | null;
  onSelect: (id: string | null) => void;
  onRoomFocus: (id: string | null) => void;
}

export default function HeroStage({ selectedId, focusedRoomId, onSelect, onRoomFocus }: HeroStageProps) {
  const load = useDeviceStore((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

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
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "inline-flex", background: "var(--cc-surface-2)", border: "1px solid var(--cc-border)", borderRadius: 999, padding: 2 }}>
            <button
              type="button"
              onClick={() => { if (tod !== "day") toggleTod(); }}
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                background: tod === "day" ? "var(--cc-surface)" : "transparent",
                color: tod === "day" ? "var(--cc-text)" : "var(--cc-text-muted)",
                boxShadow: tod === "day" ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
              }}
            >
              ☀ Day
            </button>
            <button
              type="button"
              onClick={() => { if (tod !== "night") toggleTod(); }}
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                background: tod === "night" ? "var(--cc-surface)" : "transparent",
                color: tod === "night" ? "var(--cc-text)" : "var(--cc-text-muted)",
                boxShadow: tod === "night" ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
              }}
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
