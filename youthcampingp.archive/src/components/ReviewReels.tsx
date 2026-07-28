"use client";

import { useState } from "react";
import { Play, Camera, X } from "lucide-react";
import { normalizeImageUrl } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface Reel {
  url: string;
  thumbnail: string;
  caption: string;
}

interface ReviewReelsProps {
  reels?: Reel[];
}

export default function ReviewReels({ reels = [] }: ReviewReelsProps) {
  const [activeReel, setActiveReel] = useState<Reel | null>(null);

  if (!reels || reels.length === 0) return null;

  return (
    <section className="overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <h2 className="text-2xl font-bold text-navy">Traveller Videos</h2>
        <div className="flex items-center gap-2 text-primary-orange font-bold text-[10px] capitalize tracking-widest">
           <Camera className="w-5 h-5" />
           Experience the Magic
        </div>
      </div>
      
      <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar snap-x">
        {reels.map((reel, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setActiveReel(reel)}
            className="min-w-[280px] md:min-w-[320px] aspect-[9/16] relative rounded-[32px] overflow-hidden shadow-xl hover:shadow-2xl snap-center group cursor-pointer"
          >
            <OptimizedImage 
              src={normalizeImageUrl(reel.thumbnail) || "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6"} 
              alt={reel.caption} className="object-cover group-hover:scale-110 transition-transform duration-[2000ms]" 
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/50 scale-75 group-hover:scale-100 transition-transform shadow-2xl">
                  <Play className="w-10 h-10 -white" />
               </div>
            </div>

            {/* Reel Info */}
            <div className="absolute bottom-10 left-8 right-8 text-white">
               <p className="text-lg font-bold leading-tight mb-2">{reel.caption}</p>
               <div className="w-8 h-1 bg-primary-orange rounded-full group-hover:w-full transition-all duration-500" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {activeReel && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-navy/95 backdrop-blur-xl"
          >
            <div className="absolute inset-0" onClick={() => setActiveReel(null)} />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-[450px] aspect-[9/16] bg-black rounded-[40px] overflow-hidden shadow-2xl"
            >
               {activeReel.url.includes('youtube.com') || activeReel.url.includes('youtu.be') ? (
                 <iframe 
                   src={`https://www.youtube.com/embed/${activeReel.url.split('v=')[1] || activeReel.url.split('/').pop()}?autoplay=1`}
                   className="w-full h-full"
                   allow="autoplay; encrypted-media"
                   allowFullScreen
                 />
               ) : (
                 <video 
                   src={activeReel.url} 
                   autoPlay 
                   controls 
                   className="w-full h-full object-cover"
                 />
               )}
               
               <button 
                 onClick={() => setActiveReel(null)}
                 className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-navy transition-all z-20"
               >
                 <X className="w-6 h-6" />
               </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

