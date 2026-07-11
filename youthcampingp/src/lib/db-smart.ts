import { Quotation } from "@/types";
import { API_BASE_URL } from "./api";

// Fallback for demo/missing data
// Fallback for demo/missing data
const PREDEFINED_QUOTES: Record<string, any> = {
    "kashmir-parth": {
        id: "demo-kashmir",
        slug: "kashmir-parth",
        tripTitle: "Heavenly Kashmir: The Paradise on Earth",
        customerName: "Parth",
        duration: "4 Days / 3 Nights",
        paxCount: 2,
        travelDates: {
            from: "2026-06-15",
            to: "2026-06-18"
        },
        basePrice: 45000,
        discount: 10000,
        finalPrice: 35000,
        lowLevelPrice: 35000,
        highLevelPrice: 48000,
        advancePayment: 5000,
        heroImage: "https://images.unsplash.com/photo-1598330094281-0552768e62c1?q=80&w=2000",
        overview: "Experience the timeless beauty of Kashmir. From the serene Dal Lake houseboats to the snow-capped meadows of Gulmarg, this 4-day curated journey is designed for those who seek the perfect blend of luxury and natural wonder.",
        expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        status: "published",
        agent: {
            name: "Bhautik Bhut",
            photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400",
            role: "Kashmir Destination Expert",
            phone: "919000000000"
        },
        itinerary: [
            {
                day: 1,
                title: "The Floating World: Dal Lake Arrival",
                description: "Arrive in Srinagar and check into your luxury carved Cedar-wood houseboat. In the evening, enjoy a 90-minute private Shikara ride through the floating gardens as the sun sets behind the Zabarwan range.",
                photos: ["https://images.unsplash.com/photo-1566833925222-792012999b42?q=80&w=1000"]
            },
            {
                day: 2,
                title: "Gulmarg: The Meadow of Flowers",
                description: "Travel to Gulmarg. Take the world's second-highest cable car, the Gondola, up to Phase 2 (13,780 ft) for breathtaking views of Mt. Apharwat. Afternoon walk through the lush green golf courses.",
                photos: ["https://images.unsplash.com/photo-1621644788174-89745e998782?q=80&w=1000"]
            },
            {
                day: 3,
                title: "Pahalgam: The Lidder Valley Bliss",
                description: "Drive to Pahalgam, the 'Valley of Shepherds'. Visit the famous Saffron fields en route. Relax by the Lidder River or take a pony ride to the stunning Baisaran Valley (Mini Switzerland).",
                photos: ["https://images.unsplash.com/photo-1598330094281-0552768e62c1?q=80&w=1000"]
            },
            {
                day: 4,
                title: "Farewell to the Valley",
                description: "After a traditional Kashmiri breakfast, visit the Mughal Gardens (Nishat & Shalimar) before departing for the airport with memories of a lifetime.",
                photos: ["https://images.unsplash.com/photo-1591389067442-a25a21d3399b?q=80&w=1000"]
            }
        ],
        lowLevelHotels: [
            {
                name: "The Royal Houseboat",
                location: "Dal Lake, Srinagar",
                stars: 4,
                image: "https://images.unsplash.com/photo-1566833925222-792012999b42?q=80&w=800",
                description: "Authentic hand-carved cedar wood houseboat with modern amenities.",
                amenities: ["Free Wifi", "Room Service", "Lake View"]
            },
            {
                name: "Hotel Pine Spring",
                location: "Gulmarg",
                stars: 4,
                image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800",
                description: "Comfortable alpine stay with mountain views.",
                amenities: ["Heated Rooms", "Restaurant", "Parking"]
            }
        ],
        highLevelHotels: [
            {
                name: "The Khyber Himalayan Resort",
                location: "Gulmarg",
                stars: 5,
                image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800",
                description: "The crown jewel of Gulmarg. World-class luxury with heated pools and floor-to-ceiling mountain views.",
                amenities: ["Spa", "Infinity Pool", "Heated Floors", "Luxury Dining"]
            },
            {
                name: "Vivanta Dal View",
                location: "Srinagar",
                stars: 5,
                image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800",
                description: "Perched on a hill overlooking the Dal Lake, offering the most iconic sunrise views in the valley.",
                amenities: ["360 View", "Fitness Center", "Gourmet Kitchen"]
            }
        ],
        inclusions: ["Luxury Accommodations", "Private A/C SUV Transfers", "Daily Breakfast & Dinner", "Shikara Ride", "Toll & Parking Fees"],
        exclusions: ["Airfare", "Gondola Tickets", "Lunch", "Personal Expenses", "Travel Insurance"]
    }
};

export async function getQuotationSmart(idOrSlug: string, isAdmin: boolean = false, token: string = ''): Promise<Quotation | null> {
    console.log(`[db-smart] Fetching: "${idOrSlug}" (isAdmin: ${isAdmin}, token: ${token})`);

    // 1. Try local CRM API (Production Fallback)
    let CRM_BASE = process.env.CRM_API_URL || API_BASE_URL;
    if (!CRM_BASE || CRM_BASE.includes('onrender.com')) {
        console.warn('[db-smart] Stale Render URL detected. Forcing fallback to Hostinger VPS.');
        CRM_BASE = 'https://api.youthcamping.online/api';
    }
    // Ensure it ends with /api for consistency with backend routes
    if (!CRM_BASE.endsWith('/api')) {
        CRM_BASE = `${CRM_BASE}/api`;
    }
    
    // Safety check: if API_BASE_URL already contains /api, don't double it
    const finalUrl = `${CRM_BASE.replace(/\/api\/api$/, '/api')}/quotations/${idOrSlug}?isAdmin=${isAdmin}&token=${token}`;
    console.log(`[db-smart] Checking CRM API at: ${finalUrl}`);
    try {
        const crmRes = await fetch(finalUrl, { cache: 'no-store' });
        if (crmRes.ok) {
            const crmData = await crmRes.json();
            if (crmData.success && crmData.data) {
                console.log(`[db-smart] Found in CRM API: "${idOrSlug}"`, crmData.data);
                const record = crmData.data;
                
                console.log(`[db-smart] CRM Record Keys:`, Object.keys(record));
                console.log(`[db-smart] Hotels Data:`, { low: record.lowLevelHotels?.length, high: record.highLevelHotels?.length });

                return {
                    ...record,
                    tripTitle: record.tripTitle || record.destination || "Premium Trip",
                    id: record.id,
                    slug: record.slug,
                    customerName: record.customerName || "Valued Traveler",
                    duration: record.duration || "5D/4N",
                    travelDates: record.travelDates,
                    paxCount: record.pax || 2,
                    pax: record.pax || 2, 
                    basePrice: record.totalPrice || 0,
                    totalPrice: record.totalPrice || 0, 
                    discount: record.discount || 0,
                    finalPrice: record.finalPrice || 0,
                    advancePayment: record.advanceAmount || 5000,
                    
                    // Unified System Fields
                    heroImage: record.coverImage || record.heroImage || "https://images.unsplash.com/photo-1506929113675-b92417bbbe8d?q=80&w=2000",
                    coverImage: record.coverImage || record.heroImage || "https://images.unsplash.com/photo-1506929113675-b92417bbbe8d?q=80&w=2000",
                    experiencePhotos: record.experiencePhotos || [],
                    
                    // Fallback to record.hotels if specific levels are missing
                    lowLevelHotels: (record.lowLevelHotels && record.lowLevelHotels.length > 0) ? record.lowLevelHotels : (record.hotels || []),
                    highLevelHotels: (record.highLevelHotels && record.highLevelHotels.length > 0) ? record.highLevelHotels : (record.hotels || []),
                    lowLevelPrice: record.lowLevelPrice || record.finalPrice,
                    highLevelPrice: record.highLevelPrice || (record.finalPrice * 1.2),
                    
                    overview: record.overview || record.description || "",
                    itinerary: (record.itinerary || []).map((day: any) => ({
                        ...day,
                        photos: (day.photos && day.photos.length > 0) ? day.photos : []
                    })),
                    inclusions: record.inclusions || [],
                    exclusions: record.exclusions || [],
                    agent: {
                        name: record.expert?.name || "Suresh Chaudhary",
                        photo: record.expert?.photo || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400",
                        role: record.expert?.designation || record.expert?.role || "Verified Travel Expert",
                        phone: record.expert?.whatsapp || record.expert?.phone || "919000000000",
                    },
                    expert: record.expert, 
                    expiryTime: record.expiresAt || record.expiryTime || record.expiryDate,
                    status: (record.status || 'draft').toLowerCase(),
                    expired: record.isExpired || false
                } as any;
            }
        }
    } catch (e: any) {
        console.warn(`[db-smart] CRM API fetch failed: ${e.message}`);
    }

    // 2. Predefined fallback
    if (PREDEFINED_QUOTES[idOrSlug]) {
        return PREDEFINED_QUOTES[idOrSlug];
    }

    return null;
}
