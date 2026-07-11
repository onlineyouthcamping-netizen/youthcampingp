import api from "./api";
import type { DashboardStats } from "@/types";

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const res = await api.get("/admin/stats");
    return res.data.data;
  },
};
