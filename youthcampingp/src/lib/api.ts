import { Trip, ItineraryDay } from "@/types";

const DEFAULT_API = "https://api.youthcamping.online";
let apiURL = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API;
if (!apiURL || apiURL.includes('onrender.com')) {
  apiURL = DEFAULT_API;
}
export const API_BASE_URL = apiURL.replace(/\/api$/, "") + "/api";
const IMAGE_BASE_URL = API_BASE_URL.replace("/api", "");

type PublicRequestInit = RequestInit & {
  next?: { revalidate?: number };
};

const publicRevalidate = (seconds: number): PublicRequestInit => ({
  next: { revalidate: Math.min(seconds, 60) },
});

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
    // Block broken/empty Unsplash templates
    if (url === "https://images.unsplash.com/photo-" || url.endsWith('photo-')) return undefined;
    return url;
  }

  // Handle local upload paths (handle both forward and backslashes)
  const normalizedPath = (url || '').replace(/\\/g, '/');
  if (normalizedPath && (normalizedPath.startsWith('/uploads/') || normalizedPath.startsWith('uploads/'))) {
    const fullPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
    return `${IMAGE_BASE_URL}${fullPath}`;
  }

  // Fallback for other paths that don't start with http
  // If it starts with / but isn't an upload, it's likely a frontend public asset (like /logo.png)
  if (url.startsWith('/')) {
    return url;
  }

  return url;
};

export async function fetchTrips(init?: RequestInit): Promise<Trip[]> {
  const res = await fetch(`${API_BASE_URL}/trips`, init ?? { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch trips");
  const json = await res.json();
  return json.data || [];
}

export async function fetchPublicTrips(init?: PublicRequestInit): Promise<Trip[]> {
  const res = await fetch(`${API_BASE_URL}/trips/public/cards`, init ?? publicRevalidate(180));
  if (!res.ok) throw new Error("Failed to fetch public trips");
  const json = await res.json();
  return json.data || [];
}

export async function fetchHomepageTrips(limit = 12): Promise<Trip[]> {
  const safeLimit = Math.max(1, Math.min(12, Math.trunc(limit)));
  const res = await fetch(`${API_BASE_URL}/trips/public/cards?limit=${safeLimit}`, publicRevalidate(180));
  if (!res.ok) throw new Error("Failed to fetch homepage trips");
  const json = await res.json();
  return json.data || [];
}

export async function fetchTripBySlug(slug: string, init?: PublicRequestInit): Promise<Trip | null> {
  const res = await fetch(`${API_BASE_URL}/trips/public/slug/${slug}`, init ?? publicRevalidate(60));
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

export async function fetchItinerary(tripId: string): Promise<ItineraryDay[]> {
  const res = await fetch(`${API_BASE_URL}/itinerary/${tripId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch itinerary");
  return res.json();
}

export async function fetchReviews(init?: RequestInit): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/reviews`, init ?? { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch reviews");
  const json = await res.json();
  return json.data || [];
}

export async function fetchPublicReviews(init?: PublicRequestInit): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/reviews/public/cards`, init ?? publicRevalidate(600));
  if (!res.ok) throw new Error("Failed to fetch public reviews");
  const json = await res.json();
  return json.data || [];
}

export async function fetchHomepageReviews(limit = 8): Promise<any[]> {
  const safeLimit = Math.max(1, Math.min(16, Math.trunc(limit)));
  const res = await fetch(`${API_BASE_URL}/reviews/public/cards?limit=${safeLimit}`, publicRevalidate(600));
  if (!res.ok) throw new Error("Failed to fetch homepage reviews");
  const json = await res.json();
  return json.data || [];
}

export async function fetchBlogs(init?: RequestInit): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/blogs`, init ?? { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch blogs");
  const json = await res.json();
  return json.data || [];
}

export async function fetchPublicBlogs(init?: PublicRequestInit): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/blogs/public/cards`, init ?? publicRevalidate(600));
  if (!res.ok) throw new Error("Failed to fetch public blogs");
  const json = await res.json();
  return json.data || [];
}

export async function fetchHomepageBlogs(limit = 8): Promise<any[]> {
  const safeLimit = Math.max(1, Math.min(16, Math.trunc(limit)));
  const res = await fetch(`${API_BASE_URL}/blogs/public/cards?limit=${safeLimit}`, publicRevalidate(600));
  if (!res.ok) throw new Error("Failed to fetch homepage blogs");
  const json = await res.json();
  return json.data || [];
}

export async function fetchAttractions(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/attractions`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch attractions");
  const json = await res.json();
  return json.data || [];
}

export async function fetchAttractionBySlug(slug: string): Promise<any | null> {
  const res = await fetch(`${API_BASE_URL}/attractions/slug/${slug}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

export async function fetchBlogBySlug(slug: string, init?: PublicRequestInit): Promise<any | null> {
  const res = await fetch(`${API_BASE_URL}/blogs/public/slug/${slug}`, init ?? publicRevalidate(600));
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

export async function fetchPageBySlug(slug: string, init?: PublicRequestInit): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/page-builder/public/${slug}`, init ?? publicRevalidate(60));
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
    console.error(`Public page fetch failed for ${slug}:`, error);
    return null;
  }
}

export async function fetchDraftPageBySlug(slug: string): Promise<any | null> {
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
}

export async function fetchSettings(init?: RequestInit): Promise<any | null> {
  const res = await fetch(`${API_BASE_URL}/settings`, init ?? { cache: 'no-store' });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

export async function fetchPublicSettings(init?: PublicRequestInit): Promise<any | null> {
  const res = await fetch(`${API_BASE_URL}/settings/public`, init ?? publicRevalidate(600));
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

export async function submitInquiry(data: any): Promise<{ success: boolean; message?: string }> {
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
}
export async function fetchTheme(init?: PublicRequestInit): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/theme/public`, init ?? publicRevalidate(600));
  if (!res.ok) return null;
  return res.json();
}
