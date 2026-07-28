import Hero from "@/components/Hero";
import SocialProofBar from "@/components/SocialProofBar";
import PageRenderer from "@/components/PageRenderer";
import { fetchHomepageTrips, fetchHomepageReviews, fetchHomepageBlogs, fetchPageBySlug, fetchTheme } from "@/lib/api";
import dynamicImport from "next/dynamic";

// Centralized Premium Shimmer Loader to prevent Cumulative Layout Shift (CLS)
function SectionSkeleton({ height = "400px" }: { height?: string }) {
  return (
    <div 
      className="w-full flex flex-col justify-center px-4 sm:px-6 md:px-12 lg:px-20 animate-pulse bg-white border border-slate-50/50" 
      style={{ height }}
    >
      <div className="w-24 h-3 bg-zinc-100 rounded mb-4" />
      <div className="w-1/3 h-8 bg-zinc-100 rounded mb-12" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="h-[280px] bg-zinc-50 rounded-[24px]" />
        <div className="h-[280px] bg-zinc-50 rounded-[24px] hidden md:block" />
        <div className="h-[280px] bg-zinc-50 rounded-[24px] hidden lg:block" />
      </div>
    </div>
  );
}

const CommunityTrips = dynamicImport(() => import("@/components/CommunityTrips"), {
  loading: () => <SectionSkeleton height="650px" />
});
const BestieSection = dynamicImport(() => import("@/components/BestieSection"), {
  loading: () => <SectionSkeleton height="500px" />
});
const RealitySection = dynamicImport(() => import("@/components/RealitySection"), {
  loading: () => <SectionSkeleton height="450px" />
});
const Destinations = dynamicImport(() => import("@/components/Destinations"), {
  loading: () => <SectionSkeleton height="600px" />
});
const BlogSection = dynamicImport(() => import("@/components/BlogSection"), {
  loading: () => <SectionSkeleton height="550px" />
});
const ReviewsSection = dynamicImport(() => import("@/components/ReviewsSection"), {
  loading: () => <SectionSkeleton height="500px" />
});
const VibeSection = dynamicImport(() => import("@/components/VibeSection"), {
  loading: () => <SectionSkeleton height="550px" />
});
const CTASlider = dynamicImport(() => import("@/components/CTASlider"), {
  loading: () => <div className="h-[350px] w-full bg-zinc-50 animate-pulse rounded-[32px] border border-slate-100" />
});
const CTABanner = dynamicImport(() => import("@/components/CTABanner"), {
  loading: () => <div className="h-[300px] w-full bg-zinc-50 animate-pulse rounded-[32px] border border-slate-100" />
});
const FloatingSocialBar = dynamicImport(() => import("@/components/FloatingSocialBar"));

import { Trip, Review, Blog } from "@/types";

export const revalidate = 60;

async function settleWithin<T>(promise: Promise<T>, milliseconds: number, fallback: T): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => resolve(fallback), milliseconds);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export default async function Home() {
  let trips: Trip[] = [];
  let reviews: Review[] = [];
  let blogs: Blog[] = [];
  let page: any = null;
  let theme: any = null;
  
  try {
    const results = await Promise.allSettled([
      fetchHomepageTrips(12),
      settleWithin(fetchHomepageReviews(8), 6000, []),
      settleWithin(fetchHomepageBlogs(8), 6000, []),
      fetchPageBySlug('home'),
      fetchTheme()
    ]);
    
    const tripsData = results[0].status === 'fulfilled' ? results[0].value : [];
    const reviewsData = results[1].status === 'fulfilled' ? results[1].value : [];
    const blogsData = results[2].status === 'fulfilled' ? results[2].value : [];
    const pageData = results[3].status === 'fulfilled' ? results[3].value : null;
    const themeData = results[4].status === 'fulfilled' ? results[4].value : null;
    
    trips = (tripsData || []).filter((t: any) => t.status === 'published');
    reviews = reviewsData || [];
    blogs = (blogsData || []).filter((b: any) => b.status === 'published');
    page = pageData;
    theme = themeData;
  } catch (error) {
    console.error("Error fetching home data:", error);
  }

  // Construct dynamic section map for default template
  const sectionMap: Record<string, React.ReactNode> = {
    hero: <Hero key="hero" />,
    social_proof: <SocialProofBar key="social_proof" />,
    community_trips: <CommunityTrips key="community_trips" trips={trips} />,
    cta_banner: <CTABanner key="cta_banner" />,
    destinations: <Destinations key="destinations" />,
    bestie: <BestieSection key="bestie" />,
    cta_slider: <CTASlider key="cta_slider" />,
    blogs: <BlogSection key="blogs" blogs={blogs} />,
    reviews: <ReviewsSection key="reviews" reviews={reviews} />,
    vibe: <VibeSection key="vibe" />
  };

  const order = theme?.sectionOrder || [
    'hero', 'social_proof', 'community_trips', 'cta_banner', 
    'destinations', 'bestie', 'cta_slider', 'blogs', 'reviews', 'vibe'
  ];
  const visibility = theme?.sectionVisibility || {};
  const visibleSectionKeys = order.filter((key: string) => {
    return visibility[key] !== false && sectionMap[key];
  });

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {page && page.sections && page.sections.length > 0 ? (
        <>
          <PageRenderer sections={page.sections} trips={trips} reviews={reviews} blogs={blogs} />
          {/* Force new sections if not in DB */}
          {!page.sections.some((s: any) => s.type === 'cta_slider') && <CTASlider />}
        </>
      ) : (
        <>
          {visibleSectionKeys.map((key: string, idx: number) => {
            const isAlternate = theme?.sectionBgAlternate ?? true;
            const alternateClass = isAlternate && idx % 2 === 1 ? "bg-zinc-50/50" : "bg-transparent";
            
            // Skip spacing wrapper for hero/cta to keep layouts full-screen
            if (key === 'hero' || key === 'cta_banner' || key === 'cta_slider') {
              return sectionMap[key];
            }
            
            const spacingPx = theme?.sectionSpacing != null ? `${theme.sectionSpacing}px` : '80px';
            
            return (
              <div 
                key={key} 
                className={alternateClass}
                style={{ 
                  '--section-spacing-dynamic': spacingPx,
                  paddingTop: 'var(--section-spacing)',
                  paddingBottom: 'var(--section-spacing)'
                } as any}
              >
                {sectionMap[key]}
              </div>
            );
          })}
        </>
      )}
      <FloatingSocialBar />
    </div>
  );
}
