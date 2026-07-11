import { Metadata } from "next";
import { fetchBlogBySlug, normalizeImageUrl } from "@/lib/api";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { notFound } from "next/navigation";
import { Play, User, Share2, ChevronLeft, Camera, MessageSquare } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await fetchBlogBySlug(slug);
  if (!blog) return { title: "Not Found" };

  const excerpt = "Watch this exclusive travel documentary by Youthcamping.";
  const imageUrl = normalizeImageUrl(blog.image);

  return {
    title: `Watch: ${blog.title} | Youthcamping`,
    description: excerpt,
    openGraph: {
      title: `Watch: ${blog.title}`,
      description: excerpt,
      images: imageUrl ? [{ url: imageUrl }] : [],
      type: 'video.movie',
    }
  };
}

export default async function VideoWatchPage({ params }: PageProps) {
  const { slug } = await params;
  const blog = await fetchBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  // Extract video URL if it exists in content or use a default if it's a "video blog"
  // For now, let's look for iframe in content or use a placeholder
  const videoMatch = blog.content.match(/src="([^"]+)"/);
  const videoUrl = videoMatch ? videoMatch[1] : "https://www.youtube.com/embed/j6hb-iOZalE";

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Cinematic Header */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6 md:p-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <Link href="/" className="group flex items-center gap-3 text-white/60 hover:text-white transition-colors font-bold capitalize text-[10px] tracking-widest">
           <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white transition-colors backdrop-blur-md">
             <ChevronLeft className="w-5 h-5" />
           </div>
           Back
        </Link>
        <div className="flex items-center gap-4 invisible">
        </div>
      </div>

      {/* Main Video Content */}
      <div className="w-full h-screen flex flex-col">
        <div className="flex-1 relative flex items-center justify-center">
           <iframe
              className="w-full h-full"
              src={`${videoUrl}?autoplay=1&mute=0&rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
        </div>

        {/* Video Info Footer */}
        <div className="p-8 md:p-16 bg-gradient-to-t from-black via-black/90 to-transparent">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-10 items-end justify-between">
              <div className="max-w-3xl space-y-6">
                 <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-primary text-white text-[10px] font-bold capitalize tracking-widest rounded-md">Cinematic</span>
                    <span className="text-[10px] font-bold capitalize tracking-widest text-white/40">Travel Documentary</span>
                 </div>
                 <h1 className="text-4xl md:text-7xl font-bold capitalize tracking-tighter leading-none italic">
                   {blog.title}
                 </h1>
                 <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                          <User className="w-5 h-5" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[9px] font-bold capitalize tracking-widest text-white/40">Directed By</span>
                          <span className="text-xs font-bold capitalize">{blog.author}</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                          <Camera className="w-5 h-5" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[9px] font-bold capitalize tracking-widest text-white/40">Gear</span>
                          <span className="text-xs font-bold capitalize">Adventure Cam</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col gap-4 items-end invisible">
              </div>
           </div>
        </div>
      </div>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoObject",
            "name": blog.title,
            "description": "Watch this exclusive travel documentary by Youthcamping.",
            "thumbnailUrl": normalizeImageUrl(blog.image),
            "uploadDate": blog.createdAt,
            "publisher": {
              "@type": "Organization",
              "name": "Youthcamping",
              "logo": {
                "@type": "ImageObject",
                "url": "https://youthcamping.online/logo.png"
              }
            },
            "embedUrl": videoUrl
          })
        }}
      />
    </div>
  );
}
