import { logger } from "./logger";

const MAIN_BACKEND_URL = process.env.MAIN_BACKEND_URL || "http://localhost:3001/api";
const MAIN_BACKEND_TOKEN = process.env.MAIN_BACKEND_TOKEN || "";

export interface MainBackendTrip {
  id: string;
  title: string;
  slug: string;
  location: string;
  duration: string;
  description: string;
  price: number;
  status: string;
}

export interface MainBackendBooking {
  id: string;
  bookingId: string;
  name: string;
  fullName?: string;
  phone: string;
  mobile?: string;
  email: string;
  departureDate: string;
  pickupCity: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  advancePaid: number;
  remainingAmount: number;
  numberOfTravelers: number;
  passengers?: any[];
  age?: number;
  gender?: string;
}

export async function fetchTrips(): Promise<MainBackendTrip[]> {
  try {
    const url = `${MAIN_BACKEND_URL}/trips?status=all`;
    logger.info(`Fetching trips from main backend: ${url}`);
    const headers: HeadersInit = {};
    if (MAIN_BACKEND_TOKEN) {
      headers["Authorization"] = `Bearer ${MAIN_BACKEND_TOKEN}`;
    }
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Failed to fetch trips. Status: ${res.status}`);
    }
    const json = await res.json() as { success: boolean; data: MainBackendTrip[] };
    return json.data || [];
  } catch (err) {
    logger.error({ err }, "Error in fetchTrips proxy");
    return [];
  }
}

export async function fetchBookingsForTrip(tripId: string): Promise<MainBackendBooking[]> {
  try {
    const url = `${MAIN_BACKEND_URL}/bookings?tripId=${encodeURIComponent(tripId)}`;
    logger.info(`Fetching bookings from main backend: ${url}`);
    const headers: HeadersInit = {};
    if (MAIN_BACKEND_TOKEN) {
      headers["Authorization"] = `Bearer ${MAIN_BACKEND_TOKEN}`;
    }
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Failed to fetch bookings. Status: ${res.status}`);
    }
    const json = await res.json() as { success: boolean; data: MainBackendBooking[] };
    return json.data || [];
  } catch (err) {
    logger.error({ err }, "Error in fetchBookingsForTrip proxy");
    return [];
  }
}

export async function updateBookingInMainBackend(bookingId: string, updateData: any): Promise<boolean> {
  try {
    const url = `${MAIN_BACKEND_URL}/bookings/${encodeURIComponent(bookingId)}`;
    logger.info(`Updating booking in main backend: ${url}`);
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (MAIN_BACKEND_TOKEN) {
      headers["Authorization"] = `Bearer ${MAIN_BACKEND_TOKEN}`;
    }
    const res = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(updateData),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to update booking. Status: ${res.status}. Response: ${text}`);
    }
    return true;
  } catch (err) {
    logger.error({ err }, "Error in updateBookingInMainBackend proxy");
    return false;
  }
}

