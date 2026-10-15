import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { homeSocket } from "../store/useHomeStore";
import { motionMs, motionEase } from "../hooks/motionTokens";

export default function ConnectionBanner({ online }: { online: boolean }) {
  const [retrying, setRetrying] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    const retry = () => setRetrying(true);
    const stop = () => setRetrying(false);
    homeSocket.io.on("reconnect_attempt", retry);
    homeSocket.io.on("reconnect_failed", stop);
    homeSocket.on("connect", stop);
    return () => { homeSocket.io.off("reconnect_attempt", retry); homeSocket.io.off("reconnect_failed", stop); homeSocket.off("connect", stop); };
  }, []);
  return <AnimatePresence initial={false}>{!online && <motion.div className="offline-banner" role="status"
    initial={{ opacity: 0, y: reduced ? 0 : -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : -6 }}
    transition={{ duration: reduced ? 0 : motionMs("view") / 1000, ease: motionEase() }}>
    {retrying && <span className="reconnecting-dot" aria-hidden="true" />}
    {retrying ? "Reconnecting... " : "Hub offline. "}Showing last known state. Local controls remain available.
  </motion.div>}</AnimatePresence>;
}
