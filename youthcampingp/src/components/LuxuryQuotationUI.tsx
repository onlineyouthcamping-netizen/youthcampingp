"use client";

import React, { useState, useEffect } from "react";
import { Quotation } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { ImageSlider } from "@/components/ui/ImageSlider";
import { 
    Calendar, Users, MapPin, Clock, ArrowRight, 
    ChevronDown, ChevronLeft, ChevronRight, Utensils, Hotel as HotelIcon,
    Maximize2, CheckCircle2, Sparkles, MessageCircle, ArrowDown, X,
    Plane, Train, Car, Ship, Bus, MapPin as PickupIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizeImageUrl } from "@/lib/api";
import { useTheme } from "@/components/DynamicThemeProvider";

// Helper: add N days to a date string, return formatted label
function getDayDate(baseDate: string | undefined, dayOffset: number): string {
    if (!baseDate) return '';
    try {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + dayOffset);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return ''; }
}

function TravellingIcon({ icon }: { icon: string }) {
    switch (icon) {
        case 'plane': return <Plane size={20} />;
        case 'train': return <Train size={20} />;
        case 'car': return <Car size={20} />;
        case 'ship': return <Ship size={20} />;
        case 'bus': return <Bus size={20} />;
        case 'pickup': return <PickupIcon size={20} />;
        case 'hotel': return <HotelIcon size={20} />;
        default: return <span className="text-xl">{icon}</span>;
    }
}
export default function LuxuryQuotationUI({ q }: { q: Quotation }) {
    const { settings } = useTheme();
    const [expandedDays, setExpandedDays] = useState<number[]>([1]);
    const [selectedTier, setSelectedTier] = useState<'standard' | 'premium'>('premium');
    const [selectedPlace, setSelectedPlace] = useState<any>(null);
    const [selectedHotelForGallery, setSelectedHotelForGallery] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState("");

    const exploreContainerRef = React.useRef<HTMLDivElement>(null);

    const scrollExplore = (direction: 'left' | 'right') => {
        if (exploreContainerRef.current) {
            const scrollAmount = 400; // width of one card + gap
            exploreContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Urgency Timer
    useEffect(() => {
        if (!q.expiryTime) return;
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const end = new Date(q.expiryTime!).getTime();
            const diff = end - now;
            if (diff <= 0) {
                setTimeLeft("EXPIRED");
                clearInterval(interval);
                return;
            }
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(interval);
    }, [q.expiryTime]);

    const toggleDay = (dayNum: number) => {
        setExpandedDays(prev => prev.includes(dayNum) ? prev.filter(d => d !== dayNum) : [...prev, dayNum]);
    };

    const allDaysCount = q.itinerary?.length || 0;
    const isAllExpanded = expandedDays.length === allDaysCount;

    const toggleExpandAll = () => {
        if (isAllExpanded) {
            setExpandedDays([1]);
        } else {
            const allDays = q.itinerary?.map(item => item.day) || [];
            setExpandedDays(allDays);
        }
    };

    const phone = settings?.contactPhone || "99242 46267";
    const whatsappNumber = phone.replace(/\D/g, '');

    const handleWhatsAppBooking = () => {
        const message = encodeURIComponent(`Hi! I've reviewed the luxury quotation for "${q.tripTitle}". I'd like to confirm the booking for ${q.paxCount || 2} travellers starting from ${getDayDate(q.travelDates?.from, 0) || 'the proposed date'}.`);
        window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-[#FF5400]/20">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=DM+Serif+Display&family=Inter:wght@300;400;600;800;900&display=swap');
                
                .font-handwritten { font-family: 'Caveat', cursive; }
                .font-serif { font-family: 'DM Serif Display', serif; }
                .font-sans { font-family: 'Inter', sans-serif; }
                
                .itinerary-row {
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .itinerary-row:hover {
                    transform: translateX(8px);
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* 1. PIXEL-PERFECT HERO (Matching Screenshot 1) */}
            <section className="relative h-[90vh] md:h-screen w-full overflow-hidden flex items-center justify-center bg-slate-900">
                <div className="absolute inset-0 z-0">
                    <ImageSlider 
                        images={Array.from(new Set([
                            normalizeImageUrl(q.coverImage),
                            ...(q.heroImages || []).map(normalizeImageUrl),
                            ...(q.experiencePhotos || []).map((p: any) => normalizeImageUrl(typeof p === 'string' ? p : p.url))
                        ])).filter(Boolean) as string[]} 
                        className="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/60" />
                </div>
                
                <div className="relative z-20 text-center text-white px-6 max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <p className="text-base md:text-xl font-bold capitalize tracking-[0.3em] mb-4 text-[#FF5400]/90 drop-shadow-lg">
                            {q.customerName}&apos;s
                        </p>
                        <h1 className="text-5xl md:text-8xl lg:text-9xl font-serif mb-6 drop-shadow-2xl leading-[0.9] tracking-tighter">
                            {q.tripTitle}
                        </h1>
                        <div className="flex items-center justify-center gap-4 mb-12">
                            <div className="h-px w-8 md:w-12 bg-white/30" />
                            <p className="text-lg md:text-2xl font-handwritten text-white/90 italic">
                                {q.destination} Experience
                            </p>
                            <div className="h-px w-8 md:w-12 bg-white/30" />
                        </div>
                        
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                            <div className="px-10 py-4 rounded-full border border-white/30 bg-white/10 backdrop-blur-xl text-white font-bold capitalize text-xs tracking-[0.2em] shadow-2xl">
                                {q.duration || "6 Days & 5 Nights"}
                            </div>
                            <button className="w-14 h-14 rounded-full border border-white/30 bg-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-white hover:text-black transition-all group shadow-2xl">
                                <ArrowDown size={24} className="group-hover:translate-y-1 transition-transform" />
                            </button>
                        </div>
                    </motion.div>
                </div>

            </section>

            {/* 2. THE CURATED HEADER (Matching Screenshot 1 Bottom) */}
            <div className="py-20 bg-white text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative inline-block"
                >
                    <p className="font-handwritten text-[#FF5400] text-4xl md:text-7xl mb-[-10px] relative z-10">
                        We have Curated
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <h2 className="text-2xl md:text-5xl font-bold text-[#4B5563] tracking-tighter capitalize">
                            The Best Itinerary For You
                        </h2>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="#FF5400" className="mb-2">
                            <path d="M21 5l-8 4-8-4 8 8 8-8zM3 10l9 9 9-9" />
                        </svg>
                    </div>
                </motion.div>
            </div>

            {/* 3. SUMMARY INFO CARDS (Matching Screenshot 4) */}
            <section className="container mx-auto px-4 md:px-20 pt-12 pb-24 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    
                    {/* Left: Summary Sections */}
                    <div className="lg:col-span-8 space-y-12">
                        
                        {/* Mini Header */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF5400" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 capitalize tracking-widest leading-none mb-1">{q.customerName}&apos;s</p>
                                <h2 className="text-2xl font-bold text-[#FF5400] capitalize tracking-tighter">{q.tripTitle}</h2>
                            </div>
                        </div>

                        {/* Info Bar Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                            {[
                                { label: 'Duration', val: q.duration || '6 Days & 5 Nights', icon: Clock },
                                { label: 'Travel Date', val: getDayDate(q.travelDates?.from, 0) || '18 Mar 2026', icon: Calendar },
                                { label: 'Travellers', val: `${q.paxCount || 2} Adults`, icon: Users }
                            ].map((item: any, i: number) => (
                                <div key={i} className={`bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 p-4 md:p-6 flex items-center gap-4 shadow-sm ${i === 2 ? 'sm:col-span-2 md:col-span-1' : ''}`}>
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                        <item.icon size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 capitalize tracking-widest mb-0.5">{item.label}</p>
                                        <p className="text-xs font-bold text-slate-800 capitalize tracking-tight">{item.val}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Stay & Meals Card */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-10 space-y-10 shadow-sm relative overflow-hidden">
                            <h4 className="text-xs font-bold capitalize tracking-[0.3em] text-slate-800">Stay & Meals</h4>
                            
                            {/* Nights Breakdown */}
                            <div className="flex flex-wrap items-center gap-8">
                                {q.staySummary && q.staySummary.length > 0 ? (
                                    q.staySummary.map((item: any, i: number) => (
                                        <div key={i} className="flex items-baseline gap-2">
                                            <span className="text-4xl font-bold text-slate-200">{item.nights}</span>
                                            <div className="text-[10px] leading-tight font-bold capitalize text-slate-500">
                                                Night{item.nights > 1 ? 's' : ''} in <br/><span className="text-slate-800">{item.location}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    q.itinerary?.filter((_, i) => i < 4).map((day: any, i: number) => (
                                        <div key={i} className="flex items-baseline gap-2">
                                            <span className="text-4xl font-bold text-slate-200">1</span>
                                            <div className="text-[10px] leading-tight font-bold capitalize text-slate-500">
                                                Night in <br/><span className="text-slate-800">{day.location || "Port Blair"}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="bg-slate-50/50 rounded-2xl md:rounded-3xl p-5 md:p-6 flex items-center gap-4">
                                    <HotelIcon size={24} className="text-slate-400" />
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest">Rooms</p>
                                        <p className="text-xs font-bold text-slate-800 capitalize tracking-tight">{q.roomsInfo || "1 Rooms at all location"}</p>
                                    </div>
                                </div>
                                <div className="bg-slate-50/50 rounded-2xl md:rounded-3xl p-5 md:p-6 flex items-center gap-4">
                                    <Utensils size={24} className="text-slate-400" />
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest">Meals</p>
                                        <p className="text-xs font-bold text-slate-800 capitalize tracking-tight">{q.mealsInfo || "Breakfast at Property"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Travelling Flow Card */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-10 space-y-10 shadow-sm">
                            <h4 className="text-xs font-bold capitalize tracking-[0.3em] text-slate-800">Travelling</h4>
                            
                            <div className="flex flex-col md:flex-row items-start justify-between relative px-2 gap-6 md:gap-0">
                                {/* Dashed Connector (Hidden on mobile) */}
                                <div className="hidden md:block absolute top-5 left-10 right-10 h-px border-t-2 border-dashed border-slate-100 -z-0" />
                                
                                {(q.travelling && q.travelling.length > 0 ? q.travelling : [
                                    { icon: '✈️', label: 'Ahmedabad to Port Blair' },
                                    { icon: '🚗', label: 'Airport Pickup' },
                                    { icon: '🚗', label: 'Private vehicle for sightseeing' },
                                    { icon: '🚗', label: 'Airport Drop' },
                                    { icon: '✈️', label: 'Port Blair to Ahmedabad' }
                                ]).map((item: any, i: number) => (
                                    <div key={i} className="relative z-10 flex flex-row md:flex-col items-center gap-4 md:gap-3 flex-1 text-left md:text-center group w-full md:w-auto">
                                        <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-50 flex items-center justify-center text-slate-400 shadow-sm group-hover:border-[#FF5400]/30 group-hover:text-[#FF5400] transition-all duration-500 shrink-0">
                                            <TravellingIcon icon={item.icon} />
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 capitalize leading-tight tracking-tight px-1 group-hover:text-slate-800 transition-colors">
                                            {item.label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 1. DETAILED ITINERARY */}
                        <div className="space-y-10">
                            <div className="flex items-center justify-between">
                                <div className="relative">
                                    <p className="font-handwritten text-[#FF5400] text-3xl md:text-4xl mb-[-12px] ml-[-10px]">Detailed</p>
                                    <h3 className="text-3xl md:text-5xl font-bold text-[#4B5563] tracking-tighter capitalize">Itinerary</h3>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    onClick={toggleExpandAll}
                                    className="border rounded-xl px-6 hover:bg-slate-50 text-slate-400 hover:text-slate-900 gap-2 font-bold capitalize text-[10px] tracking-widest"
                                >
                                    <Maximize2 size={14} className={`transition-transform duration-300 ${isAllExpanded ? 'rotate-180' : ''}`} /> 
                                    {isAllExpanded ? "Collapse All" : "Expand All"}
                                </Button>
                            </div>
                            <div className="space-y-4">
                                {q.itinerary?.map((day: any, idx: number) => (
                                    <div key={idx} className="group">
                                        <div 
                                            onClick={() => toggleDay(day.day)}
                                            className={`itinerary-row cursor-pointer rounded-[1.25rem] md:rounded-[2rem] p-3 md:p-5 flex items-center gap-3 md:gap-8 transition-all shadow-sm border border-transparent ${
                                                expandedDays.includes(day.day) 
                                                    ? 'bg-white border-[#FF5400]/20 ring-4 ring-primary/5' 
                                                    : 'bg-[#EBF3FF] hover:bg-white hover:shadow-md'
                                            }`}
                                        >
                                            {/* Day Badge */}
                                            <div className="bg-[#4B5563] text-white px-3 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl font-bold text-[10px] md:text-sm capitalize tracking-tight shadow-md shrink-0 min-w-[60px] md:min-w-[100px] text-center">
                                                Day {day.day}
                                            </div>

                                            {/* Title */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-xs md:text-lg font-bold text-[#1E3A8A] tracking-tight truncate">
                                                    {day.title}
                                                </h4>
                                            </div>

                                            {/* Right Side Info (Meals & Stay) */}
                                            <div className="flex items-center gap-3 md:gap-6 shrink-0 border-l border-[#1E3A8A]/10 pl-3 md:pl-6">
                                                <div className="hidden sm:flex flex-col gap-1 md:gap-2 min-w-[80px] md:min-w-[120px]">
                                                    <div className="flex items-center gap-1.5 md:gap-2.5 text-[#4B5563]">
                                                        <Utensils size={12} className="shrink-0 text-[#1E3A8A]/40" />
                                                        <span className="text-[8px] md:text-xs font-bold capitalize tracking-wider">
                                                            {day.meals || "B, D"}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 md:gap-2.5 text-[#4B5563]">
                                                        <HotelIcon size={12} className="shrink-0 text-[#1E3A8A]/40" />
                                                        <span className="text-[8px] md:text-xs font-bold capitalize tracking-wider truncate max-w-[60px] md:max-w-[150px]">
                                                            {day.stay || "Luxury Stay"}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Mobile Meals/Stay Indicator (Icons only) */}
                                                <div className="flex sm:hidden flex-col gap-1">
                                                    <div className="flex items-center gap-1 text-[8px] font-bold text-[#4B5563]">
                                                        <Utensils size={10} className="text-[#1E3A8A]/40" /> {typeof day.meals === 'string' ? day.meals.split(',')[0] : "B"}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[8px] font-bold text-[#4B5563]">
                                                        <HotelIcon size={10} className="text-[#1E3A8A]/40" /> {typeof day.stay === 'string' ? (day.stay.length > 8 ? day.stay.substring(0, 8) + '...' : day.stay) : "Stay"}
                                                    </div>
                                                </div>

                                                <div className={`transition-transform duration-500 ${expandedDays.includes(day.day) ? 'rotate-180 text-[#FF5400]' : 'text-[#1E3A8A]/30'}`}>
                                                    <ChevronDown size={18} className="md:w-6 md:h-6" />
                                                </div>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {expandedDays.includes(day.day) && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="p-6 md:p-10 pt-4 md:ml-24 space-y-6">
                                                        <p className="text-slate-600 text-sm md:text-base leading-relaxed font-medium bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                                            {day.description}
                                                        </p>
                                                        {day.photos && day.photos.length > 0 && (
                                                            <div className="space-y-6">
                                                                <h4 className="text-xs font-bold text-slate-800 capitalize tracking-[0.2em] flex items-center gap-4">
                                                                    Sightseeing Places
                                                                    <div className="h-px flex-1 bg-slate-100" />
                                                                </h4>
                                                                <div className="flex overflow-x-auto no-scrollbar gap-6 pb-4">
                                                                    {day.photos.map((pic: any, pidx: number) => {
                                                                        const parts = pic.split("|");
                                                                        const photoUrl = parts[0];
                                                                        const captionText = parts.slice(1).join("|") || `${(typeof day.title === 'string' ? day.title.split(' ')[0] : "Place")} ${pidx + 1}`;
                                                                        return (
                                                                            <div 
                                                                                key={pidx}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setSelectedPlace({ title: day.title, image: photoUrl, description: day.description });
                                                                                }}
                                                                                className="w-[160px] md:w-[220px] flex-shrink-0 group cursor-pointer space-y-4"
                                                                            >
                                                                                <div className="aspect-square rounded-[2rem] md:rounded-[3rem] overflow-hidden border-4 border-white shadow-xl shadow-slate-200/50 group-hover:scale-95 transition-all duration-500">
                                                                                    <img src={normalizeImageUrl(photoUrl)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={captionText} />
                                                                                </div>
                                                                                <p className="text-[10px] md:text-xs font-bold text-slate-800 capitalize tracking-tighter truncate px-2 text-center">
                                                                                    {captionText}
                                                                                </p>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. STAY DETAILS */}
                        <div className="pt-12 space-y-10">
                            <div className="flex items-center justify-between">
                                <div className="relative">
                                    <p className="font-handwritten text-[#FF5400] text-3xl md:text-4xl mb-[-12px] ml-[-10px]">Stay</p>
                                    <h3 className="text-3xl md:text-5xl font-bold text-[#4B5563] tracking-tighter capitalize">Details</h3>
                                </div>
                                <div className="flex p-1.5 bg-slate-100 rounded-full">
                                    <button 
                                        onClick={() => setSelectedTier('standard')}
                                        className={`px-8 py-2.5 rounded-full text-[10px] font-bold capitalize tracking-widest transition-all ${
                                            selectedTier === 'standard' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'
                                        }`}
                                    >
                                        Standard
                                    </button>
                                    <button 
                                        onClick={() => setSelectedTier('premium')}
                                        className={`px-8 py-2.5 rounded-full text-[10px] font-bold capitalize tracking-widest transition-all flex items-center gap-2 ${
                                            selectedTier === 'premium' ? 'bg-[#FF5400] text-white shadow-lg' : 'text-slate-400'
                                        }`}
                                    >
                                        Premium {selectedTier === 'premium' && <CheckCircle2 size={14} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {(selectedTier === 'premium' ? q.highLevelHotels : q.lowLevelHotels)?.map((hotel, i) => (
                                    <div key={i} className="bg-white rounded-[2.5rem] border-2 border-slate-50 hover:border-[#FF5400]/20 transition-all overflow-hidden flex flex-col md:flex-row group/hotel shadow-sm">
                                        <div className="md:w-1/3 aspect-video md:aspect-auto relative overflow-hidden">
                                            <img src={normalizeImageUrl(hotel.image)} className="w-full h-full object-cover group-hover/hotel:scale-105 transition-transform duration-700" alt="" />
                                            <button 
                                                onClick={() => setSelectedHotelForGallery(hotel)}
                                                className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md border border-white/40 text-white px-4 py-2 rounded-xl text-[10px] font-bold capitalize tracking-widest flex items-center gap-2 hover:bg-white hover:text-black transition-all"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                                                Gallery
                                            </button>
                                        </div>
                                        <div className="flex-1 p-8 md:p-10 space-y-6">
                                            <div className="space-y-2">
                                                <span className="bg-slate-100 text-slate-500 px-4 py-1 rounded-full text-[10px] font-bold capitalize tracking-widest">
                                                    1 Night in {hotel.location || "Port Blair"}
                                                </span>
                                                <h4 className="text-2xl font-bold text-slate-800 tracking-tight">{hotel.name}</h4>
                                                <div className="flex items-center gap-1">
                                                    {[...Array(hotel.stars || 4)].map((_, i) => (
                                                        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#FF5400"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                                    ))}
                                                    <span className="text-[10px] font-bold text-slate-400 capitalize tracking-widest ml-2">{hotel.stars || 4} Star Resort</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="flex items-center gap-3 text-slate-500">
                                                    <HotelIcon size={18} className="text-slate-300" />
                                                    <span className="text-xs font-bold capitalize tracking-wide">Superior Room</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-slate-500">
                                                    <Utensils size={18} className="text-slate-300" />
                                                    <span className="text-xs font-bold capitalize tracking-wide">Breakfast</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. PLACES & ACTIVITIES */}
                        <div className="pt-12 space-y-8 md:space-y-10">
                            <div className="relative inline-flex flex-col">
                                <p className="font-handwritten text-[#FF5400] text-3xl md:text-5xl mb-[-10px] md:mb-[-15px] ml-[-5px] md:ml-[-10px] relative z-10">Places &</p>
                                <h3 className="text-3xl md:text-6xl font-bold text-[#4B5563] tracking-tighter capitalize relative z-10">Activities</h3>
                                <div className="absolute -bottom-2 md:-bottom-4 left-0 w-full h-4">
                                    <svg width="100%" height="20" viewBox="0 0 200 20" fill="none" preserveAspectRatio="none">
                                        <path d="M5 15C50 5 150 5 195 15" stroke="#FF5400" strokeWidth="3" strokeLinecap="round" />
                                    </svg>
                                </div>
                            </div>

                            <div className="pt-2 md:pt-6 flex items-center justify-between">
                                <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-8 py-2 md:py-3 bg-white text-slate-900 rounded-full border-2 border-[#FF5400] font-bold text-[10px] md:text-sm shadow-sm">
                                    <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-[#FF5400] flex items-center justify-center text-white">
                                        <CheckCircle2 size={10} className="md:w-[14px] md:h-[14px]" />
                                    </div>
                                    {q.sightseeingCount || 9} Sightseeing Places
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="hidden md:flex items-center gap-2 text-slate-400 font-bold text-[10px] capitalize tracking-widest">
                                        Slide to explore <ArrowRight size={14} className="ml-1" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => scrollExplore('left')}
                                            className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-[#FF5400] hover:text-white transition-all shadow-sm active:scale-95 shrink-0"
                                            title="Scroll Left"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <button 
                                            onClick={() => scrollExplore('right')}
                                            className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-[#FF5400] hover:text-white transition-all shadow-sm active:scale-95 shrink-0"
                                            title="Scroll Right"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div ref={exploreContainerRef} className="flex overflow-x-auto no-scrollbar gap-4 md:gap-8 pb-8 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth snap-x">
                                {(q.experiencePhotos || []).map((photo: any, i: number) => {
                                    const url = typeof photo === 'string' ? photo : photo.url;
                                    const name = typeof photo === 'string' ? `Experience ${i+1}` : (photo.name || `Experience ${i+1}`);
                                    
                                    return (
                                        <div 
                                            key={i} 
                                            className="relative min-w-[280px] md:min-w-[400px] aspect-[10/16] rounded-[2.5rem] md:rounded-[4rem] overflow-hidden group shadow-2xl shadow-slate-200 snap-center"
                                        >
                                            <img src={normalizeImageUrl(url)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
                                            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-transparent p-6 md:p-12">
                                                <p className="text-white font-bold text-2xl md:text-4xl tracking-tighter leading-tight capitalize">
                                                    {name} <br/> 
                                                    <span className="opacity-60 text-[10px] md:text-sm font-bold capitalize tracking-[0.3em] block mt-2">
                                                        Activity {i + 1}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>


                        {/* 3.1 PREMIUM PRICING BAR (Matching Screenshot) */}
                        <div className="mt-12 bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-slate-100 hidden md:block">
                            {/* Top Banner: Discount info */}
                            <div className="bg-gradient-to-r from-[#FFF7ED] to-[#FFF7ED] px-4 md:px-8 py-3 md:py-4 flex items-center justify-between relative">
                                <div className="flex items-center gap-2 md:gap-3 text-orange-900 font-bold text-[10px] md:text-sm">
                                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#FF5400] flex items-center justify-center text-white">
                                        <CheckCircle2 size={12} className="md:w-3.5 md:h-3.5" />
                                    </div>
                                    Save ₹ {(q.discount || 6300).toLocaleString()}
                                </div>
                                <div className="flex items-center gap-2 text-orange-700 font-bold text-[10px] md:text-sm capitalize tracking-wider">
                                    <Sparkles size={16} className="text-orange-700" />
                                    Special Discount
                                </div>
                                {/* Scalloped/Wavy Divider at bottom of banner */}
                                <div className="absolute -bottom-1 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDIwIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgOEM1IDggNSAwIDIwIDhWMEgwVjhaIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==')] bg-repeat-x z-10" />
                            </div>

                            {/* Bottom Part: Price and Button */}
                            <div className="p-6 md:p-8 flex items-center justify-between bg-white relative">
                                <div className="space-y-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl md:text-4xl font-bold text-slate-900 tracking-tighter">
                                            ₹ {((selectedTier === 'premium' ? (q.highLevelPrice || 47800) : (q.lowLevelPrice || 32800)) - (q.discount || 0)).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] md:text-sm">
                                        <span className="line-through">₹ {(selectedTier === 'premium' ? (q.highLevelPrice || 47800) : (q.lowLevelPrice || 32800)).toLocaleString()}</span>
                                        <span>Per Person</span>
                                        <span className="text-slate-900">+Taxes</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. TRIP INCLUSIONS */}
                        <div className="pt-12 space-y-10">
                            <div className="relative">
                                <p className="font-handwritten text-[#FF5400] text-3xl md:text-4xl mb-[-12px] ml-[-10px]">Trip</p>
                                <h3 className="text-3xl md:text-5xl font-bold text-[#4B5563] tracking-tighter capitalize">Inclusions</h3>
                            </div>
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 space-y-10 shadow-sm">
                                <h4 className="text-sm font-bold text-slate-800 capitalize tracking-widest">What&apos;s inside the package?</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <p className="text-[10px] font-bold text-slate-400 capitalize tracking-[0.2em] mb-4">Inclusions</p>
                                        <div className="space-y-3">
                                            {(q.inclusions || ["Stay in Hotel/Resort as per Package", "Daily Breakfast at Property", "Airport Pickup and Drop-off", "AC Taxi Vehicle for Sightseeing"]).map((inc, i) => (
                                                <div key={i} className="flex items-center gap-3 text-xs font-bold text-slate-600">
                                                    <CheckCircle2 size={16} className="text-orange-500" /> {inc}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <p className="text-[10px] font-bold text-slate-400 capitalize tracking-[0.2em] mb-4">Exclusions</p>
                                        <div className="space-y-3">
                                            {(q.exclusions || ["5% GST", "Surcharge of Peak Season", "Any Paid Activities", "Entry Fees of Any"]).map((exc, i) => (
                                                <div key={i} className="flex items-center gap-3 text-xs font-bold text-slate-600">
                                                    <div className="w-4 h-4 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                                    </div>
                                                    {exc}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 5. DESTINATION EXPERT */}
                        <div className="pt-12 space-y-10">
                            <div className="relative">
                                <p className="font-handwritten text-[#FF5400] text-3xl md:text-4xl mb-[-12px] ml-[-10px]">Know Your</p>
                                <h3 className="text-3xl md:text-5xl font-bold text-[#4B5563] tracking-tighter capitalize">Destination Expert</h3>
                            </div>
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 flex flex-col md:flex-row items-center gap-10 shadow-sm relative overflow-hidden">
                                <div className="absolute top-8 right-10">
                                    <svg width="60" height="60" viewBox="0 0 24 24" fill="#FF5400" className="opacity-10">
                                        <path d="M21 5l-8 4-8-4 8 8 8-8zM3 10l9 9 9-9" />
                                    </svg>
                                </div>
                                <img src={normalizeImageUrl(q.expert?.photo) || "https://i.pravatar.cc/150?u=suresh"} className="w-40 h-40 rounded-3xl object-cover ring-8 ring-slate-50 shadow-xl" />
                                <div className="flex-1 space-y-4">
                                    <h4 className="text-xl font-bold text-slate-800 capitalize tracking-widest">{q.expert?.name || "Suresh Chaudhary"}</h4>
                                    <p className="text-xs font-bold text-[#FF5400] capitalize tracking-[0.3em]">Destination Expert</p>
                                    <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-xl">
                                        Experience the true essence of each destination as I uncover its hidden treasures. With my passion for travel and service, I&apos;ll create a tailor-made itinerary that reflects your travel dreams.
                                    </p>
                                    <div className="flex flex-wrap gap-4 pt-4">
                                        <a href={`https://wa.me/${q.expert?.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${q.expert?.name}, I've reviewed the quotation for ${q.tripTitle}. I'd like to discuss further.`)}`} target="_blank" className="flex-1 min-w-[140px]">
                                            <Button variant="outline" className="w-full rounded-xl h-12 px-8 border-slate-200 text-slate-600 font-bold text-xs gap-3">
                                                <MessageCircle size={18} className="text-[#25D366]" /> Whatsapp
                                            </Button>
                                        </a>
                                        <a href={`tel:${q.expert?.phone || q.expert?.whatsapp}`} className="flex-1 min-w-[140px]">
                                            <Button variant="outline" className="w-full rounded-xl h-12 px-8 border-slate-200 text-slate-600 font-bold text-xs gap-3">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                                                Call Now
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 6. WHY CHOOSE YOUTHCAMPING */}
                        <div className="pt-12 space-y-12">
                            <div className="relative">
                                <p className="font-handwritten text-[#FF5400] text-3xl md:text-4xl mb-[-12px] ml-[-10px]">Why</p>
                                <h3 className="text-3xl md:text-5xl font-bold text-[#4B5563] tracking-tighter capitalize">Choose YOUTHCAMPING?</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                {[
                                    { t: 'Best Experiences', d: 'We work with local experts to create high-quality, customized adventures.', icon: '⭐' },
                                    { t: 'Happy Travellers', d: 'Our travellers trust us for exceptional experiences. Check out their reviews.', icon: '😊' },
                                    { t: 'Personalized Trips', d: 'Your trip is designed to match your unique interests and preferences.', icon: '💖' },
                                    { t: '24/7 Support', d: 'Our team is always here to help, ensuring a smooth journey every step.', icon: '🎧' }
                                ].map((item: any, i: number) => (
                                    <div key={i} className="space-y-4">
                                        <div className="text-3xl">{item.icon}</div>
                                        <h5 className="font-bold text-slate-800 capitalize text-xs tracking-widest">{item.t}</h5>
                                        <p className="text-[10px] font-medium text-slate-400 leading-relaxed capitalize tracking-tight">{item.d}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 7. TRAVELLER REVIEWS */}
                        <div className="pt-12 space-y-10 pb-20">
                            <div className="relative">
                                <p className="font-handwritten text-[#FF5400] text-3xl md:text-4xl mb-[-12px] ml-[-10px]">Traveller</p>
                                <h3 className="text-3xl md:text-5xl font-bold text-[#4B5563] tracking-tighter capitalize">Reviews</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {(q.reviews?.length ? q.reviews : [
                                    { name: "Umang Rabadiya", rating: 5, comment: "Excellent service! The trip was planned perfectly. Every detail was taken care of. Highly recommend!" },
                                    { name: "Sagar Patel", rating: 5, comment: "The luxury hotels were amazing. Great experience with YOUTHCAMPING team." }
                                ]).map((rev, i) => (
                                    <div key={i} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 capitalize">
                                                {rev.name?.charAt(0) || "U"}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 capitalize tracking-tight">{rev.name}</p>
                                                <div className="flex gap-0.5 mt-0.5">
                                                    {[...Array(rev.rating || 5)].map((_, j) => <svg key={j} width="10" height="10" viewBox="0 0 24 24" fill="#EAB308"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs font-medium text-slate-500 leading-relaxed italic">
                                            &quot;{rev.comment}&quot;
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Sticky Sidebar (Matching Screenshot 3) */}
                    <div className="lg:col-span-4 sticky top-24 space-y-6">
                        
                        {/* 1. Pricing Card */}
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                            {/* Scalloped Banner */}
                            <div className="relative bg-gradient-to-r from-[#FFF7ED] to-[#FFF7ED] px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[#FF5400]">
                                    <Sparkles size={16} />
                                    <span className="text-[10px] font-bold capitalize tracking-widest">Special Discount</span>
                                </div>
                                <div className="flex items-center gap-2 text-[#FF5400]">
                                    <CheckCircle2 size={16} />
                                    <span className="text-[10px] font-bold capitalize tracking-widest">Save ₹ {q.discount?.toLocaleString() || "6,300"}</span>
                                </div>
                                <div className="absolute -bottom-1 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDIwIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgOEM1IDggNSAwIDIwIDhWMEgwVjhaIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==')] bg-repeat-x" />
                            </div>

                            <div className="p-8 pt-10 space-y-8">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2 text-slate-800 font-bold">
                                        Per Person <ChevronDown size={16} />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-4xl font-bold text-[#FF5400]">
                                            ₹ {((selectedTier === 'premium' ? (q.highLevelPrice || 47800) : (q.lowLevelPrice || 32800)) - (q.discount || 0)).toLocaleString()}
                                        </p>
                                        <p className="text-sm font-bold text-slate-300 line-through">
                                            ₹ {(selectedTier === 'premium' ? (q.highLevelPrice || 47800) : (q.lowLevelPrice || 32800)).toLocaleString()}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 capitalize">+ Taxes</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-300 capitalize mb-1">Your Choice</p>
                                            <div className="flex items-center gap-2 text-[#06B6D4] font-bold capitalize text-sm">
                                                <HotelIcon size={16} /> {selectedTier === 'premium' ? 'Premium' : 'Standard'}
                                            </div>
                                        </div>
                                        <button className="text-[10px] font-bold text-slate-400 capitalize underline decoration-2 underline-offset-4">View More</button>
                                    </div>
                                    <div className="h-px bg-slate-100" />
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 capitalize">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-slate-300" /> {getDayDate(q.travelDates?.from, 0) || "18 Mar 2026"}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users size={16} className="text-slate-300" /> {q.paxCount || "2"} Adults
                                        </div>
                                    </div>
                                </div>

                                {/* Booking / Expired Button */}
                                {timeLeft === "EXPIRED" ? (
                                    <div className="w-full bg-[#FFF7ED] border-2 border-[#FED7AA] rounded-2xl p-4 flex flex-col items-center gap-2 text-center">
                                        <div className="w-12 h-12 rounded-full bg-[#FF5400] flex items-center justify-center text-white">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 9v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                        </div>
                                        <p className="text-[10px] font-bold text-[#C2410C] capitalize leading-tight">
                                            This Quotation Is Expired<br/>
                                            <span className="opacity-70">Please Request A New One!</span>
                                        </p>
                                    </div>
                                ) : (
                                    <Button 
                                        onClick={handleWhatsAppBooking}
                                        className="w-full h-16 rounded-2xl bg-[#FF5400] hover:bg-[#FF5400]/90 text-white font-bold capitalize text-xs tracking-widest shadow-xl shadow-orange-100"
                                    >
                                        Book This Experience <ArrowRight size={18} className="ml-2" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* 2. Expert Card */}
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl shadow-slate-200/50 p-8 space-y-6 relative overflow-hidden">
                            <div className="absolute top-6 right-8">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="#FF5400">
                                    <path d="M21 5l-8 4-8-4 8 8 8-8zM3 10l9 9 9-9" />
                                </svg>
                            </div>
                            
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-slate-800">Hey, {q.customerName || "Hemal Patel"} !</h3>
                                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                    Connect with me if you got any questions regarding this package.
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <img src={normalizeImageUrl(q.expert?.photo) || "https://i.pravatar.cc/150?u=suresh"} className="w-16 h-16 rounded-full object-cover ring-4 ring-slate-50" />
                                <div>
                                    <p className="font-bold text-slate-800">{q.expert?.name || "Suresh Chaudhary"}</p>
                                    <p className="text-[10px] font-bold capitalize text-slate-400 tracking-widest">Destination Expert</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <a href={`https://wa.me/${q.expert?.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${q.expert?.name}, I've reviewed the quotation for ${q.tripTitle}. I'd like to discuss further.`)}`} target="_blank">
                                    <Button variant="outline" className="w-full rounded-xl h-12 border-slate-200 text-slate-600 font-bold text-xs gap-2">
                                        <MessageCircle size={16} className="text-[#25D366]" /> Whatsapp
                                    </Button>
                                </a>
                                <a href={`tel:${q.expert?.phone || q.expert?.whatsapp}`}>
                                    <Button variant="outline" className="w-full rounded-xl h-12 border-slate-200 text-slate-600 font-bold text-xs gap-2">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                                        Call Now
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. FOOTER CTA */}
            <footer className="bg-slate-900 text-white py-20 mt-20 relative overflow-hidden">
                <div className="container mx-auto px-4 text-center relative z-10">
                    <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tighter capitalize leading-none">
                        Ready for your <br /> <span className="text-[#FF5400] italic font-serif">Legendary Trip?</span>
                    </h2>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-12">
                        <Button 
                            onClick={handleWhatsAppBooking}
                            className="rounded-full px-12 h-16 gap-3 font-bold text-sm capitalize tracking-widest bg-[#FF5400] text-white hover:bg-[#FF5400]/90 shadow-2xl"
                        >
                            Confirm Booking <ArrowRight size={20} />
                        </Button>
                    </div>
                </div>
            </footer>

            {/* 4.1 FLOATING STICKY PRICING BAR (Matching Screenshot) */}
            <div className="fixed bottom-0 left-0 right-0 z-[50] p-4 md:hidden">
                <motion.div 
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="bg-white rounded-[2rem] overflow-hidden shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-100"
                >
                    {/* Top Banner */}
                    <div className="bg-gradient-to-r from-[#FFF7ED] to-[#FFF7ED] px-5 py-2 flex items-center justify-between relative">
                        <div className="flex items-center gap-2 text-orange-900 font-bold text-[10px]">
                            <div className="w-4 h-4 rounded-full bg-[#FF5400] flex items-center justify-center text-white">
                                <CheckCircle2 size={10} />
                            </div>
                            Save ₹ {(q.discount || 6300).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 text-orange-700 font-bold text-[10px] capitalize tracking-wider">
                            <Sparkles size={12} className="text-orange-700" />
                            Special Discount
                        </div>
                        <div className="absolute -bottom-1 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDIwIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgOEM1IDggNSAwIDEwIDBDMTUgMCAxNSA4IDIwIDhWMEgwVjhaIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==')] bg-repeat-x z-10" />
                    </div>

                    {/* Bottom Part */}
                    <div className="px-5 py-4 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <p className="text-2xl font-bold text-slate-900 tracking-tighter">
                                ₹ {((selectedTier === 'premium' ? (q.highLevelPrice || 47800) : (q.lowLevelPrice || 32800)) - (q.discount || 0)).toLocaleString()}
                            </p>
                            <div className="flex items-center gap-2 text-slate-400 font-bold text-[9px]">
                                <span className="line-through">₹ {(selectedTier === 'premium' ? (q.highLevelPrice || 47800) : (q.lowLevelPrice || 32800)).toLocaleString()}</span>
                                <span>Per Person</span>
                                <span className="text-slate-900">+Taxes</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* 5. PLACE DETAIL OVERLAY (Cinema Style) */}
            <AnimatePresence>
                {selectedPlace && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] bg-black overflow-y-auto no-scrollbar"
                    >
                        <div className="relative min-h-screen">
                            {/* Close Button */}
                            <button 
                                onClick={() => setSelectedPlace(null)}
                                className="fixed top-8 right-8 z-[1100] w-14 h-14 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-white hover:text-black transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            {/* Hero Section */}
                            <div className="h-[70vh] relative">
                                <img 
                                    src={normalizeImageUrl(selectedPlace.image)} 
                                    className="w-full h-full object-cover" 
                                    alt="" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black" />
                                <div className="absolute bottom-20 left-0 right-0 px-8 container mx-auto">
                                    <motion.div
                                        initial={{ y: 50, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <h2 className="text-6xl md:text-9xl font-bold text-white tracking-tighter leading-none capitalize">
                                            {selectedPlace.title}
                                        </h2>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="container mx-auto px-8 py-20 max-w-5xl">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                                    <div className="md:col-span-2 space-y-12">
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold capitalize tracking-[0.4em] text-white/40">The Experience</h4>
                                            <p className="text-2xl md:text-3xl text-white/80 leading-relaxed font-light">
                                                {selectedPlace.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-12">
                                        <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6">
                                            <h4 className="text-xs font-bold capitalize tracking-widest text-[#FF5400]">Key Highlights</h4>
                                            <ul className="space-y-4">
                                                {["Private Guided Tour", "Gourmet Lunch Included", "Premium Photo Op", "Entry Passes Pre-booked"].map((h, i) => (
                                                    <li key={i} className="flex items-center gap-3 text-white/70 text-sm font-bold">
                                                        <CheckCircle2 size={16} className="text-[#FF5400]" /> {h}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* 6. HOTEL GALLERY OVERLAY (Matching Screenshot 9) */}
            <AnimatePresence>
                {selectedHotelForGallery && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setSelectedHotelForGallery(null);
                            }}
                            className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-full md:w-[45%] z-[1200] bg-white shadow-2xl overflow-y-auto no-scrollbar"
                        >
                            <div className="p-8 md:p-12 space-y-10">
                                {/* Back Button */}
                                <button 
                                    onClick={() => setSelectedHotelForGallery(null)}
                                    className="flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors group"
                                >
                                    <ArrowRight size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                                    <span className="text-[10px] font-bold capitalize tracking-widest">Back to Proposal</span>
                                </button>

                                {/* Header */}
                                <div className="flex items-start justify-between gap-6">
                                    <div className="space-y-4 flex-1">
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight leading-tight">{selectedHotelForGallery.name}</h2>
                                                <span className="bg-[#FF5400] text-white px-3 py-1 rounded-lg text-[10px] font-bold capitalize tracking-widest shrink-0">
                                                    {selectedHotelForGallery.stars || 4} Star Resort
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-[#FF5400] capitalize tracking-widest">{selectedHotelForGallery.roomType || "Superior Room"}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedHotelForGallery(null)}
                                        className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all shadow-sm shrink-0"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>


                                {/* Image Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    {(selectedHotelForGallery.photos && selectedHotelForGallery.photos.length > 0 
                                        ? selectedHotelForGallery.photos 
                                        : [selectedHotelForGallery.image]
                                    ).map((pic: any, i: number) => (
                                        <div key={i} className="aspect-video rounded-3xl overflow-hidden shadow-sm">
                                            <img 
                                                src={normalizeImageUrl(pic)} 
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" 
                                                alt="" 
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}


