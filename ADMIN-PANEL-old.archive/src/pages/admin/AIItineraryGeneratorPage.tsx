import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    Sparkles, Copy, Check, AlertCircle, Loader2,
    RotateCcw, Wand2, Calendar, Users
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

const PROMPT_TEMPLATE = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRIP DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Destination:      [e.g. Kerala]
Client Name:      [e.g. Vishwarajbhai]
Duration:         [e.g. 4 Nights / 5 Days]
Trip Type:        [e.g. Luxury]
Travel Dates:     [e.g. 22 Mar – 26 Mar 2026]
Group Size:       [e.g. 6 Travelers]

Day-wise Itinerary:
  Day 1: [Title] — [Description] — [Highlights: point, point, point] — [Stay type] — [Meal type]
  Day 2: ...`;

export default function AIItineraryGeneratorPage() {
    const navigate = useNavigate();
    const [input, setInput] = useState(PROMPT_TEMPLATE);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (input === PROMPT_TEMPLATE || !input.trim()) {
            toast.error("Please fill in the trip details first.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await api.post("/ai/generate-itinerary", { prompt: input });
            if (res.data.success) {
                setResult(res.data.data);
                toast.success("✨ Itinerary generated successfully!");
            } else {
                throw new Error(res.data.message || "Generation failed");
            }
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateQuote = () => {
        if (!result) return;
        const mappedData = {
            clientName: result.hero?.clientName || "",
            destination: result.hero?.destination || "",
            duration: result.hero?.duration || "",
            travelDates: { from: "", to: "" },
            data: {
                itinerary: result.itinerary?.days?.map((d: any) => ({
                    id: Math.random().toString(36).substr(2, 9),
                    day: d.dayNumber,
                    title: d.title,
                    description: d.description,
                    activities: d.highlights || [],
                    photos: []
                })) || [],
                heroImage: result.hero?.heroImageUrl || "",
                expert: { name: "", whatsapp: "", designation: "" }
            }
        };
        localStorage.setItem("pending_ai_quotation", JSON.stringify(mappedData));
        navigate("/admin/quotations/new");
    };

    return (
        <div className="space-y-6 animate-fade-in p-6 bg-[#F4F7FB] min-h-screen -mx-6 -my-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-sm">
                <div className="flex items-center gap-2.5">
                    <Wand2 className="w-5 h-5 text-[#F97316]" />
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">AI Proposal Generator</h1>
                        <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Powered by Google Gemini 1.5</p>
                    </div>
                </div>
                {result && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setResult(null)} className="h-8.5 px-4 rounded-[4px] font-semibold text-xs border border-slate-200">
                            <RotateCcw size={14} className="mr-1.5" /> Reset
                        </Button>
                        <Button onClick={handleCreateQuote} className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white shadow-sm">
                            <Sparkles size={14} className="mr-1.5" /> Use this Itinerary
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 ml-1">Trip Brief (Paste Details Here)</label>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="w-full h-[550px] bg-white border border-slate-200 rounded-md p-6 text-sm font-mono focus:border-[#F97316] outline-none transition-all shadow-sm"
                    />
                    <Button onClick={handleGenerate} disabled={isLoading} className="w-full h-11 rounded-[4px] font-semibold text-xs uppercase tracking-wider bg-primary-orange hover:bg-primary-orange/90 text-white shadow-sm">
                        {isLoading ? <><Loader2 size={16} className="mr-2 animate-spin" /> Generating...</> : <><Sparkles size={16} className="mr-2" /> Generate Itinerary</>}
                    </Button>
                </div>

                <div className="space-y-3">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 ml-1">Preview & Results</label>
                    {result ? (
                        <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 scrollbar-hide">
                            <div className="relative rounded-md overflow-hidden h-56 shadow-sm border border-slate-200 group">
                                {result.hero?.heroImageUrl ? (
                                    <img src={result.hero.heroImageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                ) : <div className="absolute inset-0 bg-[#F97316]/10" />}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-6 left-6">
                                    <h3 className="text-white font-bold text-2xl tracking-tight mb-1.5">{result.hero?.destination}</h3>
                                    <div className="flex gap-2">
                                        <span className="text-[#F97316] font-semibold text-[10px] uppercase tracking-wider bg-black/40 px-2.5 py-1 rounded-[4px] backdrop-blur-sm">{result.hero?.duration}</span>
                                        <span className="text-white font-semibold text-[10px] uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded-[4px] backdrop-blur-sm">{result.hero?.tripType}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {result.itinerary?.days?.map((day: any, i: number) => (
                                    <motion.div 
                                        key={i} 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex gap-4 hover:border-[#F97316]/30 transition-all group"
                                    >
                                        <div className="w-10 h-10 bg-[#F97316]/10 text-[#F97316] rounded-md flex items-center justify-center font-bold shrink-0 text-sm group-hover:bg-[#F97316] group-hover:text-white transition-colors">
                                            {day.dayNumber || i + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-800 mb-1">{day.title}</h4>
                                            <p className="text-xs text-slate-500 leading-relaxed font-medium">{day.description}</p>
                                            {day.highlights && (
                                                <div className="flex flex-wrap gap-1.5 mt-3">
                                                    {day.highlights.map((h: string, hi: number) => (
                                                        <span key={hi} className="text-[9px] font-semibold uppercase tracking-wider bg-slate-50 text-slate-400 px-2 py-0.5 rounded-[4px] border border-slate-100">{h}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-[700px] bg-white rounded-md border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-12 gap-4 shadow-sm">
                            <div className="w-16 h-16 bg-slate-50 rounded-md flex items-center justify-center text-slate-300">
                                <Sparkles size={32} />
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Dream Engine Idle</p>
                                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">Paste your trip brief on the left to generate a professional itinerary in seconds.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
