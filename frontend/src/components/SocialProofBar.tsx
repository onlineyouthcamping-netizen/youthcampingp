"use client";

import { 
  Users, 
  ShieldCheck, 
  Calendar, 
  Trophy, 
  LucideIcon,
  CheckCircle2,
  Heart,
  Globe,
  Star,
  Zap,
  Map,
  Camera
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useIsMobile } from "@/hooks/useIsMobile";

const ICON_MAP: Record<string, any> = {
  Users: Users,
  users: Users,
  ShieldCheck: ShieldCheck,
  shield: ShieldCheck,
  Calendar: Calendar,
  calendar: Calendar,
  Trophy: Trophy,
  trophy: Trophy,
  CheckCircle2: CheckCircle2,
  check: CheckCircle2,
  Heart: Heart,
  heart: Heart,
  Globe: Globe,
  globe: Globe,
  Star: Star,
  star: Star,
  Zap: Zap,
  zap: Zap,
  Map: Map,
  map: Map,
  Camera: Camera,
  camera: Camera
};

interface Stat {
  icon?: string;
  label?: string;
  text?: string;
}

interface SocialProofBarProps {
  stats?: Stat[];
}

const defaultStats = [
  { icon: "Users", label: "10,000+ Travelers" },
  { icon: "Trophy", label: "Trusted Since 2019" },
  { icon: "ShieldCheck", label: "Gujarat Tourism Registered" },
  { icon: "Calendar", label: "Weekly Departures" },
];

export default function SocialProofBar({ 
  stats, 
}: SocialProofBarProps) {
  const displayStats = (stats && stats.length > 0) ? stats : defaultStats;
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const reduceMotion = prefersReducedMotion || isMobile;

  return (
    <div className="bg-transparent py-6 md:py-8">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {displayStats.map((stat: any, i: number) => {
            const Icon = ICON_MAP[stat.icon] || Users;
            const textContent = stat.text || stat.label || "";
            
            return (
              <motion.div
                key={i}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex items-center gap-3 text-navy"
              >
                <Icon className="w-5 h-5 text-primary-orange shrink-0" />
                <span className="text-xs md:text-sm font-bold tracking-widest capitalize">
                  {textContent}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
