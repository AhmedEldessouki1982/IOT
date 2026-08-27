import { useEffect, useState } from "react";
import { Clock, Thermometer, Droplets, Wind } from "lucide-react";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export default function EnvOverview() {
  const now = useClock();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="cc-env-card" style={{ background: "var(--cc-surface)", borderRadius: "var(--cc-radius-lg)", padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cc-accent)", marginBottom: 6 }}>
          {greeting}, Ahmed
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cc-text)", lineHeight: 1.3, letterSpacing: "-0.01em" }}>
          Your home is calm and ready.
        </div>
        <div style={{ fontSize: 12, color: "var(--cc-text-muted)", lineHeight: 1.5, marginTop: 4 }}>
          4 rooms synchronized · Climate stable · All systems nominal
        </div>
      </div>

      <div className="cc-env-grid">
        <div className="cc-env-card">
          <div className="cc-env-kicker"><Thermometer size={12} /> Temperature</div>
          <div className="cc-env-value">24.3<span>°C</span></div>
          <div className="cc-env-trend cc-env-trend--up"><Wind size={11} /> Stable · +0.2°</div>
        </div>
        <div className="cc-env-card">
          <div className="cc-env-kicker"><Droplets size={12} /> Humidity</div>
          <div className="cc-env-value">48<span>%</span></div>
          <div className="cc-env-trend">Optimal · 40–60%</div>
        </div>
        <div className="cc-env-card">
          <div className="cc-env-kicker"><Wind size={12} /> Air Quality</div>
          <div className="cc-env-value">Good</div>
          <div className="cc-env-trend cc-env-trend--up">PM2.5 8 µg/m³</div>
        </div>
        <div className="cc-env-card">
          <div className="cc-env-kicker"><Clock size={12} /> Today</div>
          <div className="cc-env-value">12.4<span>kWh</span></div>
          <div className="cc-env-trend cc-env-trend--up">+8.2% vs yesterday</div>
        </div>
      </div>

      <div className="cc-energy-card">
        <div className="cc-energy-head">
          <div>
            <h4>Energy · Today</h4>
            <p>Real-time consumption</p>
          </div>
          <span className="cc-energy-delta">+8.2%</span>
        </div>
        <div className="cc-energy-main">
          <span className="cc-energy-value">12.4 kWh</span>
        </div>
        <svg viewBox="0 0 200 40" preserveAspectRatio="none" style={{ width: "100%", height: 40, display: "block" }}>
          <defs>
            <linearGradient id="cc-energy-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--cc-accent)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--cc-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M 0 28 C 20 22, 40 30, 60 18 C 80 8, 100 14, 120 10 C 140 6, 160 16, 180 12 L 200 10 L 200 40 L 0 40 Z"
            fill="url(#cc-energy-grad)"
          />
          <path
            d="M 0 28 C 20 22, 40 30, 60 18 C 80 8, 100 14, 120 10 C 140 6, 160 16, 180 12 L 200 10"
            fill="none"
            stroke="var(--cc-accent)"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: "var(--cc-text-muted)", fontWeight: 500, letterSpacing: "0.06em" }}>
          <span>00:00</span><span>12:00</span><span>Now</span>
        </div>
      </div>
    </div>
  );
}
