"use client";

import { motion } from "framer-motion";

export default function TripDetailSkeleton() {
  // Skeleton pulse animation config
  const pulse = {
    animate: { opacity: [0.5, 0.8, 0.5] },
    transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" as const }
  };

  return (
    <div className="bg-white min-h-screen font-montserrat pb-32">
      {/* Top slim progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-zinc-100 overflow-hidden">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "90%" }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-primary-orange via-amber-500 to-primary-orange"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-28 md:pt-32 pb-24">
        {/* Breadcrumb & Title Skeletons */}
        <div className="mb-8 md:mb-12 space-y-4">
          <motion.div {...pulse} className="w-32 h-4 bg-zinc-100 rounded-full" />
          <motion.div {...pulse} className="w-[60%] h-12 md:h-16 bg-zinc-100 rounded-2xl" />
        </div>

        {/* Gallery Grid Skeleton */}
        <div className="w-full mb-8 md:mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 aspect-[16/10] md:aspect-[21/9] w-full rounded-[24px] md:rounded-[40px] overflow-hidden bg-zinc-50 p-1">
            <motion.div {...pulse} className="md:col-span-2 md:row-span-2 bg-zinc-100 rounded-[20px] md:rounded-[36px]" />
            <motion.div {...pulse} className="hidden md:block bg-zinc-100 rounded-[20px]" />
            <motion.div {...pulse} className="hidden md:block bg-zinc-100 rounded-[20px]" />
            <motion.div {...pulse} className="hidden md:block md:col-span-2 bg-zinc-100 rounded-[20px]" />
          </div>
        </div>

        {/* Quick Info Bar Skeleton */}
        <div className="flex flex-row overflow-x-auto no-scrollbar gap-x-12 md:gap-x-16 py-8 border-y border-zinc-100 w-full mb-16">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 shrink-0">
              <motion.div {...pulse} className="w-12 h-12 rounded-xl bg-zinc-100" />
              <div className="space-y-2">
                <motion.div {...pulse} className="w-16 h-3 bg-zinc-100 rounded-full" />
                <motion.div {...pulse} className="w-24 h-4 bg-zinc-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Two Column Layout Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Left Column (Details, Itinerary) */}
          <div className="lg:col-span-8 space-y-16">
            <div className="space-y-4">
              <motion.div {...pulse} className="w-24 h-6 bg-zinc-100 rounded-full" />
              <motion.div {...pulse} className="w-full h-24 bg-zinc-100 rounded-2xl" />
            </div>

            {/* Travel / Itinerary Skeletons */}
            <div className="space-y-6">
              <motion.div {...pulse} className="w-full h-32 bg-zinc-50 rounded-[32px]" />
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <motion.div key={i} {...pulse} className="w-full h-16 bg-zinc-100 rounded-2xl" />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (Booking Card) */}
          <div className="lg:col-span-4 hidden lg:block">
            <motion.div 
              {...pulse} 
              className="w-full h-[400px] border border-zinc-100 rounded-[40px] bg-zinc-50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
