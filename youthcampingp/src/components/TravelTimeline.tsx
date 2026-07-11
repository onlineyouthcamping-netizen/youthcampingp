import { Plane, Car, ArrowRight } from "lucide-react";

interface TravelStep {
  icon: "plane" | "car";
  label: string;
}

const STEPS: TravelStep[] = [
  { icon: "plane", label: "Ahmedabad to Chandigarh" },
  { icon: "car", label: "Tempo Pickup" },
  { icon: "car", label: "Private vehicle for sightseeing" },
  { icon: "car", label: "Road Trip to Manali" },
  { icon: "plane", label: "Chandigarh to Ahmedabad" },
];

export default function TravelTimeline() {
  return (
    <section className="mb-24 p-12 border border-zinc-100 rounded-[40px] bg-white shadow-sm overflow-hidden">
      <h2 className="text-xl font-bold text-navy mb-16">Travelling</h2>
      
      <div className="relative flex items-start justify-between">
        {/* Dashed Line */}
        <div className="absolute top-5 left-8 right-8 h-[2px] border-t-2 border-dashed border-zinc-200 z-0" />
        
        {STEPS.map((step, i) => (
          <div key={i} className="relative z-10 flex flex-col items-center text-center max-w-[120px]">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-6">
              {step.icon === "plane" ? (
                <Plane className="w-7 h-7 text-navy -rotate-45" />
              ) : (
                <Car className="w-7 h-7 text-navy" />
              )}
            </div>
            <p className="text-xs font-bold text-navy capitalize leading-tight">
              {step.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
