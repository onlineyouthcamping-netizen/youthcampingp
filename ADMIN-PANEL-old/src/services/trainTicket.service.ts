import api from "./api";

export interface TrainTicket {
  id: string;
  tenantId: string;
  bookingId: string;
  travelerName: string;
  passengerReference?: string;
  pnr?: string;
  trainName?: string;
  trainNumber?: string;
  journeyDate?: string;
  sourceStation?: string;
  destinationStation?: string;
  coach?: string;
  seatNumber?: string;
  berthType?: string;
  ticketStatus: 'PENDING' | 'BOOKED' | 'WAITLISTED' | 'CONFIRMED' | 'RAC' | 'SELF_BOOKED' | 'CANCELLED';
  approvalStatus: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REOPENED';
  isLocked: boolean;
  ticketAmount: number;
  amountMode?: string;
  refundAmount: number;
  cancellationReason?: string;
  internalNote?: string;
  ticketBookingPerson?: string;
  supersedesTicketId?: string;
  supersededByTicketId?: string;
  reopenReason?: string;
  submittedByAdminId?: string;
  createdAt: string;
  updatedAt: string;
  history?: any[];
  supersedes?: TrainTicket;
  supersededBy?: TrainTicket;
  submittedBy?: { id: string; name: string };
  booking?: {
    bookingId: string;
    name: string;
    fullName?: string;
    tripName?: string;
    salesAdminId?: string;
  };
}

export interface TrainTemplate {
  id: string;
  tenantId: string;
  tripId?: string;
  tripTitle?: string;
  departureDate?: string;
  trainName?: string;
  trainNumber?: string;
  source?: string;
  destination?: string;
  defaultClass?: string;
  defaultCoach?: string;
  journeyDate?: string;
  boardingPoint?: string;
  droppingPoint?: string;
  waitlistDisclaimer?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  trip?: { id: string; title: string };
}

const unwrap = (res: any) => res.data?.data ?? res.data;

export const trainTicketService = {
  // Booking-level operations
  async getTicketsByBooking(bookingId: string): Promise<TrainTicket[]> {
    const res = await api.get(`/train-tickets/booking/${bookingId}`);
    return unwrap(res) || [];
  },

  async createTicket(bookingId: string, data: any): Promise<TrainTicket> {
    const res = await api.post(`/train-tickets/booking/${bookingId}`, data);
    return unwrap(res);
  },

  async autoGenerateTickets(bookingId: string): Promise<{ tickets: TrainTicket[]; message: string }> {
    const res = await api.post(`/train-tickets/booking/${bookingId}/auto-generate`);
    return unwrap(res);
  },

  // Ticket-level operations
  async updateTicket(ticketId: string, data: any): Promise<TrainTicket> {
    const res = await api.patch(`/train-tickets/${ticketId}`, data);
    return unwrap(res);
  },

  async submitTicket(ticketId: string): Promise<TrainTicket> {
    const res = await api.post(`/train-tickets/${ticketId}/submit`);
    return unwrap(res);
  },

  async approveTicket(ticketId: string): Promise<TrainTicket> {
    const res = await api.post(`/train-tickets/${ticketId}/approve`);
    return unwrap(res);
  },

  async rejectTicket(ticketId: string, notes?: string): Promise<TrainTicket> {
    const res = await api.post(`/train-tickets/${ticketId}/reject`, { notes });
    return unwrap(res);
  },

  async reopenTicket(ticketId: string, reason: string): Promise<TrainTicket> {
    const res = await api.post(`/train-tickets/${ticketId}/reopen`, { reason });
    return unwrap(res);
  },

  async cancelTicket(ticketId: string, data: { reason: string; refundAmount?: number }): Promise<TrainTicket> {
    const res = await api.post(`/train-tickets/${ticketId}/cancel`, data);
    return unwrap(res);
  },

  async rebookTicket(ticketId: string): Promise<{ oldTicketId: string; newTicket: TrainTicket }> {
    const res = await api.post(`/train-tickets/${ticketId}/rebook`);
    return unwrap(res);
  },

  // Bulk operation
  async bulkUpdateTickets(data: {
    ticketIds: string[];
    status?: string;
    trainNumber?: string;
    journeyDate?: string;
    pnr?: string;
    coach?: string;
    seatNumber?: string;
    berthType?: string;
    notes?: string;
  }): Promise<{ updatedCount: number; tickets: TrainTicket[] }> {
    const res = await api.post('/train-tickets/bulk-update', data);
    return unwrap(res);
  },

  // Queues and Alerts
  async getApprovalsQueue(params?: Record<string, string>): Promise<{ data: TrainTicket[]; pagination: { page: number; limit: number; totalCount: number; totalPages: number } }> {
    const res = await api.get('/train-tickets/approvals', { params });
    return res.data;
  },

  async getTicketHistory(ticketId: string): Promise<any[]> {
    const res = await api.get(`/train-tickets/${ticketId}/history`);
    return unwrap(res) || [];
  },

  async getAlerts(): Promise<any[]> {
    const res = await api.get('/train-tickets/alerts');
    return unwrap(res) || [];
  },

  // Template CRUD operations
  async getTemplates(): Promise<TrainTemplate[]> {
    const res = await api.get('/train-tickets/templates');
    return unwrap(res) || [];
  },

  async createTemplate(data: any): Promise<TrainTemplate> {
    const res = await api.post('/train-tickets/templates', data);
    return unwrap(res);
  },

  async updateTemplate(id: string, data: any): Promise<TrainTemplate> {
    const res = await api.patch(`/train-tickets/templates/${id}`, data);
    return unwrap(res);
  },

  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/train-tickets/templates/${id}`);
  }
};
