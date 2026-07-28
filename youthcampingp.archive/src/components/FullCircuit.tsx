"use client";

import { Plane, Car, Train } from "lucide-react";
import { cn } from "@/lib/utils";

interface FullCircuitProps {
  route?: { label: string; icon: "plane" | "car" | "train" }[];
}

export default function FullCircuit({ route }: FullCircuitProps) {
  if (!route || route.length === 0) return null;

  return (
    <section className="relative">
      <div className="bg-white border border-zinc-100 rounded-[40px] p-10 md:p-14 shadow-sm overflow-hidden">
        <h2 className="text-2xl font-bold text-navy mb-10 capitalize">Travelling</h2>
        
        <div className="relative overflow-x-auto no-scrollbar pb-4">
          <div className="flex items-start gap-8 md:justify-between min-w-max md:min-w-0 px-4">
            {/* Dashed Line Background - Hidden on mobile if it breaks, but we can make it long */}
            <div className="absolute top-6 left-0 right-0 h-[2px] border-t-2 border-dashed border-zinc-200 z-0 hidden md:block" />
            
            {route.map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center w-[100px] md:max-w-[140px] group shrink-0">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-6 transition-transform group-hover:scale-110 shadow-sm border border-zinc-50">
                  {step.icon === "plane" && (
                    <Plane className="w-6 h-6 text-navy -rotate-45" />
                  )}
                  {step.icon === "car" && (
                    <Car className="w-6 h-6 text-navy" />
                  )}
                  {step.icon === "train" && (
                    <Train className="w-6 h-6 text-navy" />
                  )}
                </div>
                <p className="text-[10px] md:text-xs font-bold text-navy leading-tight capitalize tracking-widest">
                  {step.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
