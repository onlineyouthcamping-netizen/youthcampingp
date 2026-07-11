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
  tripId: number;
  tripName: string;
  departureDate: string;
  role: 'guide' | 'coordinator' | 'captain';
  perDayAmount: number;
  allowedLatitude: number | null;
  allowedLongitude: number | null;
  allowedRadius: number;
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

export const guideService = {
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
  }) {
    const res = await guideApi.put<Guide>(`/admin/guides/${id}`, data);
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
    tripId: number;
    departureDate: string;
    role: 'guide' | 'coordinator' | 'captain';
    perDayAmount: number;
    allowedLatitude?: number | null;
    allowedLongitude?: number | null;
    allowedRadius?: number;
  }) {
    const res = await guideApi.post<Assignment>('/admin/assignments', data);
    return res.data;
  },

  async updateAssignment(id: number, data: {
    guideId?: number;
    tripId?: number;
    departureDate?: string;
    role?: 'guide' | 'coordinator' | 'captain';
    perDayAmount?: number;
    allowedLatitude?: number | null;
    allowedLongitude?: number | null;
    allowedRadius?: number;
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
  }
};

export default guideService;
