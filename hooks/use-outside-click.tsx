import { useEffect, useCallback } from "react";

export function useOutsideClick<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  callback: (event: MouseEvent | TouchEvent) => void
) {
  const stableCallback = useCallback(callback, []);

  useEffect(() => {
    function listener(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (!ref.current || ref.current.contains(target)) {
        return;
      }
      stableCallback(event);
    }

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, stableCallback]);
}
