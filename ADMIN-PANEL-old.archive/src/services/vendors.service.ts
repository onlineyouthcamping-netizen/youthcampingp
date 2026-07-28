import api from "./api";
import type { Vendor, TripVendor, TripVendorSummary } from "@/types";

export const vendorsService = {
  // ─── Vendor CRUD ──────────────────────────
  async getAll(): Promise<Vendor[]> {
    const res = await api.get("/vendors");
    return res.data.data;
  },

  async getById(id: string): Promise<Vendor> {
    const res = await api.get(`/vendors/${id}`);
    return res.data.data;
  },

  async create(data: Partial<Vendor>): Promise<Vendor> {
    const res = await api.post("/vendors", data);
    return res.data.data;
  },

  async update(id: string, data: Partial<Vendor>): Promise<Vendor> {
    const res = await api.put(`/vendors/${id}`, data);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/vendors/${id}`);
  },

  // ─── Trip-Vendor Assignments ──────────────
  async getForTrip(tripId: string): Promise<{ assignments: TripVendor[]; summary: TripVendorSummary }> {
    const res = await api.get(`/vendors/trip/${tripId}`);
    return { assignments: res.data.data, summary: res.data.summary };
  },

  async getBulkForTrips(tripIds?: string[]): Promise<Record<string, TripVendor[]>> {
    const query = tripIds && tripIds.length > 0 ? `?tripIds=${tripIds.join(",")}` : "";
    const res = await api.get(`/vendors/bulk${query}`);
    return res.data.data;
  },

  async assignToTrip(data: {
    tripId: string;
    vendorId: string;
    agreedCost: number;
    notes?: string;
  }): Promise<TripVendor> {
    const res = await api.post("/vendors/trip-assign", data);
    return res.data.data;
  },

  async updateAssignment(id: string, data: Partial<TripVendor>): Promise<TripVendor> {
    const res = await api.put(`/vendors/trip-assign/${id}`, data);
    return res.data.data;
  },

  async removeAssignment(id: string): Promise<void> {
    await api.delete(`/vendors/trip-assign/${id}`);
  },
};
