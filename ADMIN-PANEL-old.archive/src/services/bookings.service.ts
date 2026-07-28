import axios from "axios";
import api from "./api";
import type { Booking, BookingTrip } from "@/types";

export const bookingsService = {
  // ── BOOKINGS ──
  
  async getAll(filters?: {
    status?: string;
    tripId?: string;
    paymentStatus?: string;
    payment_status?: string;
    search?: string;
    salesAdminId?: string;
    balanceOnly?: boolean | string;
    bookingStart?: string;
    bookingEnd?: string;
    depStart?: string;
    depEnd?: string;
    page?: number;
    limit?: number;
  }, signal?: AbortSignal): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== "" && String(val).toLowerCase() !== "all") {
            params.append(key, String(val));
          }
        });
      }

      const res = await api.get(`/bookings?${params.toString()}`, { signal });
      return res.data;
    } catch (err) {
      if (axios.isCancel?.(err) || (err as any)?.name === 'CanceledError' || (err as any)?.name === 'AbortError') {
        console.log("ℹ️ Request cancelled");
        throw err;
      }
      console.error("🔥 Bookings fetch failed:", err);
      throw err;
    }
  },

  async getById(id: string): Promise<Booking> {
    const res = await api.get(`/bookings/${id}`);
    return res.data.data;
  },

  async create(data: any): Promise<Booking> {
    const res = await api.post("/bookings", data);
    return res.data.data;
  },

  async update(id: string, data: any): Promise<Booking> {
    const res = await api.put(`/bookings/${id}`, data);
    return res.data.data;
  },

  async confirm(id: string, data: { totalAmount: number; advancePaid: number; paymentMode: string; paymentStatus: string }): Promise<Booking> {
    const res = await api.put(`/bookings/${id}/confirm`, data);
    return res.data.data;
  },

  async confirmPayment(id: string): Promise<Booking> {
    const res = await api.patch(`/bookings/${id}/confirm-payment`);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/bookings/${id}`);
  },

  // ── TRIPS ──

  async getTrips(): Promise<BookingTrip[]> {
    try {
      const res = await api.get("/bookings/trips");
      return res.data.data;
    } catch (err) {
      console.error("🔥 Trips fetch failed:", err);
      throw err;
    }
  },

  async createTrip(data: { tripCode: string; tripName: string; price?: number }): Promise<BookingTrip> {
    const res = await api.post("/bookings/trips", data);
    return res.data.data;
  },

  async updateTrip(id: string, data: { tripCode?: string; tripName?: string; price?: number }): Promise<BookingTrip> {
    const res = await api.put(`/bookings/trips/${id}`, data);
    return res.data.data;
  },

  async deleteTrip(id: string): Promise<void> {
    await api.delete(`/bookings/trips/${id}`);
  },

  // ── EMAILS ──

  async sendEmail(bookingId: string, type: 'confirmation' | 'payment' | 'reminder' | 'cancellation' | 'invoice', amount?: number): Promise<void> {
    console.log("📡 [bookingsService] Sending email request:", { bookingId, type, amount });
    await api.post("/emails/send", { 
      bookingId, 
      type, 
      amount: amount || 0 
    });
  },

  async getEmailLogs(bookingId: string): Promise<any[]> {
    const res = await api.get(`/emails/logs/${bookingId}`);
    return res.data;
  },

  async getActivityLogs(bookingId: string): Promise<any[]> {
    const res = await api.get(`/bookings/${bookingId}/activity-logs`);
    return res.data.data;
  },

  async getTasks(bookingId: string): Promise<any[]> {
    const res = await api.get(`/bookings/${bookingId}/tasks`);
    return res.data.data;
  },

  async createTask(bookingId: string, data: any): Promise<any> {
    const res = await api.post(`/bookings/${bookingId}/tasks`, data);
    return res.data.data;
  },

  async updateTask(taskId: string, status: string): Promise<any> {
    const res = await api.put(`/bookings/tasks/${taskId}`, { status });
    return res.data.data;
  },

  async getColleagues(): Promise<any[]> {
    const res = await api.get('/bookings/colleagues/list');
    return res.data.data;
  }
};
