import { api } from "./api";
import { Admin, AuditLog } from "@/types";

export const adminUsersService = {
  listAdmins: async (): Promise<Admin[]> => {
    const response = await api.get("/admin/users");
    return response.data.data;
  },

  createAdmin: async (adminData: any): Promise<Admin> => {
    const response = await api.post("/admin/users", adminData);
    return response.data.data;
  },

  updateAdminRole: async (id: string, role: string): Promise<{ id: string; role: string }> => {
    const response = await api.put(`/admin/users/${id}/role`, { role });
    return response.data.data;
  },

  toggleAdminActive: async (id: string): Promise<{ id: string; isActive: boolean }> => {
    const response = await api.put(`/admin/users/${id}/toggle-active`);
    return response.data.data;
  },

  resetAdminPassword: async (id: string, password: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/admin/users/${id}/reset-password`, { password });
    return response.data;
  },

  listAuditLogs: async (): Promise<AuditLog[]> => {
    const response = await api.get("/admin/audit-logs");
    return response.data.data;
  }
};
