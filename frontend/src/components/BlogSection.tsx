"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Blog } from "@/types";

interface BlogCardItem {
  id: string;
  title: string;
  slug: string;
  image: string;
  authorName: string;
  authorAvatar: string;
  readTime: string;
}

const MOCK_STORIES: BlogCardItem[] = [
  {
    id: "b1",
    title: "The Winter Beauty of Kashmir",
    slug: "winter-beauty-of-kashmir",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    authorName: "Aditi Raval",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
    readTime: "7 min read",
  },
  {
    id: "b2",
    title: "8-Day Dubai Adventure: A Journey of Thrills & Luxury",
    slug: "dubai-adventure",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
    authorName: "Harsh Patel",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    readTime: "6 min read",
  },
  {
    id: "b3",
    title: "Winter Spiti Valley Experience",
    slug: "winter-spiti-valley-experience",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80",
    authorName: "Avdhesh Patel",
    authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    readTime: "5 min read",
  },
  {
    id: "b4",
    title: "Bhrigu Lake Trek – High Altitude Serenity",
    slug: "bhrigu-lake-trek",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
    authorName: "Priya Shah",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    readTime: "8 min read",
  },
];

interface BlogSectionProps {
  blogs?: Blog[];
  title?: string;
  subtitle?: string;
}

export default function BlogSection({
  blogs = [],
  title,
  subtitle,
}: BlogSectionProps) {
  const displayTitle = (!title || title === "New journal" || title === "Journal" || title === "Blogs") ? "Stories" : title;
  const displaySubtitle = subtitle || "From The Road";

  const displayStories: BlogCardItem[] = (blogs && blogs.length > 0)
    ? blogs.map((b: any, idx: number) => {
        const mock = MOCK_STORIES[idx % MOCK_STORIES.length];
        const rawAuthor = b.author || mock.authorName;
        const cleanAuthor = rawAuthor.replace(/^by\s+/i, "");
        return {
          id: b._id || b.id || `b-${idx}`,
          title: b.title || mock.title,
          slug: b.slug || mock.slug,
          image: (b.image && b.image.trim() !== "") ? b.image : mock.image,
          authorName: cleanAuthor,
          authorAvatar: (b.authorImage && b.authorImage.trim() !== "") ? b.authorImage : mock.authorAvatar,
          readTime: b.readTime || mock.readTime,
        };
      })
    : MOCK_STORIES;

  const scrollRef = useRef<HTMLDivElement>(null);

  const nudge = (dir: "l" | "r") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "l" ? -320 : 320, behavior: "smooth" });
    }
  };

  return (
    <section className="bg-white py-8 md:py-10 border-t border-zinc-100 font-montserrat">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 md:px-12">
        
        {/* HEADER ROW WITH SLIDER CONTROLS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-10 gap-3">
          <div className="flex items-center justify-between w-full sm:w-auto overflow-hidden">
            <div className="flex items-baseline gap-2 min-w-0 overflow-hidden whitespace-nowrap">
              <h2 className="text-[#1B2A4A] font-montserrat font-black text-2xl sm:text-3xl md:text-4xl lg:text-[40px] tracking-tight capitalize leading-tight">
                {displayTitle.toLowerCase()}
              </h2>
              <span className="font-caveat font-bold text-[#D4541A] text-[26px] sm:text-[34px] md:text-[40px] lg:text-[46px] leading-none shrink-0 capitalize pr-2 sm:pr-3">
                {displaySubtitle.toLowerCase()}
              </span>
            </div>
            <Link
              href="/blogs"
              className="group sm:hidden inline-flex items-center gap-1.5 text-xs font-bold text-[#111827] hover:text-[#D4541A] transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D4541A] group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={() => nudge("l")}
                aria-label="Previous stories"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-zinc-200 shadow-xs hover:bg-zinc-100 flex items-center justify-center text-zinc-800 transition-all cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-700" />
              </button>
              <button
                onClick={() => nudge("r")}
                aria-label="Next stories"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-zinc-200 shadow-xs hover:bg-zinc-100 flex items-center justify-center text-zinc-800 transition-all cursor-pointer active:scale-95"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-700" />
              </button>
            </div>

            <Link
              href="/blogs"
              className="group hidden sm:inline-flex items-center gap-2 text-sm sm:text-[16px] font-bold text-[#111827] hover:text-[#D4541A] transition-colors ml-2"
            >
              <span>View All Stories</span>
              <ArrowRight className="w-4 h-4 text-[#D4541A] group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* HORIZONTAL CAROUSEL SLIDER (1.5 CARDS PER VIEW ON MOBILE) */}
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-2 scroll-smooth snap-x snap-mandatory touch-pan-x"
        >
          {displayStories.map((story, idx) => (
            <motion.div
              key={story.id || idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.5 }}
              viewport={{ once: true }}
              className="flex-none snap-start w-[68vw] min-w-[260px] max-w-[340px] sm:w-[320px] md:w-[340px] flex flex-col bg-white border border-zinc-200/80 rounded-[24px] overflow-hidden shadow-[0_6px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.14)] hover:-translate-y-1.5 transition-all duration-300 isolate"
            >
              {/* TOP PHOTO CONTAINER */}
              <div className="relative w-full aspect-[16/10] bg-zinc-100 overflow-hidden">
                <Link href={`/blogs/${story.slug}`} className="absolute inset-0 z-10" aria-label={story.title} />
                <Image
                  src={story.image}
                  alt={story.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* BOOK ICON BADGE AT TOP-RIGHT */}
                <div className="absolute top-3.5 right-3.5 z-20 text-white/90 drop-shadow-md">
                  <BookOpen className="w-4.5 h-4.5" />
                </div>
              </div>

              {/* CARD BODY WITH AVATAR, TITLE & AUTHOR/READ TIME */}
              <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
                <div className="flex gap-3 items-start w-full">
                  {/* AUTHOR AVATAR PHOTO */}
                  <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden shrink-0 border border-zinc-200 shadow-2xs">
                    <Image
                      src={story.authorAvatar}
                      alt={story.authorName}
                      fill
                      sizes="(max-width: 768px) 44px, 44px"
                      className="object-cover"
                    />
                  </div>

                  {/* TITLE & FOOTER META */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                    <h3 className="text-[#1B2A4A] font-montserrat font-semibold text-[15px] sm:text-[16px] leading-[1.35] line-clamp-2 mb-2.5 group-hover:text-[#D4541A] transition-colors">
                      <Link href={`/blogs/${story.slug}`}>
                        {story.title}
                      </Link>
                    </h3>

                    {/* AUTHOR NAME & READING TIME ROW */}
                    <div className="flex items-center justify-between font-montserrat text-xs text-[#999999] gap-2 pt-1 border-t border-zinc-100/80">
                      <span className="truncate">
                        by <span className="text-[#666666] font-medium">{story.authorName}</span>
                      </span>
                      <span className="shrink-0 text-zinc-400 font-normal">
                        {story.readTime}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
