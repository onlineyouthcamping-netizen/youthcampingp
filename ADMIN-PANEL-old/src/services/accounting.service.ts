import api from "./api";

export interface AccountingEntry {
  id: string;
  tenantId: string;
  bookingId: string;
  amount: number;
  paymentMode: "CASH" | "UPI" | "BANK_TRANSFER";
  referenceNumber?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes?: string;
  rejectionReason?: string;
  salespersonId: string;
  actionedById?: string;
  createdAt: string;
  updatedAt: string;
  booking?: {
    bookingId: string;
    name: string;
    fullName?: string;
    tripName?: string;
    totalAmount: number;
    adjustedPrice?: number;
    numberOfTravelers?: number;
    salesAdminId?: string;
  };
  salesperson?: { id: string; name: string; email: string };
  actionedBy?: { id: string; name: string };
  history?: AccountingEntryLog[];
}

export interface AccountingEntryLog {
  id: string;
  accountingEntryId: string;
  action: string;
  notes?: string;
  actorId: string;
  createdAt: string;
  actor?: { id: string; name: string };
}

export interface AccountingReports {
  pendingTotal: number;
  revenuePerTrip: { tripName: string; amount: number }[];
  salespersonCollection: { salespersonName: string; amount: number }[];
  monthlyRevenue: { month: string; amount: number }[];
}

export interface AccountingEntriesResponse {
  data: AccountingEntry[];
  summary: Record<"APPROVED" | "PENDING" | "REJECTED", number>;
  pagination: { page: number; limit: number; totalCount: number; totalPages: number };
}

export const accountingService = {
  async getEntries(params?: Record<string, string>): Promise<AccountingEntriesResponse> {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    const res = await api.get(`/accounting/entries${query}`);
    return {
      data: res.data?.data || [],
      summary: res.data?.summary || { APPROVED: 0, PENDING: 0, REJECTED: 0 },
      pagination: res.data?.pagination || { page: 1, limit: 25, totalCount: 0, totalPages: 1 },
    };
  },

  async getEntryHistory(id: string): Promise<AccountingEntryLog[]> {
    const res = await api.get(`/accounting/entries/${id}/history`);
    return res.data?.data || [];
  },

  async createEntry(data: {
    bookingId: string;
    amount: number;
    paymentMode: string;
    referenceNumber?: string;
    notes?: string;
    salespersonId?: string;
  }): Promise<AccountingEntry> {
    const res = await api.post("/accounting/entries", data);
    return res.data?.data;
  },

  async approveEntry(id: string): Promise<AccountingEntry> {
    const res = await api.post(`/accounting/entries/${id}/approve`);
    return res.data?.data;
  },

  async rejectEntry(id: string, reason: string): Promise<AccountingEntry> {
    const res = await api.post(`/accounting/entries/${id}/reject`, { reason });
    return res.data?.data;
  },

  async getReports(params?: Record<string, string>): Promise<AccountingReports> {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    const res = await api.get(`/accounting/reports${query}`);
    return res.data?.data;
  },
};
