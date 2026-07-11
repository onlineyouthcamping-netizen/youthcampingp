import api from "./api";
import type { Inquiry } from "@/types";

export const inquiriesService = {
  async getAll(): Promise<Inquiry[]> {
    const res = await api.get("/inquiries");
    return res.data.data;
  },

  async markAsRead(id: string): Promise<Inquiry> {
    const res = await api.patch(`/inquiries/${id}/status`, { status: "read" });
    return res.data.data;
  },

  async update(id: string, data: Partial<Inquiry>): Promise<Inquiry> {
    const res = await api.patch(`/inquiries/${id}/status`, data);
    return res.data.data;
  },
};
