import Link from "next/link";
export const revalidate = 30;

import { fetchPublicBlogs, normalizeImageUrl } from "@/lib/api";
import { BookOpen, ChevronRight, ArrowLeft, Clock, User } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

export default async function StoriesPage() {
  let blogs: any[] = [];
  try {
    blogs = await fetchPublicBlogs();
    blogs = blogs.filter((b: any) => b.status === "published");
  } catch (error) {
    console.error("Error fetching blogs:", error);
  }

  return (
    <div className="bg-white min-h-screen font-montserrat pb-20">
      {/* Top Dark Banner */}
      <section className="bg-[#0B1528] text-white pt-28 pb-16 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#D4541A] font-bold text-xs uppercase tracking-wider transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <span className="bg-white/10 text-[#D4541A] font-extrabold tracking-widest uppercase text-xs px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 mb-4">
            <BookOpen className="w-3.5 h-3.5" /> TRAVEL STORIES & GUIDES
          </span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight uppercase leading-none mt-3">
            STORIES &
          </h1>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-[#D4541A] tracking-tight uppercase leading-none mt-1">
            ADVENTURES
          </h1>
          <div className="w-16 h-1.5 bg-[#D4541A] rounded-full my-4" />
          <p className="text-zinc-300 font-semibold text-sm sm:text-base max-w-xl leading-relaxed">
            Real travel diaries, packing guides, and route breakdowns from our
            community of explorers.
          </p>
        </div>
      </section>

      {/* Blogs Grid */}
      <section className="py-12 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto">
          {blogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((art, i) => (
                <Link
                  href={`/blogs/${art.slug}`}
                  key={art._id || i}
                  className="group"
                >
                  <div className="bg-white rounded-[24px] overflow-hidden border border-zinc-200/90 shadow-2xs hover:border-[#D4541A] hover:shadow-md transition-all flex flex-col h-full">
                    <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
                      <OptimizedImage
                        src={
                          normalizeImageUrl(art.image) ||
                          "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200"
                        }
                        alt={art.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="text-sm sm:text-base font-extrabold text-[#0B1528] mb-3 line-clamp-2 leading-snug group-hover:text-[#D4541A] transition-colors font-montserrat">
                        {art.title}
                      </h3>

                      <div className="mt-auto pt-3 border-t border-zinc-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center font-bold text-[10px] text-[#D4541A] border border-orange-100">
                            {art.author ? art.author[0].toUpperCase() : "YC"}
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-[#0B1528] font-montserrat">
                              {art.author || "YouthCamping"}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-bold font-montserrat">
                              {art.readTime || "5 min read"}
                            </p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center group-hover:bg-[#D4541A] group-hover:border-[#D4541A] group-hover:text-white transition-all text-zinc-400">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-32 text-center bg-[#F8F9FA] rounded-[32px] border border-zinc-200/80">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8 text-[#D4541A]" />
              </div>
              <h2 className="text-2xl font-black text-[#0B1528] font-montserrat uppercase tracking-tight mb-2">
                No Stories Published Yet
              </h2>
              <p className="text-zinc-400 font-semibold text-xs font-montserrat">
                Check back soon for new travel guides, packing lists, and route
                breakdowns!
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
