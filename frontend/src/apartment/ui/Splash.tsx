import { useEffect, useState } from "react";

/** Brand splash shown while the view boots; fades out once ready. */
export function Splash({ ready, sub = "INITIALIZING DIGITAL TWIN" }: { ready: boolean; sub?: string }) {
  const [fading, setFading] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const t1 = window.setTimeout(() => setFading(true), 500);
    const t2 = window.setTimeout(() => setRemoved(true), 1400);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [ready]);

  if (removed) return null;
  return (
    <div className={`apt-splash${fading ? " is-fading" : ""}`} aria-hidden={fading}>
      <div className="apt-splash-mark">⌂</div>
      <div className="apt-splash-title">SMART APARTMENT</div>
      <div className="apt-splash-sub">
        {sub}
        <span className="apt-splash-dots" />
      </div>
    </div>
  );
}
