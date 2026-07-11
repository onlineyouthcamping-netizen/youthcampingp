import api from "./api";

export const quotationsService = {
  getAll: async () => {
    const res = await api.get("/quotations");
    return res.data.data;
  },
  getById: async (id: string) => {
    const res = await api.get(`/quotations/${id}?isAdmin=true`);
    return res.data.data;
  },
  save: async (data: any) => {
    const res = await api.post("/quotations", data);
    return res.data.data;
  },
  remove: async (id: string) => {
    const res = await api.delete(`/quotations/${id}`);
    return res.data;
  },
  extend: async (id: string, hours: number) => {
    const res = await api.patch(`/quotations/${id}/extend`, { hours });
    return res.data.data;
  }
};
