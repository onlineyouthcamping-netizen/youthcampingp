import { useState, useEffect, useCallback, Fragment } from "react";
import { useSearchParams } from "react-router-dom";
import {
  IndianRupee, Filter, Search, Loader2, CheckCircle2, XCircle, Clock,
  Plus, RefreshCw, TrendingUp, Users, AlertTriangle, BarChart3, History,
  ChevronLeft, ChevronRight, Building2, Truck, UserCheck, UtensilsCrossed, Wrench, HelpCircle, Save, Undo,
  Compass, Banknote, ClipboardCheck, ArrowUpRight, ArrowDownRight, ArrowRightLeft, CreditCard, Download, Trash2, Edit3, FileText, Eye, MoreVertical, Sparkles, Globe, MessageSquare, LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { accountingService, type AccountingEntry } from "@/services/accounting.service";
import { tripsService } from "@/services/trips.service";
import { vendorsService } from "@/services/vendors.service";
import type { Vendor } from "@/types";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from "recharts";

// ── Status Styles ──
const STATUS_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  PENDING:  { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: Clock },
  APPROVED: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: CheckCircle2 },
  REJECTED: { bg: "bg-red-50 border-red-200", text: "text-red-650", icon: XCircle },
};

const MODE_LABELS: Record<string, string> = {
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank Transfer",
};

type TabId = 
  | "overview" 
  | "transactions" 
  | "cash_book" 
  | "bank_accounts" 
  | "vendor_payments" 
  | "office_expenses" 
  | "payments" 
  | "profit_loss" 
  | "trip_profitability" 
  | "reports";

export default function AccountingPage() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as TabId;
  const [activeTab, setActiveTab] = useState<TabId>(tabParam || "overview");

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [dateRange, setDateRange] = useState("01 Jul 2024 - 03 Jul 2024");

  // Customer Accounting State
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState("ALL");
  const [fMode, setFMode] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [ledgerTotals, setLedgerTotals] = useState({ APPROVED: 0, PENDING: 0, REJECTED: 0 });

  // Create payment dialog
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    bookingId: "", amount: "", paymentMode: "CASH", referenceNumber: "", notes: ""
  });

  // Reject dialog
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; entryId: string }>({ open: false, entryId: "" });
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // History dialog
  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; entry: AccountingEntry | null }>({ open: false, entry: null });

  // Reports State
  const [reports, setReports] = useState<any>(null);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Vendor Accounting State
  const [vendorAssignments, setVendorAssignments] = useState<any[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [updatingVendorId, setUpdatingVendorId] = useState<string | null>(null);
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorTypeFilter, setVendorTypeFilter] = useState("ALL");
  const [vendorStatusFilter, setVendorStatusFilter] = useState("ALL");

  // Outgoing Vendor Payment Modal State
  const [vendorPayDialog, setVendorPayDialog] = useState<{
    open: boolean;
    assignment: any | null;
  }>({ open: false, assignment: null });

  const [outgoingForm, setOutgoingForm] = useState({
    paidAmount: 0,
    paymentStatus: "pending",
    outgoingPaymentMode: "CASH",
    onlinePersonAccount: "",
    cashDepositorName: "",
    depositAccountName: "",
    notes: ""
  });

  // Office Expenses State
  const [officeExpenses, setOfficeExpenses] = useState<any[]>([
    { id: "1", category: "Rent & Utilities", amount: 8450, date: "2024-07-03", note: "Electricity Bill Payment", status: "Paid" },
    { id: "2", category: "Rent", amount: 24000, date: "2024-07-02", note: "Office Rent", status: "Paid" },
    { id: "3", category: "Fuel", amount: 5000, date: "2024-07-01", note: "Fuel for Tempo (Kashmir 08 Jul)", status: "Paid" },
  ]);

  // ── Load entries ──
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await accountingService.getEntries({
        page: String(page),
        limit: String(pageSize),
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(fStatus !== "ALL" ? { status: fStatus } : {}),
        ...(fMode !== "ALL" ? { paymentMode: fMode } : {}),
      });
      setEntries(result.data);
      setLedgerTotals(result.summary);
      setTotalCount(result.pagination.totalCount);
      setTotalPages(result.pagination.totalPages);
    } catch {
      toast.error("Failed to load accounting entries");
    } finally {
      setLoading(false);
    }
  }, [fMode, fStatus, page, pageSize, search]);

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const data = await accountingService.getReports();
      setReports(data);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setReportsLoading(false);
    }
  }, []);

  const loadVendorAssignments = async () => {
    setLoadingVendors(true);
    try {
      const tripsList = await tripsService.getAll();
      const tripIds = tripsList.map((t: any) => t.id || t._id).filter(Boolean);
      const byTripMap = await vendorsService.getBulkForTrips(tripIds);

      const allAssignments: any[] = [];
      tripsList.forEach((trip: any) => {
        const tId = trip.id || trip._id;
        const assignments = byTripMap[tId] || [];
        assignments.forEach((a: any) => {
          allAssignments.push({
            ...a,
            tripName: trip.title,
            tripCode: trip.tripCode,
            tripId: tId
          });
        });
      });

      setVendorAssignments(allAssignments);
    } catch (e) {
      toast.error("Failed to load vendor assignments");
    } finally {
      setLoadingVendors(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    loadReports();
    loadVendorAssignments();
  }, [loadReports]);

  useEffect(() => { setPage(1); }, [search, fStatus, fMode, pageSize]);

  // ── Create ──
  const handleCreate = async () => {
    if (!form.bookingId || !form.amount || !form.paymentMode) {
      toast.error("Booking ID, amount, and payment mode are required");
      return;
    }
    setCreating(true);
    try {
      await accountingService.createEntry({
        bookingId: form.bookingId,
        amount: parseFloat(form.amount),
        paymentMode: form.paymentMode,
        referenceNumber: form.referenceNumber || undefined,
        notes: form.notes || undefined,
      });
      toast.success("Payment entry submitted for approval");
      setShowCreate(false);
      setForm({ bookingId: "", amount: "", paymentMode: "CASH", referenceNumber: "", notes: "" });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create entry");
    } finally {
      setCreating(false);
    }
  };

  // ── Approve ──
  const handleApprove = async (id: string) => {
    try {
      await accountingService.approveEntry(id);
      toast.success("Payment approved");
      load();
    } catch {
      toast.error("Failed to approve");
    }
  };

  // ── Reject ──
  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error("Rejection reason is required"); return; }
    setRejecting(true);
    try {
      await accountingService.rejectEntry(rejectDialog.entryId, rejectReason);
      toast.success("Payment rejected");
      setRejectDialog({ open: false, entryId: "" });
      setRejectReason("");
      load();
    } catch {
      toast.error("Failed to reject");
    } finally {
      setRejecting(false);
    }
  };

  const handleRecordVendorPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorPayDialog.assignment) return;
    const assignmentId = vendorPayDialog.assignment.id || vendorPayDialog.assignment._id;
    setUpdatingVendorId(assignmentId);
    try {
      await vendorsService.updateAssignment(assignmentId, {
        paidAmount: Number(outgoingForm.paidAmount),
        paymentStatus: outgoingForm.paymentStatus as any,
        notes: outgoingForm.notes || undefined,
        outgoingPaymentMode: outgoingForm.outgoingPaymentMode,
        onlinePersonAccount: outgoingForm.outgoingPaymentMode === "ONLINE" ? outgoingForm.onlinePersonAccount : null,
        cashDepositorName: outgoingForm.outgoingPaymentMode === "CASH" ? outgoingForm.cashDepositorName : null,
        depositAccountName: outgoingForm.outgoingPaymentMode === "CASH" ? outgoingForm.depositAccountName : null
      });
      toast.success("Vendor payment details updated successfully");
      setVendorPayDialog({ open: false, assignment: null });
      loadVendorAssignments();
    } catch {
      toast.error("Failed to update vendor payment");
    } finally {
      setUpdatingVendorId(null);
    }
  };

  const openHistory = async (entry: AccountingEntry) => {
    setHistoryDialog({ open: true, entry: { ...entry, history: undefined } });
    try {
      const history = await accountingService.getEntryHistory(entry.id);
      setHistoryDialog((current) => current.entry?.id === entry.id
        ? { open: true, entry: { ...entry, history } }
        : current);
    } catch {
      toast.error("Failed to load payment history");
    }
  };

  const canApprove = user?.role && ["superadmin", "admin", "finance"].includes(user.role);

  // Filtered lists
  const filteredVendors = vendorAssignments.filter(a => {
    const vendor = typeof a.vendorId === 'object' ? a.vendorId as Vendor : null;
    if (!vendor) return false;
    
    const matchesSearch = vendor.name.toLowerCase().includes(vendorSearch.toLowerCase()) || 
                          a.tripName.toLowerCase().includes(vendorSearch.toLowerCase()) ||
                          a.tripCode.toLowerCase().includes(vendorSearch.toLowerCase());
                          
    const matchesType = vendorTypeFilter === "ALL" || vendor.type === vendorTypeFilter;
    const matchesStatus = vendorStatusFilter === "ALL" || a.paymentStatus === vendorStatusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate stats for KPIs
  const totalApprovedCollection = ledgerTotals.APPROVED || 240000;
  const totalVendorPaid = vendorAssignments.reduce((sum, a) => sum + (a.paidAmount || 0), 0) || 115000;
  const totalOfficeExpenses = officeExpenses.reduce((sum, e) => sum + e.amount, 0) || 18450;
  const cashInHand = (totalApprovedCollection - totalVendorPaid - totalOfficeExpenses) || 106550;
  const outstandingCustomers = 845300;
  const outstandingVendors = vendorAssignments.reduce((sum, a) => sum + (a.totalAmount - (a.paidAmount || 0)), 0) || 384700;

  // Chart data
  const cashFlowData = [
    { name: "27 Jun", Collection: 170000, "Vendor Payments": 65000, Expenses: 12000 },
    { name: "28 Jun", Collection: 220000, "Vendor Payments": 80000, Expenses: 22000 },
    { name: "29 Jun", Collection: 190000, "Vendor Payments": 70000, Expenses: 15050 },
    { name: "30 Jun", Collection: 300000, "Vendor Payments": 110000, Expenses: 32000 },
    { name: "01 Jul", Collection: 280000, "Vendor Payments": 95050, Expenses: 28400 },
    { name: "02 Jul", Collection: 350000, "Vendor Payments": 125000, Expenses: 35000 },
    { name: "03 Jul", Collection: 348000, "Vendor Payments": 120000, Expenses: 34000 },
  ];

  const expensesData = [
    { name: "Hotel Bookings", value: 72500, color: "#3B82F6" },
    { name: "Transport", value: 28000, color: "#10B981" },
    { name: "Guide & Staff", value: 12500, color: "#8B5CF6" },
    { name: "Activities", value: 8700, color: "#F59E0B" },
    { name: "Other Expenses", value: 6900, color: "#EF4444" },
  ];

  const horizontalBarsData = [
    { name: "Accommodation", value: 72500, color: "#3B82F6" },
    { name: "Transport", value: 28000, color: "#10B981" },
    { name: "Guide & Staff", value: 12500, color: "#8B5CF6" },
    { name: "Activities", value: 8700, color: "#F59E0B" },
    { name: "Food", value: 4800, color: "#EC4899" },
    { name: "Other", value: 1900, color: "#6B7280" },
  ];

  const bankSummary = [
    { name: "ICICI Bank A/c", amount: 585300, icon: "bank" },
    { name: "HDFC Bank A/c", amount: 325500, icon: "bank" },
    { name: "Cash", amount: 160000, icon: "cash" },
  ];

  const pendingVendorPayments = vendorAssignments.filter(a => a.paymentStatus !== "paid").slice(0, 5).map(a => ({
    vendor: typeof a.vendorId === 'object' ? a.vendorId.name : "Vendor",
    trip: a.tripCode || "MKA - 05 Jul",
    dueDate: a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "05 Jul 2024",
    amount: a.totalAmount - (a.paidAmount || 0)
  }));

  const tripProfitability = [
    { name: "MKA - Manali Kasol Amritsar", date: "05 Jul 2024", revenue: 680000, cost: 345000, profit: 335000, pct: 49, paid: 265000, pending: 80000 },
    { name: "Spiti Valley Circuit", date: "07 Jul 2024", revenue: 450000, cost: 238000, profit: 212000, pct: 47, paid: 186000, pending: 50000 },
    { name: "Kashmir Group Tour", date: "08 Jul 2024", revenue: 520000, cost: 285000, profit: 235000, pct: 45, paid: 210000, pending: 75000 },
    { name: "Leh Ladakh Bike Trip", date: "10 Jul 2024", revenue: 375000, cost: 192000, profit: 183000, pct: 49, paid: 132000, pending: 60000 },
    { name: "Kerala Family Trip", date: "12 Jul 2024", revenue: 410000, cost: 205000, profit: 205000, pct: 50, paid: 165000, pending: 40000 },
  ];

  // Cash Book unified transactions with precise timestamps and sub-particulars matching mockup
  const rawTransactions = [
    // 03 Jul Transactions
    { date: "2024-07-03", time: "10:20 AM", type: "Income", particulars: "Received from Viraj Patel", subParticulars: "Booking Payment", reference: "MKA - 05 Jul", account: "ICICI Bank A/c", mode: "UPI", inflow: 18000, outflow: 0, category: "Booking Payment", categoryColor: "bg-blue-500", addedBy: "Neeki Sharma" },
    { date: "2024-07-03", time: "09:45 AM", type: "Expense", particulars: "Paid to Barpa Cottage", subParticulars: "Hotel Payment", reference: "MKA - 05 Jul", account: "HDFC Bank A/c", mode: "Bank Transfer", inflow: 0, outflow: 40000, category: "Hotel", categoryColor: "bg-purple-500", addedBy: "Hemal Patel" },
    { date: "2024-07-03", time: "09:15 AM", type: "Expense", particulars: "Electricity Bill Payment", subParticulars: "Office Expense", reference: "—", account: "ICICI Bank A/c", mode: "UPI", inflow: 0, outflow: 8450, category: "Utilities", categoryColor: "bg-orange-500", addedBy: "Neeki Sharma" },
    // 02 Jul Transactions
    { date: "2024-07-02", time: "04:30 PM", type: "Income", particulars: "Received from Suruchi Shah", subParticulars: "Booking Payment", reference: "Spiti Valley - 07 Jul", account: "ICICI Bank A/c", mode: "UPI", inflow: 24000, outflow: 0, category: "Booking Payment", categoryColor: "bg-blue-500", addedBy: "Neeki Sharma" },
    { date: "2024-07-02", time: "03:45 PM", type: "Expense", particulars: "Paid to Tempo Traveller (Ravi)", subParticulars: "Transport Payment", reference: "Kashmir - 08 Jul", account: "HDFC Bank A/c", mode: "UPI", inflow: 0, outflow: 38000, category: "Transport", categoryColor: "bg-green-500", addedBy: "Neeki Sharma" },
    { date: "2024-07-02", time: "02:15 PM", type: "Expense", particulars: "Guide Advance - Sachin", subParticulars: "Guide Payment", reference: "Leh Ladakh - 10 Jul", account: "Cash in Hand", mode: "Cash", inflow: 0, outflow: 5000, category: "Guide", categoryColor: "bg-teal-500", addedBy: "Neeki Sharma" },
    { date: "2024-07-02", time: "11:30 AM", type: "Income", particulars: "Received from Devansh Joshi", subParticulars: "Booking Payment", reference: "Kashmir - 08 Jul", account: "HDFC Bank A/c", mode: "UPI", inflow: 16500, outflow: 0, category: "Booking Payment", categoryColor: "bg-blue-500", addedBy: "Neeki Sharma" },
    { date: "2024-07-02", time: "10:05 AM", type: "Expense", particulars: "Office Rent", subParticulars: "Office Expense", reference: "—", account: "HDFC Bank A/c", mode: "Bank Transfer", inflow: 0, outflow: 24000, category: "Rent", categoryColor: "bg-orange-500", addedBy: "Hemal Patel" },
    // 01 Jul Transactions
    { date: "2024-07-01", time: "05:20 PM", type: "Income", particulars: "Received from Tanvi Shah", subParticulars: "Booking Payment", reference: "Kerala Trip - 12 Jul", account: "ICICI Bank A/c", mode: "UPI", inflow: 35000, outflow: 0, category: "Booking Payment", categoryColor: "bg-blue-500", addedBy: "Neeki Sharma" },
    { date: "2024-07-01", time: "04:10 PM", type: "Expense", particulars: "Fuel for Tempo (Kashmir 08 Jul)", subParticulars: "Transport Expense", reference: "Kashmir - 08 Jul", account: "Cash in Hand", mode: "Cash", inflow: 0, outflow: 5000, category: "Fuel", categoryColor: "bg-amber-800", addedBy: "Neeki Sharma" },
    { date: "2024-07-01", time: "09:00 AM", type: "Income", particulars: "Opening Balance", subParticulars: "Opening Balance", reference: "—", account: "ICICI Bank A/c", mode: "—", inflow: 895250, outflow: 0, category: "Opening Balance", categoryColor: "bg-slate-400", addedBy: "System" },
  ];

  // Sort chronological oldest to newest to compute running balances correctly
  const sortedChronological = [...rawTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Starting balance is 8,95,250 (Opening Balance on 01 Jul 2024)
  let currentBalance = 895250;
  const computedTransactions = sortedChronological.map(t => {
    if (t.particulars !== "Opening Balance") {
      if (t.type === "Income") {
        currentBalance += t.inflow;
      } else {
        currentBalance -= t.outflow;
      }
    }
    return {
      ...t,
      balance: currentBalance
    };
  });

  // Re-sort newest first for display
  const finalTransactions = [...computedTransactions].reverse();

  // Group by Date for UI Rendering
  const groupedTransactions: Record<string, typeof finalTransactions> = {};
  finalTransactions.forEach(t => {
    const d = new Date(t.date);
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const customHeader = `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()} (${daysOfWeek[d.getDay()]})`;
    
    if (!groupedTransactions[customHeader]) {
      groupedTransactions[customHeader] = [];
    }
    groupedTransactions[customHeader].push(t);
  });

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "transactions", label: "Transactions" },
    { id: "cash_book", label: "Cash Book" },
    { id: "bank_accounts", label: "Bank Accounts" },
    { id: "vendor_payments", label: "Vendor Payments" },
    { id: "office_expenses", label: "Office Expenses" },
    { id: "payments", label: "Payments" },
    { id: "profit_loss", label: "Profit & Loss" },
    { id: "trip_profitability", label: "Trip Profitability" },
    { id: "reports", label: "Reports" }
  ];

  return (
    <div className="space-y-6 pb-20 p-6 animate-fade-in bg-[#F4F7FB] min-h-screen">
      {/* Header and Filter controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Banknote className="w-5 h-5 text-[#F97316]" />
            Accounting {activeTab === "cash_book" && <span className="text-slate-400 font-medium text-sm">/ Cash Book</span>}
          </h1>
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
            {activeTab === "cash_book" ? "Record all cash inflows and outflows across accounts." : "Manage transactions, collections, vendor disbursements, cash books and trip profitability."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === "cash_book" && (
            <Button variant="outline" size="sm" className="h-8.5 text-xs font-semibold rounded-[4px] border-slate-200 bg-white text-slate-650 flex items-center gap-1.5 shadow-xs">
              <Download className="w-3.5 h-3.5" /> Import
            </Button>
          )}

          {/* Date Range Picker */}
          <div className="relative">
            <Input 
              type="text" 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="h-8.5 text-xs font-semibold rounded-[4px] border-[#E2E8F0] bg-white text-slate-700 pl-3.5 pr-8 w-56 shadow-xs" 
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">Date</span>
          </div>

          <Button 
            size="sm"
            onClick={() => setShowCreate(true)}
            className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {activeTab === "cash_book" ? "New Entry" : "Add Payment"}
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center w-full border-b border-[#E2E8F0] bg-transparent p-0 h-9 rounded-none gap-6 justify-start mb-6 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as TabId);
              setSearchParams({ tab: tab.id });
            }}
            className={cn(
              "bg-transparent hover:bg-transparent border-b-2 border-transparent data-[state=active]:border-[#F97316] data-[state=active]:bg-transparent rounded-none px-1 pb-2 pt-1.5 text-xs font-semibold text-slate-500 data-[state=active]:text-slate-800 shadow-none whitespace-nowrap transition-all",
              activeTab === tab.id ? "border-[#F97316] text-slate-850 font-bold" : "hover:text-slate-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* 6 KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
            {[
              { label: "Total Collection", val: totalApprovedCollection, trend: "18% vs yesterday", type: "up" },
              { label: "Total Payments (Vendors)", val: totalVendorPaid, trend: "8% vs yesterday", type: "down" },
              { label: "Office Expenses", val: totalOfficeExpenses, trend: "5% vs yesterday", type: "down" },
              { label: "Cash in Hand", val: cashInHand, trend: "24% vs yesterday", type: "up" },
              { label: "Outstanding (Customers)", val: outstandingCustomers, subtitle: "62 Bookings", type: "neutral" },
              { label: "Outstanding (Vendors)", val: outstandingVendors, subtitle: "23 Vendors", type: "neutral" },
            ].map((card, i) => (
              <Card key={i} className="rounded-[4px] border border-[#E2E8F0] p-4 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">{card.label}</div>
                <div className="text-lg font-bold text-slate-800 mt-2">
                  ₹ {card.val.toLocaleString("en-IN")}
                </div>
                {card.trend && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className={cn(
                      "text-[9px] font-bold px-1 py-0.5 rounded",
                      card.type === "up" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                    )}>
                      {card.type === "up" ? "▲" : "▼"} {card.trend}
                    </span>
                  </div>
                )}
                {card.subtitle && (
                  <div className="text-[10px] text-slate-500 font-medium mt-1.5">{card.subtitle}</div>
                )}
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 1. Cash Flow Overview Line Chart */}
            <Card className="rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-sm lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Cash Flow Overview</h3>
                <Select defaultValue="week">
                  <SelectTrigger className="h-7 text-[10px] w-24 rounded-[4px] border-slate-200">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[4px]">
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 10, borderRadius: 4 }} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="Collection" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="Vendor Payments" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Expenses" stroke="#F97316" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Collection</span>
                  <span className="text-sm font-bold text-[#10B981] mt-0.5 block">₹ 12,68,000</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Vendor Payments</span>
                  <span className="text-sm font-bold text-[#EF4444] mt-0.5 block">₹ 7,45,000</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Expenses</span>
                  <span className="text-sm font-bold text-[#F97316] mt-0.5 block">₹ 1,28,600</span>
                </div>
              </div>
            </Card>

            {/* 2. Pending Vendor Payments Table */}
            <Card className="rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-sm flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Pending Vendor Payments</h3>
                <button onClick={() => setActiveTab("vendor_payments")} className="text-[10px] font-bold text-primary-orange hover:underline uppercase">View All</button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-2">Vendor</th>
                      <th className="pb-2">Trip</th>
                      <th className="pb-2">Due Date</th>
                      <th className="pb-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingVendorPayments.length > 0 ? (
                      pendingVendorPayments.map((p, idx) => (
                        <tr key={idx} className="border-b border-slate-50/50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 font-semibold text-slate-700 truncate max-w-[90px]">{p.vendor}</td>
                          <td className="py-2.5 text-slate-500 font-medium">{p.trip}</td>
                          <td className="py-2.5 text-slate-500 font-medium">{p.dueDate}</td>
                          <td className="py-2.5 text-right font-bold text-red-500">₹{p.amount.toLocaleString("en-IN")}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-slate-400 text-[11px]">All vendor payments settled.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Total Outstanding</span>
                <span className="text-red-500">₹ 2,53,000</span>
              </div>
            </Card>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 3. Recent Transactions List */}
            <Card className="rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-sm flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recent Transactions</h3>
                <button onClick={() => setActiveTab("payments")} className="text-[10px] font-bold text-primary-orange hover:underline uppercase">View All</button>
              </div>

              <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[280px] pr-1">
                {entries.slice(0, 5).map((entry, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs border-b border-slate-50 pb-2.5 last:border-b-0 last:pb-0">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-700 truncate max-w-[150px]">{entry.booking?.fullName || "Guest"}</p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {entry.paymentMode === "CASH" ? "Cash" : entry.paymentMode === "UPI" ? "UPI" : "Bank"} • {new Date(entry.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={cn(
                      "font-bold",
                      entry.status === "APPROVED" ? "text-emerald-500" : "text-amber-500"
                    )}>
                      {entry.status === "APPROVED" ? "+" : "•"} ₹{entry.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* 4. Top Expenses Donut Chart */}
            <Card className="rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-sm flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Top Expenses (Month)</h3>
                <button onClick={() => setActiveTab("reports")} className="text-[10px] font-bold text-primary-orange hover:underline uppercase">View All</button>
              </div>

              <div className="flex items-center justify-center h-[140px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {expensesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Total</span>
                  <span className="text-xs font-black text-slate-800">₹1,28,600</span>
                </div>
              </div>

              <div className="space-y-1.5">
                {expensesData.map((exp, i) => (
                  <div key={i} className="flex justify-between items-center text-[10px] text-slate-550 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: exp.color }} />
                      <span>{exp.name}</span>
                    </div>
                    <span>₹{exp.value.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* 5. Expense by Category Horizontal Bars */}
            <Card className="rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-sm flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Expense by Category</h3>
                <button onClick={() => setActiveTab("reports")} className="text-[10px] font-bold text-primary-orange hover:underline uppercase">View All</button>
              </div>

              <div className="space-y-3.5 flex-1 pr-1">
                {horizontalBarsData.map((item, i) => {
                  const pct = Math.round((item.value / 128600) * 100);
                  return (
                    <div key={i} className="space-y-1 text-xs">
                      <div className="flex justify-between items-center font-semibold text-slate-600">
                        <span>{item.name}</span>
                        <span>₹{item.value.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-none overflow-hidden">
                        <div className="h-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* 6. Bank & Cash Summary */}
            <Card className="rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-sm flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Bank & Cash Summary</h3>
                <button onClick={() => setActiveTab("bank_accounts")} className="text-[10px] font-bold text-primary-orange hover:underline uppercase">View All</button>
              </div>

              <div className="space-y-4 flex-1">
                {bankSummary.map((b, i) => (
                  <div key={i} className="flex justify-between items-center text-xs pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {b.icon === "bank" ? <Building2 className="w-4 h-4 text-slate-500" /> : <IndianRupee className="w-4 h-4 text-slate-500" />}
                      </span>
                      <span className="font-bold text-slate-700">{b.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">₹{b.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Total Available Balance</span>
                <span className="text-emerald-500">₹ 9,36,250</span>
              </div>
            </Card>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 8. Trip Profitability Summary Table */}
            <Card className="rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-sm lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Trip Profitability Summary</h3>
                <button onClick={() => setActiveTab("trip_profitability")} className="text-[10px] font-bold text-primary-orange hover:underline uppercase">View All</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-2.5">Trip Name</th>
                      <th className="pb-2.5">Dep Date</th>
                      <th className="pb-2.5 text-right">Revenue</th>
                      <th className="pb-2.5 text-right">Cost</th>
                      <th className="pb-2.5 text-right">Gross Profit</th>
                      <th className="pb-2.5 text-right">Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tripProfitability.map((item, i) => (
                      <tr key={i} className="border-b border-slate-50/50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 font-semibold text-slate-700 truncate max-w-[160px]">{item.name}</td>
                        <td className="py-2.5 text-slate-500 font-medium">{item.date}</td>
                        <td className="py-2.5 text-right font-bold text-slate-700">₹{item.revenue.toLocaleString()}</td>
                        <td className="py-2.5 text-right text-slate-550">₹{item.cost.toLocaleString()}</td>
                        <td className="py-2.5 text-right font-bold text-emerald-500">₹{item.profit.toLocaleString()}</td>
                        <td className="py-2.5 text-right">
                          <span className="font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px]">
                            {item.pct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-6">
              
              {/* 7. Quick Actions Panel */}
              <Card className="rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <button onClick={() => setShowCreate(true)} className="p-3 bg-slate-50 border border-slate-100 hover:bg-[#F97316]/5 hover:border-[#F97316]/20 transition-all rounded-[4px] flex flex-col items-center justify-center text-center gap-1.5 group">
                    <ArrowUpRight className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-slate-700">Add Collection</span>
                  </button>
                  <button onClick={() => setActiveTab("vendor_payments")} className="p-3 bg-slate-50 border border-slate-100 hover:bg-[#F97316]/5 hover:border-[#F97316]/20 transition-all rounded-[4px] flex flex-col items-center justify-center text-center gap-1.5 group">
                    <ArrowDownRight className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-slate-700">Vendor Payment</span>
                  </button>
                  <button onClick={() => setActiveTab("office_expenses")} className="p-3 bg-slate-50 border border-slate-100 hover:bg-[#F97316]/5 hover:border-[#F97316]/20 transition-all rounded-[4px] flex flex-col items-center justify-center text-center gap-1.5 group">
                    <CreditCard className="w-5 h-5 text-[#F97316] group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-slate-700">Record Expense</span>
                  </button>
                  <button onClick={() => setActiveTab("bank_accounts")} className="p-3 bg-slate-50 border border-slate-100 hover:bg-[#F97316]/5 hover:border-[#F97316]/20 transition-all rounded-[4px] flex flex-col items-center justify-center text-center gap-1.5 group">
                    <ArrowRightLeft className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-slate-700">Bank Transfer</span>
                  </button>
                </div>
              </Card>

              {/* 9. Monthly Summary Card */}
              <Card className="rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-sm flex flex-col justify-between space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Monthly Summary (July 2024)</h3>
                
                <div className="space-y-2">
                  {[
                    { label: "Total Revenue", val: 2468000, color: "text-slate-800" },
                    { label: "Total Vendor Payments", val: 1245000, color: "text-red-500" },
                    { label: "Total Office Expenses", val: 128600, color: "text-red-500" },
                    { label: "Gross Profit", val: 1194400, color: "text-emerald-500", bold: true },
                  ].map((sum, i) => (
                    <div key={i} className="flex justify-between items-center text-xs py-1 font-semibold">
                      <span className={cn("text-slate-500", sum.bold && "text-slate-700 font-bold")}>{sum.label}</span>
                      <span className={cn("font-bold", sum.color)}>₹{sum.val.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-xs py-1.5 border-t border-slate-100 font-semibold">
                    <span className="text-slate-500">Profit Margin</span>
                    <span className="font-extrabold text-slate-800">48.4%</span>
                  </div>
                </div>
              </Card>

            </div>

          </div>
        </div>
      )}

      {/* CASH BOOK TAB */}
      {activeTab === "cash_book" && (
        <div className="space-y-6">
          {/* 4 KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Opening Cash Balance", val: 50000, desc: "As on 01 Jul 2024", type: "neutral" },
              { label: "Total Cash Inflow", val: 240000, desc: "18 Transactions", type: "up" },
              { label: "Total Cash Outflow", val: 164450, desc: "25 Transactions", type: "down" },
              { label: "Closing Cash Balance", val: 125550, desc: "As on 03 Jul 2024", type: "blue" },
            ].map((card, i) => (
              <Card key={i} className="rounded-[4px] border border-[#E2E8F0] p-4.5 bg-white shadow-sm flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-base shrink-0",
                  card.type === "up" ? "bg-emerald-50 text-emerald-600" :
                  card.type === "down" ? "bg-red-50 text-red-500" :
                  card.type === "blue" ? "bg-blue-50 text-blue-500" :
                  "bg-slate-50 text-slate-600"
                )}>
                  {card.type === "up" ? <ArrowUpRight className="w-5 h-5" /> : 
                   card.type === "down" ? <ArrowDownRight className="w-5 h-5" /> : 
                   card.type === "blue" ? <IndianRupee className="w-5 h-5" /> : 
                   <Compass className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{card.label}</div>
                  <div className="text-base font-black mt-1 text-slate-800">
                    ₹ {card.val.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[9px] text-slate-450 font-semibold mt-0.5">{card.desc}</div>
                </div>
              </Card>
            ))}
          </div>

          {/* Sub-tabs layout */}
          <div className="flex border-b border-slate-200 gap-6 text-xs font-bold text-slate-400">
            <button className="border-b-2 border-[#F97316] text-[#F97316] pb-2 px-1">All Transactions</button>
            <button className="hover:text-slate-700 pb-2 px-1">Cash Received</button>
            <button className="hover:text-slate-700 pb-2 px-1">Cash Paid</button>
          </div>

          {/* Filters & Table Card */}
          <Card className="rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-sm space-y-4">
            {/* Filter Toolbar */}
            <div className="flex flex-wrap gap-2 items-center bg-slate-50/50 p-2.5 rounded-[4px] border border-slate-100">
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input 
                  placeholder="Search particulars..." 
                  className="h-8 pl-8 text-xs rounded-[4px] border-slate-200 bg-white"
                />
              </div>
              <Select defaultValue="all"><SelectTrigger className="h-8 text-[11px] w-28 bg-white border-slate-200 rounded-[4px]"><SelectValue placeholder="All Categories" /></SelectTrigger><SelectContent className="rounded-[4px]"><SelectItem value="all">All Categories</SelectItem></SelectContent></Select>
              <Select defaultValue="all"><SelectTrigger className="h-8 text-[11px] w-32 bg-white border-slate-200 rounded-[4px]"><SelectValue placeholder="All Cash Handlers" /></SelectTrigger><SelectContent className="rounded-[4px]"><SelectItem value="all">All Cash Handlers</SelectItem></SelectContent></Select>
              <Select defaultValue="all"><SelectTrigger className="h-8 text-[11px] w-24 bg-white border-slate-200 rounded-[4px]"><SelectValue placeholder="All Purposes" /></SelectTrigger><SelectContent className="rounded-[4px]"><SelectItem value="all">All Purposes</SelectItem></SelectContent></Select>
              <Select defaultValue="all"><SelectTrigger className="h-8 text-[11px] w-32 bg-white border-slate-200 rounded-[4px]"><SelectValue placeholder="All Approval Status" /></SelectTrigger><SelectContent className="rounded-[4px]"><SelectItem value="all">All Approval Status</SelectItem></SelectContent></Select>
              <Select defaultValue="all"><SelectTrigger className="h-8 text-[11px] w-24 bg-white border-slate-200 rounded-[4px]"><SelectValue placeholder="All Users" /></SelectTrigger><SelectContent className="rounded-[4px]"><SelectItem value="all">All Users</SelectItem></SelectContent></Select>
              <Button size="sm" variant="ghost" className="h-8 px-2.5 text-slate-500 hover:text-slate-800 text-[11px] font-bold border border-slate-200 rounded-[4px] bg-white ml-auto">
                <Filter className="w-3.5 h-3.5 mr-1" /> Filters
              </Button>
              <Button size="sm" variant="ghost" className="h-8 px-2.5 text-slate-400 hover:text-slate-600 text-[11px] font-semibold">
                Clear Filters
              </Button>
            </div>

            {/* Cash Book Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                    <th className="px-3.5 py-2.5">Date & Time</th>
                    <th className="px-3.5 py-2.5">Type</th>
                    <th className="px-3.5 py-2.5">Particulars</th>
                    <th className="px-3.5 py-2.5">Purpose / Trip</th>
                    <th className="px-3.5 py-2.5 text-right">Cash In (₹)</th>
                    <th className="px-3.5 py-2.5 text-right">Cash Out (₹)</th>
                    <th className="px-3.5 py-2.5 text-right">Balance (₹)</th>
                    <th className="px-3.5 py-2.5">Received By / Paid To</th>
                    <th className="px-3.5 py-2.5">Approved By</th>
                    <th className="px-3.5 py-2.5">Approval Status</th>
                    <th className="px-3.5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Mocked Cash book journal matching image details */}
                  <tr className="bg-slate-50/80 font-bold text-slate-600 border-b border-slate-100">
                    <td colSpan={11} className="px-3.5 py-2 text-[10px] uppercase tracking-wide">03 Jul 2024 (Wednesday)</td>
                  </tr>
                  {[
                    { datetime: "03 Jul 2024 10:20 AM", type: "Cash In", particulars: "Received from Viraj Patel", sub: "Booking Payment - MKA 05 Jul", ref: "MKA - 05 Jul", cashin: 18000, cashout: 0, bal: 68000, party: "Neeki Sharma", role: "Sales Executive", appBy: "Hemal Patel", appStatus: "Approved", appTime: "03 Jul 10:45 AM" },
                    { datetime: "03 Jul 2024 11:30 AM", type: "Cash Out", particulars: "Paid to Barpa Cottage", sub: "Hotel Payment - MKA 05 Jul", ref: "MKA - 05 Jul", cashin: 0, cashout: 40000, bal: 28000, party: "Suresh Bhai", role: "Accounts Manager", appBy: "Hemal Patel", appStatus: "Approved", appTime: "03 Jul 11:45 AM" },
                    { datetime: "03 Jul 2024 12:15 PM", type: "Cash Out", particulars: "Electricity Bill Payment", sub: "Office Expense", ref: "Office", cashin: 0, cashout: 8450, bal: 19550, party: "Neeki Sharma", role: "Sales Executive", appBy: "Hemal Patel", appStatus: "Approved", appTime: "03 Jul 12:30 PM" },
                    { datetime: "03 Jul 2024 02:20 PM", type: "Cash In", particulars: "Received from Suruchi Shah", sub: "Booking Payment - Spiti 07 Jul", ref: "Spiti Valley - 07 Jul", cashin: 24000, cashout: 0, bal: 43550, party: "Neeki Sharma", role: "Sales Executive", appBy: "Hemal Patel", appStatus: "Approved", appTime: "03 Jul 02:35 PM" },
                    { datetime: "03 Jul 2024 04:05 PM", type: "Cash Out", particulars: "Paid to Guide (Ramesh)", sub: "Guide Advance - Leh 10 Jul", ref: "Leh Ladakh - 10 Jul", cashin: 0, cashout: 5000, bal: 38550, party: "Parth", role: "Operations", appBy: "Hemal Patel", appStatus: "Approved", appTime: "03 Jul 04:20 PM" }
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                      <td className="px-3.5 py-2.5 text-slate-500 font-medium whitespace-nowrap">{row.datetime}</td>
                      <td className="px-3.5 py-2.5">
                        <span className={cn(
                          "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-[2px]",
                          row.type === "Cash In" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                        )}>
                          {row.type}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{row.particulars}</span>
                          <span className="text-[9px] text-slate-400 font-semibold mt-0.5">{row.sub}</span>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-500 font-bold">{row.ref}</td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-emerald-600">{row.cashin > 0 ? row.cashin.toLocaleString() : "—"}</td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-red-500">{row.cashout > 0 ? row.cashout.toLocaleString() : "—"}</td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-slate-700">₹ {row.bal.toLocaleString()}</td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{row.party}</span>
                          <span className="text-[9px] text-slate-400 font-semibold mt-0.5">{row.role}</span>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-600 font-semibold">{row.appBy}</td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex flex-col">
                          <span className="text-emerald-600 font-bold">{row.appStatus}</span>
                          <span className="text-[9px] text-slate-400 font-semibold mt-0.5">{row.appTime}</span>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button className="p-1 hover:bg-slate-50 rounded text-slate-400 border border-slate-100"><Eye className="w-3.5 h-3.5" /></button>
                          <button className="p-1 hover:bg-slate-50 rounded text-slate-400 border border-slate-100"><Edit3 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  <tr className="bg-slate-50/80 font-bold text-slate-600 border-b border-slate-100">
                    <td colSpan={11} className="px-3.5 py-2 text-[10px] uppercase tracking-wide">02 Jul 2024 (Tuesday)</td>
                  </tr>
                  {[
                    { datetime: "02 Jul 2024 11:00 AM", type: "Cash In", particulars: "Opening Balance", sub: "As on 02 Jul 2024", ref: "—", cashin: 50000, cashout: 0, bal: 50000, party: "System", role: "—", appBy: "—", appStatus: "—", appTime: "—" },
                    { datetime: "02 Jul 2024 01:10 PM", type: "Cash Out", particulars: "Paid to Driver (Mahesh)", sub: "Driver Advance - Spiti 07 Jul", ref: "Spiti Valley - 07 Jul", cashin: 0, cashout: 2000, bal: 48000, party: "Parth", role: "Operations", appBy: "Hemal Patel", appStatus: "Approved", appTime: "02 Jul 01:25 PM" },
                    { datetime: "02 Jul 2024 03:45 PM", type: "Cash Out", particulars: "Tea & Refreshment", sub: "Office Expense", ref: "Office", cashin: 0, cashout: 2005, bal: 47800, party: "Neeki Sharma", role: "Sales Executive", appBy: "Hemal Patel", appStatus: "Approved", appTime: "02 Jul 04:00 PM" }
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                      <td className="px-3.5 py-2.5 text-slate-500 font-medium whitespace-nowrap">{row.datetime}</td>
                      <td className="px-3.5 py-2.5">
                        <span className={cn(
                          "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-[2px]",
                          row.type === "Cash In" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                        )}>
                          {row.type}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{row.particulars}</span>
                          <span className="text-[9px] text-slate-400 font-semibold mt-0.5">{row.sub}</span>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-500 font-bold">{row.ref}</td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-emerald-600">{row.cashin > 0 ? row.cashin.toLocaleString() : "—"}</td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-red-500">{row.cashout > 0 ? row.cashout.toLocaleString() : "—"}</td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-slate-700">₹ {row.bal.toLocaleString()}</td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{row.party}</span>
                          <span className="text-[9px] text-slate-400 font-semibold mt-0.5">{row.role}</span>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-650 font-semibold">{row.appBy}</td>
                      <td className="px-3.5 py-2.5">
                        {row.appStatus !== "—" ? (
                          <div className="flex flex-col">
                            <span className="text-emerald-600 font-bold">{row.appStatus}</span>
                            <span className="text-[9px] text-slate-400 font-semibold mt-0.5">{row.appTime}</span>
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        {row.particulars !== "Opening Balance" && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button className="p-1 hover:bg-slate-50 rounded text-slate-400 border border-slate-100"><Eye className="w-3.5 h-3.5" /></button>
                            <button className="p-1 hover:bg-slate-50 rounded text-slate-400 border border-slate-100"><Edit3 className="w-3.5 h-3.5" /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Bottom Summaries: Cash Handler, Movement, and Approval Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cash Handler Summary */}
            <Card className="rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b pb-2">Cash Handler Summary <span className="text-slate-400 text-[10px] font-normal normal-case ml-1">(This Period)</span></h3>
              <div className="space-y-4.5">
                {[
                  { name: "Neeki Sharma", role: "Sales Executive", cashin: 42000, cashout: 8650 },
                  { name: "Parth", role: "Operations", cashin: 0, cashout: 7000 },
                  { name: "Suresh Bhai", role: "Accounts Manager", cashin: 0, cashout: 40000 }
                ].map((handler, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-semibold text-slate-650">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border flex items-center justify-center font-bold text-slate-600 uppercase text-[10px]">
                        {handler.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{handler.name}</span>
                        <span className="text-[9px] text-slate-450 font-normal">{handler.role}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div><span className="text-slate-400 text-[9px]">Cash In:</span> <span className="text-emerald-600 font-bold">₹ {handler.cashin.toLocaleString()}</span></div>
                      <div className="mt-0.5"><span className="text-slate-400 text-[9px]">Cash Out:</span> <span className="text-red-500 font-bold">₹ {handler.cashout.toLocaleString()}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Cash Movement Summary */}
            <Card className="rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b pb-2">Cash Movement Summary</h3>
              <div className="space-y-4 text-xs font-bold text-slate-650">
                <div className="flex justify-between items-center">
                  <span className="text-slate-450">Total Cash In</span>
                  <div className="text-right">
                    <span className="text-slate-750 font-black">₹ 2,40,000</span>
                    <span className="text-[9px] text-slate-400 block font-normal mt-0.5">18 Transactions</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-450">Total Cash Out</span>
                  <div className="text-right">
                    <span className="text-slate-750 font-black">₹ 1,64,450</span>
                    <span className="text-[9px] text-slate-400 block font-normal mt-0.5">25 Transactions</span>
                  </div>
                </div>
                <div className="flex justify-between items-center border-t pt-3.5">
                  <span className="text-slate-800 font-black">Net Cash Movement</span>
                  <div className="text-right">
                    <span className="text-emerald-600 font-black text-sm">₹ 75,550</span>
                    <span className="text-[9px] text-slate-400 block font-normal mt-0.5">(Inflow - Outflow)</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Approval Summary */}
            <Card className="rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b pb-2">Approval Summary</h3>
              <div className="space-y-4 text-xs font-bold text-slate-650">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Approved
                  </span>
                  <div className="text-right">
                    <span className="text-slate-750 font-black">38 Transactions</span>
                    <span className="text-[10px] text-emerald-600 block mt-0.5">₹ 2,12,450</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Pending Approval
                  </span>
                  <div className="text-right">
                    <span className="text-slate-750 font-black">5 Transactions</span>
                    <span className="text-[10px] text-amber-500 block mt-0.5">₹ 28,000</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Rejected
                  </span>
                  <div className="text-right">
                    <span className="text-slate-750 font-black">0 Transactions</span>
                    <span className="text-[10px] text-red-500 block mt-0.5">₹ 0</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* BANK ACCOUNTS TAB */}
      {activeTab === "bank_accounts" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {bankSummary.map((b, i) => (
            <Card key={i} className="rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                 <div className="w-10 h-10 rounded-[4px] bg-slate-50 flex items-center justify-center border border-[#E2E8F0]">
                  {b.icon === "bank" ? <Building2 className="w-5 h-5 text-slate-500" /> : <IndianRupee className="w-5 h-5 text-slate-500" />}
                </div>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-[2px] bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">Active</span>
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-550 uppercase tracking-wider">{b.name}</h4>
                <p className="text-xl font-bold text-slate-800 mt-2">₹ {b.amount.toLocaleString("en-IN")}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* VENDOR PAYMENTS TAB */}
      {activeTab === "vendor_payments" && (
        <Card className="rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Vendor Payments Queue</h3>
            
            {/* Vendor Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input 
                  value={vendorSearch} 
                  onChange={(e) => setVendorSearch(e.target.value)}
                  placeholder="Search vendor, trip code..."
                  className="h-8 pl-8 text-xs rounded-[4px] border-[#E2E8F0]" 
                />
              </div>
              <Select value={vendorStatusFilter} onValueChange={setVendorStatusFilter}>
                <SelectTrigger className="h-8 text-xs w-32 rounded-[4px] border-[#E2E8F0]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent className="rounded-[4px]">
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Trip</th>
                  <th className="px-4 py-3">Total Cost</th>
                  <th className="px-4 py-3">Paid Amount</th>
                  <th className="px-4 py-3">Due Balance</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((v, i) => {
                  const vendor = typeof v.vendorId === 'object' ? v.vendorId : { name: "Vendor" };
                  const balance = v.totalAmount - (v.paidAmount || 0);
                  return (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-800">{vendor.name}</td>
                      <td className="px-4 py-3 text-slate-555">{v.tripName} ({v.tripCode})</td>
                      <td className="px-4 py-3 font-bold text-slate-800">₹{v.totalAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">₹{(v.paidAmount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 font-bold text-red-500">₹{balance.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase border",
                          v.paymentStatus === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-250" : "bg-red-50 text-red-700 border-red-250"
                        )}>
                          {v.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setOutgoingForm({
                              paidAmount: v.paidAmount || 0,
                              paymentStatus: v.paymentStatus || "pending",
                              outgoingPaymentMode: v.outgoingPaymentMode || "CASH",
                              onlinePersonAccount: v.onlinePersonAccount || "",
                              cashDepositorName: v.cashDepositorName || "",
                              depositAccountName: v.depositAccountName || "",
                              notes: v.notes || ""
                            });
                            setVendorPayDialog({ open: true, assignment: v });
                          }}
                          className="h-7 text-[10px] uppercase font-bold border border-slate-150 rounded-[4px] hover:bg-slate-50"
                        >
                          Disburse
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* OFFICE EXPENSES TAB */}
      {activeTab === "office_expenses" && (
        <div className="space-y-6">
          {/* Action Header and Date Ranges */}
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-1 bg-white p-1 rounded-[4px] border border-slate-200 shadow-sm text-xs font-semibold text-slate-500">
              {["Today", "Yesterday", "This Week", "Last Week", "This Month", "Last Month", "Custom Range"].map((range) => (
                <button
                  key={range}
                  className={cn(
                    "px-3 py-1.5 rounded-[3px] transition-colors",
                    range === "This Month" ? "border border-[#F97316]/30 text-[#F97316] font-bold" : "hover:text-slate-800"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
            
            {/* Date Range Picker Input */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs font-bold uppercase">Date Range:</span>
              <Input 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="h-8 text-xs w-48 rounded-[4px] border-[#E2E8F0] bg-white font-semibold text-slate-700" 
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Office Expenses Table */}
            <Card className="flex-1 rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-sm space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-slate-50/50 text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3.5 py-2.5">Category</th>
                      <th className="px-3.5 py-2.5">Description</th>
                      <th className="px-3.5 py-2.5">Vendor / Paid To</th>
                      <th className="px-3.5 py-2.5">Paid By</th>
                      <th className="px-3.5 py-2.5 text-right">Amount (₹)</th>
                      <th className="px-3.5 py-2.5">Payment Mode</th>
                      <th className="px-3.5 py-2.5">Receipt / Invoice</th>
                      <th className="px-3.5 py-2.5">Trip (Optional)</th>
                      <th className="px-3.5 py-2.5">Added By</th>
                      <th className="px-3.5 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { date: "03 Jul 2024 10:30 AM", cat: "Office Rent", icon: Building2, iconColor: "bg-rose-50 text-rose-500", desc: "Office Rent - July 2024", vendor: "—", account: "ICICI Bank A/c", amount: 50000, mode: "Bank Transfer", rec: "INV-2024-07-01", trip: "—", addedBy: "Neeki Sharma" },
                      { date: "03 Jul 2024 09:15 AM", cat: "Electricity", icon: Sparkles, iconColor: "bg-amber-50 text-amber-500", desc: "Electricity Bill - Office", vendor: "Gujarat Urja Vikas Nigam Ltd.", account: "ICICI Bank A/c", amount: 8450, mode: "UPI", rec: "EB-2024-07-03", trip: "—", addedBy: "Neeki Sharma" },
                      { date: "03 Jul 2024 11:45 AM", cat: "Internet", icon: Globe, iconColor: "bg-blue-50 text-blue-500", desc: "Internet Bill - July 2024", vendor: "Jio Fiber", account: "HDFC Bank A/c", amount: 1299, mode: "Auto Debit", rec: "NET-2024-07-03", trip: "—", addedBy: "Suresh Bhai" },
                      { date: "02 Jul 2024 04:20 PM", cat: "Marketing", icon: MessageSquare, iconColor: "bg-purple-50 text-purple-500", desc: "Facebook Ads - June", vendor: "Meta Platforms", account: "HDFC Bank A/c", amount: 12375.60, mode: "UPI", rec: "ADS-2024-06-30", trip: "—", addedBy: "Zeel Shah" },
                      { date: "02 Jul 2024 03:10 PM", cat: "Office Supplies", icon: ClipboardCheck, iconColor: "bg-emerald-50 text-emerald-500", desc: "Printer Paper, Files, Stationery", vendor: "Office Needs", account: "Cash In Hand", amount: 2350, mode: "Cash", rec: "—", trip: "—", addedBy: "Parth Parmar" },
                      { date: "02 Jul 2024 01:30 PM", cat: "Refreshments", icon: UtensilsCrossed, iconColor: "bg-pink-50 text-pink-500", desc: "Tea, Water, Snacks", vendor: "Local Vendor", account: "Cash In Hand", amount: 650, mode: "Cash", rec: "—", trip: "—", addedBy: "Parth Parmar" },
                      { date: "01 Jul 2024 06:15 PM", cat: "Travel", icon: Compass, iconColor: "bg-cyan-50 text-cyan-500", desc: "Local Travel - Auto", vendor: "Ramesh Auto", account: "Cash In Hand", amount: 450, mode: "Cash", rec: "—", trip: "—", addedBy: "Neeki Sharma" },
                      { date: "01 Jul 2024 05:40 PM", cat: "Software", icon: LayoutDashboard, iconColor: "bg-indigo-50 text-indigo-500", desc: "TeleCRM - Monthly Plan", vendor: "TeleCRM Solutions", account: "HDFC Bank A/c", amount: 9000, mode: "Net Banking", rec: "SW-2024-07-01", trip: "—", addedBy: "Hemal Patel" },
                      { date: "01 Jul 2024 04:00 PM", cat: "Maintenance", icon: Wrench, iconColor: "bg-teal-50 text-teal-500", desc: "AC Maintenance", vendor: "Cool Tech Services", account: "Cash In Hand", amount: 1800, mode: "Cash", rec: "—", trip: "—", addedBy: "Neeki Sharma" },
                      { date: "01 Jul 2024 11:20 AM", cat: "Miscellaneous", icon: HelpCircle, iconColor: "bg-slate-50 text-slate-500", desc: "Door Repair", vendor: "Local Technician", account: "Cash In Hand", amount: 750, mode: "Cash", rec: "—", trip: "—", addedBy: "Neeki Sharma" },
                      { date: "01 Jul 2024 10:05 AM", cat: "Marketing", icon: MessageSquare, iconColor: "bg-purple-50 text-purple-500", desc: "Brochure Printing", vendor: "Print Point", account: "Cash In Hand", amount: 1250, mode: "Cash", rec: "—", trip: "—", addedBy: "Parth Parmar" },
                      { date: "01 Jul 2024 09:00 AM", cat: "Opening Balance", icon: Banknote, iconColor: "bg-slate-50 text-slate-500", desc: "Opening Balance", vendor: "—", account: "Cash In Hand", amount: 5000, mode: "—", rec: "—", trip: "—", addedBy: "System" }
                    ].map((row, idx) => {
                      const Icon = row.icon;
                      return (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                          <td className="px-3 py-2.5 text-slate-500 font-medium whitespace-nowrap">{row.date}</td>
                          <td className="px-3.5 py-2.5">
                            <span className="inline-flex items-center gap-1.5 font-bold text-slate-700">
                              <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 border border-slate-100", row.iconColor)}>
                                <Icon className="w-3.5 h-3.5" />
                              </span>
                              {row.cat}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-650 font-semibold">{row.desc}</td>
                          <td className="px-3.5 py-2.5 text-slate-600 font-semibold">{row.vendor}</td>
                          <td className="px-3.5 py-2.5 text-slate-500 font-medium">{row.account}</td>
                          <td className="px-3.5 py-2.5 text-right font-bold text-slate-800">
                            {row.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-500 font-semibold">{row.mode}</td>
                          <td className="px-3.5 py-2.5">
                            {row.rec !== "—" ? (
                              <span className="inline-flex items-center gap-1 text-red-500 hover:underline cursor-pointer font-bold">
                                <FileText className="w-3.5 h-3.5" /> {row.rec}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-450">{row.trip}</td>
                          <td className="px-3.5 py-2.5 text-slate-500 font-medium">{row.addedBy}</td>
                          <td className="px-3.5 py-2.5 text-right">
                            <button className="p-1 hover:bg-slate-50 rounded text-slate-400 border border-slate-100"><MoreVertical className="w-3.5 h-3.5" /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Right: Sidebar widgets */}
            <div className="w-full lg:w-80 space-y-6 shrink-0">
              {/* Expense Summary */}
              <Card className="rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-sm space-y-3.5">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Expense Summary</h3>
                </div>
                <div className="space-y-2.5 text-xs font-bold text-slate-650">
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-450 font-semibold">Total Expenses</span>
                    <span className="text-slate-800 font-black">₹ 88,374.60</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-450 font-semibold">This Month</span>
                    <span className="text-slate-800 font-black">₹ 88,374.60</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-450 font-semibold">Last Month</span>
                    <span className="text-slate-800 font-black">₹ 1,24,560.00</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-450 font-semibold">This Week</span>
                    <span className="text-slate-800 font-black">₹ 45,150.00</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-450 font-semibold">Yesterday</span>
                    <span className="text-slate-800 font-black">₹ 8,450.00</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-450 font-semibold">Today</span>
                    <span className="text-slate-800 font-black">₹ 0.00</span>
                  </div>
                </div>
              </Card>

              {/* Top Categories Donut Chart */}
              <Card className="rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b pb-2">Top Categories <span className="text-slate-400 text-[10px] font-normal normal-case ml-1">(This Month)</span></h3>
                
                <div className="flex items-center justify-center h-[130px] relative my-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Office Rent", value: 50000 },
                          { name: "Marketing", value: 25625.60 },
                          { name: "Electricity", value: 8450 },
                          { name: "Software", value: 9000 },
                          { name: "Others", value: 5299 }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        <Cell fill="#3B82F6" />
                        <Cell fill="#8B5CF6" />
                        <Cell fill="#F59E0B" />
                        <Cell fill="#10B981" />
                        <Cell fill="#6B7280" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-[11px] font-black text-slate-800">₹ 88,374.60</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Total</span>
                  </div>
                </div>

                <div className="space-y-2 text-[11px] font-semibold text-slate-650">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Office Rent</span>
                    <span>₹ 50,000.00 <span className="text-[9px] text-slate-400">(56.60%)</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" /> Marketing</span>
                    <span>₹ 25,625.60 <span className="text-[9px] text-slate-400">(28.99%)</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Electricity</span>
                    <span>₹ 8,450.00 <span className="text-[9px] text-slate-400">(9.57%)</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Software</span>
                    <span>₹ 9,000.00 <span className="text-[9px] text-slate-400">(10.19%)</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-500" /> Others</span>
                    <span>₹ 5,299.00 <span className="text-[9px] text-slate-400">(5.99%)</span></span>
                  </div>
                </div>
              </Card>

              {/* Recent Expenses */}
              <Card className="rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recent Expenses</h3>
                  <button className="text-[10px] font-bold text-[#F97316] hover:underline">View All</button>
                </div>
                <div className="space-y-3.5 text-xs font-semibold">
                  {[
                    { name: "Electricity Bill - Office", amount: 8450, date: "03 Jul 2024" },
                    { name: "Office Rent - July 2024", amount: 50000, date: "03 Jul 2024" },
                    { name: "Facebook Ads - June", amount: 12375.60, date: "02 Jul 2024" },
                    { name: "Internet Bill - July 2024", amount: 1299, date: "03 Jul 2024" }
                  ].map((expense, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">{expense.name}</span>
                        <span className="text-[9px] text-slate-400 mt-0.5">{expense.date}</span>
                      </div>
                      <span className="font-black text-slate-800">₹ {expense.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TRANSACTIONS TAB (UNIFIED FINANCIAL LOG) */}
      {activeTab === "transactions" && (
        <Card className="rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Transactions</h3>
              <p className="text-[10px] text-slate-500 font-medium">All your money in and out, in one place</p>
            </div>
            
            {/* Toolbar Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search transactions..." 
                  className="h-8 pl-8 text-xs rounded-[4px] border-slate-200 bg-white"
                />
              </div>
              <Select value={fStatus} onValueChange={setFStatus}>
                <SelectTrigger className="h-8 text-xs w-28 bg-white border-slate-200 rounded-[4px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent className="rounded-[4px]">
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-3.5 py-2.5">Date</th>
                  <th className="px-3.5 py-2.5">Type</th>
                  <th className="px-3.5 py-2.5">Particulars</th>
                  <th className="px-3.5 py-2.5">Trip / Reference</th>
                  <th className="px-3.5 py-2.5">Account</th>
                  <th className="px-3.5 py-2.5">Payment Mode</th>
                  <th className="px-3.5 py-2.5 text-right">Income (₹)</th>
                  <th className="px-3.5 py-2.5 text-right">Expense (₹)</th>
                  <th className="px-3.5 py-2.5 text-right">Balance (₹)</th>
                  <th className="px-3.5 py-2.5">Category</th>
                  <th className="px-3.5 py-2.5">Added By</th>
                  <th className="px-3.5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedTransactions).map((dateHeader) => (
                  <Fragment key={dateHeader}>
                    {/* Day Section Header Row */}
                    <tr className="bg-slate-50/80 font-bold text-slate-600 border-b border-slate-100">
                      <td colSpan={12} className="px-3.5 py-2 text-[10px] uppercase tracking-wide">
                        {dateHeader}
                      </td>
                    </tr>
                    {groupedTransactions[dateHeader].map((t, idx) => (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                        <td className="px-3.5 py-2.5 text-slate-500 font-medium">
                          {t.date} <span className="text-[10px] text-slate-400 block font-normal mt-0.5">{t.time || "10:20 AM"}</span>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span className={cn(
                            "inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-[2px]",
                            t.type === "Income" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                          )}>
                            {t.type === "Income" ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                            {t.type}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700">{t.particulars}</span>
                            <span className="text-[9px] text-slate-400 font-semibold mt-0.5">{t.subParticulars || "Transfer"}</span>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-500 font-semibold">{t.reference}</td>
                        <td className="px-3.5 py-2.5 text-slate-600 font-semibold">{t.account}</td>
                        <td className="px-3.5 py-2.5 text-slate-500 font-semibold">{t.mode}</td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-emerald-600">
                          {t.inflow > 0 ? t.inflow.toLocaleString("en-IN") : "—"}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-red-500">
                          {t.outflow > 0 ? t.outflow.toLocaleString("en-IN") : "—"}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-slate-700">
                          ₹ {t.balance.toLocaleString()}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span className="text-[10px] text-slate-600 font-bold flex items-center gap-1.5">
                            <span className={cn("w-2 h-2 rounded-full", t.categoryColor || "bg-blue-500")} />
                            {t.category}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-500 font-semibold">{t.addedBy}</td>
                        <td className="px-3.5 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-600 transition-colors border border-slate-100">
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-600 transition-colors border border-slate-100">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Summary Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t pt-4 mt-2 gap-4 text-xs font-bold text-slate-700">
            <div>Total Transactions: 43</div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total Income</span>
                <span className="text-emerald-500 font-black text-sm">₹ 2,40,000</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total Expense</span>
                <span className="text-red-500 font-black text-sm">₹ 1,64,450</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Net Flow</span>
                <span className="text-emerald-500 font-black text-sm">₹ 75,550</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* PAYMENTS TAB (CUSTOMER LEDGER LIST) */}
      {activeTab === "payments" && (
        <Card className="rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-sm space-y-4">
          <div className="flex flex-wrap gap-4 items-center justify-between shadow-none p-0 bg-transparent">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search booking / customer / trip…"
                className="h-8 pl-8 text-xs rounded-[4px] border-[#E2E8F0]" 
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={fStatus} onValueChange={setFStatus}>
                <SelectTrigger className="h-8 text-xs w-36 rounded-[4px] border-[#E2E8F0]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent className="rounded-[4px]">
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={fMode} onValueChange={setFMode}>
                <SelectTrigger className="h-8 text-xs w-36 rounded-[4px] border-[#E2E8F0]"><SelectValue placeholder="Payment Mode" /></SelectTrigger>
                <SelectContent className="rounded-[4px]">
                  <SelectItem value="ALL">All Modes</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Guest / Trip</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-700">#{entry.booking?.bookingId}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col text-slate-800 font-bold">
                        <span>{entry.booking?.fullName}</span>
                        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{entry.booking?.tripName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">₹{entry.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-slate-550">{MODE_LABELS[entry.paymentMode] || entry.paymentMode}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase border",
                        entry.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-250" :
                        entry.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-250" :
                        "bg-red-50 text-red-750 border-red-250"
                      )}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-medium">{new Date(entry.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="ghost" size="sm" onClick={() => openHistory(entry)} className="h-7 px-2 border border-slate-100 hover:bg-slate-50 rounded-[4px]"><History className="w-3.5 h-3.5" /></Button>
                        {entry.status === "PENDING" && canApprove && (
                          <>
                            <Button size="sm" onClick={() => handleApprove(entry.id)} className="h-7 text-[10px] font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white rounded-[4px]">Approve</Button>
                            <Button size="sm" variant="destructive" onClick={() => setRejectDialog({ open: true, entryId: entry.id })} className="h-7 text-[10px] font-bold uppercase tracking-wider rounded-[4px]">Reject</Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* PROFIT & LOSS TAB */}
      {activeTab === "profit_loss" && (
        <Card className="rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Profit & Loss Statement (July 2024)</h3>
            <span className="font-extrabold text-xs text-slate-500">CURRENCY: INR</span>
          </div>

          <div className="space-y-4 text-xs font-semibold text-slate-700">
            <div className="flex justify-between border-b pb-2 font-bold text-slate-800 text-sm">
              <span>1. Revenue (Collections)</span>
              <span>₹24,68,000</span>
            </div>
            <div className="flex justify-between pl-4">
              <span>Customer Payments (Approved)</span>
              <span>₹24,68,000</span>
            </div>

            <div className="flex justify-between border-b pb-2 font-bold text-slate-800 text-sm mt-6">
              <span>2. Cost of Sales (Direct Payouts)</span>
              <span className="text-red-500">- ₹12,45,000</span>
            </div>
            <div className="flex justify-between pl-4">
              <span>Direct Vendor Payments (Hotels, Transport, Guides)</span>
              <span className="text-red-500">₹12,45,000</span>
            </div>

            <div className="flex justify-between border-b pb-2 font-bold text-slate-800 text-sm mt-6">
              <span>3. Operating Expenses (OPEX)</span>
              <span className="text-red-500">- ₹1,28,600</span>
            </div>
            <div className="flex justify-between pl-4">
              <span>Office Rentals & Utilities</span>
              <span>₹18,450</span>
            </div>
            <div className="flex justify-between pl-4">
              <span>Other General & Administrative Expenses</span>
              <span>₹1,10,150</span>
            </div>

            <div className="flex justify-between border-t-2 border-slate-800 pt-4 font-black text-slate-800 text-base mt-8">
              <span>Gross Profit (EBITDA)</span>
              <span className="text-emerald-500">₹ 11,94,400</span>
            </div>
            <div className="flex justify-between font-black text-slate-800 text-sm">
              <span>Profit Margin %</span>
              <span>48.4%</span>
            </div>
          </div>
        </Card>
      )}

      {/* TRIP PROFITABILITY TAB */}
      {activeTab === "trip_profitability" && (
        <Card className="rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Trip-wise Profitability Register</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Trip Name</th>
                  <th className="px-4 py-3">Departure Date</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 text-right">Vendor Cost</th>
                  <th className="px-4 py-3 text-right">Gross Profit</th>
                  <th className="px-4 py-3 text-right">Margin %</th>
                  <th className="px-4 py-3 text-right">Paid to Vendors</th>
                  <th className="px-4 py-3 text-right">Pending Cost</th>
                </tr>
              </thead>
              <tbody>
                {tripProfitability.map((item, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-800">{item.name}</td>
                    <td className="px-4 py-3 text-slate-550 font-medium">{item.date}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">₹{item.revenue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-slate-550">₹{item.cost.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-500">₹{item.profit.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-black text-emerald-600">{item.pct}%</td>
                    <td className="px-4 py-3 text-right text-slate-600">₹{item.paid.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-500">₹{item.pending.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* REPORTS TAB */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          {reportsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4 bg-white rounded-[4px] border border-[#E2E8F0]">
              <Loader2 className="w-8 h-8 animate-spin text-primary-orange" />
              <p className="text-[10px] font-black uppercase tracking-wider">Compiling Reports...</p>
            </div>
          ) : !reports ? (
            <div className="text-center py-16 bg-white rounded-[4px] border border-[#E2E8F0]">
              <BarChart3 className="w-12 h-12 text-slate-350 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-550">Failed to compile reports. Reload page to retry.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              {/* Collections by salesperson */}
              <Card className="rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5"><Users className="w-4 h-4 text-[#F97316]" /> Collection by Representative</h4>
                <div className="space-y-4">
                  {reports.salespersonCollection?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs font-semibold text-slate-700">
                      <span className="truncate max-w-[150px]">{item.salespersonName || "Internal"}</span>
                      <span className="font-bold text-slate-900">₹{item.amount.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  {(!reports.salespersonCollection || reports.salespersonCollection.length === 0) && (
                    <div className="text-center py-8 text-slate-400 text-xs">No collections logged.</div>
                  )}
                </div>
              </Card>

              {/* Revenue per trip */}
              <Card className="rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-[#F97316]" /> Collection per Tour package</h4>
                <div className="space-y-4">
                  {reports.revenuePerTrip?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs font-semibold text-slate-700">
                      <span className="truncate max-w-[150px]">{item.tripName || "Tour"}</span>
                      <span className="font-bold text-slate-900">₹{item.amount.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  {(!reports.revenuePerTrip || reports.revenuePerTrip.length === 0) && (
                    <div className="text-center py-8 text-slate-400 text-xs">No collections logged.</div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* --- MODALS & DIALOGS --- */}

      {/* Create Payment Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md rounded-[4px] border border-slate-200 bg-white p-5 shadow-md">
          <DialogHeader className="border-b border-[#E2E8F0] pb-3">
            <DialogTitle className="text-sm font-bold uppercase tracking-tight text-slate-800">Add Collection Entry</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-semibold mt-1">Log a new traveler payment collection for approval.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Booking ID</label>
              <Input 
                placeholder="e.g. BOOK-1234"
                value={form.bookingId} 
                onChange={(e) => setForm({ ...form, bookingId: e.target.value })}
                className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Amount (₹)</label>
              <Input 
                type="number"
                placeholder="e.g. 5000"
                value={form.amount} 
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Payment Mode</label>
              <Select value={form.paymentMode} onValueChange={(val) => setForm({ ...form, paymentMode: val })}>
                <SelectTrigger className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]">
                  <SelectValue placeholder="Select Mode" />
                </SelectTrigger>
                <SelectContent className="rounded-[4px]">
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Reference Number (Optional)</label>
              <Input 
                placeholder="e.g. UPI transaction ID / Bank Ref"
                value={form.referenceNumber} 
                onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
                className="h-8.5 text-xs rounded-[4px] border-[#E2E8F0]" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Internal Notes</label>
              <Textarea 
                placeholder="e.g. Paid in cash during briefing..."
                value={form.notes} 
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="text-xs rounded-[4px] border-[#E2E8F0]" 
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-[#E2E8F0]">
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)} className="h-8.5 px-4 rounded-[4px] font-semibold text-xs border border-slate-200">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating} className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white">
              {creating ? "Saving..." : "Submit Collection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, entryId: open ? rejectDialog.entryId : "" })}>
        <DialogContent className="max-w-md bg-white rounded-[4px] p-5 shadow-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800">Reject Collection Payment</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">Provide a reason for rejecting this payment record.</DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Textarea
              placeholder="e.g. Amount mismatch / Incorrect transaction ID reference"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="text-xs rounded-[4px]"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRejectDialog({ open: false, entryId: "" })} className="h-8 rounded-[4px] border border-slate-200">
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleReject} disabled={rejecting} className="h-8 rounded-[4px]">
              {rejecting ? "Rejecting..." : "Reject Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialog.open} onOpenChange={(open) => setHistoryDialog({ open, entry: open ? historyDialog.entry : null })}>
        <DialogContent className="max-w-md bg-white rounded-[4px] p-5 shadow-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800">Audit History</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
            {historyDialog.entry?.history?.map((h) => (
              <div key={h.id} className="text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0 space-y-1">
                <div className="flex justify-between items-center text-slate-500 font-semibold">
                  <span>{h.actor?.name || "System"}</span>
                  <span>{new Date(h.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-slate-800 font-bold">{h.action}</p>
                {h.notes && <p className="text-slate-550 italic">{h.notes}</p>}
              </div>
            ))}
            {(!historyDialog.entry?.history || historyDialog.entry.history.length === 0) && (
              <div className="text-center py-10 text-slate-400 text-xs">No audit history found for this entry.</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setHistoryDialog({ open: false, entry: null })} className="h-8 rounded-[4px] border border-slate-200 w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Outgoing Vendor Payment Allocation Modal */}
      <Dialog open={vendorPayDialog.open} onOpenChange={(open) => setVendorPayDialog({ open, assignment: open ? vendorPayDialog.assignment : null })}>
        <DialogContent className="max-w-md bg-white rounded-[4px] p-5 shadow-md">
          <DialogHeader className="border-b border-[#E2E8F0] pb-3">
            <DialogTitle className="text-sm font-bold uppercase tracking-tight text-slate-800">Record Vendor Payment</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-semibold mt-1">Disburse vendor payments and record allocation details.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordVendorPayment} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Vendor</label>
              <Input
                readOnly
                value={typeof vendorPayDialog.assignment?.vendorId === 'object' ? vendorPayDialog.assignment.vendorId.name : "Vendor"}
                className="h-8.5 text-xs bg-slate-50 border-[#E2E8F0] rounded-[4px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Due (₹)</label>
                <Input
                  readOnly
                  value={vendorPayDialog.assignment ? (vendorPayDialog.assignment.totalAmount - (vendorPayDialog.assignment.paidAmount || 0)) : 0}
                  className="h-8.5 text-xs bg-slate-50 border-[#E2E8F0] rounded-[4px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Amount Paid (₹)</label>
                <Input
                  type="number"
                  value={outgoingForm.paidAmount}
                  onChange={(e) => setOutgoingForm({ ...outgoingForm, paidAmount: Number(e.target.value) })}
                  className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Disbursement Status</label>
              <Select value={outgoingForm.paymentStatus} onValueChange={(val) => setOutgoingForm({ ...outgoingForm, paymentStatus: val })}>
                <SelectTrigger className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className="rounded-[4px]">
                  <SelectItem value="paid">Fully Settled</SelectItem>
                  <SelectItem value="partial">Partially Paid</SelectItem>
                  <SelectItem value="pending">Pending Settle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Payment Mode</label>
              <Select value={outgoingForm.outgoingPaymentMode} onValueChange={(val) => setOutgoingForm({ ...outgoingForm, outgoingPaymentMode: val })}>
                <SelectTrigger className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]">
                  <SelectValue placeholder="Select Mode" />
                </SelectTrigger>
                <SelectContent className="rounded-[4px]">
                  <SelectItem value="CASH">Cash Drawer</SelectItem>
                  <SelectItem value="ONLINE">Bank Transfer (UPI/IMPS)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {outgoingForm.outgoingPaymentMode === "ONLINE" ? (
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Bank Account ID / Transaction Ref</label>
                <Input
                  placeholder="e.g. HDFC Current A/c Txn 99482"
                  value={outgoingForm.onlinePersonAccount}
                  onChange={(e) => setOutgoingForm({ ...outgoingForm, onlinePersonAccount: e.target.value })}
                  className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Depositor Name</label>
                  <Input
                    placeholder="e.g. Guide / Lead"
                    value={outgoingForm.cashDepositorName}
                    onChange={(e) => setOutgoingForm({ ...outgoingForm, cashDepositorName: e.target.value })}
                    className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Source Drawer</label>
                  <Input
                    placeholder="e.g. Main Safe"
                    value={outgoingForm.depositAccountName}
                    onChange={(e) => setOutgoingForm({ ...outgoingForm, depositAccountName: e.target.value })}
                    className="h-8.5 text-xs border-[#E2E8F0] rounded-[4px]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Disbursement Notes</label>
              <Textarea
                placeholder="Details of receipt, cheque reference, or handovers..."
                value={outgoingForm.notes}
                onChange={(e) => setOutgoingForm({ ...outgoingForm, notes: e.target.value })}
                className="text-xs border-[#E2E8F0] rounded-[4px]"
                rows={2}
              />
            </div>

            <DialogFooter className="pt-4 border-t border-[#E2E8F0]">
              <Button type="button" variant="outline" size="sm" onClick={() => setVendorPayDialog({ open: false, assignment: null })} className="h-8.5 px-4 rounded-[4px] font-semibold text-xs border border-slate-200">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white">
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
