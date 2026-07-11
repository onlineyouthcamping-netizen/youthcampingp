import { fetchBlogBySlug, normalizeImageUrl } from "@/lib/api";
import { notFound } from "next/navigation";
export const revalidate = 30;

import { ChevronLeft, Calendar, Clock, User } from "lucide-react";
import Link from "next/link";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = await fetchBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  // Format date if available
  const dateStr = blog.createdAt 
    ? new Date(blog.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Recently Published';

  return (
    <div className="bg-white min-h-screen font-montserrat flex flex-col">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative w-full h-[60vh] min-h-[500px] flex items-center justify-center">
          <div className="absolute inset-0 z-0">
            <OptimizedImage 
              src={normalizeImageUrl(blog.image) || "https://images.unsplash.com/photo-1597037750734-450f6f406560?q=80&w=2070"} 
              alt={blog.title} className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
          
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white mt-20">
            <Link href="/blogs" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 font-bold text-sm transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back to Journal
            </Link>
            
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tighter mb-8 leading-[1.1] drop-shadow-lg">
              {blog.title}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-bold capitalize tracking-widest text-white/90">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary-orange" />
                {blog.author || 'YouthCamping'}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-orange" />
                {blog.readTime || '5 min read'}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-orange" />
                {dateStr}
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            {/* 
              We use dangerouslySetInnerHTML because the seed script and CMS 
              provide rich HTML content (with styles, headers, etc.)
            */}
            <article 
              className="prose prose-lg md:prose-xl max-w-none prose-headings:font-black prose-headings:text-navy prose-p:text-zinc-600 prose-p:leading-relaxed prose-a:text-primary-orange hover:prose-a:text-navy prose-img:rounded-[24px]"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
            
            <div className="mt-20 pt-10 border-t border-zinc-100">
              <div className="bg-zinc-50 rounded-[30px] p-8 flex flex-col md:flex-row items-center gap-8 border border-zinc-100">
                <div className="w-24 h-24 rounded-full bg-primary-orange/10 flex items-center justify-center shrink-0 border border-primary-orange/20">
                  <span className="text-4xl font-bold text-primary-orange">{blog.author ? blog.author[0] : 'Y'}</span>
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-xl font-bold text-navy mb-2">Written by {blog.author || 'YouthCamping Team'}</h3>
                  <p className="text-zinc-500 mb-6">Expert travel curator and storyteller at YouthCamping. Exploring the hidden gems of the Himalayas and beyond.</p>
                  <Link href="/trips" className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white rounded-full font-bold text-sm hover:bg-primary-orange transition-colors">
                    Explore Trips
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
    </div>
  );
}
