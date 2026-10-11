import { useCallback, useEffect, useRef } from "react";

export function useLongPress(
  onShort: () => void,
  onLong: () => void,
  ms = 600,
) {
  const timerRef = useRef<number | null>(null);
  const triggeredRef = useRef(false);

  const start = useCallback(
    () => {
      triggeredRef.current = false;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        triggeredRef.current = true;
        onLong();
      }, ms);
    },
    [onLong, ms],
  );

  const end = useCallback(
    () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (!triggeredRef.current) {
        onShort();
      }
      triggeredRef.current = false;
    },
    [onShort],
  );

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    triggeredRef.current = false;
  }, []);

  useEffect(() => {
    return cancel;
  }, [cancel]);

  return { onMouseDown: start, onMouseUp: end, onMouseLeave: cancel, onTouchStart: start, onTouchEnd: end, onTouchCancel: cancel };
}
