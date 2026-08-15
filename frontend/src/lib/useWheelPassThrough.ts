import { useEffect, RefObject } from "react";

/**
 * Custom hook to allow seamless vertical mouse wheel scrolling
 * when the mouse cursor is centered over horizontal carousel elements.
 */
export function useWheelPassThrough(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleWheel = (e: WheelEvent) => {
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);

      // Shift+wheel: scroll the carousel horizontally.
      if (e.shiftKey && absY > 0) {
        element.scrollLeft += e.deltaY;
        return;
      }

      // Vertical-dominant: never preventDefault. If the overflow-x
      // container swallowed the wheel without moving the page, forward it.
      if (absY > absX && absY > 2) {
        const deltaY = e.deltaY;
        const before = window.scrollY;
        requestAnimationFrame(() => {
          if (window.scrollY === before) {
            window.scrollBy({
              top: deltaY,
              behavior: "instant" as ScrollBehavior,
            });
          }
        });
      }
    };

    element.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      element.removeEventListener("wheel", handleWheel);
    };
  }, [ref]);
}
