import guideApi from './guideApi';

export interface Guide {
  id: number;
  name: string;
  phone: string;
  activeTripName: string | null;
  todayStatus: 'checked_in' | 'checked_out' | 'missing' | 'idle';
  lastCheckInTime: string | null;
  flagged: boolean;
  daysLogged: number;
  email: string | null;
  profilePhoto: string | null;
  address: string | null;
  notes: string | null;
}

export interface AttendanceLog {
  id: number;
  guideName: string;
  tripName: string;
  date: string;
  checkInTime: string | null;
  checkInLatitude: number | null;
  checkInLongitude: number | null;
  checkInLocationName: string | null;
  checkInSelfieUrl: string | null;
  checkInDistance: number | null;
  checkOutTime: string | null;
  checkOutLatitude: number | null;
  checkOutLongitude: number | null;
  checkOutLocationName: string | null;
  checkOutSelfieUrl: string | null;
  checkOutDistance: number | null;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'location_mismatch' | 'incomplete';
}

export interface PayrollItem {
  guideId: number;
  guideName: string;
  dailyRate: number;
  approvedDays: number;
  payableAmount: number;
  tripBreakdown: {
    tripName: string;
    approvedDays: number;
    amount: number;
  }[];
}

export interface Assignment {
  id: number;
  guideId: number;
  guideName: string;
  tripId: number | null;
  tripName: string;
  departureDate: string;
  role: 'guide' | 'coordinator' | 'captain' | 'lead_guide' | 'assistant_guide';
  perDayAmount: number;
  allowedLatitude: number | null;
  allowedLongitude: number | null;
  allowedRadius: number;
  status: 'assigned' | 'ongoing' | 'completed' | 'cancelled';
  mainBackendTripId: string | null;
  mainBackendTripName: string | null;
  createdAt: string;
}

export interface GuideTrip {
  id: number;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  leadGuideId: number;
  leadGuideName: string;
  status: string;
}

export interface MainBackendTrip {
  id: string;
  title: string;
  slug: string;
  location: string;
  duration: string;
  description: string;
  price: number;
  status: string;
}

export interface TravelerInfo {
  bookingId: string;
  bookingCuid?: string;
  name: string;
  phone: string;
  email: string;
  departureDate: string;
  pickupCity: string;
  paymentStatus: string;
  totalAmount: number;
  advancePaid: number;
  remainingAmount: number;
  isPrimaryBooker: boolean;
  age: number | null;
  gender: string | null;
  foodPreference?: string;
}

export interface Expense {
  id: number;
  guideId: number;
  guideName: string;
  assignmentId: number;
  tripName: string;
  category: 'hotel_payment' | 'toll_receipt' | 'fuel_bill' | 'entry_ticket' | 'misc_expense';
  amount: number;
  description: string;
  receiptUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  adminRemarks: string | null;
  createdAt: string;
}

export interface TravelerAttendance {
  id: number;
  assignmentId: number;
  bookingId: string;
  travelerName: string;
  travelerPhone: string | null;
  status: 'arrived_pickup' | 'boarded_train' | 'reached_destination' | 'missing_delayed';
  notes: string | null;
  markedByGuideId: number;
  markedByGuideName: string;
  updatedAt: string;
}

export interface TripStatusUpdate {
  id: number;
  assignmentId: number;
  guideId: number;
  guideName: string;
  status: 'trip_started' | 'train_boarded' | 'destination_reached' | 'hotel_checkin_complete' | 'sightseeing_started' | 'return_journey_started';
  notes: string | null;
  location: string | null;
  updatedAt: string;
}

export const guideService = {
  async login(phone: string, role: string) {
    const res = await guideApi.post<{ id: number; name: string; role: string }>('/auth/login', { phone, role });
    return res.data;
  },

  async getDashboard() {
    const res = await guideApi.get<{
      activeTrips: number;
      totalGuides: number;
      todayCheckIns: number;
      missingCheckIns: number;
      locationMismatchFlags: number;
    }>('/admin/dashboard');
    return res.data;
  },

  async getGuides() {
    const res = await guideApi.get<Guide[]>('/admin/guides');
    return res.data;
  },

  async createGuide(data: {
    name: string;
    phone: string;
    dailyRate: number;
    emergencyContact?: string;
    isActive?: string;
    email?: string | null;
    profilePhoto?: string | null;
    address?: string | null;
    notes?: string | null;
  }) {
    const res = await guideApi.post<Guide>('/admin/guides', data);
    return res.data;
  },

  async updateGuide(id: number, data: {
    name?: string;
    phone?: string;
    dailyRate?: number;
    emergencyContact?: string;
    isActive?: string;
    email?: string | null;
    profilePhoto?: string | null;
    address?: string | null;
    notes?: string | null;
  }) {
    const res = await guideApi.put<Guide>(`/admin/guides/${id}`, data);
    return res.data;
  },

  async deleteGuide(id: number) {
    const res = await guideApi.delete<{ success: boolean; message: string }>(`/admin/guides/${id}`);
    return res.data;
  },

  async getAttendanceLogs() {
    const res = await guideApi.get<AttendanceLog[]>('/admin/attendance-logs');
    return res.data;
  },

  async verifyAttendance(attendanceId: number, status: 'approved' | 'rejected') {
    const res = await guideApi.post('/admin/verify-attendance', { attendanceId, status });
    return res.data;
  },

  async getPayroll() {
    const res = await guideApi.get<PayrollItem[]>('/admin/payroll');
    return res.data;
  },

  async getAssignments() {
    const res = await guideApi.get<Assignment[]>('/admin/assignments');
    return res.data;
  },

  async createAssignment(data: {
    guideId: number;
    tripId?: number | null;
    departureDate: string;
    role: 'guide' | 'coordinator' | 'captain' | 'lead_guide' | 'assistant_guide';
    perDayAmount: number;
    allowedLatitude?: number | null;
    allowedLongitude?: number | null;
    allowedRadius?: number;
    status?: 'assigned' | 'ongoing' | 'completed' | 'cancelled';
    mainBackendTripId?: string | null;
    mainBackendTripName?: string | null;
  }) {
    const res = await guideApi.post<Assignment>('/admin/assignments', data);
    return res.data;
  },

  async updateAssignment(id: number, data: {
    guideId?: number;
    tripId?: number | null;
    departureDate?: string;
    role?: 'guide' | 'coordinator' | 'captain' | 'lead_guide' | 'assistant_guide';
    perDayAmount?: number;
    allowedLatitude?: number | null;
    allowedLongitude?: number | null;
    allowedRadius?: number;
    status?: 'assigned' | 'ongoing' | 'completed' | 'cancelled';
    mainBackendTripId?: string | null;
    mainBackendTripName?: string | null;
  }) {
    const res = await guideApi.put<Assignment>(`/admin/assignments/${id}`, data);
    return res.data;
  },

  async deleteAssignment(id: number) {
    const res = await guideApi.delete(`/admin/assignments/${id}`);
    return res.data;
  },

  async getTrips() {
    const res = await guideApi.get<GuideTrip[]>('/admin/trips');
    return res.data;
  },

  // ─── Main Backend Synced Data ───
  async getMainBackendTrips() {
    const res = await guideApi.get<MainBackendTrip[]>('/admin/main-trips');
    return res.data;
  },

  async getRecentTripStatus() {
    const res = await guideApi.get<any[]>('/admin/trip-status/recent');
    return res.data;
  },

  async getAssignmentTravelers(assignmentId: number) {
    const res = await guideApi.get<TravelerInfo[]>(`/admin/assignment-travelers/${assignmentId}`);
    return res.data;
  },

  // ─── Expenses Management (Admin) ───
  async getExpenses(filters?: { guideId?: number; assignmentId?: number; status?: string }) {
    const params = new URLSearchParams();
    if (filters?.guideId) params.append('guideId', String(filters.guideId));
    if (filters?.assignmentId) params.append('assignmentId', String(filters.assignmentId));
    if (filters?.status) params.append('status', filters.status);
    const res = await guideApi.get<Expense[]>(`/admin/expenses?${params.toString()}`);
    return res.data;
  },

  async approveExpense(id: number, status: 'approved' | 'rejected', adminRemarks?: string) {
    const res = await guideApi.put<Expense>(`/admin/expenses/${id}/status`, { status, adminRemarks });
    return res.data;
  },

  // ─── Traveler Attendance (Admin) ───
  async getTravelerAttendance(assignmentId: number) {
    const res = await guideApi.get<TravelerAttendance[]>(`/admin/traveler-attendance/${assignmentId}`);
    return res.data;
  },

  // ─── Trip Status timeline (Admin) ───
  async getTripStatusTimeline(assignmentId: number) {
    const res = await guideApi.get<TripStatusUpdate[]>(`/admin/trip-status/${assignmentId}`);
    return res.data;
  },

  // ─── Guide Portal Endpoints ───
  async getProfile() {
    const res = await guideApi.get<any>('/guide/profile');
    return res.data;
  },

  async getMyAssignments() {
    const res = await guideApi.get<Assignment[]>('/guide/my-assignments');
    return res.data;
  },

  async getMyTravelers(assignmentId: number) {
    const res = await guideApi.get<TravelerInfo[]>(`/guide/my-travelers/${assignmentId}`);
    return res.data;
  },

  async uploadExpense(data: {
    assignmentId: number;
    category: 'hotel_payment' | 'toll_receipt' | 'fuel_bill' | 'entry_ticket' | 'misc_expense';
    amount: number;
    description: string;
    receiptUrl: string;
  }) {
    const res = await guideApi.post<Expense>('/guide/expenses', data);
    return res.data;
  },

  async getMyExpenses(assignmentId: number) {
    const res = await guideApi.get<Expense[]>(`/guide/expenses/${assignmentId}`);
    return res.data;
  },

  async markTravelerAttendance(data: {
    assignmentId: number;
    bookingId: string;
    travelerName: string;
    travelerPhone?: string | null;
    status: 'arrived_pickup' | 'boarded_train' | 'reached_destination' | 'missing_delayed';
    notes?: string | null;
  }) {
    const res = await guideApi.post<TravelerAttendance>('/guide/traveler-attendance', data);
    return res.data;
  },

  async getMyTravelerAttendance(assignmentId: number) {
    const res = await guideApi.get<TravelerAttendance[]>(`/guide/traveler-attendance/${assignmentId}`);
    return res.data;
  },

  async updateTripStatus(data: {
    assignmentId: number;
    status: 'trip_started' | 'train_boarded' | 'destination_reached' | 'hotel_checkin_complete' | 'sightseeing_started' | 'return_journey_started';
    notes?: string | null;
    location?: string | null;
  }) {
    const res = await guideApi.post<TripStatusUpdate>('/guide/trip-status', data);
    return res.data;
  },

  // ─── Live Trip Operations APIs ───
  async uploadMedia(formData: FormData) {
    const res = await guideApi.post<{ url: string }>('/guide/operations/upload-media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async submitCheckinPoint(data: {
    assignmentId: number;
    checkinType: 'railway_station' | 'bus_pickup' | 'hotel' | 'sightseeing' | 'return_journey';
    locationName: string;
    latitude?: number;
    longitude?: number;
    photoUrl: string;
    notes?: string;
  }) {
    const res = await guideApi.post('/guide/operations/checkin', data);
    return res.data;
  },

  async submitHotelUpdate(data: {
    assignmentId: number;
    hotelName: string;
    roomsUsed?: number;
    roomAllocationStatus?: string;
    hotelPhotos?: string[];
    notes?: string;
    status?: 'pending' | 'done' | 'issue_reported';
  }) {
    const res = await guideApi.post('/guide/operations/hotel', data);
    return res.data;
  },

  async submitFoodUpdate(data: {
    assignmentId: number;
    dayNumber: number;
    photoUrl?: string;
    videoUrl?: string;
    rating: number;
    jainCount?: number;
    nonJainCount?: number;
    extraMeals?: number;
    notes?: string;
  }) {
    const res = await guideApi.post('/guide/operations/food', data);
    return res.data;
  },

  async submitGroupPhoto(data: {
    assignmentId: number;
    photoUrl: string;
    locationName: string;
    dayNumber: number;
    notes?: string;
  }) {
    const res = await guideApi.post('/guide/operations/group-photo', data);
    return res.data;
  },

  async submitMovementUpdate(data: {
    assignmentId: number;
    movementType: 'departed_pickup' | 'train_boarded' | 'bus_started' | 'reached_destination' | 'sightseeing_started' | 'sightseeing_completed' | 'return_journey_started';
    locationName?: string;
    photoUrl?: string;
    videoUrl?: string;
    notes?: string;
  }) {
    const res = await guideApi.post('/guide/operations/movement', data);
    return res.data;
  },

  async submitTripTimingUpdate(data: {
    assignmentId: number;
    currentDestination?: string;
    expectedArrivalTime?: string;
    delayReason?: string;
    nextDestination?: string;
    actualArrivalTime?: string;
    currentTripStatus?: string;
  }) {
    const res = await guideApi.post('/guide/operations/trip-timing', data);
    return res.data;
  },

  async getLiveOperationsTimeline(filters?: {
    tripId?: number;
    assignmentId?: number;
    guideId?: number;
    date?: string;
    type?: string;
    status?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.tripId) params.append('tripId', String(filters.tripId));
    if (filters?.assignmentId) params.append('assignmentId', String(filters.assignmentId));
    if (filters?.guideId) params.append('guideId', String(filters.guideId));
    if (filters?.date) params.append('date', filters.date);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);

    const res = await guideApi.get<any[]>(`/admin/operations/live?${params.toString()}`);
    return res.data;
  },

  async getLiveOperationsStats(assignmentId: number) {
    const res = await guideApi.get<{
      totalParticipants: number;
      confirmedCount: number;
      pendingCount: number;
      cancelledCount: number;
      maleCount: number;
      femaleCount: number;
      jainPreferenceCount: number;
      nonJainPreferenceCount: number;
      otherFoodPreferenceCount: number;
      pickupCityBreakdown: Record<string, number>;
    }>(`/admin/operations/stats/${assignmentId}`);
    return res.data;
  },

  async getLiveOperationsAlerts() {
    const res = await guideApi.get<any[]>('/admin/operations/alerts');
    return res.data;
  },

  async approveHotelUpdate(id: number, status: 'approved' | 'rejected' | 'done', notes?: string) {
    const res = await guideApi.put(`/admin/operations/hotel/${id}`, { status, notes });
    return res.data;
  },

  async syncFoodPreference(
    bookingCuid: string,
    bookingId: string,
    passengerName: string,
    foodPreference: string,
    isPrimaryBooker: boolean,
    reason?: string
  ) {
    const res = await guideApi.post('/admin/operations/sync-food-preference', {
      bookingCuid,
      bookingId,
      passengerName,
      foodPreference,
      isPrimaryBooker,
      reason,
    });
    return res.data;
  }
};

export default guideService;
