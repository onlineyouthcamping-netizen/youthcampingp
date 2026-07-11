"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { normalizeImageUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

interface VideoItem {
  id?: string;
  title: string;
  videoEnabled?: boolean;
  videoUrl?: string;
  videoPosterUrl?: string;
}

interface VideoSectionProps {
  title?: string;
  subtitle?: string;
  videos?: VideoItem[];
  topColor?: string;
  bottomColor?: string;
}

const VIDEOS: VideoItem[] = [
  { 
    id: "j6hb-iOZalE", 
    title: "Spiti Valley - A Cinematic Journey", 
  },
  { 
    id: "8XJ9kU4WJTo", 
    title: "Winter Spiti in 4K", 
  },
  { 
    id: "X2X5nC5yC6w", 
    title: "What to Carry for Spiti Expedition", 
  },
  { 
    id: "r7PzL7H8T8A", 
    title: "Culture and People of Spiti", 
  },
];

export default function VideoSection({ 
  title = "Videos", 
  subtitle = "Exclusive footage from our expeditions",
  videos,
  topColor = "#ffffff",
  bottomColor = "#f3f4f6"
}: VideoSectionProps) {
  const activeVideos = (videos && videos.length > 0) ? videos : VIDEOS;
  const [activeVideo, setActiveVideo] = useState<{ url: string; poster?: string } | null>(null);

  return (
    <>
      <section 
        className="pt-2 pb-6 md:pt-4 md:pb-8 overflow-hidden relative"
        style={{
          background: `linear-gradient(to bottom, #ffffff 0%, #ffffff 50%, #D4D6D9 50%, #D4D6D9 100%)`
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          {(title || subtitle) && (
            <div className="mb-6">
              {title && <h2 className="text-3xl font-bold text-navy capitalize tracking-tighter">{title}</h2>}
              {subtitle && <p className="text-zinc-600 font-bold mt-2 tracking-widest text-[10px] capitalize">{subtitle}</p>}
            </div>
          )}

          <div className="relative group">
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 no-scrollbar">
              {activeVideos.map((video, i) => {
                const hasSelfHosted = video.videoEnabled && video.videoUrl;
                const posterImg = video.videoPosterUrl || (video.id ? `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg` : "");
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    onClick={() => {
                      if (hasSelfHosted && video.videoUrl) {
                        setActiveVideo({ url: video.videoUrl, poster: video.videoPosterUrl });
                      }
                    }}
                    className={cn(
                      "flex-shrink-0 transition-transform",
                      activeVideos.length > 1 ? "w-[80vw] max-w-[340px] md:w-[400px]" : "w-full",
                      hasSelfHosted ? "cursor-pointer group/video active:scale-[0.98]" : "cursor-default pointer-events-none"
                    )}
                  >
                    <div className="relative aspect-[16/8.5] md:aspect-[21/9] rounded-[20px] md:rounded-[32px] overflow-hidden mb-4 shadow-[0_12px_24px_rgba(0,0,0,0.12)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.18)] hover:-translate-y-1.5 transition-all duration-500 border-0">
                      {posterImg && (
                        <OptimizedImage 
                          src={posterImg}
                          alt={video.title} 
                          className="object-cover transition-transform duration-700 scale-[1.02] group-hover/video:scale-110"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover/video:bg-black/10 transition-colors" />
                      
                      {/* Play Button */}
                      {hasSelfHosted && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-10 md:w-16 md:h-12 bg-[#FF0000] rounded-xl flex items-center justify-center text-white transition-transform duration-300 group-hover/video:scale-110 shadow-2xl">
                             <Play className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                          </div>
                        </div>
                      )}

                      {/* Title Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-black/60 to-transparent">
                         <p className="text-[11px] md:text-xs font-bold text-white line-clamp-1">{video.title}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Video Player Modal */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-20"
            onClick={() => setActiveVideo(null)}
          >
            <button 
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 md:top-8 md:right-8 text-white/50 hover:text-white transition-colors z-10 p-2"
            >
              <X className="w-8 h-8 md:w-10 md:h-10" />
            </button>
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl aspect-video bg-black rounded-2xl md:rounded-[40px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
            >
              <video
                src={normalizeImageUrl(activeVideo.url)}
                controls
                autoPlay
                playsInline
                loop
                muted
                preload="metadata"
                poster={activeVideo.poster ? normalizeImageUrl(activeVideo.poster) : undefined}
                className="w-full h-full border-0 outline-none focus:outline-none"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
