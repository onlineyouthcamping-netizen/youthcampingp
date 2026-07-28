import PageRenderer from "@/components/PageRenderer";
import { fetchPublicTrips, fetchPublicReviews, fetchPublicBlogs, fetchDraftPageBySlug } from "@/lib/api";
import FloatingSocialBar from "@/components/FloatingSocialBar";
import { notFound } from "next/navigation";

import { Trip, Review, Blog } from "@/types";

export default async function PreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  let trips: Trip[] = [];
  let reviews: Review[] = [];
  let blogs: Blog[] = [];
  let page: any = null;
  
  try {
    const [tripsData, reviewsData, blogsData, pageData] = await Promise.all([
      fetchPublicTrips(),
      fetchPublicReviews(),
      fetchPublicBlogs(),
      fetchDraftPageBySlug(slug)
    ]);
    
    trips = (tripsData || []).filter(t => t.status === 'published');
    reviews = reviewsData || [];
    blogs = (blogsData || []).filter(b => b.status === 'published');
    page = pageData;
  } catch (error) {
    console.error("Error fetching preview data:", error);
  }

  if (!page) return notFound();

  // In Preview Mode, fetchDraftPageBySlug already normalizes 'draft' or 'content' into 'data'
  const displaySections = page.sections || [];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="fixed top-0 left-0 right-0 bg-primary-orange text-white text-center py-2 z-[100] font-bold text-sm capitalize tracking-widest">
        Preview Mode: Viewing Draft Version
      </div>
      <div className="pt-10">
        <PageRenderer sections={displaySections} trips={trips} reviews={reviews} blogs={blogs} />
      </div>
      <FloatingSocialBar />
    </div>
  );
}
