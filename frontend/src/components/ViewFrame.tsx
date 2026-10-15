import { forwardRef, type ReactNode } from "react";
import { motion, useIsPresent, useReducedMotion } from "framer-motion";
import { motionMs, motionEase } from "../hooks/motionTokens";

const ViewFrame = forwardRef<HTMLElement, { children: ReactNode }>(function ViewFrame({ children }, ref) {
  const present = useIsPresent();
  const reduced = useReducedMotion();
  return <motion.main ref={ref} className="view-content" aria-hidden={!present || undefined}
    {...(!present ? { inert: "" } : {})}
    style={{ gridArea: "1 / 1", pointerEvents: present ? "auto" : "none" }}
    initial={{ opacity: 0, y: reduced ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
    transition={{ duration: reduced ? 0 : motionMs("view") / 1000, ease: motionEase() }}>{children}</motion.main>;
});
export default ViewFrame;
