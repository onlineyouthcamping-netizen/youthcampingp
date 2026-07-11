import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  loading?: boolean;
  className?: string;
  description?: React.ReactNode;
}

export function KPICard({ title, value, icon, change, loading, className, description }: KPICardProps) {
  return (
    <div className={cn("modern-card group relative overflow-hidden", className)}>
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full blur-2xl group-hover:bg-primary/5 transition-colors duration-500" />
      <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-12 w-12 rounded-2xl bg-orange-50 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500">
            {icon}
          </div>
          {change && (
            <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
               <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{change}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</h4>
          {loading ? (
            <div className="h-8 w-32 bg-slate-50 animate-pulse rounded-lg" />
          ) : (
            <p className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
              {value}
            </p>
          )}
          {description && (
            <div className="text-[10.5px] text-slate-500 mt-1.5 leading-snug">
              {description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
