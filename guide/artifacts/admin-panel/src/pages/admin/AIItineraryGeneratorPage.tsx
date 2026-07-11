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
        <div className="space-y-10 p-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-black shadow-xl shadow-primary/20">
                        <Wand2 className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter">AI PROPOSAL GENERATOR</h1>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">Powered by Google Gemini 1.5</p>
                    </div>
                </div>
                {result && (
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setResult(null)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-12">
                            <RotateCcw size={14} className="mr-2" /> Reset
                        </Button>
                        <Button onClick={handleCreateQuote} className="rounded-xl font-black uppercase text-[10px] tracking-widest h-12 shadow-xl shadow-primary/20">
                            <Sparkles size={14} className="mr-2" /> Use this Itinerary
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-2">Trip Brief (Paste Details Here)</label>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="w-full h-[550px] bg-white border-2 border-border/40 rounded-[2.5rem] p-10 text-sm font-mono focus:border-primary outline-none transition-all shadow-sm focus:shadow-xl focus:shadow-primary/5"
                    />
                    <Button onClick={handleGenerate} disabled={isLoading} className="w-full h-20 rounded-[2rem] font-black uppercase tracking-widest text-base shadow-2xl shadow-primary/30">
                        {isLoading ? <><Loader2 size={24} className="mr-3 animate-spin" /> GENERATING...</> : <><Sparkles size={24} className="mr-3" /> GENERATE ITINERARY</>}
                    </Button>
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-2">Preview & Results</label>
                    {result ? (
                        <div className="space-y-8 max-h-[700px] overflow-y-auto pr-4 scrollbar-hide">
                            <div className="relative rounded-[2.5rem] overflow-hidden h-64 shadow-2xl border-4 border-white group">
                                {result.hero?.heroImageUrl ? (
                                    <img src={result.hero.heroImageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : <div className="absolute inset-0 bg-primary/20" />}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                <div className="absolute bottom-8 left-10">
                                    <h3 className="text-white font-black text-3xl uppercase tracking-tighter mb-2">{result.hero?.destination}</h3>
                                    <div className="flex gap-4">
                                        <span className="text-primary font-black text-[10px] uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">{result.hero?.duration}</span>
                                        <span className="text-white font-black text-[10px] uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">{result.hero?.tripType}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-5">
                                {result.itinerary?.days?.map((day: any, i: number) => (
                                    <motion.div 
                                        key={i} 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="bg-white p-8 rounded-[2rem] border border-border/50 shadow-sm flex gap-6 hover:shadow-xl transition-all group"
                                    >
                                        <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black shrink-0 text-xl group-hover:bg-primary group-hover:text-black transition-colors">
                                            {day.dayNumber || i + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-lg uppercase tracking-tight mb-2 text-gray-900">{day.title}</h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed font-medium italic opacity-80">{day.description}</p>
                                            {day.highlights && (
                                                <div className="flex flex-wrap gap-2 mt-4">
                                                    {day.highlights.map((h: string, hi: number) => (
                                                        <span key={hi} className="text-[9px] font-black uppercase tracking-widest bg-gray-50 text-gray-400 px-3 py-1 rounded-lg">{h}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-[700px] bg-white rounded-[2.5rem] border-4 border-dashed border-border/30 flex flex-col items-center justify-center text-center p-16 gap-6 group">
                            <div className="w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center text-muted-foreground opacity-20 group-hover:scale-110 group-hover:opacity-40 transition-all duration-500">
                                <Sparkles size={48} />
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-black uppercase tracking-[0.4em] text-muted-foreground">Dream Engine Idle</p>
                                <p className="text-xs text-muted-foreground/60 max-w-xs mx-auto">Paste your trip brief on the left to generate a professional itinerary in seconds.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
