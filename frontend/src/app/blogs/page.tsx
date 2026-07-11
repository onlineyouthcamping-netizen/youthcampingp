import Link from "next/link";
export const revalidate = 30;

import { fetchPublicBlogs, normalizeImageUrl } from "@/lib/api";
import { BookOpen, Sparkles, Filter, ChevronRight, ChevronLeft } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

export default async function BlogsPage() {
  let blogs = [];
  try {
    blogs = await fetchPublicBlogs();
    blogs = blogs.filter(b => b.status === 'published');
  } catch (error) {
    console.error("Error fetching blogs:", error);
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Search/Header Hero */}
      <section className="pt-40 pb-20 px-6 bg-zinc-50 border-b border-zinc-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div className="max-w-3xl">
              <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-primary-orange mb-8 font-bold text-xs capitalize tracking-widest transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back to Home
              </Link>
              <div className="flex items-center gap-3 text-primary-orange mb-6">
                <BookOpen className="w-6 h-6" />
                <span className="font-bold tracking-[0.3em] capitalize text-xs">The Travel Journal</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-semibold tracking-tighter text-navy mb-8 leading-[0.9]">
                WATCH & <br />
                <span className="text-primary-orange">Read</span>
              </h1>
              <p className="text-zinc-500 text-xl font-medium max-w-xl leading-relaxed">
                Dive into our collection of travel stories, destination guides, and visual journeys. Find inspiration for your next adventure.
              </p>
            </div>
            
            {/* Quick Filters Placeholder */}
            <div className="flex flex-wrap gap-4">
              <button className="px-8 py-4 bg-white border border-zinc-200 rounded-full font-bold text-sm flex items-center gap-3 hover:bg-navy hover:text-white hover:border-navy transition-all shadow-sm">
                <Filter className="w-4 h-4" />
                Filter by Topic
              </button>
              <button className="px-8 py-4 bg-navy text-white rounded-full font-bold text-sm flex items-center gap-3 shadow-xl hover:bg-primary-orange transition-all">
                <Sparkles className="w-4 h-4" />
                Latest Stories
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Blogs Grid */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          {blogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {blogs.map((art, i) => (
                <Link href={`/blogs/${art.slug}`} key={art._id || i} className="group">
                  <div className="bg-white rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl transition-all border border-zinc-100 h-full flex flex-col">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <OptimizedImage 
                        src={normalizeImageUrl(art.image) || "https://images.unsplash.com/photo-1597037750734-450f6f406560?q=80&w=2070"} 
                        alt={art.title} className="object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                    </div>
                    <div className="p-8 flex flex-col flex-grow">
                      <h3 className="text-xl font-bold text-navy mb-6 line-clamp-2 leading-snug tracking-tighter group-hover:text-primary-orange transition-colors">
                        {art.title}
                      </h3>
                      
                      <div className="mt-auto pt-6 border-t border-zinc-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-orange/10 flex items-center justify-center font-bold text-[10px] text-primary-orange border border-primary-orange/20">
                            {art.author ? art.author[0] : 'Y'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-navy">{art.author || 'YouthCamping'}</p>
                            <p className="text-[10px] text-zinc-400 font-bold tracking-widest">{art.readTime || '5 min read'}</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-primary-orange group-hover:text-white transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-40 text-center bg-zinc-50 rounded-[60px] border-2 border-dashed border-zinc-200">
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <BookOpen className="w-10 h-10 text-zinc-300" />
              </div>
              <h2 className="text-3xl font-bold capitalize text-navy mb-4">No stories published yet</h2>
              <p className="text-zinc-400 font-bold max-w-sm mx-auto capitalize tracking-widest text-xs">
                Check back soon for new travel guides and stories!
              </p>
            </div>
          )}
        </div>
      </section>
      
    </div>
  );
}
