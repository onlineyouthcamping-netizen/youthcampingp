import api from "./api";

export interface BookingFormRecord {
  id: string;
  _id?: string;
  tripId?: string;
  tripName: string;
  date: string;
  formUrl: string;
  sheetUrl: string;
  sheetId?: string;
  formId?: string;
  paymentMode?: string;
  bookingAmount?: number;
  createdBy?: string;
  createdAt: string;
}

export const bookingFormsService = {
  async create(data: {
    tripName: string;
    date: string;
    tripId?: string;
    paymentMode?: string;
    bookingAmount?: number;
  }): Promise<BookingFormRecord> {
    const res = await api.post("/booking-forms/create", data);
    return res.data.data;
  },

  async getAll(): Promise<BookingFormRecord[]> {
    const res = await api.get("/booking-forms");
    return res.data.data;
  },

  async lookup(tripName: string, date: string): Promise<BookingFormRecord | null> {
    try {
      const res = await api.get(`/booking-forms/lookup?tripName=${encodeURIComponent(tripName)}&date=${encodeURIComponent(date)}`);
      return res.data.data;
    } catch {
      return null;
    }
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/booking-forms/${id}`);
  },

  async update(id: string, data: Partial<BookingFormRecord>): Promise<BookingFormRecord> {
    const res = await api.put(`/booking-forms/${id}`, data);
    return res.data.data;
  },

  async getShareMessage(tripName: string, date: string, formUrl: string): Promise<string> {

    const res = await api.post("/booking-forms/share-message", { tripName, date, formUrl });
    return res.data.message;
  },
};
