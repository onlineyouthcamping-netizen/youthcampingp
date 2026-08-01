import { Trip, ItineraryDay } from "@/types";
import { fetchWithRetry } from "./fetchWithRetry";

const DEFAULT_API = process.env.NODE_ENV !== "production" ? "http://localhost:5001/api" : "https://api.youthcamping.online/api";
let apiURL = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API;

if (!apiURL || apiURL.includes('onrender.com')) {
  apiURL = DEFAULT_API;
}

export const API_BASE_URL = apiURL.replace(/\/api$/, "") + "/api";
const IMAGE_BASE_URL = API_BASE_URL.replace("/api", "");

type PublicRequestInit = RequestInit & {
  next?: { revalidate?: number };
};

const publicRevalidate = (seconds: number): PublicRequestInit => {
  if (process.env.NODE_ENV !== 'production') {
    return { cache: 'no-store' } as any;
  }
  return {
    next: { revalidate: Math.min(seconds, 60) },
  };
};

/**
 * Normalizes image URLs to be fully qualified and accessible.
 * Handles: local uploads (/uploads/...), external URLs (https://...), and empty values.
 */
export const normalizeImageUrl = (url: any): string | undefined => {
  if (!url || typeof url !== 'string') return undefined;
  if (url.trim() === "") return undefined;

  // Block WordPress hotlinked images (403 forbidden)
  if (url.includes('youthcamping.in/wp-content') || url.includes('youthcamping.online/wp-content')) {
    return undefined;
  }

  // Enforce valid HTTP/HTTPS URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (url === "https://images.unsplash.com/photo-" || url.endsWith('photo-')) return undefined;
    return url;
  }

  // Handle local upload paths
  const normalizedPath = (url || '').replace(/\\/g, '/');
  if (normalizedPath && (normalizedPath.startsWith('/uploads/') || normalizedPath.startsWith('uploads/'))) {
    const fullPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
    return `${IMAGE_BASE_URL}${fullPath}`;
  }

  if (url.startsWith('/')) {
    return url;
  }

  return undefined;
};

export async function fetchTrips(init?: RequestInit): Promise<Trip[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/trips`, init ?? { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn("fetchTrips network error:", err);
    return [];
  }
}

export async function fetchPublicTrips(init?: PublicRequestInit): Promise<Trip[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/trips/public/cards`, init ?? publicRevalidate(180));
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn("fetchPublicTrips network error:", err);
    return [];
  }
}

export async function fetchHomepageTrips(limit = 12): Promise<Trip[]> {
  try {
    const safeLimit = Math.max(1, Math.min(12, Math.trunc(limit)));
    const res = await fetch(`${API_BASE_URL}/trips/public/cards?limit=${safeLimit}`, publicRevalidate(180));
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn("fetchHomepageTrips network error:", err);
    return [];
  }
}

const MOCK_SLUG_MAP: Record<string, any> = {
  'manali-kasol-amritsar': {
    id: 'mka-1',
    title: 'Manali Kasol Amritsar Backpacking Trip',
    slug: 'manali-kasol-amritsar',
    description: 'Get ready for an unforgettable journey through snow peaks, lush valleys, and spiritual heritage.',
    heroImage: 'https://vl-prod-static.b-cdn.net/system/images/000/888/076/6f012c2f939c45fd491d86b3d33b0cbb/original/IMG_3309.jpg',
    price: 12999,
    location: 'Himachal Pradesh & Punjab',
    duration: '9 Days / 8 Nights',
    departureCity: 'Ahmedabad',
    category: 'Backpacking',
    difficulty: 'Easy to Moderate',
    ageLimit: '16-35 Years',
    maxAltitude: '13,050 ft',
    images: [
      'https://vl-prod-static.b-cdn.net/system/images/000/888/076/6f012c2f939c45fd491d86b3d33b0cbb/original/IMG_3309.jpg',
      'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1200&q=85',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=85',
      'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1200&q=85'
    ],
    availableDates: [{ date: '2026-08-01', capacity: 20, bookedCount: 8 }, { date: '2026-08-15', capacity: 20, bookedCount: 5 }],
    variants: [
      { location: 'Ahmedabad', duration: '9 Days / 8 Nights', originalPrice: 15999, discountedPrice: 12999, image: '' },
      { location: 'Delhi', duration: '7 Days / 6 Nights', originalPrice: 13999, discountedPrice: 10999, image: '' }
    ],
    status: 'published'
  },
  'leh-ladakh-road-trip': {
    id: 'ladakh-1',
    title: 'Leh Ladakh Road Trip',
    slug: 'leh-ladakh-road-trip',
    description: 'Conquer the highest motorable passes and witness the breathtaking Pangong Tso Lake.',
    heroImage: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1200&q=85',
    price: 24999,
    location: 'Ladakh',
    duration: '11 Days / 10 Nights',
    departureCity: 'Delhi',
    category: 'Road Trip',
    difficulty: 'Moderate',
    ageLimit: '18-40 Years',
    maxAltitude: '18,380 ft',
    images: [
      'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1200&q=85',
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1200&q=85'
    ],
    availableDates: [{ date: '2026-08-10', capacity: 15, bookedCount: 10 }],
    variants: [{ location: 'Delhi', duration: '11 Days / 10 Nights', originalPrice: 28999, discountedPrice: 24999, image: '' }],
    status: 'published'
  },
  'spiti-valley-road-trip': {
    id: 'spiti-1',
    title: 'Spiti Valley Road Trip',
    slug: 'spiti-valley-road-trip',
    description: 'Explore the cold desert, ancient monasteries, and high-altitude Himalayan villages.',
    heroImage: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&q=85',
    price: 19999,
    location: 'Spiti Valley, Himachal Pradesh',
    duration: '11 Days / 10 Nights',
    departureCity: 'Chandigarh',
    category: 'Adventure',
    difficulty: 'Moderate',
    ageLimit: '18-40 Years',
    maxAltitude: '15,000 ft',
    images: [
      'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&q=85'
    ],
    availableDates: [{ date: '2026-08-05', capacity: 15, bookedCount: 6 }],
    variants: [{ location: 'Chandigarh', duration: '11 Days / 10 Nights', originalPrice: 24999, discountedPrice: 19999, image: '' }],
    status: 'published'
  },
  'kedarkantha-trek': {
    id: 'kk-1',
    title: 'Kedarkantha Winter Trek',
    slug: 'kedarkantha-trek',
    description: 'Summit the legendary snow peak of Uttarakhand with 360-degree Himalayan views.',
    heroImage: 'https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=1200&q=85',
    price: 6499,
    location: 'Uttarakhand',
    duration: '6 Days / 5 Nights',
    departureCity: 'Dehradun',
    category: 'Trek',
    difficulty: 'Easy to Moderate',
    ageLimit: '12-45 Years',
    maxAltitude: '12,500 ft',
    images: [
      'https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=1200&q=85'
    ],
    availableDates: [{ date: '2026-08-18', capacity: 25, bookedCount: 10 }],
    variants: [{ location: 'Dehradun', duration: '6 Days / 5 Nights', originalPrice: 8999, discountedPrice: 6499, image: '' }],
    status: 'published'
  },
  'kerala-trip': {
    id: 'kerala-1',
    title: 'Kerala Backwaters & Hills Trip',
    slug: 'kerala-trip',
    description: 'Relax in green tea gardens, serene backwater houseboats, and coastal beaches.',
    heroImage: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&q=85',
    price: 19999,
    location: 'Kerala',
    duration: '9 Days / 8 Nights',
    departureCity: 'Cochin',
    category: 'Backpacking',
    difficulty: 'Easy',
    ageLimit: '12-50 Years',
    maxAltitude: '6,000 ft',
    images: [
      'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&q=85'
    ],
    availableDates: [{ date: '2026-08-20', capacity: 20, bookedCount: 5 }],
    variants: [{ location: 'Cochin', duration: '9 Days / 8 Nights', originalPrice: 24999, discountedPrice: 19999, image: '' }],
    status: 'published'
  },
  'winter-spiti-road-trip': {
    id: 'wspiti-1',
    title: 'Winter Spiti Expedition',
    slug: 'winter-spiti-road-trip',
    description: 'Experience frozen waterfalls, snow-clad landscapes, and winter wildlife in Spiti.',
    heroImage: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&q=85',
    price: 19999,
    location: 'Spiti Valley, Himachal Pradesh',
    duration: '10 Days / 9 Nights',
    departureCity: 'Chandigarh',
    category: 'Expedition',
    difficulty: 'Challenging',
    ageLimit: '18-40 Years',
    maxAltitude: '15,000 ft',
    images: [
      'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&q=85'
    ],
    availableDates: [{ date: '2026-08-25', capacity: 12, bookedCount: 4 }],
    variants: [{ location: 'Chandigarh', duration: '10 Days / 9 Nights', originalPrice: 24999, discountedPrice: 19999, image: '' }],
    status: 'published'
  }
};

export async function fetchTripBySlug(slug: string, init?: PublicRequestInit): Promise<Trip | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/trips/public/slug/${slug}`, init ?? publicRevalidate(60));
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }
  } catch (err) {
    console.warn(`fetchTripBySlug error slug=${slug}:`, err);
  }

  // Fallback map for demo/mock trip slugs so trip pages always open seamlessly
  const mockTrip = MOCK_SLUG_MAP[slug] || MOCK_SLUG_MAP[slug.toLowerCase()] || null;
  return mockTrip;
}

export async function fetchItinerary(tripId: string): Promise<ItineraryDay[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/itinerary/${tripId}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn(`fetchItinerary error tripId=${tripId}:`, err);
    return [];
  }
}

export async function fetchReviews(init?: RequestInit): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/reviews`, init ?? { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn("fetchReviews network error:", err);
    return [];
  }
}

export async function fetchPublicReviews(init?: PublicRequestInit): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/reviews/public/cards`, init ?? publicRevalidate(600));
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn("fetchPublicReviews network error:", err);
    return [];
  }
}

export async function fetchHomepageReviews(limit = 8): Promise<any[]> {
  try {
    const safeLimit = Math.max(1, Math.min(16, Math.trunc(limit)));
    const res = await fetch(`${API_BASE_URL}/reviews/public/cards?limit=${safeLimit}`, publicRevalidate(600));
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn("fetchHomepageReviews network error:", err);
    return [];
  }
}

export async function fetchBlogs(init?: RequestInit): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/blogs`, init ?? { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn("fetchBlogs network error:", err);
    return [];
  }
}

export async function fetchPublicBlogs(init?: PublicRequestInit): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/blogs/public/cards`, init ?? publicRevalidate(600));
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn("fetchPublicBlogs network error:", err);
    return [];
  }
}

export async function fetchHomepageBlogs(limit = 8): Promise<any[]> {
  try {
    const safeLimit = Math.max(1, Math.min(16, Math.trunc(limit)));
    const res = await fetch(`${API_BASE_URL}/blogs/public/cards?limit=${safeLimit}`, publicRevalidate(600));
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn("fetchHomepageBlogs network error:", err);
    return [];
  }
}

export async function fetchAttractions(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/attractions`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn("fetchAttractions network error:", err);
    return [];
  }
}

export async function fetchAttractionBySlug(slug: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/attractions/slug/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn(`fetchAttractionBySlug error slug=${slug}:`, err);
    return null;
  }
}

export async function fetchBlogBySlug(slug: string, init?: PublicRequestInit): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/blogs/public/slug/${slug}`, init ?? publicRevalidate(600));
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }
  } catch (err) {
    console.warn(`fetchBlogBySlug network error slug=${slug}:`, err);
  }

  // Graceful fallback blog for empty backend/local preview
  const formattedTitle = slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    id: `blog-${slug}`,
    title: formattedTitle || "Explore The Great Outdoors",
    slug: slug,
    category: "Travel & Expedition",
    author: "Suresh Chaudhary",
    authorRole: "Lead Himalayan Expedition Specialist",
    readTime: "6 min read",
    createdAt: new Date().toISOString(),
    image: "https://images.unsplash.com/photo-1597037750734-450f6f406560?q=80&w=2070",
    excerpt: `Discover why ${formattedTitle} is one of India's most breathtaking winter travel experiences with expert tips, packing essentials, and secret spots.`,
    highlights: [
      { title: "Snowy Mountain Vistas", desc: "Experience 360-degree panoramic views of frozen peaks & alpine valleys." },
      { title: "Guided Mountain Treks", desc: "Lead by certified safety professionals and experienced local guides." },
      { title: "Curated Stays & Culture", desc: "Cozy fireside stays, local delicacies, and warm mountain hospitality." }
    ],
    tips: [
      "Layering is key: Pack high-density thermals, a windproof outer jacket, and fleece gloves.",
      "Footwear matters: Sturdy waterproof trekking boots with good ankle support are essential.",
      "Stay Hydrated: Cold weather masks dehydration; carry a thermal thermos flask on day hikes.",
      "Respect Local Heritage: Embrace local mountain customs and leave zero trace in nature."
    ],
    gallery: [
      "https://images.unsplash.com/photo-1597037750734-450f6f406560?q=80&w=1200",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200",
      "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?q=80&w=1200"
    ],
    intro: `Kashmir in winter is a mesmerizing wonderland. Blanketed under pure white snow, the valleys of Gulmarg, Pahalgam, and Sonamarg transform into landscapes straight out of an alpine fairytale.`,
    content: `Kashmir in winter is a mesmerizing wonderland. Blanketed under pure white snow, the valleys of Gulmarg, Pahalgam, and Sonamarg transform into landscapes straight out of an alpine fairytale.

Whether you are seeking thrilling ski slopes in Gulmarg, peaceful morning rides on a frosty Dal Lake in Srinagar, or fireside evenings sipping hot Kashmiri Kahwa, a winter expedition to Kashmir is an unmissable bucket-list journey.`
  };
}

export async function fetchPageBySlug(slug: string, init?: PublicRequestInit): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/page-builder/public/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();

    if (json.success && json.data) {
      return {
        ...json.data,
        sections: (json.data.sections || []).map((s: any) => ({
          ...s,
          data: s.draft || s.content || s.data || s
        }))
      };
    }

    return null;
  } catch (error) {
    console.warn(`Public page fetch failed for ${slug}:`, error);
    return null;
  }
}

export async function fetchDraftPageBySlug(slug: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/page-builder/${slug}/draft`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();

    if (json.success && json.data) {
      return {
        ...json.data,
        sections: (json.data.sections || []).map((s: any) => ({
          ...s,
          data: s.draft || s.content || s.data || s
        }))
      };
    }

    return null;
  } catch (error) {
    console.warn(`Draft page fetch failed for ${slug}:`, error);
    return null;
  }
}

export async function fetchSettings(init?: RequestInit): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/settings`, init ?? { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn("fetchSettings error:", err);
    return null;
  }
}

export async function fetchPublicSettings(init?: PublicRequestInit): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/settings/public`, init ?? publicRevalidate(600));
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn("fetchPublicSettings error:", err);
    return null;
  }
}

export async function submitInquiry(data: any): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const json = await res.json();
    return {
      success: res.ok && json.success,
      message: json.message || (res.ok ? undefined : 'Failed to submit inquiry')
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Network error submitting inquiry'
    };
  }
}

export async function fetchTheme(init?: PublicRequestInit): Promise<any> {
  try {
    const res = await fetchWithRetry(`${API_BASE_URL}/theme/public`, init ?? publicRevalidate(600));
    if (!res || !res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn("fetchTheme error:", err);
    return null;
  }
}

export async function fetchWebsitePages(init?: PublicRequestInit): Promise<any[]> {
  try {
    const res = await fetchWithRetry(`${API_BASE_URL}/website/pages`, init ?? publicRevalidate(60));
    if (!res || !res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn("fetchWebsitePages error:", err);
    return [];
  }
}

export async function fetchWebsitePageBySlug(slug: string, init?: PublicRequestInit): Promise<any | null> {
  try {
    const res = await fetchWithRetry(`${API_BASE_URL}/website/pages/${encodeURIComponent(slug)}`, init ?? publicRevalidate(60));
    if (!res || !res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn(`fetchWebsitePageBySlug error slug=${slug}:`, err);
    return null;
  }
}

export async function fetchWebsiteSettings(init?: PublicRequestInit): Promise<Record<string, any>> {
  try {
    const res = await fetchWithRetry(`${API_BASE_URL}/website/settings`, init ?? publicRevalidate(600));
    if (!res || !res.ok) return {};
    const json = await res.json();
    return json.data || {};
  } catch (err) {
    console.warn("fetchWebsiteSettings error:", err);
    return {};
  }
}

