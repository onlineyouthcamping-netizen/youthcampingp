import api from "./api";

export const settingsService = {
  async get() {
    const res = await api.get("/settings");
    return res.data.data;
  },

  async update(data: any) {
    const res = await api.put("/settings", data);
    return res.data.data;
  },

  async getDraft() {
    const res = await api.get("/settings/draft");
    return res.data.data;
  },

  async getFooter() {
    const res = await api.get("/settings/footer");
    return res.data.data;
  },

  async updateFooter(data: any) {
    const res = await api.put("/settings/footer", data);
    return res.data.data;
  }
};
