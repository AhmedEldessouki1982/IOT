import { useEffect, useState } from "react";

/** One-time interaction hint, auto-dismisses. */
export function HintToast({ text = "DRAG TO ORBIT · SCROLL TO ZOOM · CLICK ANY DEVICE" }: { text?: string }) {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setGone(true), 8000);
    return () => window.clearTimeout(t);
  }, []);

  if (gone) return null;
  return (
    <div className="apt-hint" onClick={() => setGone(true)}>
      {text}
    </div>
  );
}
