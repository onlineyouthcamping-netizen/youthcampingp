import { MetadataRoute } from "next";
import {
  fetchPublicTrips,
  fetchPublicBlogs,
  fetchAttractions,
} from "@/lib/api";
import { PUBLIC_SITE_ORIGIN } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = PUBLIC_SITE_ORIGIN;

  // Define static routes
  const staticRoutes = [
    "",
    "/about-us",
    "/contact",
    "/privacy",
    "/privacy-policy",
    "/terms",
    "/terms-and-conditions",
    "/cancellation-policy",
    "/questions",
    "/reviews",
    "/trips",
    "/blogs",
  ].map((route) => ({
    url: route === "" ? `${baseUrl}/` : `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  let tripRoutes: any[] = [];
  try {
    const trips = await fetchPublicTrips();
    if (trips && Array.isArray(trips)) {
      tripRoutes = trips.map((trip) => ({
        url: `${baseUrl}/trips/${trip.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error("Sitemap trips fetch error:", error);
  }

  let blogRoutes: any[] = [];
  try {
    const blogs = await fetchPublicBlogs();
    if (blogs && Array.isArray(blogs)) {
      blogRoutes = blogs
        .filter((b) => b && b.status === "published")
        .map((blog) => ({
          url: `${baseUrl}/blogs/${blog.slug}`,
          lastModified: new Date(
            blog.updatedAt || blog.createdAt || new Date(),
          ),
          changeFrequency: "weekly" as const,
          priority: 0.6,
        }));
    }
  } catch (error) {
    console.error("Sitemap blogs fetch error:", error);
  }

  let attractionRoutes: any[] = [];
  try {
    const attractions = await fetchAttractions();
    if (attractions && Array.isArray(attractions)) {
      attractionRoutes = attractions.map((attraction) => ({
        url: `${baseUrl}/attractions/${attraction.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.5,
      }));
    }
  } catch (error) {
    console.error("Sitemap attractions fetch error:", error);
  }

  return [...staticRoutes, ...tripRoutes, ...blogRoutes, ...attractionRoutes];
}
