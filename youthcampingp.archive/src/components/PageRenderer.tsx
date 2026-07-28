import dynamic from "next/dynamic";
import { Trip, Review, Blog } from "@/types";

// Skeleton loader for dynamic sections — prevents CLS
function SectionSkeleton({ height = "400px" }: { height?: string }) {
  return (
    <div className="w-full animate-pulse bg-zinc-50" style={{ height }} />
  );
}

// --- Dynamic imports: SSR-enabled for SEO-relevant sections ---
const Hero = dynamic(() => import("./Hero"), {
  loading: () => <SectionSkeleton height="100vh" />,
});
const SocialProofBar = dynamic(() => import("./SocialProofBar"), {
  loading: () => <SectionSkeleton height="80px" />,
});
const CommunityTrips = dynamic(() => import("./CommunityTrips"), {
  loading: () => <SectionSkeleton height="650px" />,
});
const BestieSection = dynamic(() => import("./BestieSection"), {
  loading: () => <SectionSkeleton height="500px" />,
});
const RealitySection = dynamic(() => import("./RealitySection"), {
  loading: () => <SectionSkeleton height="450px" />,
});
const Destinations = dynamic(() => import("./Destinations"), {
  loading: () => <SectionSkeleton height="600px" />,
});
const BlogSection = dynamic(() => import("./BlogSection"), {
  loading: () => <SectionSkeleton height="550px" />,
});
const ReviewsSection = dynamic(() => import("./ReviewsSection"), {
  loading: () => <SectionSkeleton height="500px" />,
});
const CTABanner = dynamic(() => import("./CTABanner"), {
  loading: () => <SectionSkeleton height="500px" />,
});
const PhotoGrid = dynamic(() => import("./PhotoGrid"), {
  loading: () => <SectionSkeleton height="400px" />,
});
const ImageGallery = dynamic(() => import("./ImageGallery"), {
  loading: () => <SectionSkeleton height="400px" />,
});
const CinematicBanner = dynamic(() => import("./CinematicBanner"), {
  loading: () => <SectionSkeleton height="500px" />,
});
const PhotoSlider = dynamic(() => import("./PhotoSlider"), {
  loading: () => <SectionSkeleton height="400px" />,
});
const VideoSection = dynamic(() => import("./VideoSection"), {
  loading: () => <SectionSkeleton height="450px" />,
});

const CTASlider = dynamic(() => import("./CTASlider"), {
  loading: () => <SectionSkeleton height="400px" />,
});
const VibeSection = dynamic(() => import("./VibeSection"), {
  loading: () => <SectionSkeleton height="550px" />,
});

interface PageRendererProps {
  sections: any[];
  trips?: Trip[];
  reviews?: Review[];
  blogs?: Blog[];
  settings?: any;
}

export default function PageRenderer({ sections = [], trips = [], reviews = [], blogs = [], settings }: PageRendererProps) {
  if (!sections || !Array.isArray(sections)) return null;

  const visibleSections = sections.filter(s => s.visible !== false);

  return (
    <div className="flex flex-col">
      {visibleSections.map((section, index) => {
        const { type, data } = section;

        const getBgColor = (idx: number) => {
          const s = visibleSections[idx];
          if (!s) return '#ffffff';
          
          // Map exact backgrounds for components with custom/hardcoded styling
          if (['destinations'].includes(s.type)) return '#D4D6D9';
          if (['trips', 'upcoming_trips', 'featured_trips', 'trending_trips', 'blogs', 'journal'].includes(s.type)) return '#ffffff';
          if (s.type === 'bestie') return '#BDD5D5';
          
          if (['hero', 'cta_banner', 'cta_slider', 'cinematic_banner', 'video_section', 'reality'].includes(s.type)) return 'transparent';
          
          const patterns = ['#ffffff', '#f6f6f6'];
          return patterns[idx % patterns.length];
        };

        const renderSection = () => {
          const prevBg = index > 0 ? getBgColor(index - 1) : '#ffffff';
          const nextBg = index < visibleSections.length - 1 ? getBgColor(index + 1) : '#ffffff';
          const commonProps = { 
            topColor: prevBg, 
            bottomColor: nextBg,
            ...data 
          };

          switch (type) {
            case 'hero':
              return <Hero key={index} {...commonProps} settings={settings} />;
            case 'social_proof':
              return <SocialProofBar key={index} {...commonProps} />;
            case 'trips':
            case 'upcoming_trips':
            case 'featured_trips':
            case 'trending_trips':
              return <CommunityTrips key={index} trips={trips} {...commonProps} />;
            case 'bestie':
              return <BestieSection key={index} {...commonProps} />;
            case 'destinations':
              return <Destinations key={index} {...commonProps} />;
            case 'reality':
              return <RealitySection key={index} {...commonProps} />;
            case 'blogs':
            case 'journal':
              return <BlogSection key={index} blogs={blogs} {...commonProps} />;
            case 'reviews':
              return <ReviewsSection key={index} reviews={reviews} {...commonProps} />;
            case 'vibe':
              return <VibeSection key={index} {...commonProps} />;
            case 'cta_banner':
              return <CTABanner key={index} {...commonProps} />;
            case 'photo_grid':
              return <PhotoGrid key={index} {...commonProps} />;
            case 'image_gallery':
              return <ImageGallery key={index} {...commonProps} />;
            case 'cta_slider':
              return <CTASlider key={index} {...commonProps} />;
            case 'cinematic_banner':
              return <CinematicBanner key={index} {...commonProps} />;
            case 'photo_slider':
              return <PhotoSlider key={index} {...commonProps} />;
            case 'video_section':
              return <VideoSection key={index} {...commonProps} />;
            case 'rich_text':
              return (
                <div key={index} className="max-w-4xl mx-auto px-6 py-20">
                  {data.title && (
                    <h2 className="text-3xl md:text-4xl font-bold mb-12 capitalize tracking-tighter text-[#ff4e00]">
                      {data.title}
                    </h2>
                  )}
                  <div 
                    className="rich-content prose prose-stone prose-lg max-w-none 
                               prose-headings:text-[#ff4e00] prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
                               prose-p:text-gray-700 prose-p:leading-relaxed 
                               prose-strong:text-gray-900 prose-strong:font-black
                               prose-li:text-gray-700
                               prose-h1:text-4xl prose-h1:mb-8
                               prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                               prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4" 
                    dangerouslySetInnerHTML={{ __html: data.body || '' }} 
                  />
                </div>
              );
            default:
              return null;
          }
        };

        const getBackgroundClass = (idx: number) => {
          const s = visibleSections[idx];
          if (!s) return 'bg-transparent';
          if (['destinations'].includes(s.type)) return 'bg-[#D4D6D9]';
          if (['trips', 'upcoming_trips', 'featured_trips', 'trending_trips', 'blogs', 'journal'].includes(s.type)) return 'bg-white';
          if (['hero', 'cta_banner', 'cta_slider', 'cinematic_banner', 'video_section', 'reality'].includes(s.type)) return 'bg-transparent';
          
          const patterns = ['bg-[#ffffff]', 'bg-[#f6f6f6]'];
          return patterns[idx % patterns.length];
        };

        return (
          <div
            key={index}
            className={`page-section-wrapper ${getBackgroundClass(index)} transition-colors duration-500`}
          >
            {renderSection()}
          </div>
        );
      })}
    </div>
  );
}
