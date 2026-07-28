"use client";

import { Check, X, Backpack, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TripPoliciesProps {
  inclusions?: string[];
  exclusions?: string[];
  thingsToCarry?: string[] | any;
}

export default function TripPolicies({ inclusions = [], exclusions = [], thingsToCarry = [] }: TripPoliciesProps) {
  // Handle thingsToCarry if it's categorized (strings with category name)
  const categorizedCarry = Array.isArray(thingsToCarry) ? thingsToCarry : [];

  return (
    <div className="space-y-16 py-16 border-t border-zinc-100">
      {/* Inclusions & Exclusions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Inclusions */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-navy tracking-tight italic capitalize">Inclusions</h2>
          </div>
          <ul className="space-y-4">
            {inclusions.map((item, i) => (
              <li key={i} className="flex items-start gap-3 group">
                <div className="mt-1 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 group-hover:bg-green-500 transition-colors">
                  <Check className="w-3 h-3 text-green-600 group-hover:text-white" />
                </div>
                <span className="text-zinc-600 font-medium leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Exclusions */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-navy tracking-tight italic capitalize">Exclusions</h2>
          </div>
          <ul className="space-y-4">
            {exclusions.map((item, i) => (
              <li key={i} className="flex items-start gap-3 group">
                <div className="mt-1 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 group-hover:bg-red-500 transition-colors">
                  <X className="w-3 h-3 text-red-600 group-hover:text-white" />
                </div>
                <span className="text-zinc-600 font-medium leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Things to Carry */}
      {categorizedCarry.length > 0 && (
        <div className="space-y-10 pt-16 border-t border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-orange/10 flex items-center justify-center">
              <Backpack className="w-6 h-6 text-primary-orange" />
            </div>
            <h2 className="text-2xl font-bold text-navy tracking-tight italic capitalize">Things to Carry</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categorizedCarry.map((category, i) => {
              const [title, ...items] = category.split(':');
              const itemList = items.join(':').split(',').map((s: string) => s.trim());
              
              return (
                <div key={i} className="bg-zinc-50 rounded-3xl p-8 border border-zinc-100 hover:border-primary-orange/20 transition-colors">
                  <h3 className="text-lg font-bold text-navy mb-6 tracking-tight capitalize italic">{title}</h3>
                  <ul className="space-y-3">
                    {itemList.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2 text-zinc-500 font-bold text-sm">
                        <div className="w-1 h-1 rounded-full bg-primary-orange shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
