"use client";

import React from "react";
import { Star, MapPin, Check, Wifi, Coffee, Waves, Car, Wind, ShieldCheck } from "lucide-react";
import { Hotel } from "@/types";
import { ImageSlider } from "./ImageSlider";
import { cn } from "@/lib/utils";

interface HotelCardProps {
    hotel: Hotel;
    className?: string;
    isRecommended?: boolean;
}

const AmenityIcon = ({ name }: { name: string }) => {
    const n = name.toLowerCase();
    if (n.includes('wifi')) return <Wifi size={14} />;
    if (n.includes('breakfast') || n.includes('meal')) return <Coffee size={14} />;
    if (n.includes('pool')) return <Waves size={14} />;
    if (n.includes('parking')) return <Car size={14} />;
    if (n.includes('ac') || n.includes('condition')) return <Wind size={14} />;
    return <Check size={14} />;
};

export const HotelCard = ({ hotel, className, isRecommended }: HotelCardProps) => {
    return (
        <div 
            className={cn(
                "group relative bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 flex flex-col md:flex-row h-full",
                className
            )}
        >
            {(isRecommended || hotel.isRecommended) && (
                <div className="absolute top-4 left-4 z-20 bg-primary px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-primary/20 border border-white/20">
                    <ShieldCheck size={12} className="text-white fill-white/20" />
                    <span className="text-[10px] font-bold text-white capitalize tracking-widest">Recommended</span>
                </div>
            )}

            <div className="w-full md:w-2/5 relative h-64 md:h-full min-h-[220px]">
                <ImageSlider 
                    images={hotel.photos || []} 
                    className="w-full h-full" 
                    autoplay={false}
                />
            </div>

            <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-0.5 text-amber-400">
                            {[...Array(5)].map((_, i) => (
                                <Star 
                                    key={i} 
                                    size={12} 
                                    fill={i < (hotel.rating || 5) ? "currentColor" : "none"} 
                                    className={i < (hotel.rating || 5) ? "" : "text-gray-200"}
                                />
                            ))}
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors leading-tight capitalize">
                            {hotel.name || 'Premium Accommodation'}
                        </h3>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[#6B7280]">
                            <MapPin size={14} className="text-primary" />
                            <span className="text-xs font-bold capitalize tracking-wide">{hotel.location || 'Luxury Location'}</span>
                        </div>
                        <div className="inline-block px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[#374151] text-[10px] font-bold capitalize tracking-widest">
                            {hotel.roomType || "Deluxe Room"}
                        </div>
                    </div>

                    <p className="text-sm text-[#4A4A4A] leading-relaxed line-clamp-2 md:line-clamp-3">
                        {hotel.description || 'Experience ultimate comfort and world-class hospitality at this hand-picked stay.'}
                    </p>
                </div>

                <div className="pt-4 border-t border-gray-50 flex items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-3">
                        {(hotel.amenities || ['Wifi', 'Breakfast', 'Pool', 'AC']).map((amenity, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[#6B7280]" title={amenity}>
                                <AmenityIcon name={amenity} />
                                <span className="text-[10px] font-bold capitalize tracking-tighter hidden sm:inline">{amenity}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
