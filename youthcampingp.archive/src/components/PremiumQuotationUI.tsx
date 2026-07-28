"use client";

import { Quotation, DayItinerary } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
    Users,
    Calendar,
    MapPin,
    CheckCircle2,
    XCircle,
    Star,
    Sparkles,
    Check,
    MessageCircle,
    Phone,
    Share2,
    Download,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    X,
    FileText,
    CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizeImageUrl } from "@/lib/api";
import { useTheme } from "@/components/DynamicThemeProvider";

export default function PremiumQuotationUI({ q }: { q: Quotation }) {
    const { settings } = useTheme();
    const [expandedDays, setExpandedDays] = useState<number[]>([0]);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 100);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const toggleDay = (index: number) => {
        setExpandedDays(prev => 
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const [timeLeft, setTimeLeft] = useState<string>("");
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        if (!q.expiresAt || (q as any).expired) return;

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const expiry = new Date(q.expiresAt!).getTime();
            const diff = expiry - now;

            if (diff <= 0) {
                clearInterval(timer);
                window.location.reload(); // Trigger expired view
                return;
            }

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            if (h < 24) {
                setIsUrgent(true);
                setTimeLeft(`${h}h ${m}m ${s}s`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [q.expiresAt]);

    const phone = settings?.contactPhone || "99242 46267";
    const whatsappNumber = phone.replace(/\D/g, '');

    const handleWhatsAppBooking = () => {
        const message = encodeURIComponent(`Hi! I've reviewed the premium quotation for "${q.tripTitle}". I'd like to confirm the booking for ${q.pax || 2} travellers starting from ${new Date(q.travelDates.from).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`);
        window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
    };

    if ((q as any).expired) {
        return (
            <div className="fixed inset-0 bg-white z-[999] flex flex-col items-center justify-center p-6 text-center">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md space-y-8"
                >
                    <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-rose-100">
                        <Clock size={40} />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-slate-900 capitalize tracking-tighter">Proposal Expired</h1>
                        <p className="text-slate-500 font-medium">This quotation for <span className="text-slate-900 font-bold">{q.tripTitle}</span> is no longer valid. Please contact your travel expert for an updated proposal.</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-4 text-left">
                        <img src={normalizeImageUrl(q.expert?.photo)} className="w-16 h-16 rounded-2xl object-cover shadow-md" />
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest leading-none mb-1">Your Expert</p>
                            <h4 className="text-lg font-bold text-slate-900 leading-tight">{q.expert?.name}</h4>
                        </div>
                    </div>
                    <a href={`https://wa.me/${q.expert?.whatsapp?.replace(/\D/g, '')}?text=Hi ${q.expert?.name}, my quote for ${q.tripTitle} has expired. Can you please refresh it?`} className="block">
                        <Button className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 rounded-2xl font-bold capitalize text-xs tracking-widest text-white shadow-xl shadow-emerald-100">
                            <MessageCircle size={18} className="mr-2" /> Request Refresh
                        </Button>
                    </a>
                </motion.div>
            </div>
        );
    }

    const whatsappLink = `https://wa.me/${q.expert?.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${q.expert?.name}, I've reviewed the quotation for ${q.tripTitle}. I'd like to discuss further.`)}`;

    return (
        <div className="bg-[#f8fafc] min-h-screen font-sans selection:bg-orange-100 selection:text-orange-900 pb-24">
            {/* Expiry Urgency Banner */}
            <AnimatePresence>
                {isUrgent && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="bg-orange-500 text-white py-3 text-center sticky top-0 z-[100] font-bold capitalize text-[10px] tracking-[0.2em] shadow-lg"
                    >
                        ⏳ Urgency: This quotation expires in {timeLeft}
                    </motion.div>
                )}
            </AnimatePresence>
            {/* 1. Hero Section */}
            <section className="relative h-[60vh] md:h-[65vh] w-full overflow-hidden">
                <div className="absolute inset-0">
                    <img 
                        src={normalizeImageUrl(q.coverImage) || "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070"} 
                        alt={q.tripTitle} 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                </div>
                
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-12 max-w-7xl mx-auto w-full">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500 text-white rounded-full text-[10px] font-bold capitalize tracking-widest shadow-lg"
                            >
                                <Users size={12} /> Prepared for {q.customerName}
                            </motion.div>
                            <motion.h1 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-3xl md:text-6xl font-bold text-white leading-tight capitalize tracking-tighter"
                            >
                                {q.tripTitle}
                            </motion.h1>
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex flex-wrap items-center gap-6 text-white/80 font-bold"
                            >
                                <div className="flex items-center gap-2">
                                    <Clock size={18} className="text-orange-400" /> {q.duration}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={18} className="text-orange-400" /> 
                                    {new Date(q.travelDates.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(q.travelDates.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={18} className="text-orange-400" /> {q.destination}
                                </div>
                            </motion.div>
                        </div>

                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl text-left md:text-right md:min-w-[200px]"
                        >
                            <p className="text-[10px] font-bold text-white/60 capitalize tracking-widest mb-1">Final Price</p>
                            <p className="text-4xl font-bold text-white">₹ {q.finalPrice?.toLocaleString()}</p>
                            {q.discount > 0 && (
                                <p className="text-xs font-bold text-orange-400 line-through opacity-80">₹ {q.totalPrice?.toLocaleString()}</p>
                            )}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 2. Content Area */}
            <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
                
                {/* Left Column: Sections */}
                <div className="lg:col-span-8 space-y-12">
                    
                    {/* Overview Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-[2rem] p-6 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100"
                    >
                        <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                            <div className="w-1.5 h-6 md:h-8 bg-orange-500 rounded-full" />
                            Overview
                        </h2>
                        <p className="text-slate-600 text-base md:text-lg leading-relaxed font-medium">
                            {q.overview || "Embark on an unforgettable journey curated just for you. Experience the perfect blend of luxury, comfort, and exploration as we take you through the hidden gems and iconic landmarks of your destination."}
                        </p>
                    </motion.div>

                    {/* Itinerary Card */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900 px-4 flex items-center gap-3">
                            <div className="w-1.5 h-8 bg-orange-500 rounded-full" />
                            Planned Itinerary
                        </h2>
                        <div className="space-y-4">
                            {q.itinerary?.map((day, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    key={i} 
                                    className="bg-white rounded-[1.5rem] overflow-hidden border border-slate-100 shadow-sm"
                                >
                                    <button 
                                        onClick={() => toggleDay(i)}
                                        className="w-full flex items-center justify-between p-4 md:p-6 hover:bg-slate-50/50 transition-all text-left"
                                    >
                                        <div className="flex items-center gap-4 md:gap-6">
                                            <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 text-white rounded-xl md:rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-lg text-sm md:text-base">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest leading-none mb-1">Day {i + 1}</p>
                                                <h3 className="text-base md:text-lg font-bold text-slate-800 leading-tight">{day.title}</h3>
                                            </div>
                                        </div>
                                        <ChevronDown className={`text-slate-400 transition-transform duration-300 ${expandedDays.includes(i) ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    <AnimatePresence>
                                        {expandedDays.includes(i) && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-6 pb-6 pt-2 ml-14 md:px-8 md:pb-8 md:ml-[4.5rem] border-l-2 border-slate-50">
                                                    <p className="text-slate-600 text-sm md:text-base leading-relaxed font-medium mb-6">
                                                        {day.description}
                                                    </p>
                                                    {day.photos && day.photos.length > 0 && (
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                                                             {day.photos.map((photo, pIdx) => {
                                                                const photoUrl = photo.split("|")[0];
                                                                return (
                                                                    <div key={pIdx} className="aspect-video rounded-xl md:rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                                                                        <img src={normalizeImageUrl(photoUrl)} className="w-full h-full object-cover" />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Inclusions & Exclusions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-xl shadow-slate-200/50"
                        >
                            <h3 className="text-base md:text-lg font-bold text-emerald-600 capitalize tracking-widest flex items-center gap-3 mb-6 md:mb-8">
                                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> Inclusions
                            </h3>
                            <ul className="space-y-4">
                                {q.inclusions?.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-600 font-bold text-sm">
                                        <div className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                            <Check size={12} />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-xl shadow-slate-200/50"
                        >
                            <h3 className="text-base md:text-lg font-bold text-rose-500 capitalize tracking-widest flex items-center gap-3 mb-6 md:mb-8">
                                <XCircle className="w-5 h-5 md:w-6 md:h-6" /> Exclusions
                            </h3>
                            <ul className="space-y-4">
                                {q.exclusions?.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-500 font-bold text-sm">
                                        <div className="w-5 h-5 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                            <X size={12} />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </div>

                {/* Right Column: Expert & CTA */}
                <div className="lg:col-span-4">
                    <div className="sticky top-24 space-y-8">
                        
                        {/* Pricing Breakdown Card */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white shadow-2xl shadow-slate-900/40 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-orange-500 rounded-bl-[4rem] md:rounded-bl-[5rem] -mr-8 -mt-8 md:-mr-10 md:-mt-10 opacity-20" />
                            
                            <div className="relative z-10 space-y-8">
                                <div>
                                    <p className="text-[10px] font-bold text-orange-400 capitalize tracking-[0.2em] mb-2">Package Investment</p>
                                    <h3 className="text-4xl md:text-5xl font-bold">₹ {q.finalPrice?.toLocaleString()}</h3>
                                    {q.discount > 0 && (
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-sm font-bold text-slate-400 line-through">₹ {q.totalPrice?.toLocaleString()}</span>
                                            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">Save ₹ {q.discount?.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                                        <span className="text-xs font-bold text-slate-400">Travelers</span>
                                        <span className="text-sm font-bold">{q.pax} Persons</span>
                                    </div>
                                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                                        <span className="text-xs font-bold text-slate-400">Duration</span>
                                        <span className="text-sm font-bold">{q.duration}</span>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <Button 
                                        onClick={handleWhatsAppBooking}
                                        className="w-full h-14 bg-orange-500 hover:bg-orange-600 rounded-2xl font-bold capitalize text-xs tracking-widest transition-all text-white"
                                    >
                                        Pay Advance Now
                                    </Button>
                                    <Button variant="outline" className="w-full h-14 border-white/10 hover:bg-white/5 rounded-2xl font-bold capitalize text-xs tracking-widest transition-all text-white">
                                        <Download size={16} className="mr-2" /> Download PDF
                                    </Button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Expert Contact */}
                        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
                            <h4 className="text-sm font-bold text-slate-400 capitalize tracking-widest text-center border-b pb-4 mb-4">Your Travel Expert</h4>
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-slate-50 shadow-lg">
                                    <img src={normalizeImageUrl(q.expert?.photo) || "https://images.unsplash.com/photo-1560250097-0b93528c311a"} alt={q.expert?.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h5 className="text-xl font-bold text-slate-900">{q.expert?.name || "Suresh Chaudhary"}</h5>
                                    <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest">{q.expert?.designation || "Destination Expert"}</p>
                                </div>
                                <div className="w-full grid grid-cols-2 gap-4 pt-4">
                                    <a href={whatsappLink} target="_blank" className="bg-emerald-500 text-white p-4 rounded-2xl flex flex-col items-center gap-2 hover:scale-[1.02] transition-transform">
                                        <MessageCircle size={20} />
                                        <span className="text-[10px] font-bold capitalize tracking-widest">WhatsApp</span>
                                    </a>
                                    <a href={`tel:${q.expert?.whatsapp}`} className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col items-center gap-2 hover:scale-[1.02] transition-transform">
                                        <Phone size={20} />
                                        <span className="text-[10px] font-bold capitalize tracking-widest">Call Now</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* 3. Sticky Bottom CTA (Mobile Only) */}
            <motion.div 
                initial={{ y: 100 }}
                animate={{ y: isScrolled ? 0 : 0 }}
                className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 p-4 z-50 lg:hidden flex gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]"
            >
                <a href={whatsappLink} target="_blank" className="flex-1">
                    <Button variant="outline" className="w-full h-12 rounded-xl border-emerald-100 text-emerald-600 font-bold capitalize text-[10px] tracking-widest">
                        <MessageCircle size={16} className="mr-2" /> WhatsApp
                    </Button>
                </a>
                <Button 
                    onClick={handleWhatsAppBooking}
                    className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 rounded-xl font-bold capitalize text-[10px] tracking-widest text-white"
                >
                    Book Now
                </Button>
            </motion.div>
        </div>
    );
}
