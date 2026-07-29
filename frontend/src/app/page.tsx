import SocialProofBar from "@/components/SocialProofBar";
import PageRenderer from "@/components/PageRenderer";
import { fetchHomepageTrips, fetchHomepageReviews, fetchHomepageBlogs, fetchPageBySlug, fetchTheme } from "@/lib/api";
import dynamicImport from "next/dynamic";
import { Trip, Review, Blog } from "@/types";

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
const RecentPhotosSection = dynamicImport(() => import("@/components/RecentPhotosSection"), {
  loading: () => <SectionSkeleton height="380px" />
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
const PhotoSlider = dynamicImport(() => import("@/components/PhotoSlider"), {
  loading: () => <SectionSkeleton height="350px" />
});
const FloatingSocialBar = dynamicImport(() => import("@/components/FloatingSocialBar"));

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
      settleWithin(fetchHomepageTrips(50), 2500, []),
      settleWithin(fetchHomepageReviews(8), 2500, []),
      settleWithin(fetchHomepageBlogs(8), 2500, []),
      settleWithin(fetchPageBySlug('home'), 2500, null),
      settleWithin(fetchTheme(), 2500, null)
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

  const heroDbSection = page?.sections?.find((s: any) => s.type === 'hero');
  const heroProps = heroDbSection?.draft || heroDbSection?.data || heroDbSection?.content || {};

  const recentPhotosDbSection = page?.sections?.find((s: any) => s.type === 'recent_photos' || s.type === 'vibe' || s.type === 'photo_grid');
  const recentPhotosData = recentPhotosDbSection?.draft || recentPhotosDbSection?.data || recentPhotosDbSection?.content || {};
  const recentPhotosList = recentPhotosData.photos || recentPhotosData.items || recentPhotosData.images;
  const recentPhotosFormatted = (Array.isArray(recentPhotosList) && recentPhotosList.length > 0)
    ? recentPhotosList.map((p: any, i: number) => ({
        id: p.id || `photo-${i}`,
        url: p.src || p.url || p.image || p.imageUrl,
        caption: p.caption || "",
        location: p.location || ""
      })).filter((p: any) => Boolean(p.url))
    : undefined;

  // Construct dynamic section map
  const sectionMap: Record<string, React.ReactNode> = {
    community_trips: <CommunityTrips key="community_trips" trips={trips} {...heroProps} />,
    social_proof: <SocialProofBar key="social_proof" />,
    cta_banner: <CTABanner key="cta_banner" />,
    destinations: <Destinations key="destinations" />,
    recent_photos: (
      <RecentPhotosSection
        key="recent_photos"
        photos={recentPhotosFormatted}
        title={recentPhotosData.titlePrimary || recentPhotosData.title}
        subtitle={recentPhotosData.titleAccent || recentPhotosData.subtitle}
      />
    ),
    bestie: <BestieSection key="bestie" />,
    cta_slider: <CTASlider key="cta_slider" />,
    blogs: <BlogSection key="blogs" blogs={blogs} />,
    reviews: <ReviewsSection key="reviews" reviews={reviews} />,
    photo_slider: <PhotoSlider key="photo_slider" title="Glimpses of Adventure" />
  };

  const order = theme?.sectionOrder
    ? theme.sectionOrder.filter((k: string) => k !== 'hero' && k !== 'vibe')
    : [
        'community_trips', 'cta_banner', 
        'recent_photos', 'bestie', 'cta_slider', 'destinations', 'reviews', 'blogs', 'photo_slider'
      ];

  const visibility = theme?.sectionVisibility || {};
  const visibleSectionKeys = order.filter((key: string) => {
    return visibility[key] !== false && sectionMap[key];
  });

  // Use DB page sections from PageBuilder if present and non-empty
  const rawDbSections = page?.sections && Array.isArray(page.sections)
    ? page.sections
    : [];

  const dbSections = rawDbSections.length > 0 ? rawDbSections : null;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {dbSections ? (
        <PageRenderer sections={dbSections} trips={trips} reviews={reviews} blogs={blogs} />
      ) : (
        <>
          {visibleSectionKeys.map((key: string, idx: number) => {
            const isAlternate = theme?.sectionBgAlternate ?? true;
            const alternateClass = isAlternate && idx % 2 === 1 ? "bg-zinc-50/50" : "bg-transparent";
            
            if (key === 'cta_banner' || key === 'cta_slider') {
              return sectionMap[key];
            }
            
            const spacingPx = theme?.sectionSpacing != null ? `${theme.sectionSpacing}px` : '16px';
            
            return (
              <div 
                key={key} 
                className={alternateClass}
                style={{ 
                  '--section-spacing-dynamic': spacingPx,
                  paddingTop: key === 'community_trips' ? '0px' : 'var(--section-spacing-dynamic)',
                  paddingBottom: 'var(--section-spacing-dynamic)'
                } as any}
              >
                {sectionMap[key]}
              </div>
            );
          })}
          {!visibleSectionKeys.includes('recent_photos') && (
            <RecentPhotosSection
              photos={recentPhotosFormatted}
              title={recentPhotosData.titlePrimary || recentPhotosData.title}
              subtitle={recentPhotosData.titleAccent || recentPhotosData.subtitle}
            />
          )}
        </>
      )}
      <FloatingSocialBar />
    </div>
  );
}
