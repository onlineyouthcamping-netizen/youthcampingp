"use client";

import { Check, X } from "lucide-react";

interface InclusionsExclusionsProps {
  inclusions: string[];
  exclusions: string[];
}

export default function InclusionsExclusions({ inclusions, exclusions }: InclusionsExclusionsProps) {
  return (
    <div className="space-y-8">
      {/* Inclusions */}
      <div className="bg-white border border-zinc-100 rounded-[40px] p-10 md:p-14 shadow-sm">
        <h2 className="text-2xl font-bold text-navy mb-10">Inclusions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          {inclusions?.map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="mt-1 w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <span className="text-sm md:text-base font-bold text-zinc-600 leading-tight">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Exclusions */}
      <div className="bg-white border border-zinc-100 rounded-[40px] p-10 md:p-14 shadow-sm">
        <h2 className="text-2xl font-bold text-navy mb-10">Exclusions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          {exclusions?.map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="mt-1 w-5 h-5 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <X className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <span className="text-sm md:text-base font-bold text-zinc-600 leading-tight">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
