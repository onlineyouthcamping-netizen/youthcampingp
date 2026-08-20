"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Blog } from "@/types";
import { useWheelPassThrough } from "@/lib/useWheelPassThrough";

interface BlogCardItem {
  id: string;
  title: string;
  slug: string;
  image: string;
  authorName: string;
  authorAvatar: string;
  readTime: string;
}

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
  const displayTitle =
    !title ||
    title === "New journal" ||
    title === "Journal" ||
    title === "Blogs"
      ? "Stories"
      : title;
  const displaySubtitle = subtitle || "From The Road";

  const fallbackImages = [
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200",
  ];

  const fallbackAvatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300",
  ];

  const defaultStories: BlogCardItem[] = [
    {
      id: "sb-1",
      title: "The Pristine Colors of Kasol: Riverside Cafes & Parvati Valley Trails",
      slug: "the-pristine-colors-of-kasol-riverside-cafes-and-parvati-valley-trails",
      image: fallbackImages[0],
      authorName: "Siddharth",
      authorAvatar: fallbackAvatars[0],
      readTime: "5 MIN READ",
    },
    {
      id: "sb-2",
      title: "Spiti Valley in Winter: Surviving -20°C in the Middle Land",
      slug: "spiti-valley-in-winter-surviving-20c-in-the-middle-land",
      image: fallbackImages[1],
      authorName: "Karan Johar",
      authorAvatar: fallbackAvatars[1],
      readTime: "12 MIN READ",
    },
    {
      id: "sb-3",
      title: "Walking the Frozen Zanskar River: The Ultimate Chadar Trek Guide",
      slug: "walking-the-frozen-zanskar-river-the-ultimate-chadar-trek-guide",
      image: fallbackImages[2],
      authorName: "Aman Sharma",
      authorAvatar: fallbackAvatars[2],
      readTime: "8 MIN READ",
    },
  ];

  const apiMappedStories: BlogCardItem[] =
    blogs && blogs.length > 0
      ? blogs
          .map((b: any, idx: number) => {
            const rawAuthor = String(b.author || "YouthCamping Team");
            const cleanAuthor = rawAuthor.replace(/^by\s+/i, "");
            const storyImg =
              b.image && b.image.trim() !== "" && !b.image.includes("cloudinary.com")
                ? b.image
                : fallbackImages[idx % fallbackImages.length];
            const storyAvatar =
              b.authorImage && b.authorImage.trim() !== ""
                ? b.authorImage
                : fallbackAvatars[idx % fallbackAvatars.length];

            return {
              id: b._id || b.id || `b-${idx}`,
              title: b.title || "",
              slug: b.slug || "",
              image: storyImg,
              authorName: cleanAuthor,
              authorAvatar: storyAvatar,
              readTime: b.readTime || "5 MIN READ",
            };
          })
          .filter(
            (b) =>
              b.title.trim().length > 0 &&
              b.slug.trim().length > 0 &&
              b.image.trim().length > 0,
          )
      : [];

  const displayStories: BlogCardItem[] =
    apiMappedStories.length > 0 ? apiMappedStories : defaultStories;

  const scrollRef = useRef<HTMLDivElement>(null);
  useWheelPassThrough(scrollRef);

  const nudge = (dir: "l" | "r") => {
    if (scrollRef.current) {
      const cardEl = scrollRef.current.firstElementChild as HTMLElement | null;
      const cardWidth = cardEl ? cardEl.offsetWidth : 320;
      const scrollAmount = cardWidth + 24;
      scrollRef.current.scrollBy({
        left: dir === "l" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="relative overflow-hidden font-montserrat bg-white py-6 sm:py-8">
      {/* Two-tone background transition: top half white, bottom half grey (#E2E7ED) */}
      <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-[#E2E7ED] z-0" />
      <div className="relative z-10 max-w-[1440px] mx-auto px-6 sm:px-8 md:px-12">
        {/* HEADER ROW WITH SLIDER CONTROLS */}
        <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3 flex-nowrap">
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
            className="group inline-flex items-center gap-1.5 text-xs sm:text-[15px] font-bold text-[#0B1528] hover:text-[#D4541A] transition-colors shrink-0"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4541A] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* HORIZONTAL CAROUSEL SLIDER (1.5 CARDS PER VIEW ON MOBILE) */}
        <div
          ref={scrollRef}
          className="carousel-track w-full max-w-full flex gap-4 sm:gap-6 overflow-x-auto overflow-y-hidden no-scrollbar py-2 scroll-smooth snap-x snap-mandatory"
          style={{ touchAction: "pan-x" }}
        >
          {displayStories.map((story, idx) => (
            <motion.div
              key={story.id || idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.5 }}
              viewport={{ once: true }}
              className="flex-none snap-start w-[62vw] min-w-[220px] max-w-[270px] sm:w-[320px] md:w-[340px] flex flex-col bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 isolate"
            >
              {/* TOP PHOTO CONTAINER */}
              <div className="relative w-full aspect-[16/10.5] bg-zinc-100 overflow-hidden">
                <Link
                  href={`/blogs/${story.slug}`}
                  className="absolute inset-0 z-10"
                  aria-label={story.title}
                />
                <Image
                  src={story.image}
                  alt={story.title}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 270px, 310px"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* BOOK ICON BADGE AT TOP-RIGHT */}
                <div className="absolute top-2.5 right-2.5 z-20 text-white/90 drop-shadow-md">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* CARD BODY WITH AVATAR, TITLE & AUTHOR/READ TIME */}
              <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between gap-2">
                <div className="flex gap-2.5 items-start w-full">
                  {/* AUTHOR AVATAR PHOTO */}
                  <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden shrink-0 border border-zinc-200 shadow-2xs">
                    <Image
                      src={story.authorAvatar}
                      alt={story.authorName}
                      fill
                      unoptimized
                      sizes="36px"
                      className="object-cover"
                    />
                  </div>

                  {/* TITLE & FOOTER META */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <h3 className="text-[#1B2A4A] font-montserrat font-bold text-xs sm:text-sm leading-snug line-clamp-2 mb-1.5 group-hover:text-[#D4541A] transition-colors">
                      <Link href={`/blogs/${story.slug}`}>{story.title}</Link>
                    </h3>

                    {/* AUTHOR NAME & READING TIME ROW */}
                    <div className="flex items-center justify-between font-montserrat text-[11px] text-[#999999] gap-1.5 pt-1 border-t border-zinc-100">
                      <span className="truncate">
                        by{" "}
                        <span className="text-[#666666] font-medium">
                          {story.authorName}
                        </span>
                      </span>
                      <span className="shrink-0 text-zinc-400 font-normal text-[10px]">
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
