import api from "./api";

export interface OpsDayItinerary {
  id?: string;
  departureDate?: string;
  date?: string;
  dayTitle: string;
  paxCount: number;
  hotelName?: string;
  hotelVerified: boolean;
  vehicleType?: string;
  vehicleVerified: boolean;
  remarks?: string;
  guideDriverDetails?: string;
  guideVerified: boolean;
  checkInDone: boolean;
}

export interface OpsTripExpense {
  id?: string;
  departureDate?: string;
  serviceDate?: string;
  activity: string;
  paymentDate?: string;
  totalAmount: number;
  amountPaid: number;
  dueAmount: number;
  paymentStatus: string;
  remarks?: string;
}

export interface OpsAccountingSummary {
  hotelCost: number;
  transportCost: number;
  guideCost: number;
  miscCost: number;
  detailedExpensesCost: number;
  totalOpsCost: number;
  travelerCount: number;
  perPersonOpsCost: number;
  totalRevenueCollected: number;
  profitPerTrip: number;
}

export interface OpsSeatConfig {
  id?: string;
  departureDate?: string;
  totalSeatsCap: number;
  alertThreshold: number;
  blockedSeats: number;
  seatsSold: number;
  seatsAvailable: number;
  waitingList: number;
}

export interface OpsWorkspaceSummary {
  acceptedTravelerCount: number;
  ticketReadiness: { approved: number; pending: number; cancelled: number };
  approvedCollections: number;
  pendingCollections: number;
  remainingCollections: number;
  seatAvailability: OpsSeatConfig & { configured: boolean };
  hotelTransportStatus: { hotelsTotal: number; hotelsConfirmed: number; transportTotal: number };
  allocationState: { status: string; version: number; roomAllocations: number; vehicleAllocations: number };
  checklistCompletion: { completed: number; total: number };
  blockingFlagCount: number;
  openIncidentCount: number;
  leaders: Array<{ id: string; leaderName: string; leaderPhone: string; leaderType: string; isPrimary: boolean }>;
}

export interface AutoAllocationResult {
  allocationRunId?: string;
  version?: number;
  status?: string;
  vehicleAllocations: { fleetId: string; bookingId: string; travelerName: string; seatNumber?: number }[];
  roomAllocations: { roomNumber: string; roomType: string; genderGroup: string; bookingId: string; travelerName: string }[];
  flags: string[];
  whatsappTempoText: string;
  whatsappRoomText: string;
}

export interface OpsTransportFleet {
  id?: string;
  departureDate?: string;
  vehicleType: string;
  capacity: number;
  vendorId?: string;
  vendor?: { id: string; name: string };
  driverName?: string;
  driverPhone?: string;
  route?: string;
  pickupPoints?: string;
  dropPoints?: string;
  totalAmount?: number;
  advancePaid?: number;
  balanceAmount?: number;
  notes?: string;
}

export interface OpsRoomInventory {
  id?: string;
  departureDate?: string;
  roomLabel: string;
  roomType: string;
  genderGroup: string;
  capacity: number;
  hotelName?: string;
  notes?: string;
}

export const opsService = {
  async getWorkspaceSummary(tripId: string, departureDate?: string): Promise<OpsWorkspaceSummary> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.get(`/ops/summary/${tripId}${q}`);
    return res.data?.data;
  },
  async getDayItinerary(tripId: string, departureDate?: string): Promise<OpsDayItinerary[]> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.get(`/ops/itinerary/${tripId}${q}`);
    return res.data?.data || [];
  },
  async upsertDayItinerary(tripId: string, data: Partial<OpsDayItinerary>, departureDate?: string): Promise<OpsDayItinerary> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.post(`/ops/itinerary/${tripId}${q}`, data);
    return res.data?.data;
  },
  async deleteDayItinerary(id: string): Promise<void> {
    await api.delete(`/ops/itinerary/${id}`);
  },

  async getTripExpenses(tripId: string, departureDate?: string): Promise<OpsTripExpense[]> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.get(`/ops/expenses/${tripId}${q}`);
    return res.data?.data || [];
  },
  async upsertTripExpense(tripId: string, data: Partial<OpsTripExpense>, departureDate?: string): Promise<OpsTripExpense> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.post(`/ops/expenses/${tripId}${q}`, data);
    return res.data?.data;
  },
  async deleteTripExpense(id: string): Promise<void> {
    await api.delete(`/ops/expenses/${id}`);
  },

  async getTransportFleet(tripId: string, departureDate?: string): Promise<OpsTransportFleet[]> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.get(`/ops/transport/${tripId}${q}`);
    return res.data?.data || [];
  },
  async createTransportFleet(tripId: string, data: Partial<OpsTransportFleet>, departureDate?: string): Promise<OpsTransportFleet> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.post(`/ops/transport/${tripId}${q}`, data);
    return res.data?.data;
  },
  async deleteTransportFleet(id: string): Promise<void> {
    await api.delete(`/ops/transport/${id}`);
  },

  async getRoomInventory(tripId: string, departureDate?: string): Promise<OpsRoomInventory[]> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.get(`/ops/rooms/${tripId}${q}`);
    return res.data?.data || [];
  },
  async createRoomInventory(tripId: string, data: Partial<OpsRoomInventory>, departureDate?: string): Promise<OpsRoomInventory> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.post(`/ops/rooms/${tripId}${q}`, data);
    return res.data?.data;
  },
  async deleteRoomInventory(id: string): Promise<void> {
    await api.delete(`/ops/rooms/${id}`);
  },

  async getAccountingSummary(tripId: string, departureDate?: string): Promise<OpsAccountingSummary> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.get(`/ops/accounting-summary/${tripId}${q}`);
    return res.data?.data;
  },

  async getSeatConfig(tripId: string, departureDate?: string): Promise<OpsSeatConfig> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.get(`/ops/seats/${tripId}${q}`);
    return res.data?.data;
  },

  async executeAutoAllocation(tripId: string, departureDate?: string): Promise<AutoAllocationResult> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.post(`/ops/auto-allocate/${tripId}${q}`);
    return res.data?.data;
  },

  async confirmAllocation(allocationRunId: string): Promise<any> {
    const res = await api.post(`/ops/auto-allocate/confirm`, { allocationRunId });
    return res.data;
  },

  async overrideAllocation(data: { allocationRunId: string; targetType: string; targetId: string; beforeValue?: any; afterValue: any; reason: string }): Promise<any> {
    const res = await api.post(`/ops/auto-allocate/override`, data);
    return res.data;
  },

  async getChecklist(tripId: string, departureDate?: string): Promise<OpsChecklistItem[]> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.get(`/ops/checklists/${tripId}${q}`);
    return res.data?.data || [];
  },

  async initializeChecklist(tripId: string, departureDate: string): Promise<OpsChecklistItem[]> {
    const res = await api.post(`/ops/checklists/${tripId}/initialize`, { departureDate });
    return res.data?.data || [];
  },

  async completeChecklistItem(id: string, notes?: string): Promise<OpsChecklistItem> {
    const res = await api.post(`/ops/checklists/complete`, { id, notes });
    return res.data?.data;
  },

  async reopenChecklistItem(id: string, notes: string): Promise<OpsChecklistItem> {
    const res = await api.post(`/ops/checklists/reopen`, { id, notes });
    return res.data?.data;
  },

  // ── INCIDENTS ──
  async getIncidents(tripId: string, departureDate?: string): Promise<OpsIncident[]> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.get(`/ops/incidents/${tripId}${q}`);
    return res.data?.data || [];
  },

  async createIncident(tripId: string, data: Partial<OpsIncident>, departureDate?: string): Promise<OpsIncident> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.post(`/ops/incidents${q}`, { tripId, ...data });
    return res.data?.data;
  },

  async resolveIncident(id: string, resolution: string): Promise<OpsIncident> {
    const res = await api.post(`/ops/incidents/${id}/resolve`, { resolution });
    return res.data?.data;
  },

  async reopenIncident(id: string, notes: string): Promise<OpsIncident> {
    const res = await api.post(`/ops/incidents/${id}/reopen`, { notes });
    return res.data?.data;
  },

  // ── SOP LIBRARY ──
  async getSops(destination?: string, includeArchived?: boolean): Promise<OpsSopLibrary[]> {
    const parts = [];
    if (destination) parts.push(`destination=${encodeURIComponent(destination)}`);
    if (includeArchived) parts.push(`includeArchived=true`);
    const q = parts.length > 0 ? `?${parts.join("&")}` : "";
    const res = await api.get(`/ops/sop-library${q}`);
    return res.data?.data || [];
  },

  async createSop(data: Partial<OpsSopLibrary>): Promise<OpsSopLibrary> {
    const res = await api.post(`/ops/sop-library`, data);
    return res.data?.data;
  },

  async updateSop(id: string, data: Partial<OpsSopLibrary>): Promise<OpsSopLibrary> {
    const res = await api.patch(`/ops/sop-library/${id}`, data);
    return res.data?.data;
  },

  async archiveSop(id: string): Promise<OpsSopLibrary> {
    const res = await api.post(`/ops/sop-library/${id}/archive`);
    return res.data?.data;
  },

  async restoreSop(id: string): Promise<OpsSopLibrary> {
    const res = await api.post(`/ops/sop-library/${id}/restore`);
    return res.data?.data;
  },

  // ── TRIP LEADERS ──
  async getTripLeader(tripId: string, departureDate?: string): Promise<OpsTripLeader[]> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.get(`/ops/leaders/${tripId}${q}`);
    return res.data?.data || [];
  },

  async assignTripLeader(tripId: string, data: Partial<OpsTripLeader>, departureDate?: string): Promise<OpsTripLeader> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.post(`/ops/leaders/${tripId}${q}`, data);
    return res.data?.data;
  },

  async patchTripLeader(tripId: string, data: Partial<OpsTripLeader>, departureDate?: string): Promise<OpsTripLeader> {
    const q = departureDate ? `?departureDate=${encodeURIComponent(departureDate)}` : "";
    const res = await api.patch(`/ops/leaders/${tripId}${q}`, data);
    return res.data?.data;
  },

  async archiveTripLeader(tripId: string, departureDate: string, id?: string, leaderPhone?: string): Promise<any> {
    const res = await api.post(`/ops/leaders/${tripId}/archive`, { departureDate, id, leaderPhone });
    return res.data;
  },

  async restoreTripLeader(tripId: string, departureDate: string, id?: string, leaderPhone?: string): Promise<any> {
    const res = await api.post(`/ops/leaders/${tripId}/restore`, { departureDate, id, leaderPhone });
    return res.data;
  }
};

export interface OpsChecklistItem {
  id: string;
  stage: string;
  taskName: string;
  isCompleted: boolean;
  notes?: string;
  completedAt?: string;
  completedBy?: { name: string };
  activities?: OpsChecklistActivity[];
}

export interface OpsChecklistActivity {
  id: string;
  action: string;
  previousStatus: boolean;
  nextStatus: boolean;
  notes?: string;
  createdAt: string;
  actor: { name: string };
}

export interface OpsIncident {
  id: string;
  title: string;
  severity: string;
  description: string;
  resolution?: string;
  status: string; // OPEN | RESOLVED
  reportedBy?: { name: string };
  resolvedBy?: { name: string };
  createdAt: string;
  resolvedAt?: string;
  activities?: OpsIncidentActivity[];
}

export interface OpsIncidentActivity {
  id: string;
  action: string;
  notes?: string;
  createdAt: string;
  actor: { name: string };
}

export interface OpsSopLibrary {
  id: string;
  destination: string;
  title: string;
  content: string;
  isActive: boolean;
  createdBy?: { name: string };
  updatedBy?: { name: string };
  archivedBy?: { name: string };
}

export interface OpsTripLeader {
  id?: string;
  leaderName: string;
  leaderPhone: string;
  leaderType: string;
  isPrimary?: boolean;
  notes?: string;
  assignedBy?: { name: string };
  updatedBy?: { name: string };
  archivedAt?: string;
  archivedBy?: { name: string };
  activities?: any[];
}
