export interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  admin: Admin;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  location: string;
  activities: string[];
  stay: string;
  meals: string;
  photos: string[];
}

export interface FAQ {
  question: string;
  answer: string;
  order?: number;
}

export interface TripVariant {
  location: string;
  duration: string;
  originalPrice: number;
  discountedPrice: number;
  image: string;
  skipDays?: number;
  excludeTravel?: boolean;
}

export interface TravelOption {
  label: string;
  priceDelta: number;
  description?: string;
}

export interface TripAddon {
  id?: string;
  name: string;
  rate: number;
  description: string;
  minQuantity: number;
  maxQuantity: number;
}

export interface RoomOption {
  label: string;
  priceDelta: number;
}

export interface AvailableDate {
  date: string;
  capacity: number;
  bookedCount: number;
}

export interface Trip {
  id: string;
  _id?: string;
  title: string;
  slug: string;
  description: string;
  heroImage: string;
  price: number;
  location: string;
  duration: string;
  category: string;
  images: string[];
  gallery?: { url: string; alt: string; order: number }[];
  stickyCardPrice?: number;
  stickyCardLabel?: string;
  itinerary: ItineraryDay[];
  highlights: any[];

  inclusions: string[];
  exclusions: string[];
  faqs: FAQ[];
  availableDates: AvailableDate[];
  variants: TripVariant[];
  travelOptions: TravelOption[];
  roomOptions: RoomOption[];
  addons: TripAddon[];
  status: "draft" | "published";
  maxGroupSize?: number;
  difficulty?: "easy" | "moderate" | "hard";
  departureCity?: string;
  ageLimit?: string;
  maxAltitude?: string;
  bookingUrl?: string;

  attractions?: {
    name: string;
    description?: string;
    image: string;
    slug: string;
    order?: number;
  }[];
  activities?: {
    name: string;
    description?: string;
    image: string;
    slug: string;
    order?: number;
  }[];
  accommodations?: {
    name: string;
    location: string;
    nights: string;
    type: string;
    starRating: string;
    roomType: string;
    meals: string;
    image: string;
    gallery: { url: string; category: string }[];
  }[];
  popupDetails?: {
    cancellation: { label: string; val: string }[];
    gears: { item: string; price: string }[];
    terms: string[];
    carry: { label: string; val: string }[];
    etiquette: { title: string; desc: string }[];
    showRentedGears?: boolean;
  };
  videos?: { id: string; title: string }[];
  reels?: { url: string; thumbnail: string; caption: string }[];
  reviews?: Review[];
  route?: { label: string; icon: "plane" | "car" | "train" }[];
  createdAt: string;
  updatedAt: string;
}

export interface TrainTicket {
  pnr: string;
  trainNo: string;
  trainName: string;
  from: string;
  to: string;
  departureDate?: string;
  arrivalDate?: string;
  coach: string;
  seat: string;
  status: string;
  ticketUrl?: string;
}

export interface Booking {
  id: string;
  userName: string;
  email: string;
  phone: string;
  tripId: string;
  tripTitle?: string;
  travelers: number;
  travelDate?: string;
  amount: number;
  paidAmount: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "unpaid" | "partial" | "paid";
  notes           ?: string;
  adminNotes      ?: string;
  trainTickets    ?: TrainTicket[];
  createdAt: string;
  updatedAt: string;
}

export type BookingFormData = Omit<Booking, "id" | "createdAt" | "updatedAt" | "tripTitle">;

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  tripTitle?: string;
  date?: string;
  count?: number;
  read: boolean;
  status: 'new' | 'contacted' | 'converted' | 'closed';
  isDuplicate?: boolean;
  convertedAmount?: number;
  adminNotes?: string;
  responseTimeMinutes?: number;
  createdAt: string;
}

export interface ThemeSettings {
  primaryColor: string;
  accentColor: string;
  borderRadius: number;
  primaryFont: string;
  handwritingFont?: string;
  headerTitle?: string;
}

export interface DimensionsSettings {
  heroHeight: number;
  containerWidth: number;
  sectionSpacing: number;
}

export interface MediaItem {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
  createdAt: string;
}

export interface SiteSettings {
  siteName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  currency: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
    linkedin: string;
  };
  logo: string;
  favicon: string;
  theme: ThemeSettings;
  dimensions: DimensionsSettings;
  organization: {
    name: string;
    logo: string;
    website: string;
    supportEmail: string;
    supportPhone: string;
    mailingAddress: string;
  };
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
    isEnabled: boolean;
  };
}

export interface DashboardStats {
  totalTrips: number;
  totalBookings: number;
  totalRevenue: number;
  totalInquiries: number;
  recentBookings: Booking[];
  monthlyRevenue: { month: string; revenue: number }[];
  bookingsByStatus: { status: string; count: number }[];
}

export type TripFormData = Omit<Trip, "id" | "createdAt" | "updatedAt">;

export interface Blog {
  id: string;
  title: string;
  slug: string;
  author: string;
  authorImage?: string;
  content: string;
  image: string;
  readTime: string;
  hasVideo: boolean;
  status: "draft" | "published";
  createdAt: string;
}

export type BlogFormData = Omit<Blog, "id" | "slug" | "createdAt">;

export interface Review {
  id: string;
  _id?: string;
  userName: string;
  city: string;
  userImage: string;
  rating: number;
  comment: string;
  tripName: string;
  tripId?: string;
  instagram?: string;
  isFeatured: boolean;
  photos: string[];
  tripType?: string;
  createdAt: string;
}

export interface Hotel {
  id?: string;
  name: string;
  location: string;
  rating?: number;
  stars?: number;
  description?: string;
  roomType?: string;
  meals?: string;
  photos?: string[];
  image: string;
  amenities?: string[];
  isRecommended?: boolean;
}

export interface DayItinerary {
  id?: string;
  day: number;
  title: string;
  description: string;
  location?: string;
  activities?: string[];
  photos: string[];
  meals?: string;
  stay?: string;
}

export interface Flight {
  airline: string;
  flightNo: string;
  type: "departure" | "return" | "internal";
  date: string;
  segments: {
    from: string;
    to: string;
    departureTime: string;
    arrivalTime: string;
    layover?: string;
  }[];
  luggage: {
    cabin: string;
    checkin: string;
  };
}

export interface Quotation {
  id: string;
  slug: string;
  status: 'draft' | 'published';
  
  // Customer Info
  customerName: string;
  customerPhone: string;
  customerEmail?: string;

  // Trip Info
  tripTitle: string;
  destination: string;
  duration: string;
  travelDates: {
    from: string;
    to: string;
  };
  pax: number;
  paxCount?: number;

  // Pricing
  totalPrice: number;
  basePrice?: number;
  discount: number;
  finalPrice: number;
  advancePayment?: number;

  // Content Sections
  overview?: string;
  itinerary: DayItinerary[];
  inclusions: string[];
  exclusions: string[];

  // Media
  coverImage?: string;
  heroImage?: string;
  heroImages?: string[];

  // Admin Meta
  viewCount: number;
  expiresAt?: string;
  expiryTime?: string;
  expired?: boolean;
  
  // Legacy support for Expert (can be moved to global settings later)
  expert: {
    name: string;
    photo?: string;
    whatsapp: string;
    designation?: string;
    description?: string;
    phone?: string;
  };

  agent?: {
    name: string;
    photo?: string;
    role: string;
    phone: string;
    whatsapp?: string;
  };

  createdAt: string;
  updatedAt: string;
  
  // Optional/Legacy fields from previous versions
  experiencePhotos?: string[];
  sightseeingCount?: number;
  reviews?: any[];
  lowLevelPrice?: number;
  highLevelPrice?: number;
  lowLevelHotels?: Hotel[];
  highLevelHotels?: Hotel[];
  travelling?: { label: string; icon: string }[];
  staySummary?: { nights: number; location: string }[];
  roomsInfo?: string;
  mealsInfo?: string;
  flights?: Flight[];
}
