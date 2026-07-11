"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { normalizeImageUrl } from "@/lib/api";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { cn } from "@/lib/utils";
import { WavyEdges } from "./ui/WavyEdges";
import { useIsMobile } from "@/hooks/useIsMobile";

interface BlogItem {
  title: string;
  author: string;
  authorImage?: string;
  readTime: string;
  image: string;
  status: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  hasVideo?: boolean;
  createdAt?: string;
}

interface BlogSectionProps {
  blogs?: BlogItem[];
  title?: string;
  subtitle?: string;
  titleSize?: string | number;
  titleWeight?: string | number;
  topLabel?: string;
  titleStyle?: 'standard' | 'boxed';
  wavyEdges?: boolean;
  topColor?: string;
  bottomColor?: string;
}

const defaultBlogs: BlogItem[] = [
  {
    title: "The Pristine Colors of Kasol: Riverside Cafes & Parvati Valley Trails",
    author: "Siddharth",
    readTime: "5 MIN READ",
    image: "https://images.unsplash.com/photo-1597037750734-450f6f406560?auto=format&fit=crop&w=800&q=80",
    status: "published",
    slug: "pristine-colors-of-kasol-riverside-cafes-parvati-valley-trails",
    excerpt: "From the serene banks of the Parvati River to the hidden high-altitude trails..."
  },
  {
    title: "Spiti Valley in Winter: Surviving & Thriving at -20°C",
    author: "Karan Johar",
    readTime: "12 MIN READ",
    image: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80",
    status: "published",
    slug: "spiti-valley-in-winter-surviving-thriving-at-20c",
    excerpt: "The quietude of Spiti in winter is deafening. With frozen waterfalls and snow-covered monasteries..."
  },
  {
    title: "Walking the Frozen Zanskar River: The Ultimate Chadar Trek Guide",
    author: "Aman Sharma",
    readTime: "8 MIN READ",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
    status: "published",
    slug: "walking-the-frozen-zanskar-river-the-ultimate-chadar-trek-guide",
    excerpt: "The Chadar Trek is not just a journey; it is a pilgrimage through ice located in Ladakh..."
  }
];

export default function BlogSection({ 
  blogs = [],
  title = "Watch & Read",
  subtitle,
  titleSize,
  titleWeight,
  topLabel,
  titleStyle = 'standard',
  wavyEdges = false,
  topColor = "#ffffff",
  bottomColor = "#ffffff",
}: BlogSectionProps) {
  const displayBlogs = (blogs && blogs.length > 0) ? blogs : defaultBlogs;
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const reduceMotion = prefersReducedMotion || isMobile;

  const scrollRight = () => {
    const el = document.getElementById('blog-slider-container');
    if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
  };

  return (
    <section className="section-wrapper bg-white overflow-hidden relative max-md:!px-0">
      {wavyEdges && <WavyEdges color={topColor} position="top" />}
      <div className="max-w-[1440px] mx-auto relative max-md:px-0 px-4 md:px-0">
        <div className="flex flex-col mb-8 px-4 md:px-0">
          {topLabel && (
            <span className="section-label">
              {topLabel}
            </span>
          )}
          <div className={cn(
            titleStyle === 'boxed' && "p-6 md:px-10 md:py-8 rounded-[20px] md:rounded-[32px] border border-slate-200 bg-white shadow-sm max-w-fit"
          )}>
            <h2 
              className="section-heading text-[#082B5B] !font-extrabold capitalize"
              style={{ 
                fontSize: titleSize ? (isNaN(Number(titleSize)) ? titleSize : `${titleSize}px`) : undefined
              }}
            >
              {title || "New Journal"}
            </h2>
          </div>
        </div>

        <div className="relative group">
          <div 
            id="blog-slider-container"
            className="flex gap-4 md:gap-[28px] overflow-x-auto no-scrollbar pb-6 snap-x scroll-smooth px-4 md:px-0 scroll-pl-4 md:scroll-pl-0"
          >
            {displayBlogs.map((art, i) => (
              <BlogCard key={art.slug || i} art={art} i={i} reduceMotion={reduceMotion} />
            ))}
          </div>

          {/* Floating Next Button */}
          {displayBlogs.length > 0 && (
            <button 
              onClick={scrollRight}
              className="absolute -right-4 top-[40%] -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center text-navy hover:scale-110 transition-all z-10 opacity-0 group-hover:opacity-100"
              aria-label="Scroll Right"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
      {wavyEdges && <WavyEdges color={bottomColor} position="bottom" />}
    </section>
  );
}

const BLOG_PHOTO_MAP: Record<string, string> = {
  kasol: "https://images.unsplash.com/photo-1597037750734-450f6f406560?auto=format&fit=crop&w=800&q=80",
  parvati: "https://images.unsplash.com/photo-1597037750734-450f6f406560?auto=format&fit=crop&w=800&q=80",
  spiti: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80",
  zanskar: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
  chadar: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
  kedarnath: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80",
  manali: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80",
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80"
};

function getBlogCover(art: BlogItem): string {
  if (art.image) {
    const normalized = normalizeImageUrl(art.image);
    if (normalized) return normalized;
  }
  const titleKey = (art.title || "").toLowerCase();
  for (const [key, photoUrl] of Object.entries(BLOG_PHOTO_MAP)) {
    if (titleKey.includes(key)) return photoUrl;
  }
  return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80";
}

function BlogCard({ art, i, reduceMotion }: { art: BlogItem, i: number, reduceMotion: boolean }) {
  const content = art.content || '';
  const isVideo = Boolean(art.hasVideo || content.includes('youtube.com') || content.includes('youtu.be') || content.includes('iframe'));
  const linkPath = isVideo ? `/watch/${art.slug}` : `/read/${art.slug}`;

  const initials = art.author ? art.author.charAt(0).toUpperCase() : "Y";
  const getAvatarColor = (name: string) => {
    const colors = ["#E87A00", "#5C6BC0", "#4CAF50", "#E91E63", "#00BCD4"];
    const charCode = name ? name.charCodeAt(0) : 0;
    return colors[charCode % colors.length];
  };
  const avatarBg = getAvatarColor(art.author);
  const blogImageSrc = getBlogCover(art);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={reduceMotion ? { duration: 0 } : { delay: i * 0.1 }}
      viewport={{ once: true }}
      className="flex-none snap-start bg-white rounded-[32px] shadow-[0_15px_35px_rgba(0,0,0,0.06),0_5px_15px_rgba(0,0,0,0.03)] border border-zinc-100/80 hover:shadow-[0_25px_50px_rgba(0,0,0,0.15)] hover:-translate-y-1.5 transition-all duration-500 flex flex-col overflow-hidden group/card w-[280px] min-w-[280px] h-[275px] min-h-[275px] md:w-[340px] md:min-w-[340px] md:h-[310px] md:min-h-[310px]"
    >
      <Link href={linkPath} prefetch={false} className="flex flex-col h-full w-full text-left justify-start">
        {/* Top Image Area */}
        <div className="relative w-full aspect-[16/9.5] rounded-t-[32px] rounded-b-[24px] overflow-hidden shrink-0 bg-zinc-100">
          <OptimizedImage 
            src={blogImageSrc} 
            alt={art.title} 
            cloudinaryWidth={600}
            bunnyVariant="x540gt"
            sizes="340px"
            width={600}
            height={356}
            priority={true}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover/card:scale-105" 
          />
          {/* Magazine/Video Icon Overlay */}
          <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm p-1.5 rounded-lg">
            {isVideo ? (
              <svg className="w-3.5 h-3.5 text-white fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6H2v14a2 2 0 002 2h14v-2H4V6zm16-4H8a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z" />
              </svg>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex gap-3.5 items-center px-4 pb-4 pt-3.5 w-full">
          <div 
            className="w-11 h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-white font-bold text-[13px] shadow-sm"
            style={{ backgroundColor: avatarBg }}
          >
            {art.authorImage ? (
              <OptimizedImage 
                src={normalizeImageUrl(art.authorImage)} 
                alt={art.author} 
                width={44}
                height={44}
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between h-[72px]">
            <h3 className="text-[15px] font-extrabold text-[#082B5B] leading-[1.3] line-clamp-2 select-none group-hover/card:text-[#FF5B00] transition-colors">
              {art.title}
            </h3>
            
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
              <span className="truncate">by {art.author || "Admin"}</span>
              <span className="shrink-0">{art.readTime || "5 min read"}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
