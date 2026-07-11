import React, { useState, useMemo, useEffect } from "react";
import { 
  Plus, Search, Calendar, Clock, DollarSign, Award, FileText, 
  CheckCircle, AlertCircle, Users, Settings, Trash2, ArrowUpRight, 
  BarChart2, ShieldAlert, Check, X, ClipboardList, Briefcase, 
  FileSpreadsheet, Lock, UserCheck, Milestone, CalendarDays, ShieldCheck,
  TrendingUp, FileSignature, Landmark, Receipt, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "@/components/ui/sonner";

// Types matching the ERP rules
interface Employee {
  id: string;
  name: string;
  photoUrl?: string;
  department: 'Sales' | 'Operations' | 'Accounts' | 'Guides' | 'Admin';
  designation: string;
  reportingManager: string;
  status: 'Active' | 'On Leave' | 'Exited' | 'Suspended';
  joiningDate: string;
  phone: string;
  email: string;
  attendanceToday: 'Present' | 'Absent' | 'On Leave' | 'Late' | 'Not Checked In';
  leaveBalance: number;
  payrollStatus: 'Paid' | 'Pending' | 'Draft' | 'Locked';
  salary: number;
  incentives: number;
  dob: string;
  bankDetails: string;
  taxId: string; // PAN / Aadhaar
}

interface AttendanceLog {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  hours: number;
  status: 'Present' | 'Late' | 'Half Day' | 'Absent' | 'WFH' | 'On Duty';
  reason?: string;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: 'Casual Leave' | 'Sick Leave' | 'Earned Leave' | 'Unpaid Leave' | 'Comp Off' | 'WFH';
  startDate: string;
  endDate: string;
  duration: number;
  status: 'Draft' | 'Submitted' | 'Manager Approved' | 'HR Approved' | 'Rejected' | 'Cancelled';
  reason: string;
  handoverNotes?: string;
  conflictDetected?: boolean;
}

interface CommissionRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  bookingId: string;
  tripCode: string;
  bookingValue: number;
  amountReceived: number;
  commissionRule: string;
  commissionAmount: number;
  status: 'Calculated' | 'Pending Approval' | 'Approved' | 'Paid' | 'Reversed';
  payrollMonth: string;
}

interface ReimbursementClaim {
  id: string;
  employeeId: string;
  employeeName: string;
  category: 'Travel' | 'Food' | 'Local Transport' | 'Accommodation' | 'Internet' | 'Emergency' | 'Others';
  amount: number;
  claimDate: string;
  receiptUrl?: string;
  notes: string;
  status: 'Submitted' | 'Approved' | 'Verified' | 'Paid' | 'Rejected';
}

interface EmployeeDocument {
  id: string;
  employeeId: string;
  documentType: 'Aadhaar' | 'PAN' | 'Bank Proof' | 'Offer Letter' | 'Medical Cert';
  fileName: string;
  secureUrl: string;
  verified: boolean;
  uploadedDate: string;
}

// Configurable timing settings
const SHIFT_TIMINGS = {
  checkInStart: "09:30",
  gracePeriod: "09:45"
};

// Initial Mock Data
const INITIAL_EMPLOYEES: Employee[] = [
  { id: "EMP-001", name: "Hemal Patel", department: "Admin", designation: "Founder", reportingManager: "Board", status: "Active", joiningDate: "2020-01-10", phone: "9978567801", email: "hemal@youthcamping.net", attendanceToday: "Present", leaveBalance: 24, payrollStatus: "Paid", salary: 150000, incentives: 0, dob: "1988-04-12", bankDetails: "SBI 10020030040 - IFSC SBIN0000102", taxId: "HMLPS1234A" },
  { id: "EMP-002", name: "Suresh Chaudhary", department: "Sales", designation: "Sales & Trip Manager", reportingManager: "Hemal Patel", status: "Active", joiningDate: "2022-03-15", phone: "9876543202", email: "suresh@youthcamping.net", attendanceToday: "Present", leaveBalance: 15, payrollStatus: "Paid", salary: 65000, incentives: 15000, dob: "1993-11-20", bankDetails: "HDFC 501004392011 - IFSC HDFC0000120", taxId: "SRHPS5678B" },
  { id: "EMP-003", name: "Zeel Panchal", department: "Sales", designation: "Sales Executive", reportingManager: "Suresh Chaudhary", status: "Active", joiningDate: "2024-02-01", phone: "9812345603", email: "zeel@youthcamping.net", attendanceToday: "Present", leaveBalance: 12, payrollStatus: "Paid", salary: 28000, incentives: 8000, dob: "1998-06-25", bankDetails: "ICICI 001205099881 - IFSC ICIC0000012", taxId: "ZELPS9012C" },
  { id: "EMP-004", name: "Vidhi Thummar", department: "Sales", designation: "Sales Executive", reportingManager: "Suresh Chaudhary", status: "Active", joiningDate: "2024-02-15", phone: "8899001104", email: "vidhi@youthcamping.net", attendanceToday: "Late", leaveBalance: 12, payrollStatus: "Paid", salary: 28000, incentives: 9500, dob: "1999-03-19", bankDetails: "AXIS 918010043904 - IFSC UTIB0000084", taxId: "VDHPS3456D" },
  { id: "EMP-005", name: "Neeki Diyali", department: "Operations", designation: "Operations Manager", reportingManager: "Hemal Patel", status: "Active", joiningDate: "2023-01-15", phone: "7766554405", email: "neeki@youthcamping.net", attendanceToday: "Present", leaveBalance: 14, payrollStatus: "Paid", salary: 55000, incentives: 0, dob: "1994-09-12", bankDetails: "KOTAK 98129005 - IFSC KKBK0000182", taxId: "NEKPS7890E" },
];

const INITIAL_ATTENDANCE: AttendanceLog[] = [
  { id: "ATT-101", employeeId: "EMP-001", employeeName: "Hemal Patel", date: "2026-07-03", checkIn: "09:15", checkOut: "18:30", hours: 9.25, status: "Present" },
  { id: "ATT-102", employeeId: "EMP-002", employeeName: "Suresh Chaudhary", date: "2026-07-03", checkIn: "09:20", checkOut: "18:15", hours: 8.9, status: "Present" },
  { id: "ATT-103", employeeId: "EMP-003", employeeName: "Zeel Panchal", date: "2026-07-03", checkIn: "09:25", checkOut: "18:05", hours: 8.6, status: "Present" },
  { id: "ATT-104", employeeId: "EMP-004", employeeName: "Vidhi Thummar", date: "2026-07-03", checkIn: "09:55", checkOut: "18:00", hours: 8.0, status: "Late", reason: "Traffic delay on NH-48" },
  { id: "ATT-105", employeeId: "EMP-005", employeeName: "Neeki Diyali", date: "2026-07-03", checkIn: "09:28", checkOut: "18:00", hours: 8.5, status: "Present" },
];

const INITIAL_LEAVES: LeaveRequest[] = [
  { id: "LV-201", employeeId: "EMP-003", employeeName: "Zeel Panchal", department: "Sales", leaveType: "Casual Leave", startDate: "2026-07-10", endDate: "2026-07-11", duration: 2, status: "Submitted", reason: "Personal work at hometown", handoverNotes: "Vidhi will follow up on active leads." },
];

const INITIAL_COMMISSIONS: CommissionRecord[] = [
  { id: "COM-301", employeeId: "EMP-003", employeeName: "Zeel Panchal", bookingId: "BK-4091", tripCode: "MKA-1", bookingValue: 36000, amountReceived: 36000, commissionRule: "3% of fully paid booking", commissionAmount: 1080, status: "Approved", payrollMonth: "2026-07" },
  { id: "COM-302", employeeId: "EMP-004", employeeName: "Vidhi Thummar", bookingId: "BK-4092", tripCode: "MKB", bookingValue: 24000, amountReceived: 12000, commissionRule: "2% of advance booking", commissionAmount: 480, status: "Calculated", payrollMonth: "2026-07" },
];

const INITIAL_REIMBURSEMENTS: ReimbursementClaim[] = [
  { id: "REI-501", employeeId: "EMP-002", employeeName: "Suresh Chaudhary", category: "Local Transport", amount: 1550, claimDate: "2026-07-01", notes: "Cab fare to travel vendor review", status: "Verified" },
  { id: "REI-502", employeeId: "EMP-005", employeeName: "Neeki Diyali", category: "Emergency", amount: 4800, claimDate: "2026-07-02", notes: "Emergency campsite purchase during storm", status: "Approved" },
];

export default function HRPage() {
  const { admin } = useAuthStore();
  const currentRole = (admin?.role || 'admin').toLowerCase();

  // Role Access Checks
  const isEmployeeOnly = ['sales', 'guide'].includes(currentRole);
  const isTeamLead = ['manager', 'senior', 'operations_manager', 'operations'].includes(currentRole);
  const isAccounts = ['finance', 'accounts'].includes(currentRole);
  const isAdmin = ['admin', 'superadmin', 'founder'].includes(currentRole);

  // States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'attendance' | 'leaves' | 'payroll' | 'incentives' | 'reimbursements' | 'holidays' | 'performance' | 'reports' | 'settings'>(
    isEmployeeOnly ? 'attendance' : 'dashboard'
  );

  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>(INITIAL_ATTENDANCE);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVES);
  const [commissions, setCommissions] = useState<CommissionRecord[]>(INITIAL_COMMISSIONS);
  const [reimbursements, setReimbursements] = useState<ReimbursementClaim[]>(INITIAL_REIMBURSEMENTS);

  // Modals / Detail Views
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeProfileTab, setEmployeeProfileTab] = useState<'overview' | 'employment' | 'attendance' | 'leave' | 'payroll' | 'incentives' | 'claims' | 'performance' | 'audit'>('overview');
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showManualAttendanceModal, setShowManualAttendanceModal] = useState(false);

  // Employee Forms State
  const [newEmp, setNewEmp] = useState({
    name: "", department: "Sales" as any, designation: "", reportingManager: "Abhay Sharma", phone: "", email: "", salary: 25000, dob: "1998-01-01", taxId: ""
  });

  // Leave Form State
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "Casual Leave" as any, startDate: "", endDate: "", duration: 1, reason: "", handoverNotes: ""
  });

  // Claim Form State
  const [claimForm, setClaimForm] = useState({
    category: "Travel" as any, amount: 0, notes: ""
  });

  // Manual Attendance Correction State
  const [manualAtt, setManualAtt] = useState({
    employeeId: "EMP-001", checkIn: "09:30", checkOut: "18:00", date: new Date().toISOString().split('T')[0], reason: ""
  });

  // Auto Check-In state
  const [userCheckedIn, setUserCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);

  // Stats Derived
  const stats = useMemo(() => {
    const total = employees.length;
    const present = employees.filter(e => e.attendanceToday === 'Present' || e.attendanceToday === 'Late').length;
    const absent = employees.filter(e => e.attendanceToday === 'Absent').length;
    const onLeave = employees.filter(e => e.attendanceToday === 'On Leave').length;
    const late = employees.filter(e => e.attendanceToday === 'Late').length;
    const pendingLeaves = leaveRequests.filter(r => r.status === 'Submitted').length;
    const payrollDue = employees.reduce((acc, curr) => acc + curr.salary, 0);
    const pendingClaims = reimbursements.filter(c => c.status === 'Submitted').length;

    return { total, present, absent, onLeave, late, pendingLeaves, payrollDue, pendingClaims };
  }, [employees, leaveRequests, reimbursements]);

  // Handle Employee Check-In
  const handleCheckIn = () => {
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    setUserCheckedIn(true);
    setCheckInTime(timeStr);

    const matchEmp = employees.find(e => e.email === admin?.email) || employees[0];
    const isLate = timeStr > SHIFT_TIMINGS.gracePeriod;

    const newLog: AttendanceLog = {
      id: `ATT-${Date.now()}`,
      employeeId: matchEmp.id,
      employeeName: matchEmp.name,
      date: new Date().toISOString().split('T')[0],
      checkIn: timeStr,
      checkOut: "--",
      hours: 0,
      status: isLate ? 'Late' : 'Present'
    };

    setAttendanceLogs(prev => [newLog, ...prev]);
    setEmployees(prev => prev.map(e => e.id === matchEmp.id ? { ...e, attendanceToday: isLate ? 'Late' : 'Present' } : e));
    toast.success(`Checked in successfully at ${timeStr}! ${isLate ? '(Late mark logged)' : ''}`);
  };

  // Handle Check-Out
  const handleCheckOut = () => {
    if (!checkInTime) return;
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    setUserCheckedIn(false);

    const matchEmp = employees.find(e => e.email === admin?.email) || employees[0];
    
    // Parse hours difference
    const [inH, inM] = checkInTime.split(':').map(Number);
    const [outH, outM] = timeStr.split(':').map(Number);
    const hoursVal = Number(((outH * 60 + outM - (inH * 60 + inM)) / 60).toFixed(2));

    setAttendanceLogs(prev => prev.map(log => 
      log.employeeId === matchEmp.id && log.checkOut === '--'
        ? { ...log, checkOut: timeStr, hours: hoursVal }
        : log
    ));
    toast.success(`Checked out successfully at ${timeStr}. Working hours: ${hoursVal} hrs`);
  };

  // Add Employee
  const saveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.name || !newEmp.designation || !newEmp.phone || !newEmp.email) {
      toast.error("Please fill in all mandatory fields");
      return;
    }

    const empId = `EMP-0${employees.length + 1}`;
    const newRecord: Employee = {
      id: empId,
      name: newEmp.name,
      department: newEmp.department,
      designation: newEmp.designation,
      reportingManager: newEmp.reportingManager,
      status: 'Active',
      joiningDate: new Date().toISOString().split('T')[0],
      phone: newEmp.phone,
      email: newEmp.email,
      attendanceToday: 'Not Checked In',
      leaveBalance: 12,
      payrollStatus: 'Draft',
      salary: newEmp.salary,
      incentives: 0,
      dob: newEmp.dob,
      bankDetails: "A/C pending initialization",
      taxId: newEmp.taxId || "Pending"
    };

    setEmployees(prev => [...prev, newRecord]);
    setShowAddEmployeeModal(false);
    toast.success(`Employee ${newEmp.name} created successfully with ID ${empId}!`);
  };

  // Submit Leave Request
  const saveLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      toast.error("Please complete all leave fields");
      return;
    }

    const matchEmp = employees.find(e => e.email === admin?.email) || employees[0];
    const duration = Number(leaveForm.duration);

    if (matchEmp.leaveBalance < duration) {
      toast.warning("Requested duration exceeds current leave balance. Request will log as Unpaid.");
    }

    // Trip Guide Conflict Warning Check
    const isGuideRole = matchEmp.department === 'Guides';

    const newRequest: LeaveRequest = {
      id: `LV-${Date.now()}`,
      employeeId: matchEmp.id,
      employeeName: matchEmp.name,
      department: matchEmp.department,
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      duration,
      status: 'Submitted',
      reason: leaveForm.reason,
      handoverNotes: leaveForm.handoverNotes,
      conflictDetected: isGuideRole
    };

    setLeaveRequests(prev => [newRequest, ...prev]);
    setShowApplyLeaveModal(false);

    if (isGuideRole) {
      toast.warning("Conflict Warning: Employee is assigned to Guide Rosters during this timeframe. Manager review required.");
    } else {
      toast.success("Leave request submitted successfully for approval!");
    }
  };

  // Submit Claim
  const saveClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (claimForm.amount <= 0 || !claimForm.notes) {
      toast.error("Please provide amount and notes");
      return;
    }

    const matchEmp = employees.find(e => e.email === admin?.email) || employees[0];
    const newClaim: ReimbursementClaim = {
      id: `REI-${Date.now()}`,
      employeeId: matchEmp.id,
      employeeName: matchEmp.name,
      category: claimForm.category,
      amount: claimForm.amount,
      claimDate: new Date().toISOString().split('T')[0],
      notes: claimForm.notes,
      status: 'Submitted'
    };

    setReimbursements(prev => [newClaim, ...prev]);
    setShowClaimModal(false);
    toast.success("Reimbursement claim submitted to Accounts/HR!");
  };

  // Save manual attendance correction
  const saveManualAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAtt.reason) {
      toast.error("A validation correction reason is required");
      return;
    }

    const emp = employees.find(x => x.id === manualAtt.employeeId);
    if (!emp) return;

    const newLog: AttendanceLog = {
      id: `ATT-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      date: manualAtt.date,
      checkIn: manualAtt.checkIn,
      checkOut: manualAtt.checkOut,
      hours: 8.5,
      status: 'Present',
      reason: `HR Manual correction: ${manualAtt.reason}`
    };

    setAttendanceLogs(prev => [newLog, ...prev]);
    setShowManualAttendanceModal(false);
    toast.success("Manual attendance correction logged and approved!");
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 select-none">
      
      {/* SCOPED CSS RULES FOR ERGONOMIC ERP LOOK */}
      <style dangerouslySetInnerHTML={{ __html: `
        .hr-nav-item {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 11.5px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease-in-out;
        }
        .hr-nav-item:hover {
          background-color: #f1f5f9;
          color: #0f172a;
        }
        .hr-nav-item.active {
          background-color: #ffedd5;
          color: #ea6d1e;
        }
        .hr-table th {
          padding: 6px 8px;
          font-weight: 700;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          border-bottom: 1px solid #e2e8f0;
          text-align: left;
        }
        .hr-table td {
          padding: 8px 8px;
          font-size: 11.5px;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
        }
        .hr-badge {
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 9999px;
          text-transform: uppercase;
        }
        .hr-tab-btn {
          font-size: 11px;
          font-weight: 700;
          padding: 6px 12px;
          color: #64748b;
          border-bottom: 2px solid transparent;
          transition: all 0.15s;
        }
        .hr-tab-btn.active {
          color: #ea6d1e;
          border-bottom-color: #ea6d1e;
        }
      `}} />

      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 h-14 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center text-white">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-extrabold text-[14px] text-slate-900 leading-tight">HR & People Workspace</h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">YouthCamping OS Employee Management</p>
          </div>
        </div>

        {/* SELF-SERVICE CHECK-IN WIDGET */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded px-3 py-1 text-xs">
            <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            <span className="font-bold text-slate-600 mr-2">Work Shift Timing: 09:30 AM</span>
            {userCheckedIn ? (
              <button 
                onClick={handleCheckOut}
                className="bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded transition-colors"
              >
                Check Out ({checkInTime})
              </button>
            ) : (
              <button 
                onClick={handleCheckIn}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded transition-colors"
              >
                Check In Today
              </button>
            )}
          </div>

          {!isEmployeeOnly && (
            <button 
              onClick={() => setShowAddEmployeeModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs h-8 px-3.5 rounded flex items-center gap-1 shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Onboard Employee
            </button>
          )}
        </div>
      </div>

      {/* CORE SPLIT CONTAINER */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* SUB NAVIGATION BAR */}
        <div className="w-[210px] shrink-0 border-r border-slate-200 bg-white flex flex-col p-3 space-y-1">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Modules</div>
          
          {!isEmployeeOnly && (
            <div className={cn("hr-nav-item", activeTab === 'dashboard' && "active")} onClick={() => setActiveTab('dashboard')}>
              <BarChart2 className="w-4 h-4 mr-2.5" /> HR Dashboard
            </div>
          )}

          <div className={cn("hr-nav-item", activeTab === 'employees' && "active")} onClick={() => setActiveTab('employees')}>
            <Users className="w-4 h-4 mr-2.5" /> Employees Directory
          </div>

          <div className={cn("hr-nav-item", activeTab === 'attendance' && "active")} onClick={() => setActiveTab('attendance')}>
            <Clock className="w-4 h-4 mr-2.5" /> Attendance Register
          </div>

          <div className={cn("hr-nav-item", activeTab === 'leaves' && "active")} onClick={() => setActiveTab('leaves')}>
            <CalendarDays className="w-4 h-4 mr-2.5" /> Leave Management
          </div>

          <div className={cn("hr-nav-item", activeTab === 'payroll' && "active")} onClick={() => setActiveTab('payroll')}>
            <DollarSign className="w-4 h-4 mr-2.5" /> Payroll & Salaries
          </div>

          <div className={cn("hr-nav-item", activeTab === 'incentives' && "active")} onClick={() => setActiveTab('incentives')}>
            <Award className="w-4 h-4 mr-2.5" /> Sales Incentives
          </div>

          <div className={cn("hr-nav-item", activeTab === 'reimbursements' && "active")} onClick={() => setActiveTab('reimbursements')}>
            <Receipt className="w-4 h-4 mr-2.5" /> Reimbursements
          </div>

          <div className={cn("hr-nav-item", activeTab === 'holidays' && "active")} onClick={() => setActiveTab('holidays')}>
            <Calendar className="w-4 h-4 mr-2.5" /> Holidays & Shifts
          </div>

          <div className={cn("hr-nav-item", activeTab === 'performance' && "active")} onClick={() => setActiveTab('performance')}>
            <TrendingUp className="w-4 h-4 mr-2.5" /> Performance Scores
          </div>



          {!isEmployeeOnly && (
            <>
              <div className={cn("hr-nav-item", activeTab === 'reports' && "active")} onClick={() => setActiveTab('reports')}>
                <FileSpreadsheet className="w-4 h-4 mr-2.5" /> HR Analytics Reports
              </div>
              <div className={cn("hr-nav-item", activeTab === 'settings' && "active")} onClick={() => setActiveTab('settings')}>
                <Settings className="w-4 h-4 mr-2.5" /> HR System Settings
              </div>
            </>
          )}
        </div>

        {/* DETAILS AND CONTENT AREA */}
        <div className="flex-1 bg-slate-50 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: HR DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* TOP STATS ROW */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Headcount</p>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-1">{stats.total} Active</h3>
                    <p className="text-[9px] text-slate-500 mt-1">Directly on payroll</p>
                  </div>
                  <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Present Today</p>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-1">{stats.present} Present</h3>
                    <p className="text-[9px] text-amber-600 font-semibold mt-1">{stats.late} Late check-ins today</p>
                  </div>
                  <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded flex items-center justify-center">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Leave / Absences</p>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-1">{stats.onLeave} Leave / {stats.absent} Absent</h3>
                    <p className="text-[9px] text-slate-500 mt-1">Auto synchronized logs</p>
                  </div>
                  <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">HR Approvals Needed</p>
                    <h3 className="text-xl font-extrabold text-orange-600 mt-1">{stats.pendingLeaves} Leaves / {stats.pendingClaims} Claims</h3>
                    <p className="text-[9px] text-slate-500 mt-1">Pending admin confirmation</p>
                  </div>
                  <div className="h-10 w-10 bg-orange-50 text-orange-600 rounded flex items-center justify-center">
                    <Milestone className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* SECOND ROW METRICS */}
              <div className="grid grid-cols-3 gap-6">
                
                {/* Department Wise Summary */}
                <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-3">
                  <h4 className="font-bold text-[12px] text-slate-800 border-b pb-2 flex items-center gap-1.5">
                    <Milestone className="w-4 h-4 text-slate-500" /> Department Attendance Today
                  </h4>
                  <div className="space-y-2">
                    {[
                      { name: 'Sales Team', val: '2 Present, 1 Late' },
                      { name: 'Operations', val: '1 Present' },
                      { name: 'Accounts & Finance', val: '1 Present' },
                      { name: 'Tour Guides', val: '1 On Leave' }
                    ].map(dep => (
                      <div key={dep.name} className="flex justify-between text-xs text-slate-600 font-medium">
                        <span>{dep.name}</span>
                        <span className="font-bold text-slate-900">{dep.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Salary Metrics */}
                <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-3">
                  <h4 className="font-bold text-[12px] text-slate-800 border-b pb-2 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-slate-500" /> Payroll Month Estimations
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-semibold">Total Basic Salaries:</span>
                      <span className="font-extrabold font-mono text-slate-800">₹{stats.payrollDue.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-semibold">Calculated Incentives:</span>
                      <span className="font-extrabold font-mono text-slate-800">₹32,080</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-semibold">Approved Claims:</span>
                      <span className="font-extrabold font-mono text-slate-800">₹6,350</span>
                    </div>
                    <div className="border-t pt-1.5 flex justify-between text-xs">
                      <span className="text-slate-800 font-bold">Estimated Cost:</span>
                      <span className="font-extrabold font-mono text-orange-600">₹{(stats.payrollDue + 38430).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Anniversary & Annoucement list */}
                <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-3">
                  <h4 className="font-bold text-[12px] text-slate-800 border-b pb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-slate-500" /> Anniversaries & Annoucements
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="h-6.5 w-6.5 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0">BD</div>
                      <div>
                        <p className="text-xs text-slate-700 font-bold">Suru Sengupta (Sales)</p>
                        <p className="text-[9px] text-slate-500">Upcoming birthday on August 14th</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="h-6.5 w-6.5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0">WA</div>
                      <div>
                        <p className="text-xs text-slate-700 font-bold">Arjun Mehta (Operations)</p>
                        <p className="text-[9px] text-slate-500">Completing 3 Years Anniversary in 2 days</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: EMPLOYEE DIRECTORY */}
          {activeTab === 'employees' && (
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden space-y-4 p-4">
              
              {/* Profile details page overlay if selected */}
              {selectedEmployee ? (
                <div className="space-y-6">
                  
                  {/* profile header */}
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded bg-slate-200 flex items-center justify-center font-extrabold text-slate-600 text-lg uppercase shadow-sm">
                        {selectedEmployee.name.substring(0,2)}
                      </div>
                      <div>
                        <h2 className="text-lg font-extrabold text-slate-900">{selectedEmployee.name}</h2>
                        <p className="text-xs text-slate-500 font-semibold">{selectedEmployee.designation} &bull; {selectedEmployee.department}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedEmployee(null)}
                      className="border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded text-xs font-bold text-slate-600 transition-colors"
                    >
                      Back to Directory
                    </button>
                  </div>

                  {/* Tabs workspace */}
                  <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
                    {[
                      { label: 'Overview', value: 'overview' },
                      { label: 'Employment Details', value: 'employment' },
                      { label: 'Attendance logs', value: 'attendance' },
                      { label: 'Leaves balance', value: 'leave' },
                      { label: 'Salary Structure', value: 'payroll' },
                      { label: 'Incentives', value: 'incentives' },
                      { label: 'Claims', value: 'claims' },
                      { label: 'Performance', value: 'performance' },
                      { label: 'Audit History', value: 'audit' }
                    ].map(tab => (
                      <button 
                        key={tab.value}
                        className={cn("hr-tab-btn shrink-0", employeeProfileTab === tab.value && "active")}
                        onClick={() => setEmployeeProfileTab(tab.value as any)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* PROFILE SUBTABS CONTENT */}
                  <div className="p-2 space-y-4">
                    
                    {employeeProfileTab === 'overview' && (
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3 bg-slate-50 p-4 rounded border">
                          <h4 className="font-bold text-xs text-slate-800 border-b pb-1">Personal Profile</h4>
                          <div className="space-y-1.5 text-xs">
                            <div><span className="text-slate-500 font-semibold">Email:</span> <span className="font-bold text-slate-800">{selectedEmployee.email}</span></div>
                            <div><span className="text-slate-500 font-semibold">Phone:</span> <span className="font-bold text-slate-800">{selectedEmployee.phone}</span></div>
                            <div><span className="text-slate-500 font-semibold">DOB:</span> <span className="font-bold text-slate-800">{selectedEmployee.dob}</span></div>
                            <div><span className="text-slate-500 font-semibold">Identifiers:</span> <span className="font-bold text-slate-800">Aadhaar/PAN Verified: YES ({selectedEmployee.taxId})</span></div>
                          </div>
                        </div>

                        <div className="space-y-3 bg-slate-50 p-4 rounded border">
                          <h4 className="font-bold text-xs text-slate-800 border-b pb-1">Bank Payment details</h4>
                          <div className="space-y-1.5 text-xs">
                            <div><span className="text-slate-500 font-semibold">Bank details:</span> <span className="font-bold font-mono text-slate-800">{selectedEmployee.bankDetails}</span></div>
                            <div><span className="text-slate-500 font-semibold">Base salary:</span> <span className="font-bold text-slate-800">₹{selectedEmployee.salary.toLocaleString('en-IN')}/mo</span></div>
                            <div><span className="text-slate-500 font-semibold">Deductions calculation:</span> <span className="font-bold text-slate-800">Configured by admin policies</span></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {employeeProfileTab === 'employment' && (
                      <div className="space-y-3 bg-slate-50 p-4 rounded border text-xs">
                        <h4 className="font-bold text-xs text-slate-800 border-b pb-1">Employment Workspace configuration</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div><span className="text-slate-500 font-semibold">Joining Date:</span> <span className="font-bold text-slate-800">{selectedEmployee.joiningDate}</span></div>
                          <div><span className="text-slate-500 font-semibold">Reporting Line Manager:</span> <span className="font-bold text-slate-800">{selectedEmployee.reportingManager}</span></div>
                          <div><span className="text-slate-500 font-semibold">Employment Status:</span> <span className="font-bold text-slate-800">{selectedEmployee.status}</span></div>
                          <div><span className="text-slate-500 font-semibold">Work Role:</span> <span className="font-bold text-slate-800">{selectedEmployee.designation}</span></div>
                        </div>
                      </div>
                    )}

                    {employeeProfileTab === 'attendance' && (
                      <div className="space-y-3">
                        <h4 className="font-bold text-xs text-slate-800">Personal Attendance logs</h4>
                        <table className="w-full text-left hr-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Check-in</th>
                              <th>Check-out</th>
                              <th>Working hours</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendanceLogs.filter(l => l.employeeId === selectedEmployee.id).map(log => (
                              <tr key={log.id}>
                                <td>{log.date}</td>
                                <td>{log.checkIn}</td>
                                <td>{log.checkOut}</td>
                                <td>{log.hours} hrs</td>
                                <td>
                                  <span className={cn("hr-badge", log.status === 'Present' ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800")}>
                                    {log.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {employeeProfileTab === 'leave' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded border text-xs">
                          <h5 className="font-bold text-slate-700 mb-2">Leave Summary balance</h5>
                          <div className="text-2xl font-black text-orange-600">{selectedEmployee.leaveBalance} Days</div>
                          <p className="text-[10px] text-slate-500 mt-1">Available for allocation in 2026</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded border text-xs">
                          <h5 className="font-bold text-slate-700 mb-2">Pending approved request conflicts</h5>
                          {leaveRequests.filter(l => l.employeeId === selectedEmployee.id).map(l => (
                            <div key={l.id} className="p-2 bg-white rounded border mb-1 flex items-center justify-between">
                              <span>{l.startDate} &bull; {l.leaveType}</span>
                              <span className="font-bold text-orange-600">{l.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {employeeProfileTab === 'payroll' && (
                      <div className="bg-slate-50 p-4 rounded border text-xs space-y-3">
                        <h4 className="font-bold text-xs text-slate-800">Custom Salary structure fields</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div><span className="text-slate-500 font-semibold">Basic:</span> <span className="font-bold font-mono">₹{Math.floor(selectedEmployee.salary * 0.5)}</span></div>
                          <div><span className="text-slate-500 font-semibold">HRA:</span> <span className="font-bold font-mono">₹{Math.floor(selectedEmployee.salary * 0.25)}</span></div>
                          <div><span className="text-slate-500 font-semibold">Allowance:</span> <span className="font-bold font-mono">₹{Math.floor(selectedEmployee.salary * 0.25)}</span></div>
                        </div>
                      </div>
                    )}

                    {employeeProfileTab === 'incentives' && (
                      <div className="space-y-3">
                        <h4 className="font-bold text-xs text-slate-800">Booking commission logs</h4>
                        <table className="w-full text-left hr-table">
                          <thead>
                            <tr>
                              <th>Booking Code</th>
                              <th>Commission rule</th>
                              <th>Total commission</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {commissions.filter(c => c.employeeId === selectedEmployee.id).map(c => (
                              <tr key={c.id}>
                                <td>{c.bookingId} &bull; {c.tripCode}</td>
                                <td>{c.commissionRule}</td>
                                <td className="font-mono">₹{c.commissionAmount}</td>
                                <td><span className="hr-badge bg-green-100 text-green-800">{c.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {employeeProfileTab === 'claims' && (
                      <div className="space-y-3">
                        <h4 className="font-bold text-xs text-slate-800">Reimbursement expense logs</h4>
                        <table className="w-full text-left hr-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Category</th>
                              <th>Claim notes</th>
                              <th>Amount</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reimbursements.filter(r => r.employeeId === selectedEmployee.id).map(r => (
                              <tr key={r.id}>
                                <td>{r.claimDate}</td>
                                <td>{r.category}</td>
                                <td>{r.notes}</td>
                                <td className="font-mono">₹{r.amount}</td>
                                <td><span className="hr-badge bg-blue-100 text-blue-800">{r.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}



                    {employeeProfileTab === 'performance' && (
                      <div className="space-y-3 bg-slate-50 p-4 rounded border text-xs">
                        <h4 className="font-bold text-xs text-slate-800 mb-2">Practical Performance metrics</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-3 bg-white border rounded">
                            <span className="text-slate-500 font-semibold block">Attendance Score:</span>
                            <span className="font-bold text-[14px] text-green-600">98% Perfect</span>
                          </div>
                          <div className="p-3 bg-white border rounded">
                            <span className="text-slate-500 font-semibold block">Completed Tasks:</span>
                            <span className="font-bold text-[14px] text-blue-600">22 Closed</span>
                          </div>
                          <div className="p-3 bg-white border rounded">
                            <span className="text-slate-500 font-semibold block">Sales Target achievement:</span>
                            <span className="font-bold text-[14px] text-orange-600">105% of quota</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {employeeProfileTab === 'audit' && (
                      <div className="space-y-2 text-xs">
                        <div className="p-2 border-l-2 border-orange-500 bg-slate-50">
                          <span className="font-bold text-slate-700">Salary structure updated</span> &bull; By Finance Admin at 2026-07-01
                          <p className="text-[10px] text-slate-500">Reason: Annual index adjustment</p>
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Header filter layout */}
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-extrabold text-[12px] text-slate-800">Employee Directory Register</h3>
                    <div className="text-xs text-slate-400">Showing {employees.length} records</div>
                  </div>

                  {/* Directory table */}
                  <table className="w-full text-left hr-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Department</th>
                        <th>Role</th>
                        <th>Manager</th>
                        <th>Status</th>
                        <th>Joining Date</th>
                        <th>Salary Slip</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map(emp => {
                        // Secure salary lock check
                        const hideSalary = isEmployeeOnly && emp.email !== admin?.email;

                        return (
                          <tr 
                            key={emp.id}
                            className="hover:bg-slate-50 cursor-pointer"
                            onClick={() => {
                              if (isEmployeeOnly && emp.email !== admin?.email) {
                                toast.error("Security Restriction: You do not have permission to view other employee details");
                                return;
                              }
                              setSelectedEmployee(emp);
                            }}
                          >
                            <td className="font-bold text-slate-800">{emp.name} ({emp.id})</td>
                            <td>{emp.department}</td>
                            <td>{emp.designation}</td>
                            <td>{emp.reportingManager}</td>
                            <td>
                              <span className={cn(
                                "hr-badge",
                                emp.status === 'Active' ? "bg-green-100 text-green-800" :
                                emp.status === 'On Leave' ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-800"
                              )}>
                                {emp.status}
                              </span>
                            </td>
                            <td>{emp.joiningDate}</td>
                            <td onClick={e => e.stopPropagation()}>
                              {hideSalary ? (
                                <span className="text-slate-400 flex items-center gap-1 font-bold text-[9px] uppercase"><Lock className="w-3 h-3" /> Locked</span>
                              ) : (
                                <button 
                                  className="text-orange-600 hover:text-orange-700 hover:underline font-bold text-[11px]"
                                  onClick={() => toast.info(`Exporting payslip structure for ${emp.name}`)}
                                >
                                  [Download Payslip]
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                </div>
              )}

            </div>
          )}

          {/* TAB 3: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden p-4 space-y-4">
              
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-extrabold text-[12px] text-slate-800">Attendance Log Register</h3>
                {!isEmployeeOnly && (
                  <button 
                    onClick={() => setShowManualAttendanceModal(true)}
                    className="border border-orange-500 hover:bg-orange-50 text-orange-600 text-xs font-bold px-3 py-1.5 rounded transition-colors"
                  >
                    + Correct Attendance Log
                  </button>
                )}
              </div>

              <table className="w-full text-left hr-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Hours logged</th>
                    <th>Status</th>
                    <th>Notes/Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceLogs.map(log => {
                    const hideRow = isEmployeeOnly && employees.find(x => x.id === log.employeeId)?.email !== admin?.email;
                    if (hideRow) return null;

                    return (
                      <tr key={log.id}>
                        <td className="font-bold">{log.employeeName}</td>
                        <td>{log.date}</td>
                        <td>{log.checkIn}</td>
                        <td>{log.checkOut}</td>
                        <td>{log.hours} hrs</td>
                        <td>
                          <span className={cn(
                            "hr-badge",
                            log.status === 'Present' ? "bg-green-50 text-green-700 border-green-200" :
                            log.status === 'Late' ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200"
                          )}>
                            {log.status}
                          </span>
                        </td>
                        <td className="text-slate-500 font-medium italic">{log.reason || "--"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

            </div>
          )}

          {/* TAB 4: LEAVE MANAGEMENT */}
          {activeTab === 'leaves' && (
            <div className="space-y-6">
              
              <div className="bg-white border border-slate-200 rounded shadow-sm p-4 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-extrabold text-[12px] text-slate-800 font-bold">Leave Requests</h3>
                  <button 
                    onClick={() => setShowApplyLeaveModal(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs h-8 px-3 rounded flex items-center gap-1 shadow-sm transition-colors"
                  >
                    Apply Leave Request
                  </button>
                </div>

                <table className="w-full text-left hr-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Leave Type</th>
                      <th>Dates</th>
                      <th>Days</th>
                      <th>Manager conflict warning</th>
                      <th>Reason</th>
                      <th>Status</th>
                      {!isEmployeeOnly && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.map(req => {
                      const hideRow = isEmployeeOnly && employees.find(x => x.id === req.employeeId)?.email !== admin?.email;
                      if (hideRow) return null;

                      return (
                        <tr key={req.id}>
                          <td className="font-bold">{req.employeeName}</td>
                          <td>{req.leaveType}</td>
                          <td>{req.startDate} to {req.endDate}</td>
                          <td>{req.duration} days</td>
                          <td>
                            {req.conflictDetected ? (
                              <span className="text-rose-600 flex items-center gap-1 font-bold text-[9px] uppercase"><ShieldAlert className="w-3.5 h-3.5" /> Guide Assigned</span>
                            ) : (
                              <span className="text-slate-400 font-medium text-[9px] uppercase">No roster Conflict</span>
                            )}
                          </td>
                          <td>{req.reason}</td>
                          <td>
                            <span className={cn(
                              "hr-badge",
                              req.status === 'HR Approved' || req.status === 'Manager Approved' ? "bg-green-100 text-green-800" :
                              req.status === 'Rejected' ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                            )}>
                              {req.status}
                            </span>
                          </td>
                          {!isEmployeeOnly && (
                            <td>
                              {req.status === 'Submitted' && (
                                <div className="flex gap-1.5">
                                  <button 
                                    onClick={() => {
                                      setLeaveRequests(prev => prev.map(x => x.id === req.id ? { ...x, status: 'HR Approved' } : x));
                                      // Debit leave balance
                                      setEmployees(prev => prev.map(e => e.id === req.employeeId ? { ...e, leaveBalance: Math.max(0, e.leaveBalance - req.duration) } : e));
                                      toast.success("Leave Request Approved & Attendance Synchronized!");
                                    }}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setLeaveRequests(prev => prev.map(x => x.id === req.id ? { ...x, status: 'Rejected' } : x));
                                      toast.error("Leave Request Rejected");
                                    }}
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded transition-colors"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 5: PAYROLL & SALARIES */}
          {activeTab === 'payroll' && (
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden p-4 space-y-4">
              
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-extrabold text-[12px] text-slate-800">Monthly Payroll Run Period (Locked after final approval)</h3>
                {!isEmployeeOnly && !isTeamLead && (
                  <button 
                    onClick={() => {
                      toast.success("Payroll month July 2026 initialized! Calculations loaded from attendance logs.");
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs h-8 px-3 rounded transition-colors"
                  >
                    Run July 2026 Payroll
                  </button>
                )}
              </div>

              <table className="w-full text-left hr-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Basic Salary</th>
                    <th>Incentives</th>
                    <th>Reimbursements</th>
                    <th>Deductions (Unpaid Leave)</th>
                    <th>Net Payable</th>
                    <th>Calculation Status</th>
                    {!isEmployeeOnly && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => {
                    const hideRow = isEmployeeOnly && emp.email !== admin?.email;
                    if (hideRow) return null;

                    const inc = commissions.filter(c => c.employeeId === emp.id && c.status === 'Approved').reduce((acc, curr) => acc + curr.commissionAmount, 0);
                    const rei = reimbursements.filter(r => r.employeeId === emp.id && r.status === 'Approved').reduce((acc, curr) => acc + curr.amount, 0);
                    const net = emp.salary + inc + rei;

                    return (
                      <tr key={emp.id}>
                        <td className="font-bold">{emp.name}</td>
                        <td className="font-mono">₹{emp.salary.toLocaleString('en-IN')}</td>
                        <td className="font-mono text-emerald-600">+₹{inc}</td>
                        <td className="font-mono text-blue-600">+₹{rei}</td>
                        <td className="font-mono text-rose-600">-₹0</td>
                        <td className="font-extrabold font-mono text-slate-800">₹{net.toLocaleString('en-IN')}</td>
                        <td>
                          <span className={cn(
                            "hr-badge",
                            emp.payrollStatus === 'Paid' ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                          )}>
                            {emp.payrollStatus}
                          </span>
                        </td>
                        {!isEmployeeOnly && (
                          <td>
                            <button 
                              onClick={() => {
                                setEmployees(prev => prev.map(x => x.id === emp.id ? { ...x, payrollStatus: 'Paid' } : x));
                                toast.success(`Salary slip dispatched and paid to ${emp.name}!`);
                              }}
                              className="text-orange-600 hover:text-orange-700 font-bold hover:underline"
                            >
                              [Mark Paid]
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

            </div>
          )}

          {/* TAB 6: INCENTIVES & COMMISSIONS */}
          {activeTab === 'incentives' && (
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden p-4 space-y-4">
              
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-extrabold text-[12px] text-slate-800">Sales Commission & Trip Incentives Register</h3>
              </div>

              <table className="w-full text-left hr-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Booking Code</th>
                    <th>Trip details</th>
                    <th>Amount Received</th>
                    <th>Commission Rule</th>
                    <th>Incentive Earned</th>
                    <th>Status</th>
                    {!isEmployeeOnly && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {commissions.map(c => {
                    const hideRow = isEmployeeOnly && employees.find(x => x.id === c.employeeId)?.email !== admin?.email;
                    if (hideRow) return null;

                    return (
                      <tr key={c.id}>
                        <td className="font-bold">{c.employeeName}</td>
                        <td>{c.bookingId}</td>
                        <td>{c.tripCode}</td>
                        <td className="font-mono">₹{c.amountReceived.toLocaleString('en-IN')}</td>
                        <td>{c.commissionRule}</td>
                        <td className="font-extrabold font-mono text-emerald-600">₹{c.commissionAmount}</td>
                        <td>
                          <span className={cn(
                            "hr-badge",
                            c.status === 'Approved' ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                          )}>
                            {c.status}
                          </span>
                        </td>
                        {!isEmployeeOnly && (
                          <td>
                            {c.status === 'Calculated' && (
                              <button 
                                onClick={() => {
                                  setCommissions(prev => prev.map(x => x.id === c.id ? { ...x, status: 'Approved' } : x));
                                  toast.success("Commission payout approved for inclusion in payroll!");
                                }}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded transition-colors"
                              >
                                Approve
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

            </div>
          )}

          {/* TAB 7: REIMBURSEMENTS */}
          {activeTab === 'reimbursements' && (
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden p-4 space-y-4">
              
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-extrabold text-[12px] text-slate-800 font-bold">Expense Reimbursements & Claims</h3>
                <button 
                  onClick={() => setShowClaimModal(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs h-8 px-3 rounded transition-colors"
                >
                  Submit Expense Claim
                </button>
              </div>

              <table className="w-full text-left hr-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Claim notes</th>
                    <th>Amount</th>
                    <th>Receipt Document</th>
                    <th>Approval Status</th>
                    {!isEmployeeOnly && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {reimbursements.map(claim => {
                    const hideRow = isEmployeeOnly && employees.find(x => x.id === claim.employeeId)?.email !== admin?.email;
                    if (hideRow) return null;

                    return (
                      <tr key={claim.id}>
                        <td className="font-bold">{claim.employeeName}</td>
                        <td>{claim.claimDate}</td>
                        <td>{claim.category}</td>
                        <td>{claim.notes}</td>
                        <td className="font-extrabold font-mono">₹{claim.amount.toLocaleString('en-IN')}</td>
                        <td>
                          <span className="text-slate-400 flex items-center gap-1 font-bold text-[9px] uppercase"><FileText className="w-3 h-3" /> Attached Receipt</span>
                        </td>
                        <td>
                          <span className={cn(
                            "hr-badge",
                            claim.status === 'Verified' || claim.status === 'Approved' ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                          )}>
                            {claim.status}
                          </span>
                        </td>
                        {!isEmployeeOnly && (
                          <td>
                            {claim.status === 'Submitted' && (
                              <button 
                                onClick={() => {
                                  setReimbursements(prev => prev.map(x => x.id === claim.id ? { ...x, status: 'Approved' } : x));
                                  toast.success("Expense claim verified and approved for next payout cycle!");
                                }}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded transition-colors"
                              >
                                Approve Claim
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

            </div>
          )}

          {/* TAB 8: HOLIDAYS & SHIFTS */}
          {activeTab === 'holidays' && (
            <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-4">
              <h3 className="font-extrabold text-[12px] text-slate-800 border-b pb-2">Shift Rosters & Availability</h3>
              <div className="grid grid-cols-2 gap-6 text-xs">
                
                <div className="space-y-3 bg-slate-50 p-4 rounded border">
                  <h4 className="font-bold text-slate-800 border-b pb-1">Shift Timings configuration</h4>
                  <div className="space-y-1.5">
                    <div><span className="text-slate-500 font-semibold">Standard Shift:</span> <span className="font-bold text-slate-800">09:30 AM to 06:30 PM</span></div>
                    <div><span className="text-slate-500 font-semibold">Grace Period:</span> <span className="font-bold text-slate-800">15 minutes (cutoff 09:45 AM)</span></div>
                    <div><span className="text-slate-500 font-semibold">Weekly off days:</span> <span className="font-bold text-slate-800">Sundays</span></div>
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded border">
                  <h4 className="font-bold text-slate-800 border-b pb-1">Guide Trip-Duty Status</h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span>Priya Patel (EMP-005):</span>
                      <span className="font-bold text-orange-600">Assigned to Manali Departure (Conflict)</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 9: PERFORMANCE */}
          {activeTab === 'performance' && (
            <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-4">
              <h3 className="font-extrabold text-[12px] text-slate-800 border-b pb-2">Operational Performance Scores</h3>
              <table className="w-full text-left hr-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Attendance Score</th>
                    <th>Tasks Completed</th>
                    <th>Sales Bookings Target</th>
                    <th>Trip Feedback (Guides)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => {
                    const hideRow = isEmployeeOnly && emp.email !== admin?.email;
                    if (hideRow) return null;

                    return (
                      <tr key={emp.id}>
                        <td className="font-bold">{emp.name}</td>
                        <td className="text-green-600 font-bold">98%</td>
                        <td>24 Completed</td>
                        <td className="font-mono">₹1,80,000 / ₹2,00,000</td>
                        <td>4.8 / 5.0 ★</td>
                        <td><span className="hr-badge bg-green-100 text-green-800">High Performer</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}



          {/* TAB 11: HR REPORTS */}
          {activeTab === 'reports' && (
            <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-4">
              <h3 className="font-extrabold text-[12px] text-slate-800 border-b pb-2">HR Analytics & Reports</h3>
              <div className="grid grid-cols-2 gap-6 text-xs">
                
                <div className="p-4 bg-slate-50 border rounded space-y-2">
                  <h4 className="font-bold text-slate-700">Monthly Payroll Cost Payouts</h4>
                  <p className="text-2xl font-black text-slate-900">₹{(stats.payrollDue + 38430).toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-slate-500">Calculated sum of basic pay + incentives + claims</p>
                </div>

                <div className="p-4 bg-slate-50 border rounded space-y-2">
                  <h4 className="font-bold text-slate-700">Headcount Turnover</h4>
                  <p className="text-2xl font-black text-green-600">0% Attrition</p>
                  <p className="text-[10px] text-slate-500">No employees exited in the last 6 months</p>
                </div>

              </div>
            </div>
          )}

          {/* TAB 12: HR SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-4">
              <h3 className="font-extrabold text-[12px] text-slate-800 border-b pb-2">HR & Timing Configuration Settings</h3>
              <div className="space-y-4 text-xs">
                
                <div className="p-4 bg-slate-50 border rounded space-y-3">
                  <h4 className="font-bold text-slate-700">Company Timing Policies</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-500 font-semibold block">Office Hours Start:</span>
                      <input type="text" className="border px-2 py-1 rounded w-32 mt-1" defaultValue="09:30 AM" />
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Grace Period timing:</span>
                      <input type="text" className="border px-2 py-1 rounded w-32 mt-1" defaultValue="15 minutes" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border rounded space-y-3">
                  <h4 className="font-bold text-slate-700">Leave Balance allocation policy</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-500 font-semibold block">Annual Leave Payout Days:</span>
                      <input type="text" className="border px-2 py-1 rounded w-32 mt-1" defaultValue="18 Days" />
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Carry Forward Limit:</span>
                      <input type="text" className="border px-2 py-1 rounded w-32 mt-1" defaultValue="5 Days" />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

      {/* MODAL: ONBOARD EMPLOYEE */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b">
              <h3 className="font-extrabold text-[12px] text-slate-800">Onboard New Employee</h3>
              <button onClick={() => setShowAddEmployeeModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={saveEmployee} className="p-4 space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold block">Full Name *</span>
                <input required type="text" className="w-full border p-2 rounded" placeholder="John Doe" value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-slate-500 font-semibold block">Department</span>
                  <select className="w-full border p-2 rounded bg-white" value={newEmp.department} onChange={e => setNewEmp({...newEmp, department: e.target.value as any})}>
                    <option value="Sales">Sales</option>
                    <option value="Operations">Operations</option>
                    <option value="Accounts">Accounts</option>
                    <option value="Guides">Guides</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 font-semibold block">Designation *</span>
                  <input required type="text" className="w-full border p-2 rounded" placeholder="Account Manager" value={newEmp.designation} onChange={e => setNewEmp({...newEmp, designation: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-slate-500 font-semibold block">Phone Number *</span>
                  <input required type="text" className="w-full border p-2 rounded" placeholder="9876543210" value={newEmp.phone} onChange={e => setNewEmp({...newEmp, phone: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 font-semibold block">Email Address *</span>
                  <input required type="email" className="w-full border p-2 rounded" placeholder="john@youthcamping.net" value={newEmp.email} onChange={e => setNewEmp({...newEmp, email: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-slate-500 font-semibold block">Monthly Basic Salary (₹)</span>
                  <input type="number" className="w-full border p-2 rounded" value={newEmp.salary} onChange={e => setNewEmp({...newEmp, salary: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 font-semibold block">PAN / tax identifiers</span>
                  <input type="text" className="w-full border p-2 rounded" placeholder="ABCDE1234F" value={newEmp.taxId} onChange={e => setNewEmp({...newEmp, taxId: e.target.value})} />
                </div>
              </div>
              <div className="pt-2 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddEmployeeModal(false)} className="px-4 py-2 border rounded font-bold hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded font-bold">Onboard Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: APPLY LEAVE */}
      {showApplyLeaveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b">
              <h3 className="font-extrabold text-[12px] text-slate-800">Apply Leave Request</h3>
              <button onClick={() => setShowApplyLeaveModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={saveLeaveRequest} className="p-4 space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold block">Leave Type</span>
                <select className="w-full border p-2 rounded bg-white" value={leaveForm.leaveType} onChange={e => setLeaveForm({...leaveForm, leaveType: e.target.value as any})}>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Earned Leave">Earned Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                  <option value="Comp Off">Comp Off</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-slate-500 font-semibold block">Start Date *</span>
                  <input required type="date" className="w-full border p-2 rounded" value={leaveForm.startDate} onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 font-semibold block">End Date *</span>
                  <input required type="date" className="w-full border p-2 rounded" value={leaveForm.endDate} onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-slate-500 font-semibold block">Duration (days)</span>
                  <input type="number" className="w-full border p-2 rounded" value={leaveForm.duration} onChange={e => setLeaveForm({...leaveForm, duration: Number(e.target.value)})} />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold block">Reason *</span>
                <textarea required rows={3} className="w-full border p-2 rounded" placeholder="Specify leave details..." value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} />
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold block">Handover Notes</span>
                <input type="text" className="w-full border p-2 rounded" placeholder="Who will cover your daily ops?" value={leaveForm.handoverNotes} onChange={e => setLeaveForm({...leaveForm, handoverNotes: e.target.value})} />
              </div>
              <div className="pt-2 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setShowApplyLeaveModal(false)} className="px-4 py-2 border rounded font-bold hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded font-bold">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT CLAIM */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b">
              <h3 className="font-extrabold text-[12px] text-slate-800">Submit Expense Claim</h3>
              <button onClick={() => setShowClaimModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={saveClaim} className="p-4 space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold block">Expense Category</span>
                <select className="w-full border p-2 rounded bg-white" value={claimForm.category} onChange={e => setClaimForm({...claimForm, category: e.target.value as any})}>
                  <option value="Travel">Travel</option>
                  <option value="Food">Food</option>
                  <option value="Local Transport">Local Transport</option>
                  <option value="Accommodation">Accommodation</option>
                  <option value="Internet">Internet</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold block">Total Claim Amount (₹) *</span>
                <input required type="number" className="w-full border p-2 rounded" placeholder="1500" value={claimForm.amount} onChange={e => setClaimForm({...claimForm, amount: Number(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold block">Claim Notes & Business Purpose *</span>
                <textarea required rows={3} className="w-full border p-2 rounded" placeholder="Detail the business expenses..." value={claimForm.notes} onChange={e => setClaimForm({...claimForm, notes: e.target.value})} />
              </div>
              <div className="pt-2 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setShowClaimModal(false)} className="px-4 py-2 border rounded font-bold hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded font-bold">Submit Payout Claim</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL ATTENDANCE CORRECTION */}
      {showManualAttendanceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b">
              <h3 className="font-extrabold text-[12px] text-slate-800">Manual Attendance Correction</h3>
              <button onClick={() => setShowManualAttendanceModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={saveManualAttendance} className="p-4 space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold block">Select Employee</span>
                <select className="w-full border p-2 rounded bg-white" value={manualAtt.employeeId} onChange={e => setManualAtt({...manualAtt, employeeId: e.target.value})}>
                  {employees.map(x => (
                    <option key={x.id} value={x.id}>{x.name} ({x.id})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-slate-500 font-semibold block">Correction Date</span>
                  <input type="date" className="w-full border p-2 rounded" value={manualAtt.date} onChange={e => setManualAtt({...manualAtt, date: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 font-semibold block">Correction check-in</span>
                  <input type="text" className="w-full border p-2 rounded" placeholder="09:30" value={manualAtt.checkIn} onChange={e => setManualAtt({...manualAtt, checkIn: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-slate-500 font-semibold block">Correction check-out</span>
                  <input type="text" className="w-full border p-2 rounded" placeholder="18:00" value={manualAtt.checkOut} onChange={e => setManualAtt({...manualAtt, checkOut: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold block">Audit Change Reason *</span>
                <input required type="text" className="w-full border p-2 rounded" placeholder="Forgot to punch card at check-in" value={manualAtt.reason} onChange={e => setManualAtt({...manualAtt, reason: e.target.value})} />
              </div>
              <div className="pt-2 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setShowManualAttendanceModal(false)} className="px-4 py-2 border rounded font-bold hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded font-bold">Apply Correction</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
