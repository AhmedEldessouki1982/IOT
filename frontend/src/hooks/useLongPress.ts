import { useCallback, useEffect, useRef } from "react";
import { DEFAULT_LONG_PRESS_MS, resolvePressGesture } from "./pressGesture.js";

export function useLongPress(
  onShort: () => void,
  onLong: () => void,
  ms = DEFAULT_LONG_PRESS_MS,
) {
  const timerRef = useRef<number | null>(null);
  const startAtRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);

  const start = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      pointerIdRef.current = event.pointerId;
      startAtRef.current = window.performance.now();
      suppressClickRef.current = false;
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      event.currentTarget.setPointerCapture?.(event.pointerId);
      timerRef.current = window.setTimeout(() => {
        suppressClickRef.current = true;
        onLong();
      }, ms);
    },
    [onLong, ms],
  );

  const end = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (
        pointerIdRef.current !== null &&
        event.pointerId !== pointerIdRef.current
      ) {
        return;
      }
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      const gesture = resolvePressGesture(
        window.performance.now() - startAtRef.current,
        ms,
      );
      if (gesture === "short" && !suppressClickRef.current) {
        onShort();
      }
      pointerIdRef.current = null;
    },
    [ms, onShort],
  );

  const cancel = useCallback((event?: React.PointerEvent<HTMLElement>) => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (event && pointerIdRef.current !== null) {
      event.currentTarget.releasePointerCapture?.(pointerIdRef.current);
    }
    pointerIdRef.current = null;
  }, []);

  const suppressClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  }, []);

  useEffect(() => {
    return () => cancel();
  }, [cancel]);

  return {
    onPointerDown: start,
    onPointerUp: end,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onClickCapture: suppressClick,
  };
}
