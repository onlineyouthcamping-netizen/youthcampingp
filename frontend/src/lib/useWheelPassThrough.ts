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
      // If user is scrolling vertically with mouse wheel/trackpad
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && Math.abs(e.deltaY) > 2) {
        window.scrollBy({
          top: e.deltaY,
          behavior: "instant" as ScrollBehavior,
        });
      }
    };

    element.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      element.removeEventListener("wheel", handleWheel);
    };
  }, [ref]);
}
