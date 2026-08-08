import { fetchBlogBySlug, normalizeImageUrl } from "@/lib/api";
import { notFound } from "next/navigation";
export const revalidate = 30;

import {
  ChevronLeft,
  Calendar,
  Clock,
  User,
  Share2,
  Sparkles,
  Mountain,
  Compass,
  ShieldCheck,
  HeartHandshake,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const blog = await fetchBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  // Format date if available
  const dateStr = blog.createdAt
    ? new Date(blog.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Recently Published";

  // Extract structured highlights and tips or default
  const highlights = blog.highlights || [
    {
      title: "Breathtaking Mountain Vistas",
      desc: "Experience 360-degree panoramic views of Himalayan alpine valleys.",
    },
    {
      title: "Guided Mountain Expeditions",
      desc: "Lead by certified safety professionals and local expedition guides.",
    },
    {
      title: "Curated Stays & Local Culture",
      desc: "Cozy fireside stays, regional cuisine, and authentic hospitality.",
    },
  ];

  const tips = blog.tips || [
    "Layering is key: Pack high-density thermals, a windproof outer jacket, and fleece gloves.",
    "Footwear matters: Sturdy waterproof trekking boots with good ankle support are essential.",
    "Stay Hydrated: Cold weather masks dehydration; carry a thermal thermos flask on day hikes.",
    "Respect Local Heritage: Embrace local customs and leave zero trace in nature.",
  ];

  const galleryImages = blog.gallery || [
    normalizeImageUrl(blog.image) ||
      "https://images.unsplash.com/photo-1597037750734-450f6f406560?q=80&w=1200",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200",
    "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?q=80&w=1200",
  ];

  // Parse paragraphs from content HTML/text
  const rawText = (blog.content || blog.intro || "").replace(/<[^>]*>?/gm, "");
  const paragraphs = rawText
    .split(/\n\n|\n/)
    .map((p: string) => p.trim())
    .filter(
      (p: string) =>
        p.length > 0 &&
        !p.startsWith("###") &&
        !p.startsWith("-") &&
        !p.startsWith("1."),
    );

  return (
    <div className="bg-[#FAFBFD] min-h-screen font-montserrat flex flex-col">
      <main className="flex-grow pb-24">
        {/* ─── Magazine Hero Header ─── */}
        <section className="relative w-full min-h-[520px] md:min-h-[580px] flex items-center justify-center pt-24 pb-16 bg-[#0B1528] overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-45">
            <OptimizedImage
              src={
                normalizeImageUrl(blog.image) ||
                "https://images.unsplash.com/photo-1597037750734-450f6f406560?q=80&w=2070"
              }
              alt={blog.title}
              className="object-cover w-full h-full"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1528] via-[#0B1528]/70 to-transparent" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white space-y-6">
            <div className="flex items-center justify-center gap-2">
              <Link
                href="/blogs"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold transition-all cursor-pointer shadow-sm backdrop-blur-md"
              >
                <ChevronLeft className="w-4 h-4" /> Travel Journal
              </Link>
              <span className="px-3.5 py-1 rounded-full bg-[#D4541A] text-white text-[11px] font-black uppercase tracking-wider shadow-md">
                {blog.category || "Expedition Guide"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white drop-shadow-lg max-w-3xl mx-auto">
              {blog.title}
            </h1>

            <p className="text-sm md:text-base text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
              {blog.excerpt ||
                `Explore essential travel insights and expert recommendations for ${blog.title}.`}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold tracking-wider text-slate-300 pt-4 border-t border-white/10 max-w-md mx-auto">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#D4541A]" />
                {blog.author || "YouthCamping Team"}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D4541A]" />
                {blog.readTime || "5 min read"}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#D4541A]" />
                {dateStr}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Article Body & Visual Cards Container ─── */}
        <section className="py-12 md:py-16 px-6 -mt-10 relative z-20">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* 1. Lead Overview Banner */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-zinc-200/90 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-2 bg-[#D4541A]" />
              <p className="text-lg sm:text-xl md:text-2xl font-extrabold text-[#0B1528] leading-relaxed">
                "
                {blog.intro ||
                  paragraphs[0] ||
                  `Traveling with YouthCamping brings you closer to untamed wilderness, pristine mountain trails, and vibrant community experiences.`}
                "
              </p>
            </div>

            {/* 2. Key Highlights Card Grid */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D4541A]" />
                <h2 className="text-xl font-extrabold text-[#0B1528]">
                  Expedition Highlights
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {highlights.map((h: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-2xs space-y-2 hover:border-[#D4541A]/50 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#D4541A] flex items-center justify-center font-bold">
                      {idx === 0 ? (
                        <Mountain className="w-5 h-5" />
                      ) : idx === 1 ? (
                        <Compass className="w-5 h-5" />
                      ) : (
                        <HeartHandshake className="w-5 h-5" />
                      )}
                    </div>
                    <h3 className="font-extrabold text-sm text-[#0B1528]">
                      {h.title}
                    </h3>
                    <p className="text-xs font-medium text-zinc-500 leading-relaxed">
                      {h.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Detailed Article Content Paragraphs */}
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-zinc-200/90 shadow-sm space-y-6">
              <h2 className="text-2xl font-black text-[#0B1528] tracking-tight pb-3 border-b border-zinc-100 flex items-center gap-3">
                <span className="w-2.5 h-7 rounded-full bg-[#D4541A]" />
                Overview & Story
              </h2>

              <div className="space-y-5 text-base md:text-lg text-zinc-700 font-medium leading-relaxed">
                {paragraphs.slice(0, 3).map((p: string, pIdx: number) => (
                  <p
                    key={pIdx}
                    className="first-letter:text-4xl first-letter:font-black first-letter:text-[#D4541A] first-letter:mr-2 first-letter:float-left"
                  >
                    {p}
                  </p>
                ))}
              </div>
            </div>

            {/* 4. Photo Gallery Grid Showcase */}
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-[#0B1528] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#D4541A]" /> Visual Storyboard
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {galleryImages.map((imgUrl: string, gIdx: number) => (
                  <div
                    key={gIdx}
                    className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-200 shadow-sm group"
                  >
                    <OptimizedImage
                      src={imgUrl}
                      alt={`Gallery Image ${gIdx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 text-white text-xs font-bold">
                      View Expedition View #{gIdx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Essential Travel Tips Checklist Card */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-zinc-200/90 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#0B1528]">
                    Essential Travel & Packing Tips
                  </h2>
                  <p className="text-xs font-medium text-zinc-400">
                    Expert recommendations for a safe and comfortable trip
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tips.map((tip: string, tIdx: number) => (
                  <div
                    key={tIdx}
                    className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70 flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm font-semibold text-zinc-700 leading-relaxed">
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. High-Impact Call-to-Action Trip Banner */}
            <div className="bg-gradient-to-r from-[#0B1329] to-[#1E293B] rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4541A]/20 rounded-full blur-3xl" />
              <div className="space-y-2 text-center md:text-left relative z-10">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                  Ready To Explore?
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Join Our Upcoming Himalayan Expeditions
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm max-w-lg font-medium">
                  Small group sizes, certified mountain guides, and zero hassle.
                  Reserve your slot today.
                </p>
              </div>

              <Link
                href="/trips"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#D4541A] hover:bg-[#c24813] text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-orange-500/25 active:scale-95 transition-all shrink-0 relative z-10 cursor-pointer"
              >
                Browse All Trips <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 7. Author Bio & Community Footer */}
            <div className="bg-white rounded-3xl p-8 border border-zinc-200/90 shadow-2xs flex flex-col sm:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D4541A] to-orange-600 text-white flex items-center justify-center shrink-0 shadow-md font-black text-3xl">
                {blog.author ? blog.author[0] : "S"}
              </div>
              <div className="text-center sm:text-left space-y-1">
                <span className="text-[10px] font-extrabold text-[#D4541A] uppercase tracking-wider bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                  Curated By
                </span>
                <h3 className="text-lg font-extrabold text-[#0B1528]">
                  {blog.author || "Suresh Chaudhary"}
                </h3>
                <p className="text-xs font-semibold text-zinc-500">
                  {blog.authorRole || "Lead Himalayan Expedition Specialist"}
                </p>
                <p className="text-xs text-zinc-400 font-medium pt-1">
                  Passionate about high-altitude trekking, community
                  storytelling, and responsible mountain tourism.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
