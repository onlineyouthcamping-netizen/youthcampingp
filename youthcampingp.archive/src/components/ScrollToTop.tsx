"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function ScrollToTop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    // Only trigger scroll reset when the pathname changes (genuine route navigation)
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;

      // Preserve same-page anchor navigation (e.g. #faq, #contact)
      if (window.location.hash) {
        const id = window.location.hash.replace("#", "");
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
          return;
        }
      }

      // Perform instant scroll to top across window, document, and body
      const executeScrollTop = () => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
        if (document.documentElement) {
          document.documentElement.scrollTop = 0;
        }
        if (document.body) {
          document.body.scrollTop = 0;
        }
        const mainElement = document.querySelector("main");
        if (mainElement) {
          mainElement.scrollTop = 0;
        }
      };

      executeScrollTop();
      const timer = setTimeout(executeScrollTop, 20);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  return null;
}
