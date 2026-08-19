import React from "react";
import SocialProofBar from "@/components/SocialProofBar";
import PageRenderer from "@/components/PageRenderer";
import FloatingSocialBar from "@/components/FloatingSocialBar";
import CommunityTrips from "@/components/CommunityTrips";
import CTABanner from "@/components/CTABanner";
import Destinations from "@/components/Destinations";
import RecentPhotosSection from "@/components/RecentPhotosSection";
import CTASlider from "@/components/CTASlider";
import BlogSection from "@/components/BlogSection";
import ReviewsSection from "@/components/ReviewsSection";
import PhotoSlider from "@/components/PhotoSlider";
import {
  fetchHomepageTrips,
  fetchHomepageReviews,
  fetchHomepageBlogs,
  fetchPageBySlug,
  fetchTheme,
} from "@/lib/api";
import { Trip, Review, Blog } from "@/types";

export const revalidate = 60;

async function settleWithin<T>(
  promise: Promise<T>,
  milliseconds: number,
  fallback: T,
): Promise<T> {
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
      settleWithin(fetchPageBySlug("home"), 2500, null),
      settleWithin(fetchTheme(), 2500, null),
    ]);

    const tripsData = results[0].status === "fulfilled" ? results[0].value : [];
    const reviewsData =
      results[1].status === "fulfilled" ? results[1].value : [];
    const blogsData = results[2].status === "fulfilled" ? results[2].value : [];
    const pageData =
      results[3].status === "fulfilled" ? results[3].value : null;
    const themeData =
      results[4].status === "fulfilled" ? results[4].value : null;

    trips = (tripsData || []).filter((t: any) => t.status === "published");
    reviews = reviewsData || [];
    blogs = (blogsData || []).filter((b: any) => b.status === "published");
    page = pageData;
    theme = themeData;
  } catch (error) {
    console.error("Error fetching home data:", error);
  }

  const heroDbSection = page?.sections?.find((s: any) => s.type === "hero");
  const heroProps =
    heroDbSection?.draft || heroDbSection?.data || heroDbSection?.content || {};

  const recentPhotosDbSection = page?.sections?.find(
    (s: any) =>
      s.type === "recent_photos" ||
      s.type === "vibe" ||
      s.type === "photo_grid",
  );
  const recentPhotosData =
    recentPhotosDbSection?.draft ||
    recentPhotosDbSection?.data ||
    recentPhotosDbSection?.content ||
    {};
  const recentPhotosList =
    recentPhotosData.photos ||
    recentPhotosData.items ||
    recentPhotosData.images;
  const recentPhotosFormatted =
    Array.isArray(recentPhotosList) && recentPhotosList.length > 0
      ? recentPhotosList
          .map((p: any, i: number) => ({
            id: p.id || `photo-${i}`,
            url: p.src || p.url || p.image || p.imageUrl,
            caption: p.caption || "",
            location: p.location || "",
          }))
          .filter((p: any) => Boolean(p.url))
      : undefined;

  // Construct dynamic section map
  const sectionMap: Record<string, React.ReactNode> = {
    community_trips: (
      <CommunityTrips key="community_trips" trips={trips} {...heroProps} />
    ),
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
    cta_slider: <CTASlider key="cta_slider" />,
    blogs: <BlogSection key="blogs" blogs={blogs} />,
    reviews: <ReviewsSection key="reviews" reviews={reviews} />,
    photo_slider: (
      <PhotoSlider key="photo_slider" title="Glimpses of Adventure" />
    ),
  };

  const order = theme?.sectionOrder
    ? theme.sectionOrder.filter((k: string) => k !== "hero" && k !== "vibe")
    : [
        "community_trips",
        "cta_banner",
        "recent_photos",
        "cta_slider",
        "destinations",
        "reviews",
        "blogs",
        "photo_slider",
      ];

  const visibility = theme?.sectionVisibility || {};
  const visibleSectionKeys = order.filter((key: string) => {
    return visibility[key] !== false && sectionMap[key];
  });

  // Use DB page sections from PageBuilder if present and non-empty
  const rawDbSections =
    page?.sections && Array.isArray(page.sections) ? page.sections : [];

  const defaultDbSections = [
    { type: "hero", visible: true, data: heroProps },
    { type: "trips", visible: true, data: {} },
    { type: "social_proof", visible: true, data: {} },
    { type: "cta_banner", visible: true, data: {} },
    { type: "destinations", visible: true, data: {} },
    { type: "recent_photos", visible: true, data: recentPhotosData },
    { type: "cta_slider", visible: true, data: {} },
    { type: "blogs", visible: true, data: {} },
    { type: "reviews", visible: true, data: {} },
    { type: "photo_slider", visible: true, data: {} },
  ];

  const dbSections = rawDbSections.length > 0 ? rawDbSections : defaultDbSections;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <PageRenderer
        sections={dbSections}
        trips={trips}
        reviews={reviews}
        blogs={blogs}
      />
      <FloatingSocialBar />
    </div>
  );
}
