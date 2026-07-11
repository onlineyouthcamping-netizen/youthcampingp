import api from "./api";

const BASE = "/package-builder";

export const packageBuilderService = {
  // ── MASTER DATA ──

  // States
  async getStates(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{
    success: boolean;
    data: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const res = await api.get(`${BASE}/master/states`, { params });
    return res.data;
  },

  async createState(data: { name: string; isActive?: boolean }): Promise<any> {
    const res = await api.post(`${BASE}/master/states`, data);
    return res.data;
  },

  async updateState(
    id: string,
    data: { name?: string; isActive?: boolean }
  ): Promise<any> {
    const res = await api.put(`${BASE}/master/states/${id}`, data);
    return res.data;
  },

  async deleteState(id: string): Promise<any> {
    const res = await api.delete(`${BASE}/master/states/${id}`);
    return res.data;
  },

  // Cities
  async getCities(params?: {
    stateId?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<any> {
    const res = await api.get(`${BASE}/master/cities`, { params });
    return res.data;
  },

  async createCity(data: {
    stateId: string;
    name: string;
    isActive?: boolean;
  }): Promise<any> {
    const res = await api.post(`${BASE}/master/cities`, data);
    return res.data;
  },

  async updateCity(id: string, data: any): Promise<any> {
    const res = await api.put(`${BASE}/master/cities/${id}`, data);
    return res.data;
  },

  async deleteCity(id: string): Promise<any> {
    const res = await api.delete(`${BASE}/master/cities/${id}`);
    return res.data;
  },

  // Hotels
  async getHotels(params?: {
    cityId?: string;
    stateId?: string;
    category?: string;
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const res = await api.get(`${BASE}/master/hotels`, { params });
    return res.data;
  },

  async createHotel(data: any): Promise<any> {
    const res = await api.post(`${BASE}/master/hotels`, data);
    return res.data;
  },

  async updateHotel(id: string, data: any): Promise<any> {
    const res = await api.put(`${BASE}/master/hotels/${id}`, data);
    return res.data;
  },

  async deleteHotel(id: string): Promise<any> {
    const res = await api.delete(`${BASE}/master/hotels/${id}`);
    return res.data;
  },

  async getHotelTariffs(hotelId: string): Promise<any> {
    const res = await api.get(
      `${BASE}/master/hotels/${hotelId}/tariffs`
    );
    return res.data;
  },

  async createHotelTariff(
    hotelId: string,
    data: {
      startDate: string;
      endDate: string;
      roomRate: number;
      label?: string;
    }
  ): Promise<any> {
    const res = await api.post(
      `${BASE}/master/hotels/${hotelId}/tariffs`,
      data
    );
    return res.data;
  },

  async deleteHotelTariff(
    hotelId: string,
    tariffId: string
  ): Promise<any> {
    const res = await api.delete(
      `${BASE}/master/hotels/${hotelId}/tariffs/${tariffId}`
    );
    return res.data;
  },

  // Vehicles
  async getVehicles(params?: {
    cityId?: string;
    isAc?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const res = await api.get(`${BASE}/master/vehicles`, { params });
    return res.data;
  },

  async createVehicle(data: any): Promise<any> {
    const res = await api.post(`${BASE}/master/vehicles`, data);
    return res.data;
  },

  async updateVehicle(id: string, data: any): Promise<any> {
    const res = await api.put(`${BASE}/master/vehicles/${id}`, data);
    return res.data;
  },

  async deleteVehicle(id: string): Promise<any> {
    const res = await api.delete(`${BASE}/master/vehicles/${id}`);
    return res.data;
  },

  async getVehicleTariffs(vehicleId: string): Promise<any> {
    const res = await api.get(
      `${BASE}/master/vehicles/${vehicleId}/tariffs`
    );
    return res.data;
  },

  async createVehicleTariff(
    vehicleId: string,
    data: any
  ): Promise<any> {
    const res = await api.post(
      `${BASE}/master/vehicles/${vehicleId}/tariffs`,
      data
    );
    return res.data;
  },

  async deleteVehicleTariff(
    vehicleId: string,
    tariffId: string
  ): Promise<any> {
    const res = await api.delete(
      `${BASE}/master/vehicles/${vehicleId}/tariffs/${tariffId}`
    );
    return res.data;
  },

  // Transfer Routes
  async getTransferRoutes(params?: {
    fromCityId?: string;
    toCityId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const res = await api.get(`${BASE}/master/transfer-routes`, {
      params,
    });
    return res.data;
  },

  async createTransferRoute(data: any): Promise<any> {
    const res = await api.post(
      `${BASE}/master/transfer-routes`,
      data
    );
    return res.data;
  },

  async updateTransferRoute(id: string, data: any): Promise<any> {
    const res = await api.put(
      `${BASE}/master/transfer-routes/${id}`,
      data
    );
    return res.data;
  },

  async deleteTransferRoute(id: string): Promise<any> {
    const res = await api.delete(
      `${BASE}/master/transfer-routes/${id}`
    );
    return res.data;
  },

  // Activities
  async getActivities(params?: {
    cityId?: string;
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const res = await api.get(`${BASE}/master/activities`, { params });
    return res.data;
  },

  async createActivity(data: any): Promise<any> {
    const res = await api.post(`${BASE}/master/activities`, data);
    return res.data;
  },

  async updateActivity(id: string, data: any): Promise<any> {
    const res = await api.put(
      `${BASE}/master/activities/${id}`,
      data
    );
    return res.data;
  },

  async deleteActivity(id: string): Promise<any> {
    const res = await api.delete(
      `${BASE}/master/activities/${id}`
    );
    return res.data;
  },

  // Meal Plans
  async getMealPlans(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const res = await api.get(`${BASE}/master/meal-plans`, { params });
    return res.data;
  },

  async createMealPlan(data: any): Promise<any> {
    const res = await api.post(`${BASE}/master/meal-plans`, data);
    return res.data;
  },

  async updateMealPlan(id: string, data: any): Promise<any> {
    const res = await api.put(
      `${BASE}/master/meal-plans/${id}`,
      data
    );
    return res.data;
  },

  async deleteMealPlan(id: string): Promise<any> {
    const res = await api.delete(
      `${BASE}/master/meal-plans/${id}`
    );
    return res.data;
  },

  // Vendors
  async getPackageVendors(params?: {
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const res = await api.get(`${BASE}/master/vendors`, { params });
    return res.data;
  },

  async createPackageVendor(data: any): Promise<any> {
    const res = await api.post(`${BASE}/master/vendors`, data);
    return res.data;
  },

  async updatePackageVendor(id: string, data: any): Promise<any> {
    const res = await api.put(
      `${BASE}/master/vendors/${id}`,
      data
    );
    return res.data;
  },

  async deletePackageVendor(id: string): Promise<any> {
    const res = await api.delete(
      `${BASE}/master/vendors/${id}`
    );
    return res.data;
  },

  // Dashboard Stats
  async getMasterDashboardStats(): Promise<any> {
    const res = await api.get(`${BASE}/master/dashboard-stats`);
    return res.data;
  },

  // ── PACKAGE DRAFTS ──

  async getPackageDrafts(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const res = await api.get(`${BASE}/drafts`, { params });
    return res.data;
  },

  async createPackageDraft(data: any): Promise<any> {
    const res = await api.post(`${BASE}/drafts`, data);
    return res.data;
  },

  async getPackageDraft(id: string): Promise<any> {
    const res = await api.get(`${BASE}/drafts/${id}`);
    return res.data;
  },

  async updatePackageDraft(id: string, data: any): Promise<any> {
    const res = await api.put(`${BASE}/drafts/${id}`, data);
    return res.data;
  },

  async deletePackageDraft(id: string): Promise<any> {
    const res = await api.delete(`${BASE}/drafts/${id}`);
    return res.data;
  },

  async duplicatePackageDraft(id: string): Promise<any> {
    const res = await api.post(`${BASE}/drafts/${id}/duplicate`);
    return res.data;
  },

  // Itinerary Days
  async addItineraryDay(draftId: string, data: any): Promise<any> {
    const res = await api.post(
      `${BASE}/drafts/${draftId}/itinerary-days`,
      data
    );
    return res.data;
  },

  async updateItineraryDay(
    draftId: string,
    dayId: string,
    data: any
  ): Promise<any> {
    const res = await api.put(
      `${BASE}/drafts/${draftId}/itinerary-days/${dayId}`,
      data
    );
    return res.data;
  },

  async deleteItineraryDay(
    draftId: string,
    dayId: string
  ): Promise<any> {
    const res = await api.delete(
      `${BASE}/drafts/${draftId}/itinerary-days/${dayId}`
    );
    return res.data;
  },

  async reorderItineraryDays(
    draftId: string,
    data: { id: string; dayNumber: number }[]
  ): Promise<any> {
    const res = await api.put(
      `${BASE}/drafts/${draftId}/itinerary-days/reorder`,
      data
    );
    return res.data;
  },

  async duplicateItineraryDay(
    draftId: string,
    dayId: string
  ): Promise<any> {
    const res = await api.post(
      `${BASE}/drafts/${draftId}/itinerary-days/${dayId}/duplicate`
    );
    return res.data;
  },

  // Itinerary Items
  async addItineraryItem(
    draftId: string,
    dayId: string,
    data: any
  ): Promise<any> {
    const res = await api.post(
      `${BASE}/drafts/${draftId}/itinerary-days/${dayId}/items`,
      data
    );
    return res.data;
  },

  async updateItineraryItem(
    draftId: string,
    dayId: string,
    itemId: string,
    data: any
  ): Promise<any> {
    const res = await api.put(
      `${BASE}/drafts/${draftId}/itinerary-days/${dayId}/items/${itemId}`,
      data
    );
    return res.data;
  },

  async deleteItineraryItem(
    draftId: string,
    dayId: string,
    itemId: string
  ): Promise<any> {
    const res = await api.delete(
      `${BASE}/drafts/${draftId}/itinerary-days/${dayId}/items/${itemId}`
    );
    return res.data;
  },

  async reorderItineraryItems(
    draftId: string,
    dayId: string,
    data: { id: string; sortOrder: number }[]
  ): Promise<any> {
    const res = await api.put(
      `${BASE}/drafts/${draftId}/itinerary-days/${dayId}/items/reorder`,
      data
    );
    return res.data;
  },

  // Pricing & Quote
  async recalculatePackagePrice(draftId: string): Promise<any> {
    const res = await api.post(
      `${BASE}/drafts/${draftId}/recalculate-price`
    );
    return res.data;
  },

  async generateQuote(draftId: string): Promise<any> {
    const res = await api.post(`${BASE}/drafts/${draftId}/generate-quote`);
    return res.data;
  },

  async convertToBooking(draftId: string): Promise<any> {
    const res = await api.post(
      `${BASE}/drafts/${draftId}/convert-to-booking`
    );
    return res.data;
  },

  // Activity Logs
  async getPackageActivityLogs(draftId: string): Promise<any> {
    const res = await api.get(
      `${BASE}/drafts/${draftId}/activity-logs`
    );
    return res.data;
  },
};
