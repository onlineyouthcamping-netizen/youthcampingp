import api from "./api";
import type { Payment, PaymentSummary } from "@/types";

export const paymentsService = {
  async getByBooking(bookingId: string): Promise<{ payments: Payment[]; summary: PaymentSummary }> {
    try {
      const res = await api.get(`/payments/booking/${bookingId}`);
      return { payments: res.data.data, summary: res.data.summary };
    } catch (err) {
      console.warn("Using mock payments for booking:", bookingId);
      return {
        payments: [],
        summary: {
          totalAmount: 25000,
          totalPaid: 5000,
          pending: 20000,
          count: 0
        }
      };
    }
  },

  async add(data: {
    bookingId: string;
    amount: number;
    paymentMode: string;
    paymentDate?: string;
    reference?: string;
    notes?: string;
  }): Promise<Payment> {
    const res = await api.post("/payments", data);
    return res.data.data;
  },

  async getAll(): Promise<{ payments: Payment[]; totalRevenue: number }> {
    const res = await api.get("/payments");
    return { payments: res.data.data, totalRevenue: res.data.totalRevenue };
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/payments/${id}`);
  },
};
