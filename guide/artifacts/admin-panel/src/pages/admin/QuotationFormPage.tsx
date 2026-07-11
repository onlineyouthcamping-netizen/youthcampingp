import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { GlassCard } from "@/components/admin/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    Image as ImageIcon,
    ChevronRight,
    MessageCircle as WhatsAppIcon,
    Copy,
    ExternalLink,
    Send,
    Loader2,
    Calendar,
    Users,
    MapPin,
    CheckCircle2,
    XCircle,
    BadgePercent,
    Clock,
    Hotel as HotelIcon,
    Sparkles,
    Train,
    Car,
    Plane,
    Ship,
    MapPin as PickupIcon,
    Bus
} from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { quotationsService } from "@/services/quotations.service";
import { Quotation } from "@/types";
import api from "@/services/api";

const formatUrl = (url: any): string => {
    if (!url || typeof url !== 'string') return "";
    if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:")) return url;
    const apiBase = api.defaults.baseURL || "https://api.youthcamping.online/api";
    const serverBase = apiBase.replace('/api', '');
    return `${serverBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function QuotationFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = id !== "new";
    
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);

    const [formData, setFormData] = useState<Partial<Quotation>>({
        id: uuidv4(),
        status: "Draft",
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        tripTitle: "",
        destination: "",
        duration: "",
        travelDates: { from: "", to: "" },
        pax: 2,
        totalPrice: 0,
        discount: 0,
        finalPrice: 0,
        overview: "",
        itinerary: [],
        inclusions: [],
        exclusions: [],
        coverImage: "",
        heroImages: [],
        experiencePhotos: [],
        staySummary: [],
        roomsInfo: "",
        mealsInfo: "",
        travelling: [],
        expiryHours: 48, // Default 48h
        expert: {
            name: "Suresh Chaudhary",
            whatsapp: "919000000000",
            designation: "YOUTHCAMPING Destination Expert"
        }
    });

    useEffect(() => {
        if (isEdit && id) {
            quotationsService.getById(id).then(data => {
                setFormData(data);
                setLoading(false);
            }).catch(() => {
                toast.error("Failed to load quotation");
                navigate("/admin/quotations");
            });
        }
    }, [id, isEdit, navigate]);

    // Auto-calculate final price
    useEffect(() => {
        const total = Number(formData.lowLevelPrice) || 0;
        const discount = Number(formData.discount) || 0;
        setFormData(prev => {
            if (prev.totalPrice === total && prev.finalPrice === (total - discount)) {
                return prev;
            }
            return { 
                ...prev, 
                totalPrice: total,
                finalPrice: total - discount 
            };
        });
    }, [formData.lowLevelPrice, formData.discount]);

    const handleExtend = async () => {
        try {
            const res = await quotationsService.extend(formData.id!, 48);
            setFormData(prev => ({ ...prev, expiresAt: res.expiresAt }));
            toast.success("Validity extended by 48 hours");
        } catch (error) {
            toast.error("Failed to extend validity");
        }
    };

    const handleSave = async (status: 'Draft' | 'Published' = 'Draft') => {
        setIsSaving(true);
        try {
            if (!formData.customerName || !formData.tripTitle) {
                toast.error("Please fill in basic details");
                return;
            }

            const payload = {
                ...formData,
                status,
                slug: formData.slug || formData.tripTitle.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.random().toString(36).substring(2, 7)
            };

            const saved = await quotationsService.save(payload);
            setFormData(saved);
            toast.success(status === 'Published' ? "Quotation Published!" : "Draft Saved");
            if (!isEdit) navigate(`/admin/quotations/${saved.id}`);
        } catch (error: any) {
            toast.error("Failed to save");
        } finally {
            setIsSaving(false);
        }
    };

    const copyLink = () => {
        const baseUrl = import.meta.env.VITE_FRONTEND_URL || 'https://youthcamping.online';
        const url = `${baseUrl}/quote/${formData.slug || formData.id}`;
        navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
    };

    const sendWhatsApp = () => {
        const baseUrl = import.meta.env.VITE_FRONTEND_URL || 'https://youthcamping.online';
        const quoteLink = `${baseUrl}/quote/${formData.slug || formData.id}`;
        const message = `Hi ${formData.customerName},

Greetings from YOUTHCAMPING Experiences.

As per our recent conversation, we've prepared a customized quotation for you.

View your quotation here:
${quoteLink}

${formData.expert?.name}
${formData.expert?.designation}`;

        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/${formData.customerPhone}?text=${encoded}`, '_blank');
    };

    const addItineraryDay = () => {
        const newDay = {
            id: uuidv4(),
            day: (formData.itinerary?.length || 0) + 1,
            title: "",
            description: "",
            meals: "B, D",
            stay: "Luxury Stay",
            photos: []
        };
        setFormData({ ...formData, itinerary: [...(formData.itinerary || []), newDay as any] });
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Loading Proposal...</p>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto pb-32 space-y-12 animate-fade-in">
            {/* ─── Page Header ─── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => navigate("/admin/quotations")} 
                        className="h-14 w-14 rounded-[20px] border-slate-100 bg-white shadow-sm hover:bg-slate-50 transition-all"
                    >
                        <ArrowLeft size={22} className="text-slate-400" />
                    </Button>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            {isEdit ? "Refine Proposal" : "Compose Quotation"}
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em]">Premium Sales Intelligence</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button 
                        variant="outline" 
                        onClick={() => handleSave('Draft')} 
                        disabled={isSaving} 
                        className="h-14 px-8 rounded-2xl border-slate-100 font-bold text-[10px] uppercase tracking-widest bg-white hover:bg-slate-50 transition-all"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save size={16} className="mr-2" />} 
                        Hold as Draft
                    </Button>
                    <Button 
                        onClick={() => handleSave('Published')} 
                        disabled={isSaving} 
                        className="h-14 px-10 rounded-2xl bg-primary hover:bg-orange-600 text-white font-bold text-[10px] uppercase tracking-widest shadow-2xl shadow-orange-100 transition-all"
                    >
                        <CheckCircle2 size={16} className="mr-2" /> Launch Proposal
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Form Area */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Customer Info */}
                    <div className="modern-card p-10 space-y-8">
                        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                                <Users size={20} />
                            </div>
                            <h3 className="font-bold text-sm uppercase tracking-[0.2em] text-slate-800">Identity Details</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Guest Name</Label>
                                <Input value={formData.customerName || ""} onChange={e => setFormData({...formData, customerName: e.target.value})} placeholder="e.g. John Doe" className="h-12 bg-slate-50/50 border-transparent focus:bg-white focus:border-slate-200 transition-all rounded-xl font-medium" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Contact Number</Label>
                                <Input value={formData.customerPhone || ""} onChange={e => setFormData({...formData, customerPhone: e.target.value})} placeholder="91XXXXXXXXXX" className="h-12 bg-slate-50/50 border-transparent focus:bg-white focus:border-slate-200 transition-all rounded-xl font-medium" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Communication Email</Label>
                                <Input value={formData.customerEmail || ""} onChange={e => setFormData({...formData, customerEmail: e.target.value})} placeholder="guest@travel.com" className="h-12 bg-slate-50/50 border-transparent focus:bg-white focus:border-slate-200 transition-all rounded-xl font-medium" />
                            </div>
                        </div>
                    </div>

                    {/* Trip Info */}
                    <div className="modern-card p-10 space-y-8">
                        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                            <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center">
                                <MapPin size={20} />
                            </div>
                            <h3 className="font-bold text-sm uppercase tracking-[0.2em] text-slate-800">Expedition Architecture</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Proposal Title</Label>
                                <Input value={formData.tripTitle || ""} onChange={e => setFormData({...formData, tripTitle: e.target.value})} placeholder="e.g. Luxury Spiti Valley Odyssey" className="h-12 bg-slate-50/50 border-transparent focus:bg-white focus:border-slate-200 transition-all rounded-xl font-medium" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Primary Destination</Label>
                                <Input value={formData.destination || ""} onChange={e => setFormData({...formData, destination: e.target.value})} placeholder="e.g. Kaza, Spiti" className="h-12 bg-slate-50/50 border-transparent focus:bg-white focus:border-slate-200 transition-all rounded-xl font-medium" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Duration Manifest</Label>
                                <Input value={formData.duration || ""} onChange={e => setFormData({...formData, duration: e.target.value})} placeholder="e.g. 7 Days / 6 Nights" className="h-12 bg-slate-50/50 border-transparent focus:bg-white focus:border-slate-200 transition-all rounded-xl font-medium" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Commencement Date</Label>
                                <Input type="date" value={formData.travelDates?.from || ""} onChange={e => setFormData({...formData, travelDates: {...formData.travelDates!, from: e.target.value}})} className="h-12 bg-slate-50/50 border-transparent focus:bg-white focus:border-slate-200 transition-all rounded-xl font-medium" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Conclusion Date</Label>
                                <Input type="date" value={formData.travelDates?.to || ""} onChange={e => setFormData({...formData, travelDates: {...formData.travelDates!, to: e.target.value}})} className="h-12 bg-slate-50/50 border-transparent focus:bg-white focus:border-slate-200 transition-all rounded-xl font-medium" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">PAX Count</Label>
                                <Input type="number" value={formData.pax} onChange={e => setFormData({...formData, pax: parseInt(e.target.value) || 0})} className="h-12 bg-slate-50/50 border-transparent focus:bg-white focus:border-slate-200 transition-all rounded-xl font-medium" />
                            </div>
                        </div>
                    </div>

                    {/* Pricing Architecture */}
                    <div className="modern-card p-10 space-y-10">
                        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                                <BadgePercent size={20} />
                            </div>
                            <h3 className="font-bold text-sm uppercase tracking-[0.2em] text-slate-800">Financial Strategy</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Standard Tier */}
                            <div className="space-y-6 p-8 bg-slate-50/50 rounded-[32px] border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-slate-400" />
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Standard Tier Configuration</Label>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Base Investment</Label>
                                    <div className="relative group">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-300 group-focus-within:text-slate-900 transition-colors">₹</span>
                                        <Input type="number" value={formData.lowLevelPrice || 0} onChange={e => setFormData({...formData, lowLevelPrice: parseInt(e.target.value)})} className="h-14 pl-10 bg-white border-transparent focus:border-slate-200 transition-all rounded-2xl font-black text-lg" />
                                    </div>
                                </div>
                            </div>

                            {/* Luxury Tier */}
                            <div className="space-y-6 p-8 bg-primary rounded-[32px] shadow-2xl shadow-orange-100">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-blue-400" />
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Luxury Tier Configuration</Label>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-white/60">Base Investment</Label>
                                    <div className="relative group">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-white/20 group-focus-within:text-white transition-colors">₹</span>
                                        <Input type="number" value={formData.highLevelPrice || 0} onChange={e => setFormData({...formData, highLevelPrice: parseInt(e.target.value)})} className="h-14 pl-10 bg-white/10 border-white/10 focus:border-white/20 transition-all rounded-2xl font-black text-lg text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Universal Incentive (Discount)</Label>
                                <div className="relative group">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-300 group-focus-within:text-slate-900 transition-colors">₹</span>
                                    <Input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: parseInt(e.target.value)})} className="h-14 pl-10 bg-slate-50/50 border-transparent focus:bg-white focus:border-slate-200 transition-all rounded-2xl font-bold" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Proposal Integrity</Label>
                                <div className="h-14 flex items-center px-8 bg-slate-50 text-slate-400 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] border border-slate-100 italic">
                                    Final Price: ₹ {((formData.lowLevelPrice || 0) - (formData.discount || 0)).toLocaleString()} / ₹ {((formData.highLevelPrice || 0) - (formData.discount || 0)).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Content Sections */}
                    <div className="modern-card p-10 space-y-10">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Expedition Overview</Label>
                            <Textarea 
                                value={formData.overview} 
                                onChange={e => setFormData({...formData, overview: e.target.value})} 
                                placeholder="Describe the soul of the journey..." 
                                className="min-h-[150px] bg-slate-50/50 border-transparent focus:bg-white focus:border-slate-200 transition-all rounded-[32px] p-8 text-sm leading-relaxed font-medium"
                            />
                        </div>

                        <div className="h-px bg-slate-50" />

                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Day-wise Chronology</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addItineraryDay} className="h-10 px-5 rounded-xl border-dashed border-slate-200 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50">
                                    <Plus size={14} className="mr-2" /> Insert Day
                                </Button>
                            </div>
                            
                            <div className="space-y-6">
                                {formData.itinerary?.map((day: any, idx: number) => (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={day.id || idx} 
                                        className="p-8 bg-slate-50/30 rounded-[32px] border border-slate-100/50 space-y-6 relative group transition-all hover:bg-slate-50/50"
                                    >
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                const newList = [...formData.itinerary!];
                                                newList.splice(idx, 1);
                                                setFormData({...formData, itinerary: newList});
                                            }}
                                            className="absolute top-6 right-6 h-8 w-8 rounded-full bg-white flex items-center justify-center text-slate-300 hover:text-rose-500 shadow-sm border border-slate-50 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center font-bold text-xs shadow-xl shadow-orange-100">
                                                D{idx + 1}
                                            </div>
                                            <Input 
                                                value={day.title} 
                                                onChange={e => {
                                                    const newList = [...formData.itinerary!];
                                                    newList[idx].title = e.target.value;
                                                    setFormData({...formData, itinerary: newList});
                                                }}
                                                placeholder="Experience Headline..." 
                                                className="bg-transparent border-none p-0 h-auto font-bold text-xl focus-visible:ring-0 placeholder:text-slate-300 text-slate-900"
                                            />
                                        </div>
                                        <Textarea 
                                            value={day.description} 
                                            onChange={e => {
                                                const newList = [...formData.itinerary!];
                                                newList[idx].description = e.target.value;
                                                setFormData({...formData, itinerary: newList});
                                            }}
                                            placeholder="Chronicle the memories for this chapter..." 
                                            className="bg-white rounded-[24px] p-6 text-sm min-h-[120px] border-slate-100 shadow-sm font-medium leading-relaxed"
                                        />

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Gastronomy (Meals)</Label>
                                                <Input 
                                                    value={day.meals} 
                                                    onChange={e => {
                                                        const newList = [...formData.itinerary!];
                                                        newList[idx].meals = e.target.value;
                                                        setFormData({...formData, itinerary: newList});
                                                    }}
                                                    placeholder="e.g. B, L, D"
                                                    className="rounded-xl h-12 bg-white border-slate-100 text-xs font-bold px-5"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Nocturnal Sanctuary (Stay)</Label>
                                                <Input 
                                                    value={day.stay} 
                                                    onChange={e => {
                                                        const newList = [...formData.itinerary!];
                                                        newList[idx].stay = e.target.value;
                                                        setFormData({...formData, itinerary: newList});
                                                    }}
                                                    placeholder="e.g. Royal Heritage Villa"
                                                    className="rounded-xl h-12 bg-white border-slate-100 text-xs font-bold px-5"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Day Sightseeing Photos</Label>
                                            <div className="flex flex-wrap gap-3">
                                                {(day.photos || []).map((photoItem: string, pIdx: number) => {
                                                    const parts = photoItem.split("|");
                                                    const photoUrl = parts[0];
                                                    const caption = parts.slice(1).join("|") || "";
                                                    return (
                                                        <div key={pIdx} className="flex flex-col gap-1 items-center bg-white border border-slate-100 p-1.5 rounded-2xl shadow-sm w-32 shrink-0">
                                                            <div className="relative w-full aspect-square rounded-xl overflow-hidden group/thumb border shadow-sm">
                                                                <img src={formatUrl(photoUrl)} className="w-full h-full object-cover" />
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => {
                                                                        const newItinerary = [...formData.itinerary!];
                                                                        newItinerary[idx].photos = newItinerary[idx].photos.filter((_: any, i: number) => i !== pIdx);
                                                                        setFormData({...formData, itinerary: newItinerary});
                                                                    }}
                                                                    className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-lg opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                                                                >
                                                                    <Trash2 size={10} />
                                                                </button>
                                                            </div>
                                                            <input 
                                                                type="text" 
                                                                value={caption} 
                                                                onChange={e => {
                                                                    const newItinerary = [...formData.itinerary!];
                                                                    newItinerary[idx].photos[pIdx] = `${photoUrl}|${e.target.value}`;
                                                                    setFormData({...formData, itinerary: newItinerary});
                                                                }}
                                                                placeholder="Set photo name..." 
                                                                className="w-full text-[9px] font-bold px-1.5 py-1 border border-slate-100 rounded-lg focus:outline-none focus:border-primary text-center"
                                                            />
                                                        </div>
                                                    );
                                                })}
                                                <ImageUpload 
                                                    compact
                                                    multiple={true}
                                                    className="w-32"
                                                    onUpload={(url) => {
                                                        setFormData(prev => {
                                                            const newItinerary = [...(prev.itinerary || [])];
                                                            if (!newItinerary[idx].photos) newItinerary[idx].photos = [];
                                                            if (!newItinerary[idx].photos.includes(url)) {
                                                                newItinerary[idx].photos.push(url);
                                                            }
                                                            return { ...prev, itinerary: newItinerary };
                                                        });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <div className="h-px bg-slate-50" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Inclusions */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Premium Inclusions</Label>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({...formData, inclusions: [...(formData.inclusions || []), ""]})} className="h-8 px-3 rounded-lg text-emerald-600 font-bold text-[9px] uppercase tracking-widest hover:bg-emerald-50">
                                        <Plus size={12} className="mr-1.5" /> Extend
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {formData.inclusions?.map((item, i) => (
                                        <div key={i} className="flex gap-3 items-center group/item">
                                            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0 shadow-sm border border-emerald-100">
                                                <Plus size={10} />
                                            </div>
                                            <Input 
                                                value={item} 
                                                onChange={e => {
                                                    const newList = [...formData.inclusions!];
                                                    newList[i] = e.target.value;
                                                    setFormData({...formData, inclusions: newList});
                                                }}
                                                placeholder="Service included..."
                                                className="h-10 bg-white border-slate-100 focus:border-emerald-200 transition-all rounded-xl text-xs font-medium px-4" 
                                            />
                                            <button type="button" onClick={() => {
                                                const newList = [...formData.inclusions!];
                                                newList.splice(i, 1);
                                                setFormData({...formData, inclusions: newList});
                                            }} className="opacity-0 group-hover/item:opacity-100 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Exclusions */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Exclusions & Limits</Label>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({...formData, exclusions: [...(formData.exclusions || []), ""]})} className="h-8 px-3 rounded-lg text-rose-600 font-bold text-[9px] uppercase tracking-widest hover:bg-rose-50">
                                        <Plus size={12} className="mr-1.5" /> Extend
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {formData.exclusions?.map((item, i) => (
                                        <div key={i} className="flex gap-3 items-center group/item">
                                            <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0 shadow-sm border border-rose-100">
                                                <XCircle size={10} />
                                            </div>
                                            <Input 
                                                value={item} 
                                                onChange={e => {
                                                    const newList = [...formData.exclusions!];
                                                    newList[i] = e.target.value;
                                                    setFormData({...formData, exclusions: newList});
                                                }}
                                                placeholder="Service excluded..."
                                                className="h-10 bg-white border-slate-100 focus:border-rose-200 transition-all rounded-xl text-xs font-medium px-4" 
                                            />
                                            <button type="button" onClick={() => {
                                                const newList = [...formData.exclusions!];
                                                newList.splice(i, 1);
                                                setFormData({...formData, exclusions: newList});
                                            }} className="opacity-0 group-hover/item:opacity-100 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tiered Accommodation Strategy */}
                    <div className="modern-card p-10 space-y-10">
                        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                            <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center">
                                <HotelIcon size={20} />
                            </div>
                            <h3 className="font-bold text-sm uppercase tracking-[0.2em] text-slate-800">Hospitality Manifest</h3>
                        </div>

                        {/* Standard Tier (Low Level) */}
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Standard Tier Selection</Label>
                                    <p className="text-[9px] text-slate-300 font-medium uppercase tracking-tight">4-Star & Premium Properties</p>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={() => setFormData({...formData, lowLevelHotels: [...(formData.lowLevelHotels || []), { name: "", location: "", stars: 4, image: "", description: "" }]})} className="h-10 px-5 rounded-xl border-dashed border-slate-200 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50">
                                    <Plus size={14} className="mr-2" /> Add Property
                                </Button>
                            </div>
                            <div className="space-y-4">
                                {formData.lowLevelHotels?.map((hotel, idx) => (
                                    <div key={idx} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-6 relative group">
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                const newList = [...formData.lowLevelHotels!];
                                                newList.splice(idx, 1);
                                                setFormData({...formData, lowLevelHotels: newList});
                                            }}
                                            className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="md:col-span-1">
                                            <Label className="text-[10px] font-black uppercase opacity-50 mb-2 block">Hotel Image</Label>
                                            <ImageUpload 
                                                compact
                                                value={hotel.image} 
                                                onUpload={(url) => {
                                                    const newList = [...formData.lowLevelHotels!];
                                                    newList[idx].image = url;
                                                    setFormData({...formData, lowLevelHotels: newList});
                                                }} 
                                            />
                                        </div>
                                        <div className="md:col-span-3 grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold uppercase opacity-60">Hotel Name</Label>
                                                <Input value={hotel.name} onChange={e => {
                                                    const newList = [...formData.lowLevelHotels!];
                                                    newList[idx].name = e.target.value;
                                                    setFormData({...formData, lowLevelHotels: newList});
                                                }} className="rounded-xl h-10 text-xs font-bold" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold uppercase opacity-60">Location</Label>
                                                <Input value={hotel.location} onChange={e => {
                                                    const newList = [...formData.lowLevelHotels!];
                                                    newList[idx].location = e.target.value;
                                                    setFormData({...formData, lowLevelHotels: newList});
                                                }} className="rounded-xl h-10 text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold uppercase opacity-60">Star Rating</Label>
                                                <select 
                                                    value={hotel.stars} 
                                                    onChange={e => {
                                                        const newList = [...formData.lowLevelHotels!];
                                                        newList[idx].stars = parseInt(e.target.value);
                                                        setFormData({...formData, lowLevelHotels: newList});
                                                    }}
                                                    className="w-full bg-white border border-slate-200 rounded-xl h-10 px-3 text-xs"
                                                >
                                                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Stars</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold uppercase opacity-60">Room Type/Meals</Label>
                                                <Input value={hotel.roomType || ""} onChange={e => {
                                                    const newList = [...formData.lowLevelHotels!];
                                                    newList[idx].roomType = e.target.value;
                                                    setFormData({...formData, lowLevelHotels: newList});
                                                }} placeholder="e.g. Superior / Breakfast" className="rounded-xl h-10 text-xs" />
                                            </div>
                                            <div className="col-span-2 space-y-3 pt-2 border-t border-slate-50">
                                                <Label className="text-[10px] font-black uppercase opacity-40">Hotel Gallery</Label>
                                                <div className="flex flex-wrap gap-3">
                                                    {(hotel.photos || []).map((url, pIdx) => (
                                                        <div key={pIdx} className="relative w-20 h-20 rounded-xl overflow-hidden border shadow-sm group/hotelimg">
                                                            <img src={formatUrl(url)} className="w-full h-full object-cover" />
                                                            <button 
                                                                type="button"
                                                                onClick={() => {
                                                                    const newList = [...formData.lowLevelHotels!];
                                                                    newList[idx].photos = newList[idx].photos!.filter((_, i) => i !== pIdx);
                                                                    setFormData({...formData, lowLevelHotels: newList});
                                                                }}
                                                                className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-lg opacity-0 group-hover/hotelimg:opacity-100 transition-opacity"
                                                            >
                                                                <Trash2 size={10} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <ImageUpload 
                                                        compact
                                                        multiple
                                                        className="w-20"
                                                        onUpload={(url) => {
                                                            const newList = [...formData.lowLevelHotels!];
                                                            if (!newList[idx].photos) newList[idx].photos = [];
                                                            newList[idx].photos!.push(url);
                                                            setFormData({...formData, lowLevelHotels: newList});
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Luxury Tier (High Level) */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-black uppercase tracking-widest text-purple-600">Luxury Tier Hotels</Label>
                                <Button type="button" variant="outline" size="sm" onClick={() => setFormData({...formData, highLevelHotels: [...(formData.highLevelHotels || []), { name: "", location: "", stars: 5, image: "", description: "" }]})} className="rounded-xl border-dashed border-purple-200 text-purple-600">
                                    <Plus size={16} className="mr-2" /> Add Luxury Hotel
                                </Button>
                            </div>
                            <div className="space-y-4">
                                {formData.highLevelHotels?.map((hotel, idx) => (
                                    <div key={idx} className="p-6 bg-purple-50/30 rounded-3xl border border-purple-100 grid grid-cols-1 md:grid-cols-4 gap-6 relative group">
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                const newList = [...formData.highLevelHotels!];
                                                newList.splice(idx, 1);
                                                setFormData({...formData, highLevelHotels: newList});
                                            }}
                                            className="absolute top-4 right-4 text-purple-300 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="md:col-span-1">
                                            <Label className="text-[10px] font-black uppercase opacity-50 mb-2 block">Hotel Image</Label>
                                            <ImageUpload 
                                                compact
                                                value={hotel.image} 
                                                onUpload={(url) => {
                                                    const newList = [...formData.highLevelHotels!];
                                                    newList[idx].image = url;
                                                    setFormData({...formData, highLevelHotels: newList});
                                                }} 
                                            />
                                        </div>
                                        <div className="md:col-span-3 grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold uppercase opacity-60">Hotel Name</Label>
                                                <Input value={hotel.name} onChange={e => {
                                                    const newList = [...formData.highLevelHotels!];
                                                    newList[idx].name = e.target.value;
                                                    setFormData({...formData, highLevelHotels: newList});
                                                }} className="rounded-xl h-10 text-xs font-bold" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold uppercase opacity-60">Location</Label>
                                                <Input value={hotel.location} onChange={e => {
                                                    const newList = [...formData.highLevelHotels!];
                                                    newList[idx].location = e.target.value;
                                                    setFormData({...formData, highLevelHotels: newList});
                                                }} className="rounded-xl h-10 text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold uppercase opacity-60">Star Rating</Label>
                                                <select 
                                                    value={hotel.stars} 
                                                    onChange={e => {
                                                        const newList = [...formData.highLevelHotels!];
                                                        newList[idx].stars = parseInt(e.target.value);
                                                        setFormData({...formData, highLevelHotels: newList});
                                                    }}
                                                    className="w-full bg-white border border-slate-200 rounded-xl h-10 px-3 text-xs"
                                                >
                                                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Stars</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold uppercase opacity-60">Room Type/Meals</Label>
                                                <Input value={hotel.roomType || ""} onChange={e => {
                                                    const newList = [...formData.highLevelHotels!];
                                                    newList[idx].roomType = e.target.value;
                                                    setFormData({...formData, highLevelHotels: newList});
                                                }} placeholder="e.g. Deluxe Sea View / Breakfast" className="rounded-xl h-10 text-xs" />
                                            </div>
                                            <div className="col-span-2 space-y-3 pt-2 border-t border-slate-50">
                                                <Label className="text-[10px] font-black uppercase opacity-40">Hotel Gallery</Label>
                                                <div className="flex flex-wrap gap-3">
                                                    {(hotel.photos || []).map((url, pIdx) => (
                                                        <div key={pIdx} className="relative w-20 h-20 rounded-xl overflow-hidden border shadow-sm group/hotelimg">
                                                            <img src={formatUrl(url)} className="w-full h-full object-cover" />
                                                            <button 
                                                                type="button"
                                                                onClick={() => {
                                                                    const newList = [...formData.highLevelHotels!];
                                                                    newList[idx].photos = newList[idx].photos!.filter((_, i) => i !== pIdx);
                                                                    setFormData({...formData, highLevelHotels: newList});
                                                                }}
                                                                className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-lg opacity-0 group-hover/hotelimg:opacity-100 transition-opacity"
                                                            >
                                                                <Trash2 size={10} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <ImageUpload 
                                                        compact
                                                        multiple
                                                        className="w-20"
                                                        onUpload={(url) => {
                                                            const newList = [...formData.highLevelHotels!];
                                                            if (!newList[idx].photos) newList[idx].photos = [];
                                                            newList[idx].photos!.push(url);
                                                            setFormData({...formData, highLevelHotels: newList});
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Places & Activities */}
                    <div className="modern-card p-10 space-y-10">
                        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                                <ImageIcon size={20} />
                            </div>
                            <h3 className="font-bold text-sm uppercase tracking-[0.2em] text-slate-800">Visual Narratives</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sightseeing Index (Count)</Label>
                                <Input 
                                    type="number" 
                                    value={formData.sightseeingCount || 0} 
                                    onChange={e => setFormData({...formData, sightseeingCount: parseInt(e.target.value)})} 
                                    className="h-14 bg-slate-50/50 border-transparent focus:bg-white focus:border-slate-200 transition-all rounded-2xl font-black text-lg px-6"
                                    placeholder="e.g. 9"
                                />
                                <p className="text-[9px] text-slate-300 font-medium uppercase tracking-widest">Displays as a highlight badge in the proposal header.</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cinematic Storyboard (Gallery)</Label>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                                {(formData.experiencePhotos || []).map((photo: any, pIdx: number) => {
                                    const photoUrl = typeof photo === 'string' ? photo : photo.url;
                                    const photoName = typeof photo === 'string' ? "" : photo.name;
                                    
                                    return (
                                        <div key={pIdx} className="space-y-3 group/thumb">
                                            <div className="relative aspect-[4/5] rounded-[24px] overflow-hidden border-2 border-white shadow-sm transition-all group-hover/thumb:shadow-xl group-hover/thumb:-translate-y-1">
                                                <img src={formatUrl(photoUrl)} className="w-full h-full object-cover" />
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        const newList = (formData.experiencePhotos || []).filter((_: any, i: number) => i !== pIdx);
                                                        setFormData({...formData, experiencePhotos: newList});
                                                    }}
                                                    className="absolute top-3 right-3 w-7 h-7 bg-white text-rose-500 rounded-full flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-all shadow-lg border border-rose-50"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                            <Input 
                                                placeholder="Experience name..." 
                                                value={photoName} 
                                                onChange={(e) => {
                                                    const newList = [...(formData.experiencePhotos || [])];
                                                    newList[pIdx] = { url: photoUrl, name: e.target.value };
                                                    setFormData({...formData, experiencePhotos: newList});
                                                }}
                                                className="h-9 text-[10px] font-bold rounded-xl text-center bg-slate-50 border-transparent focus:bg-white focus:border-slate-100 transition-all"
                                            />
                                        </div>
                                    );
                                })}
                                <div className="aspect-[3/4]">
                                    <ImageUpload 
                                        multiple={true}
                                        onUpload={(url) => {
                                            setFormData(prev => {
                                                const experiencePhotos = [...(prev.experiencePhotos || [])];
                                                // Check if it already exists (handling both string and object)
                                                const exists = experiencePhotos.some(p => (typeof p === 'string' ? p : p.url) === url);
                                                if (!exists) {
                                                    experiencePhotos.push({ url, name: "" });
                                                }
                                                return { ...prev, experiencePhotos };
                                            });
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Voice of Explorers */}
                    <div className="modern-card p-10 space-y-10">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                                    <Sparkles size={20} />
                                </div>
                                <h3 className="font-bold text-sm uppercase tracking-[0.2em] text-slate-800">Voice of Explorers</h3>
                            </div>
                        </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => setFormData({...formData, reviews: [...(formData.reviews || []), { id: uuidv4(), name: "", rating: 5, comment: "" }]})} className="h-10 px-5 rounded-xl border-dashed border-slate-200 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50">
                                <Plus size={14} className="mr-2" /> Add Testimony
                            </Button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {(formData.reviews || []).map((review, idx) => (
                                <div key={idx} className="p-8 bg-slate-50/50 rounded-[32px] border border-slate-100/50 space-y-6 relative group transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-100">
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            const newList = [...formData.reviews!];
                                            newList.splice(idx, 1);
                                            setFormData({...formData, reviews: newList});
                                        }}
                                        className="absolute top-6 right-6 h-7 w-7 rounded-full bg-white flex items-center justify-center text-slate-200 hover:text-rose-500 shadow-sm border border-slate-50 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Explorer Identity</Label>
                                                <Input value={review.name} onChange={e => {
                                                    const newList = [...formData.reviews!];
                                                    newList[idx].name = e.target.value;
                                                    setFormData({...formData, reviews: newList});
                                                }} placeholder="e.g. Rahul Sharma" className="h-11 bg-white border-slate-100 rounded-xl text-xs font-bold px-4" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Satisfaction Rating</Label>
                                                <select 
                                                    value={review.rating} 
                                                    onChange={e => {
                                                        const newList = [...formData.reviews!];
                                                        newList[idx].rating = parseInt(e.target.value);
                                                        setFormData({...formData, reviews: newList});
                                                    }}
                                                    className="w-full bg-white border border-slate-100 rounded-xl h-11 px-4 text-xs font-bold outline-none"
                                                >
                                                    {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Star' : 'Stars'}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Narrative Comment</Label>
                                            <Textarea 
                                                value={review.comment} 
                                                onChange={e => {
                                                    const newList = [...formData.reviews!];
                                                    newList[idx].comment = e.target.value;
                                                    setFormData({...formData, reviews: newList});
                                                }} 
                                                placeholder="Share their experience..."
                                                className="bg-white border-slate-100 rounded-2xl text-xs min-h-[100px] p-4 font-medium leading-relaxed"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    </div>

                {/* Sidebar Controls */}
                <div className="space-y-8">
                    {/* Hero & Experience Slider */}
                    <GlassCard className="p-6 space-y-6">
                        <div className="flex items-center justify-between border-b pb-3">
                            <Label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <ImageIcon size={14} /> Hero Gallery
                            </Label>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase opacity-60">Primary Cover (Main)</Label>
                                <ImageUpload 
                                    value={formData.coverImage} 
                                    onUpload={(url) => setFormData({...formData, coverImage: url})} 
                                />
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <Label className="text-[10px] font-bold uppercase opacity-60">Hero Slider Gallery (Additional Photos)</Label>
                                <div className="flex flex-wrap gap-3">
                                    {(formData.heroImages || []).map((url, idx) => (
                                        <div key={idx} className="relative w-32 h-20 rounded-xl overflow-hidden border shadow-sm group/item">
                                            <img src={formatUrl(url)} className="w-full h-full object-cover" />
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    const newList = (formData.heroImages || []).filter((_, i) => i !== idx);
                                                    setFormData({...formData, heroImages: newList});
                                                }}
                                                className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        </div>
                                    ))}
                                    <ImageUpload 
                                        compact
                                        multiple
                                        className="w-32"
                                        onUpload={(url) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                heroImages: [...(prev.heroImages || []), url]
                                            }));
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <p className="text-[9px] text-muted-foreground italic leading-relaxed uppercase tracking-widest font-black opacity-40">
                            The main background images for the quotation hero section.
                        </p>
                    </GlassCard>

                    {/* Side Intelligence */}
                    <div className="space-y-8">
                        {/* Quote Validity */}
                        <div className="modern-card p-8 space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                                <Clock size={16} className="text-slate-400" />
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-800">Proposal Integrity</h3>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Temporal Validity</Label>
                                    <select 
                                        className="w-full bg-slate-50 border-transparent rounded-xl h-12 px-4 text-xs font-bold focus:bg-white focus:border-slate-200 transition-all outline-none"
                                        value={formData.expiryHours || ""}
                                        onChange={e => setFormData({...formData, expiryHours: e.target.value ? parseInt(e.target.value) : null})}
                                    >
                                        <option value="">Perpetual (No Expiry)</option>
                                        <option value="24">24 Hours</option>
                                        <option value="48">48 Hours</option>
                                        <option value="72">72 Hours</option>
                                        <option value="168">7 Days</option>
                                        <option value="custom">Custom Duration</option>
                                    </select>
                                </div>
                                {formData.expiryHours === -1 || (formData.expiryHours && ![24, 48, 72, 168].includes(formData.expiryHours)) && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                        <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Custom Hours</Label>
                                        <Input 
                                            type="number" 
                                            value={formData.expiryHours || ""} 
                                            onChange={e => setFormData({...formData, expiryHours: parseInt(e.target.value)})} 
                                            className="h-12 bg-white border-slate-100 rounded-xl text-xs font-black"
                                        />
                                    </div>
                                )}
                                <p className="text-[9px] text-slate-300 font-medium leading-relaxed uppercase tracking-tight">
                                    Clock starts at the moment of publication.
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="modern-card p-8 space-y-6">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-800 border-b border-slate-50 pb-4">Transmission Hub</h3>
                            
                            {formData.slug && (
                                <div className="space-y-3">
                                    <Button variant="outline" onClick={copyLink} className="w-full h-12 justify-start rounded-xl text-[10px] font-bold uppercase tracking-widest border-slate-100 hover:bg-slate-50">
                                        <Copy size={14} className="mr-3" /> Copy Asset Link
                                    </Button>
                                    <Button variant="outline" onClick={() => {
                                        const baseUrl = import.meta.env.VITE_FRONTEND_URL || 'https://youthcamping.online';
                                        window.open(`${baseUrl}/quote/${formData.slug}?isAdmin=true`, '_blank');
                                    }} className="w-full h-12 justify-start rounded-xl text-[10px] font-bold uppercase tracking-widest border-slate-100 hover:bg-slate-50">
                                        <ExternalLink size={14} className="mr-3" /> Live Preview
                                    </Button>
                                    <Button onClick={sendWhatsApp} className="w-full h-12 justify-start rounded-xl text-[10px] font-bold uppercase tracking-widest bg-[#25D366] hover:bg-[#128C7E] text-white shadow-lg shadow-green-100 border-none">
                                        <WhatsAppIcon size={14} className="mr-3" /> Dispatch via WhatsApp
                                    </Button>
                                </div>
                            )}

                            {!formData.slug && (
                                <div className="p-6 bg-slate-50 rounded-2xl text-center border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed italic">Seal the proposal to unlock transmission channels.</p>
                                </div>
                            )}
                        </div>

                        {/* Expert Meta */}
                        <div className="modern-card p-8 space-y-8">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-800 border-b border-slate-50 pb-4 flex items-center gap-2">
                                <Users size={14} className="text-slate-400" /> Curated By
                            </h3>
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Professional Profile</Label>
                                    <ImageUpload 
                                        value={formData.expert?.photo} 
                                        onUpload={(url) => setFormData({...formData, expert: {...formData.expert!, photo: url}})} 
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Agent Identity</Label>
                                        <Input value={formData.expert?.name} onChange={e => setFormData({...formData, expert: {...formData.expert!, name: e.target.value}})} placeholder="Name" className="h-12 bg-slate-50/50 border-transparent focus:bg-white focus:border-slate-100 rounded-xl text-xs font-bold px-4" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Official Title</Label>
                                        <Input value={formData.expert?.designation} onChange={e => setFormData({...formData, expert: {...formData.expert!, designation: e.target.value}})} placeholder="Designation" className="h-12 bg-slate-50/50 border-transparent focus:bg-white focus:border-slate-100 rounded-xl text-xs font-medium px-4" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Professional Ethos (Bio)</Label>
                                    <Textarea 
                                        value={formData.expert?.description} 
                                        onChange={e => setFormData({...formData, expert: {...formData.expert!, description: e.target.value}})} 
                                        className="bg-slate-50/50 border-transparent focus:bg-white focus:border-slate-100 rounded-2xl text-xs min-h-[100px] p-4 font-medium leading-relaxed"
                                        placeholder="Brief professional background..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats (if exists) */}
                    {isEdit && (
                        <GlassCard className="p-6 bg-primary text-white">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Proposal Insights</p>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-3xl font-black">{formData.viewCount || 0}</p>
                                    <p className="text-[10px] font-bold uppercase text-slate-400">Total Views</p>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                                    <Calendar size={12} />
                                    Created on {new Date(formData.createdAt!).toLocaleDateString()}
                                </div>
                                {formData.expiresAt && (
                                    <div className="space-y-3 pt-2 border-t border-white/10">
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                                            <span className="text-slate-400">Expires On</span>
                                            <span className={new Date() > new Date(formData.expiresAt) ? "text-rose-400" : "text-emerald-400"}>
                                                {new Date(formData.expiresAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <Button 
                                            variant="secondary" 
                                            size="sm" 
                                            onClick={handleExtend}
                                            className="w-full rounded-lg font-black uppercase text-[10px] h-8 bg-white/10 hover:bg-white/20 text-white border-none"
                                        >
                                            Extend by 48h
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    )}

                    {/* Summary & Logistics Configuration */}
                    <div className="modern-card p-10 space-y-10">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                            <Label className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-3 text-slate-800">
                                <Sparkles size={20} className="text-primary" /> Logistics Architecture
                            </Label>
                        </div>

                        {/* Stay & Meals Manual Override */}
                        <div className="space-y-6">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nightly Distribution (Stay Summary)</Label>
                            <div className="space-y-4">
                                {(formData.staySummary || []).map((item, idx) => (
                                    <div key={idx} className="flex gap-4 items-end group/stay">
                                        <div className="w-24">
                                            <Label className="text-[9px] uppercase tracking-widest text-slate-300 font-bold mb-1.5 block">Nights</Label>
                                            <Input 
                                                type="number"
                                                value={item.nights}
                                                onChange={(e) => {
                                                    const newList = [...formData.staySummary!];
                                                    newList[idx].nights = parseInt(e.target.value) || 1;
                                                    setFormData({...formData, staySummary: newList});
                                                }}
                                                className="h-12 bg-slate-50/50 border-transparent focus:bg-white focus:border-slate-100 rounded-xl text-xs font-bold px-4"
                                            />
                                        </div>
                                        <div className="flex-grow">
                                            <Label className="text-[9px] uppercase tracking-widest text-slate-300 font-bold mb-1.5 block">Strategic Location</Label>
                                            <Input 
                                                value={item.location}
                                                onChange={(e) => {
                                                    const newList = [...formData.staySummary!];
                                                    newList[idx].location = e.target.value;
                                                    setFormData({...formData, staySummary: newList});
                                                }}
                                                placeholder="e.g. South Goa"
                                                className="h-12 bg-slate-50/50 border-transparent focus:bg-white focus:border-slate-100 rounded-xl text-xs font-medium px-4"
                                            />
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-12 w-12 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover/stay:opacity-100"
                                            onClick={() => {
                                                const newList = formData.staySummary!.filter((_, i) => i !== idx);
                                                setFormData({...formData, staySummary: newList});
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                ))}
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full h-12 border-dashed border-slate-200 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-50"
                                    onClick={() => setFormData({...formData, staySummary: [...(formData.staySummary || []), { nights: 1, location: "" }]})}
                                >
                                    <Plus size={14} className="mr-2" /> Add Logistics Point
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-10 pt-6 border-t border-slate-50">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Accommodation Capacity</Label>
                                <Input 
                                    value={formData.roomsInfo || ""}
                                    onChange={(e) => setFormData({...formData, roomsInfo: e.target.value})}
                                    placeholder="e.g. 1 Private Suite"
                                    className="h-12 bg-slate-50 border-transparent focus:bg-white focus:border-slate-100 rounded-xl text-xs font-medium px-4"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Culinary Provision</Label>
                                <Input 
                                    value={formData.mealsInfo || ""}
                                    onChange={(e) => setFormData({...formData, mealsInfo: e.target.value})}
                                    placeholder="e.g. Continental Breakfast"
                                    className="h-12 bg-slate-50 border-transparent focus:bg-white focus:border-slate-100 rounded-xl text-xs font-medium px-4"
                                />
                            </div>
                        </div>

                        {/* Travelling Flow Manual Override */}
                        <div className="space-y-6 pt-6 border-t border-slate-50">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Transit Choreography</Label>
                            <div className="space-y-6">
                                {(formData.travelling || []).map((item, idx) => (
                                    <div key={idx} className="flex gap-6 items-start p-6 bg-white border border-slate-50 rounded-[32px] shadow-sm group/transit">
                                        <div className="space-y-3 shrink-0">
                                            <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Transit Glyph</Label>
                                            <div className="grid grid-cols-4 gap-2 p-2 bg-slate-50 rounded-2xl">
                                                {[
                                                    { id: "plane", icon: Plane },
                                                    { id: "train", icon: Train },
                                                    { id: "car", icon: Car },
                                                    { id: "bus", icon: Bus },
                                                    { id: "ship", icon: Ship },
                                                    { id: "pickup", icon: PickupIcon },
                                                    { id: "hotel", icon: HotelIcon },
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() => {
                                                            const newList = [...formData.travelling!];
                                                            newList[idx].icon = opt.id;
                                                            setFormData({...formData, travelling: newList});
                                                        }}
                                                        className={`p-2 rounded-xl transition-all ${item.icon === opt.id ? 'bg-primary text-white shadow-xl' : 'bg-white text-slate-300 hover:text-primary'}`}
                                                    >
                                                        <opt.icon size={12} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-3">
                                            <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Phase Specification</Label>
                                            <Input 
                                                value={item.label}
                                                onChange={(e) => {
                                                    const newList = [...formData.travelling!];
                                                    newList[idx].label = e.target.value;
                                                    setFormData({...formData, travelling: newList});
                                                }}
                                                placeholder="e.g. Arrival Reception"
                                                className="h-12 text-sm rounded-xl font-bold border-slate-100 bg-slate-50/50 focus:bg-white transition-all px-4"
                                            />
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-12 w-12 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover/transit:opacity-100"
                                            onClick={() => {
                                                const newList = formData.travelling!.filter((_, i) => i !== idx);
                                                setFormData({...formData, travelling: newList});
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                ))}
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full h-12 border-dashed border-slate-200 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-50"
                                    onClick={() => setFormData({...formData, travelling: [...(formData.travelling || []), { icon: "🚗", label: "" }]})}
                                >
                                    <Plus size={14} className="mr-2" /> Insert Transit Phase
                                </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
}
