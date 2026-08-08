"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-zinc-100/50 overflow-hidden">
      <motion.div
        initial={{ width: "0%" }}
        animate={{ width: "90%" }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="h-full bg-gradient-to-r from-primary-orange via-amber-500 to-primary-orange"
      />
    </div>
  );
}
