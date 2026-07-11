import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Plus, Search, Copy, Trash2, CheckCircle, Clock, Filter, X, Link2, Users, ChevronDown, Edit, Pencil, FileDown, RotateCw, ChevronLeft, ChevronRight, CreditCard, FileText, ClipboardList, Bookmark, Ticket, Train, CheckSquare, MessageSquare, HelpCircle, Wallet, Compass, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bookingsService } from "@/services/bookings.service";
import { adminUsersService } from "@/services/adminUsers.service";
import BookingDetailsView from "@/components/admin/BookingDetailsView";
import type { Booking, BookingTrip } from "@/types";
import { toast } from "sonner";
import { cn, safeFormatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { trainTicketService } from "@/services/trainTicket.service";

// ── TRIP MANAGER MODAL ──
function TripManager({ open, onClose, onRefresh }: { open: boolean; onClose: () => void; onRefresh: () => void }) {
  const [trips, setTrips] = useState<BookingTrip[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => { setTrips(await bookingsService.getTrips()); };
  useEffect(() => { if (open) load(); }, [open]);

  const handleSave = async () => {
    if (!code || !name) return toast.error("Both fields required");
    setLoading(true);
    try {
      if (editId) {
        await bookingsService.updateTrip(editId, { tripCode: code.toUpperCase(), tripName: name, price: parseFloat(price) || 0 });
        toast.success("Trip updated!");
      } else {
        await bookingsService.createTrip({ tripCode: code.toUpperCase(), tripName: name, price: parseFloat(price) || 0 });
        toast.success("Trip created!");
      }
      setCode(""); setName(""); setPrice(""); setEditId(null);
      load(); onRefresh();
    } catch (e: any) { toast.error(e?.response?.data?.message || "Failed"); }
    setLoading(false);
  };

  const startEdit = (t: BookingTrip) => {
    setEditId(t.id);
    setCode(t.tripCode);
    setName(t.tripName);
    setPrice(t.price?.toString() || "");
  };

  const cancelEdit = () => {
    setEditId(null);
    setCode("");
    setName("");
    setPrice("");
  };

  const copyLink = (link?: string) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    toast.success("Form link copied!");
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 border border-slate-200 rounded-lg overflow-hidden shadow-premium bg-white">
        <DialogHeader className="bg-slate-900 px-4 py-3 text-white">
          <DialogTitle className="text-sm font-bold uppercase tracking-wider text-white">Trip Manager</DialogTitle>
          <DialogDescription className="sr-only">Manage available trips.</DialogDescription>
        </DialogHeader>
        <div className="p-4 space-y-4">
          <div className="flex gap-2 items-center">
            <Input placeholder="Code" value={code} onChange={e => setCode(e.target.value)} className="w-20 uppercase font-bold h-8 text-xs rounded" />
            <Input placeholder="Trip Name" value={name} onChange={e => setName(e.target.value)} className="flex-1 h-8 text-xs rounded" />
            <Input type="number" placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} className="w-20 h-8 text-xs rounded" />
            {editId ? (
              <div className="flex gap-1 shrink-0">
                <Button onClick={handleSave} disabled={loading} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] h-8 rounded px-3">Update</Button>
                <Button onClick={cancelEdit} variant="ghost" size="sm" className="text-gray-400 h-8 rounded px-1.5"><X className="w-4 h-4" /></Button>
              </div>
            ) : (
              <Button onClick={handleSave} disabled={loading} size="sm" className="bg-primary text-white font-bold text-[10px] h-8 rounded px-3">Add</Button>
            )}
          </div>
          <div className="space-y-1.5 max-h-[250px] overflow-y-auto no-scrollbar">
            {trips.map(t => (
              <div key={t.id} className="flex items-center justify-between p-2 bg-slate-55 rounded border border-slate-200/60 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary text-[10px]">{t.tripCode}</span>
                  <span className="font-medium text-slate-700">{t.tripName}</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded font-mono font-bold">₹{t.price?.toLocaleString('en-IN') || 0}</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" className="text-blue-500 h-7 w-7 p-0" onClick={() => startEdit(t)} title="Edit trip">
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-slate-555 h-7 w-7 p-0" onClick={() => copyLink(t.formLink)} title="Copy form link">
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-500 h-7 w-7 p-0" onClick={async () => { 
                    if(confirm("Delete trip?")) {
                      await bookingsService.deleteTrip(t.id); load(); onRefresh(); 
                    }
                  }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {trips.length === 0 && <p className="text-center text-gray-400 py-3 text-xs italic">No trips yet. Create one above.</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── CONFIRM BOOKING MODAL ──
function ConfirmModal({ booking, trips, onClose, onDone }: { booking: Booking | null; trips: BookingTrip[]; onClose: () => void; onDone: () => void }) {
  const [total, setTotal] = useState("");
  const [advance, setAdvance] = useState("");
  const [mode, setMode] = useState("UPI");
  const [email, setEmail] = useState("");
  const [trainStatus, setTrainStatus] = useState("PENDING");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (booking) {
      setEmail(booking.email || "");
      const trip = trips.find(t => t.tripCode === booking.tripId || t.id === booking.tripId);
      if (trip && trip.price) {
        setTotal(trip.price.toString());
      } else {
        setTotal("");
      }
    }
  }, [booking, trips]);

  if (!booking) return null;

  const handleConfirm = async () => {
    if (!total || parseFloat(total) <= 0) return toast.error("Enter valid total amount");
    setSaving(true);
    try {
      await bookingsService.confirm(booking.id, {
        totalAmount: parseFloat(total),
        advancePaid: parseFloat(advance) || 0,
        paymentMode: mode,
        paymentStatus: parseFloat(advance) >= parseFloat(total) ? 'Paid' : parseFloat(advance) > 0 ? 'Partial' : 'Pending',
        email
      });
      
      // Auto create train tickets for passengers in this booking with the selected status
      const passengersList = booking.passengers && Array.isArray(booking.passengers) ? booking.passengers : [];
      if (passengersList.length > 0) {
        await Promise.all(
          passengersList.map(p => 
            trainTicketService.createTicket(booking.bookingId, {
              travelerName: p.name,
              ticketStatus: trainStatus,
              sourceStation: booking.pickupCity || "Ahmedabad",
              destinationStation: "Jalandhar"
            })
          )
        );
      } else {
        // Fallback for main guest
        await trainTicketService.createTicket(booking.bookingId, {
          travelerName: booking.fullName,
          ticketStatus: trainStatus,
          sourceStation: booking.pickupCity || "Ahmedabad",
          destinationStation: "Jalandhar"
        });
      }

      toast.success("Booking confirmed!");
      try {
        await bookingsService.sendEmail(booking.id, 'confirmation');
        toast.success("Confirmation email sent!");
      } catch (e) {
        console.error("Failed to send automatic confirmation email", e);
        toast.error("Booking confirmed but email failed to send");
      }
      onDone();
    } catch { toast.error("Failed to confirm"); }
    setSaving(false);
  };

  const rem = (parseFloat(total) || 0) - (parseFloat(advance) || 0);

  return (
    <Dialog open={!!booking} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-0 border border-slate-200 rounded-lg overflow-hidden shadow-premium bg-white">
        <DialogHeader className="bg-emerald-600 px-4 py-3 text-white">
          <DialogTitle className="text-xs font-bold uppercase tracking-wider text-white">Confirm Booking</DialogTitle>
          <DialogDescription className="sr-only">Confirm the booking details and payments.</DialogDescription>
        </DialogHeader>
        <div className="p-4 space-y-3.5 text-xs">
          <div className="bg-slate-55 p-2.5 rounded border border-slate-200/60">
            <span className="font-bold text-slate-555 uppercase mr-1">Booking Ref:</span>
            <span className="font-mono font-semibold">{booking.bookingId}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-400">Total Package Amount *</label>
              <Input type="number" value={total} onChange={e => setTotal(e.target.value)} placeholder="0.00" className="h-8 text-xs rounded bg-white" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-400">Advance Paid</label>
              <Input type="number" value={advance} onChange={e => setAdvance(e.target.value)} placeholder="0.00" className="h-8 text-xs rounded bg-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 bg-slate-55 p-2.5 rounded border border-slate-100/80">
            <div>
              <p className="text-[9px] font-bold uppercase text-slate-400">Remaining Balance</p>
              <p className="text-sm font-bold font-mono text-slate-800">₹{rem.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase text-slate-400">Payment Status</p>
              <p className={cn("text-xs font-black uppercase tracking-wider", rem <= 0 ? "text-emerald-600" : parseFloat(advance) > 0 ? "text-orange-500" : "text-amber-500")}>
                {rem <= 0 ? "PAID" : parseFloat(advance) > 0 ? "PARTIAL" : "PENDING"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-400">Payment Mode</label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger className="h-8 text-xs rounded bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPI" className="text-xs">UPI</SelectItem>
                  <SelectItem value="Cash" className="text-xs">Cash</SelectItem>
                  <SelectItem value="Bank Transfer" className="text-xs">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-400">Train Ticket Status</label>
              <Select value={trainStatus} onValueChange={setTrainStatus}>
                <SelectTrigger className="h-8 text-xs rounded bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING" className="text-xs">Pending</SelectItem>
                  <SelectItem value="BOOKED" className="text-xs">Booked</SelectItem>
                  <SelectItem value="WAITLISTED" className="text-xs">Waitlisted</SelectItem>
                  <SelectItem value="CONFIRMED" className="text-xs">Confirmed</SelectItem>
                  <SelectItem value="RAC" className="text-xs">RAC</SelectItem>
                  <SelectItem value="SELF_BOOKED" className="text-xs">Self booked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase text-slate-400">Customer Email (For confirmation)</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="customer@example.com" className="h-8 text-xs rounded bg-white" />
          </div>
          <Button onClick={handleConfirm} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider h-9 rounded text-[10px] mt-2 shadow-sm">
            {saving ? "Processing..." : "Confirm Booking"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Booking source helper
const getBookingMetaData = (booking: Booking) => {
  const salesAdminId = (booking as any).salesAdminId as string | undefined;
  const link = (booking as any).sourceBookingLink as
    | { tokenPrefix?: string | null; id?: string | null; shareUrl?: string | null }
    | undefined;

  let bookedBy = salesAdminId ? `Sales ${salesAdminId}` : "Website / Unknown";
  let source = link?.tokenPrefix ? `Booking Link #${link.tokenPrefix}` : "Website / Inquiry";

  const notesLower = ((booking.notes as any) || "").toString().toLowerCase() + " " + ((booking.adminNotes as any) || "").toString().toLowerCase();
  if (notesLower.includes("booked by:")) {
    const match = notesLower.match(/booked by:\s*([a-zA-Z\s]+)/);
    if (match && match[1]) bookedBy = match[1].trim();
  }
  if (notesLower.includes("source:")) {
    const match = notesLower.match(/source:\s*([a-zA-Z\s]+)/);
    if (match && match[1]) source = match[1].trim();
  }

  return { bookedBy, source };
};

// Caches
let cachedBookingTrips: BookingTrip[] | null = null;
let cachedSalesOptions: string[] | null = null;

// ── MAIN PAGE ──
export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trips, setTrips] = useState<BookingTrip[]>(cachedBookingTrips || []);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'confirmed'>('confirmed');
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(prev => (prev !== searchInput ? searchInput : prev));
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const [filterTrip, setFilterTrip] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [filterSalesAdmin, setFilterSalesAdmin] = useState("all");
  const [bookingStart, setBookingStart] = useState("");
  const [bookingEnd, setBookingEnd] = useState("");
  const [depStart, setDepStart] = useState("");
  const [depEnd, setDepEnd] = useState("");
  const [showTrips, setShowTrips] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Booking | null>(null);
  const [editTarget, setEditTarget] = useState<Booking | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<Booking | null>(null);
  const [detailsLoadingId, setDetailsLoadingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  
  // Custom states
  const [detailsDefaultTab, setDetailsDefaultTab] = useState<string>("overview");
  const [quickFilter, setQuickFilter] = useState<string>('confirmed_bookings');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewTarget, setPreviewTarget] = useState<Booking | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [salesOptions, setSalesOptions] = useState<string[]>(cachedSalesOptions || []);
  const bookingsRequestRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { admin: currentAdmin } = useAuthStore();

  const tripMap = useMemo(() => {
    const m = new Map<string, BookingTrip>();
    for (const t of trips) {
      if (t.id) m.set(t.id, t);
      if (t.tripCode) m.set(t.tripCode, t);
    }
    return m;
  }, [trips]);

  useEffect(() => {
    const handleReset = () => { setDetailsTarget(null); };
    window.addEventListener("reset-bookings-view", handleReset);
    return () => window.removeEventListener("reset-bookings-view", handleReset);
  }, []);

  useEffect(() => {
    bookingsService.getTrips()
      .then(t => {
        const arr = Array.isArray(t) ? t : [];
        cachedBookingTrips = arr;
        setTrips(arr);
      })
      .catch(err => console.error("Trips failed", err));
  }, []);

  useEffect(() => {
    if (currentAdmin && (currentAdmin.role === "admin" || currentAdmin.role === "superadmin")) {
      if (cachedSalesOptions) setSalesOptions(cachedSalesOptions);
      adminUsersService.listAdmins()
        .then((users) => {
          const ids = users.map((u: any) => u.id || u.username || u.email).filter(Boolean);
          cachedSalesOptions = ids;
          setSalesOptions(ids);
        })
        .catch((err) => console.error("Failed to load sales options:", err));
    } else if (currentAdmin && currentAdmin.role === "sales") {
      setSalesOptions([currentAdmin.id]);
    }
  }, [currentAdmin]);

  const filterKey = `${tab}-${filterTrip}-${filterPayment}-${filterSalesAdmin}-${bookingStart}-${bookingEnd}-${depStart}-${depEnd}-${search}`;
  const lastFilterKeyRef = useRef(filterKey);

  const fetchBookings = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    let queryPage = page;
    if (lastFilterKeyRef.current !== filterKey) {
      lastFilterKeyRef.current = filterKey;
      queryPage = 1;
      setPage(1);
    }

    const requestId = ++bookingsRequestRef.current;
    setLoading(true);
    try {
      const res = await bookingsService.getAll({
        status: tab,
        tripId: filterTrip,
        search,
        salesAdminId: filterSalesAdmin,
        bookingStart,
        bookingEnd,
        depStart,
        depEnd,
        page: queryPage,
        limit: pageSize,
      }, controller.signal);
      if (requestId !== bookingsRequestRef.current) return;

      const currentTotalPages = res.pagination?.totalPages || 0;
      if (currentTotalPages > 0 && queryPage > currentTotalPages) {
        setPage(currentTotalPages);
        return;
      }

      setBookings(res.data || []);
      setTotalCount(res.pagination?.total || 0);
      setTotalPages(currentTotalPages);
    } catch (err: any) {
      if (err.name !== 'CanceledError') {
        toast.error("Failed to load bookings");
      }
    } finally {
      if (requestId === bookingsRequestRef.current) setLoading(false);
    }
  }, [filterKey, page, pageSize]);

  useEffect(() => {
    fetchBookings();
    return () => { if (abortControllerRef.current) abortControllerRef.current.abort(); };
  }, [fetchBookings]);

  const fetchAll = () => { fetchBookings(); };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const getFlowStatus = (b: Booking) => {
    if (b.status === 'cancelled') return 'Cancelled';
    if (b.status === 'expired') return 'Expired';
    if (b.status === 'draft') return 'Draft';
    if (b.status === 'confirmed') return 'Confirmed';
    return 'Inquiry';
  };

  const openBookingDetails = async (b: Booking, defaultTab?: string) => {
    setDetailsDefaultTab(defaultTab || "overview");
    setDetailsLoadingId(b.id);
    try {
      const fresh = await bookingsService.getById(b.id);
      setDetailsTarget(fresh);
    } catch {
      toast.error("Failed to load booking details");
    } finally {
      setDetailsLoadingId(null);
    }
  };

  const refreshBookingDetails = async () => {
    if (!detailsTarget) return;
    try {
      const fresh = await bookingsService.getById(detailsTarget.id);
      setDetailsTarget(fresh);
      fetchAll();
    } catch {
      toast.error("Failed to refresh details");
    }
  };

  const openEdit = (b: Booking) => {
    setEditTarget(b);
    setEditForm({
      fullName: b.fullName,
      mobile: b.mobile,
      age: b.age || '',
      gender: b.gender || 'Male',
      email: b.email || '',
      paymentStatus: b.paymentStatus, 
      notes: b.notes || '',
      departureDate: b.departureDate || ''
    });
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    try {
      await bookingsService.update(editTarget.id, editForm);
      toast.success("Booking updated!"); setEditTarget(null); fetchAll();
    } catch { toast.error("Update failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this booking?")) return;
    try { await bookingsService.delete(id); toast.success("Deleted"); fetchAll(); } catch { toast.error("Failed"); }
  };

  const handleConfirmPayment = async (id: string) => {
    if (!confirm("Confirm payment for this booking?")) return;
    try {
      await bookingsService.confirmPayment(id);
      toast.success("Payment confirmed and WhatsApp triggered!");
      fetchAll();
    } catch {
      toast.error("Failed to confirm payment");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setFilterTrip("all");
    setFilterPayment("all");
    setBookingStart("");
    setBookingEnd("");
    setDepStart("");
    setDepEnd("");
    setQuickFilter('confirmed_bookings');
    setSelectedStatuses([]);
    setTab('confirmed');
  };

  const handleExportCSV = () => {
    if (bookings.length === 0) return toast.error("No bookings to export");
    const headers = ["Booking ID", "Guest Name", "Email", "Mobile", "Expedition ID", "Total Price", "Advance Paid", "Balance Due", "Status", "Created Date"];
    const rows = bookings.map(b => [
      `"${b.bookingId}"`,
      `"${b.fullName}"`,
      `"${b.email || 'N/A'}"`,
      `"${b.mobile}"`,
      `"${b.tripId}"`,
      b.totalAmount || 0,
      b.advancePaid || 0,
      b.remainingAmount || 0,
      `"${b.status === 'confirmed' ? b.paymentStatus : 'Pending Confirmation'}"`,
      `"${safeFormatDate(b.createdAt, { day: '2-digit', month: '2-digit', year: 'numeric' })}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bookings_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${bookings.length} bookings exported to CSV!`);
  };

  const selectAll = () => {
    if (selectedIds.length === bookings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(bookings.map(b => b.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Metrics for counters
  const totalAmountDue = bookings.reduce((sum, b) => sum + (b.remainingAmount || 0), 0);
  const totalPendingInquiries = bookings.filter(b => b.status === 'pending').length;
  const totalConfirmedCount = bookings.filter(b => b.status === 'confirmed').length;

  const getPriority = (b: Booking) => {
    if (b.status === 'pending') return 'amber';
    if (b.remainingAmount > 15000) return 'red';
    if (b.remainingAmount > 0) return 'blue';
    if (b.status === 'confirmed') return 'green';
    return 'purple';
  };

  const getDays = (b: Booking) => {
    if (!b.departureDate) return 0;
    const diff = new Date(b.departureDate).getTime() - new Date(b.createdAt).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getProgress = (b: Booking) => {
    if (b.status === 'confirmed' && b.remainingAmount === 0) return 100;
    if (b.status === 'confirmed') return 85;
    if (b.status === 'pending' && b.advancePaid > 0) return 60;
    if (b.status === 'pending') return 35;
    return 15;
  };

  const getNextAction = (b: Booking) => {
    if (b.status === 'pending') return 'Confirm Booking';
    if (b.remainingAmount > 0) return 'Collect Balance';
    if (b.ticketStatus !== 'ISSUED') return 'Generate Ticket';
    return 'Final Checklist';
  };

  const getActivityTime = (b: Booking) => {
    const diff = new Date().getTime() - new Date(b.updatedAt || b.createdAt).getTime();
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    if (hrs < 1) return 'Just now';
    if (hrs < 24) return `${hrs} hours ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // 1. Quick Filters
      if (quickFilter === 'my') {
        const meta = getBookingMetaData(b);
        if (meta.bookedBy !== (currentAdmin?.name || currentAdmin?.email)) return false;
      } else if (quickFilter === 'confirmed_bookings') {
        if (b.status !== 'confirmed') return false;
      } else if (quickFilter === 'unconfirmed_bookings') {
        if (b.status !== 'pending' && b.status !== 'draft') return false;
      } else if (quickFilter === 'payment_pending') {
        if (b.remainingAmount <= 0) return false;
      } else if (quickFilter === 'payment_overdue') {
        if (b.remainingAmount <= 0) return false;
        if (!b.departureDate) return false;
        const diff = new Date(b.departureDate).getTime() - new Date().getTime();
        const days = diff / (1000 * 60 * 60 * 24);
        if (days > 3) return false;
      } else if (quickFilter === 'ticket_verification') {
        if (b.trainTicketStatus !== 'Pending' && b.trainTicketStatus !== 'Waitlisted') return false;
      } else if (quickFilter === 'departing_7_days') {
        if (!b.departureDate) return false;
        const diff = new Date(b.departureDate).getTime() - new Date().getTime();
        const days = diff / (1000 * 60 * 60 * 24);
        if (days < 0 || days > 7) return false;
      } else if (quickFilter === 'ops_blocked') {
        if (b.status !== 'confirmed' || getProgress(b) >= 85) return false;
      } else if (quickFilter === 'completed_bookings') {
        if (b.status !== 'confirmed' || getProgress(b) < 100) return false;
      } else if (quickFilter === 'cancelled_bookings') {
        if (b.status !== 'expired' && b.status !== 'cancelled') return false;
      }

      // 2. Booking Status Filters (Checkboxes)
      if (selectedStatuses.length > 0) {
        const isConfirmed = b.status === 'confirmed';
        const isUnconfirmed = b.status === 'pending' || b.status === 'draft';
        const isCancelled = b.status === 'expired' || b.status === 'cancelled';
        const isCompleted = getProgress(b) === 100 && b.status === 'confirmed';

        let matchesOne = false;
        if (selectedStatuses.includes('Confirmed') && isConfirmed) matchesOne = true;
        if (selectedStatuses.includes('Unconfirmed') && isUnconfirmed) matchesOne = true;
        if (selectedStatuses.includes('Cancelled') && isCancelled) matchesOne = true;
        if (selectedStatuses.includes('Completed') && isCompleted) matchesOne = true;
        if (!matchesOne) return false;
      }

      // 3. Dropdowns
      if (filterTrip !== 'all' && b.tripId !== filterTrip) return false;
      if (filterSalesAdmin !== 'all' && b.salesAdminId !== filterSalesAdmin) return false;

      return true;
    });
  }, [bookings, quickFilter, selectedStatuses, filterTrip, filterSalesAdmin, currentAdmin]);



  const [bulkModalAction, setBulkModalAction] = useState<string | null>(null);
  const [bulkSalesperson, setBulkSalesperson] = useState("");
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkReminderChannel, setBulkReminderChannel] = useState("WhatsApp");
  const [bulkReminderMessage, setBulkReminderMessage] = useState("");
  const [bulkTaskTitle, setBulkTaskTitle] = useState("");
  const [bulkTaskDueDate, setBulkTaskDueDate] = useState("");
  const [bulkTaskPriority, setBulkTaskPriority] = useState("Medium");
  const [bulkTaskAssignee, setBulkTaskAssignee] = useState("");

  const handleBulkAction = (action: string) => {
    setBulkModalAction(action);
    setBulkSalesperson("");
    setBulkReminderMessage("");
    setBulkTaskTitle("");
    setBulkTaskDueDate("");
    setBulkTaskPriority("Medium");
    setBulkTaskAssignee("");
  };

  const executeBulkAction = async () => {
    if (!bulkModalAction) return;
    setBulkProcessing(true);
    try {
      if (bulkModalAction === 'assign') {
        if (!bulkSalesperson) {
          toast.error("Please select a salesperson");
          setBulkProcessing(false);
          return;
        }
        await Promise.all(selectedIds.map(id => bookingsService.update(id, { salesAdminId: bulkSalesperson })));
        toast.success(`Assigned executive ${bulkSalesperson} to ${selectedIds.length} bookings!`);
      } else if (bulkModalAction === 'reminder') {
        await Promise.all(selectedIds.map(id => bookingsService.sendEmail(id, 'reminder')));
        toast.success(`Reminders dispatched via ${bulkReminderChannel} to ${selectedIds.length} travelers!`);
      } else if (bulkModalAction === 'link') {
        await Promise.all(selectedIds.map(id => bookingsService.sendEmail(id, 'invoice')));
        toast.success(`Invoice payment links sent to ${selectedIds.length} travelers!`);
      } else if (bulkModalAction === 'assign_task') {
        if (!bulkTaskTitle) {
          toast.error("Please enter a task title");
          setBulkProcessing(false);
          return;
        }
        // Simulating creating a task on the booking's task board
        await Promise.all(selectedIds.map(id => 
          bookingsService.update(id, {
            notes: `[Task Assigned: ${bulkTaskTitle} | Assignee: ${bulkTaskAssignee || 'Unassigned'} | Due: ${bulkTaskDueDate || 'No due date'} | Priority: ${bulkTaskPriority}]`
          })
        ));
        toast.success(`Assigned task "${bulkTaskTitle}" to ${bulkTaskAssignee || 'colleague'} for ${selectedIds.length} bookings!`);
      } else if (bulkModalAction === 'mark_complete') {
        await Promise.all(selectedIds.map(id => bookingsService.update(id, { status: 'confirmed', paymentStatus: 'Paid', remainingAmount: 0 })));
        toast.success(`Marked ${selectedIds.length} bookings as confirmed and complete!`);
      }
      setBulkModalAction(null);
      setSelectedIds([]);
      fetchAll();
    } catch (e) {
      toast.error("Failed to execute bulk action");
    } finally {
      setBulkProcessing(false);
    }
  };



  if (detailsTarget) {
    return (
      <BookingDetailsView
        booking={detailsTarget}
        onBack={() => setDetailsTarget(null)}
        onRefresh={refreshBookingDetails}
        trips={trips}
        defaultTab={detailsDefaultTab}
      />
    );
  }

  return (
    <div className="zoho-container flex flex-col h-screen overflow-hidden bg-white text-[13px] font-sans">
      {/* SCOPED ZOHO CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
            --orange-600: #ea6d1e;
            --orange-50: #fef9f3;
            --slate-900: #0f172a;
            --slate-800: #1e293b;
            --slate-700: #334155;
            --slate-600: #475569;
            --slate-500: #64748b;
            --slate-400: #94a3b8;
            --slate-200: #e2e8f0;
            --slate-100: #f1f5f9;
            --slate-50: #f8fafc;
            --green-600: #16a34a;
            --green-50: #f0fdf4;
            --blue-600: #2563eb;
            --blue-50: #eff6ff;
            --amber-600: #d97706;
            --amber-50: #fffbeb;
            --red-600: #dc2626;
            --red-50: #fef2f2;
            --purple-600: #7c3aed;
            --purple-50: #f5f3ff;
            --white: #ffffff;
            --border: #e5e7eb;
            --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
            --shadow: 0 1px 3px 0 rgba(0,0,0,0.1);
            --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
        }

        .zoho-container {
            background: var(--white);
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .zoho-container * {
            box-sizing: border-box;
        }

        .zoho-toolbar {
            background: var(--white);
            border-bottom: 1px solid var(--border);
            padding: 0 24px;
            height: 56px;
            display: flex;
            align-items: center;
            gap: 12px;
            flex-shrink: 0;
        }

        .zoho-toolbar-title {
            font-size: 15px;
            font-weight: 700;
            color: var(--slate-900);
            min-width: 80px;
        }

        .zoho-toolbar-search {
            flex: 1;
            max-width: 300px;
        }

        .zoho-search-input {
            width: 100%;
            padding: 6px 10px;
            border: 1px solid var(--border);
            border-radius: 4px;
            font-size: 12px;
            background: var(--white);
            color: var(--slate-900);
            transition: border-color 0.15s;
        }

        .zoho-search-input:focus {
            outline: none;
            border-color: var(--orange-600);
        }

        .zoho-toolbar-actions {
            display: flex;
            gap: 8px;
            margin-left: auto;
        }

        .zoho-btn {
            padding: 6px 12px;
            border-radius: 4px;
            border: 1px solid var(--border);
            background: var(--white);
            color: var(--slate-700);
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            transition: all 0.15s;
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
        }

        .zoho-btn:hover {
            background: var(--slate-50);
            border-color: var(--slate-300);
        }

        .zoho-btn-primary {
            background: var(--orange-600);
            color: var(--white);
            border-color: var(--orange-600);
        }

        .zoho-btn-primary:hover {
            background: #d86a1a;
        }

        .zoho-btn-icon {
            width: 32px;
            height: 32px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .zoho-action-center {
            padding: 0px 4px;
            display: flex;
            gap: 8px;
            overflow-x: auto;
            flex-shrink: 0;
        }

        .zoho-action-card {
            padding: 6px 12px;
            background: var(--white);
            border: 1px solid var(--border);
            border-radius: 6px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 600;
            color: var(--slate-700);
            transition: all 0.15s;
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
            flex-shrink: 0;
            box-shadow: var(--shadow-sm);
        }

        .zoho-action-card:hover {
            background: var(--slate-50);
            border-color: var(--slate-300);
        }

        .zoho-action-card.active {
            background: var(--orange-600);
            color: var(--white);
            border-color: var(--orange-600);
        }

        .zoho-action-badge {
            background: var(--slate-900);
            color: var(--white);
            border-radius: 10px;
            padding: 1px 6px;
            font-size: 9px;
            font-weight: 700;
            min-width: 18px;
            text-align: center;
        }

        .zoho-main {
            display: flex;
            flex: 1;
            overflow: hidden;
        }

        .zoho-filter-panel {
            width: 230px;
            background: #f8fafc;
            border-right: 1px solid var(--border);
            padding: 16px 12px;
            overflow-y: auto;
            flex-shrink: 0;
        }

        .zoho-filter-section {
            margin-bottom: 14px;
        }

        .zoho-filter-title {
            font-size: 10px;
            font-weight: 700;
            color: var(--slate-500);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
            padding: 0 4px;
        }

        .zoho-filter-item {
            padding: 5px 8px;
            cursor: pointer;
            border-radius: 3px;
            font-size: 12px;
            color: var(--slate-700);
            transition: all 0.15s;
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 2px;
        }

        .zoho-filter-item:hover {
            background: var(--slate-50);
        }

        .zoho-filter-item.active {
            background: var(--orange-600);
            color: var(--white);
            font-weight: 600;
        }

        .zoho-filter-checkbox {
            width: 14px;
            height: 14px;
            accent-color: var(--orange-600);
        }

        .zoho-content-left {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
            background: var(--white);
        }

        .zoho-table-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .zoho-table-wrapper {
            flex: 1;
            overflow-y: auto;
            overflow-x: auto;
        }

        .zoho-table {
            width: 100%;
            min-width: 1650px;
            border-collapse: collapse;
            font-size: 11px;
            border: 1px solid #dbe1e8;
            table-layout: fixed;
        }

        .zoho-th-checkbox, .zoho-td-checkbox { width: 32px !important; min-width: 32px !important; max-width: 32px !important; }
        .zoho-th-priority, .zoho-td-priority { width: 12px !important; min-width: 12px !important; max-width: 12px !important; }
        
        .col-customer { width: 110px !important; min-width: 110px !important; max-width: 110px !important; }
        .col-phone { width: 90px !important; min-width: 90px !important; max-width: 90px !important; }
        .col-trip { width: 100px !important; min-width: 100px !important; max-width: 100px !important; }
        .col-departure { width: 85px !important; min-width: 85px !important; max-width: 85px !important; }
        .col-days { width: 50px !important; min-width: 50px !important; max-width: 50px !important; }
        .col-pass { width: 45px !important; min-width: 45px !important; max-width: 45px !important; }
        .col-exec { width: 90px !important; min-width: 90px !important; max-width: 90px !important; }
        .col-package { width: 70px !important; min-width: 70px !important; max-width: 70px !important; }
        .col-balance { width: 80px !important; min-width: 80px !important; max-width: 80px !important; }
        .col-received { width: 80px !important; min-width: 80px !important; max-width: 80px !important; }
        .col-progress { width: 95px !important; min-width: 95px !important; max-width: 95px !important; text-align: center !important; }
        .col-next { width: 100px !important; min-width: 100px !important; max-width: 100px !important; text-align: center !important; }
        .col-status { width: 90px !important; min-width: 90px !important; max-width: 90px !important; text-align: center !important; }
        .col-activity { width: 100px !important; min-width: 100px !important; max-width: 100px !important; }
        .col-actions { width: 255px !important; min-width: 255px !important; max-width: 255px !important; }

        .zoho-table-wrapper::-webkit-scrollbar {
            height: 8px;
            width: 8px;
        }
        .zoho-table-wrapper::-webkit-scrollbar-track {
            background: #f1f5f9;
        }
        .zoho-table-wrapper::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
        }
        .zoho-table-wrapper::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }

        .zoho-table thead {
            position: sticky;
            top: 0;
            background: var(--white);
            border-bottom: 1px solid #dbe1e8;
            z-index: 10;
        }

        .zoho-table th {
            padding: 6px 4px;
            text-align: left;
            font-weight: 700;
            color: var(--slate-600);
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-right: 1px solid #dbe1e8;
            border-bottom: 1px solid #dbe1e8;
            background: var(--slate-50);
            white-space: nowrap;
            vertical-align: middle;
        }

        .zoho-table td {
            padding: 6px 4px;
            border-bottom: 1px solid #dbe1e8;
            border-right: 1px solid #dbe1e8;
            color: var(--slate-700);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            vertical-align: middle;
        }

        .zoho-table tbody tr {
            transition: all 0.15s;
        }

        .zoho-table tbody tr:hover {
            background: var(--slate-50);
            cursor: pointer;
        }

        .zoho-th-checkbox, .zoho-td-checkbox {
            width: 32px !important;
            padding: 0 !important;
            text-align: center !important;
            min-width: 32px !important;
            max-width: 32px !important;
        }
        .zoho-th-priority, .zoho-td-priority {
            width: 12px !important;
            padding: 0 !important;
            min-width: 12px !important;
            max-width: 12px !important;
        }

        .zoho-table tbody tr.selected {
            background: var(--orange-50);
        }

        .zoho-priority-indicator {
            width: 3px;
            height: 32px;
            margin: -8px 0 -8px -8px;
            padding: 0;
            border: none;
        }

        .zoho-priority-red { background: var(--red-600); }
        .zoho-priority-amber { background: var(--amber-600); }
        .zoho-priority-blue { background: var(--blue-600); }
        .zoho-priority-green { background: var(--green-600); }
        .zoho-priority-purple { background: var(--purple-600); }

        .zoho-customer {
            font-weight: 600;
            color: var(--slate-900);
        }

        .zoho-phone {
            font-family: monospace;
            font-size: 11px;
            color: var(--slate-500);
        }

        .zoho-balance {
            font-weight: 600;
            color: var(--red-600);
        }

        .zoho-received {
            color: var(--green-600);
            font-weight: 500;
        }

        .zoho-progress-container {
            display: flex;
            align-items: center;
            gap: 6px;
            width: 80px;
            margin: 0 auto;
        }

        .zoho-progress-bar {
            flex: 1;
            height: 4px;
            background: var(--slate-200);
            border-radius: 2px;
            overflow: hidden;
        }

        .zoho-progress-fill {
            height: 100%;
            background: var(--orange-600);
        }

        .zoho-progress-text {
            font-size: 10px;
            color: var(--slate-500);
            min-width: 24px;
            text-align: right;
        }

        .zoho-next-action {
            background: var(--blue-50);
            color: var(--blue-600);
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: 600;
            font-size: 10px;
        }

        .zoho-status-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            white-space: nowrap;
            min-width: 75px;
        }

        .zoho-status-confirmed { background: var(--green-50); color: var(--green-600); }
        .zoho-status-pending { background: var(--amber-50); color: var(--amber-600); }
        .zoho-status-draft { background: var(--slate-100); color: var(--slate-600); }

        .zoho-quick-actions {
            display: flex;
            gap: 4px;
        }

        .zoho-action-btn {
            width: 24px;
            height: 24px;
            padding: 0;
            border: 1px solid var(--border);
            background: var(--white);
            border-radius: 3px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--slate-500);
            transition: all 0.15s;
        }

        .zoho-action-btn:hover {
            background: var(--slate-100);
            color: var(--slate-900);
            border-color: var(--slate-300);
        }

        .zoho-bulk-actions {
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%) translateY(150%);
            width: auto;
            min-width: 480px;
            background: var(--orange-600);
            color: var(--white);
            padding: 12px 24px;
            display: flex;
            gap: 12px;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            box-shadow: 0 10px 25px -5px rgba(234, 88, 12, 0.3), 0 8px 10px -6px rgba(234, 88, 12, 0.3);
            z-index: 50;
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .zoho-bulk-actions.visible {
            transform: translateX(-50%) translateY(0);
        }

        .zoho-preview-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.3);
            z-index: 1000;
        }

        .zoho-preview-panel {
            position: fixed;
            top: 0;
            right: -450px;
            width: 450px;
            height: 100vh;
            background: var(--white);
            box-shadow: var(--shadow-md);
            transition: right 0.3s ease;
            overflow-y: auto;
            z-index: 1001;
            display: flex;
            flex-direction: column;
        }

        .zoho-preview-panel.active {
            right: 0;
        }

        .zoho-preview-header {
            padding: 16px;
            border-bottom: 1px solid var(--border);
            background: var(--white);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }

        .zoho-preview-title {
            font-weight: 700;
            color: var(--slate-900);
            font-size: 14px;
        }

        .zoho-preview-close {
            width: 28px;
            height: 28px;
            border: none;
            background: var(--slate-50);
            border-radius: 4px;
            cursor: pointer;
            color: var(--slate-500);
        }

        .zoho-preview-close:hover {
            background: var(--slate-100);
            color: var(--slate-900);
        }

        .zoho-preview-body {
            padding: 16px;
            flex: 1;
            overflow-y: auto;
        }

        .zoho-preview-section {
            margin-bottom: 16px;
        }

        .zoho-preview-section-title {
            font-size: 11px;
            font-weight: 700;
            color: var(--slate-500);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }

        .zoho-preview-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 12px;
            border-bottom: 1px solid var(--border);
        }

        .zoho-preview-label {
            color: var(--slate-500);
        }

        .zoho-preview-value {
            font-weight: 600;
            color: var(--slate-900);
        }

        .zoho-preview-actions {
            padding: 16px;
            border-top: 1px solid var(--border);
        }
      `}} />

      {/* TOOLBAR */}
      <div className="zoho-toolbar flex items-center justify-between border-b border-slate-200 bg-white px-6 h-14">
        <div className="flex items-center gap-4 flex-1">
          <div className="zoho-toolbar-title font-bold text-slate-900 text-[14px]">Bookings</div>
          <div className="zoho-toolbar-search flex-1 max-w-[320px]">
            <input 
              type="text" 
              className="zoho-search-input w-full h-8 px-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded text-xs outline-none transition-colors" 
              placeholder="Search bookings..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
        </div>
        <div className="zoho-toolbar-actions flex items-center gap-2">
          <button className="zoho-btn zoho-btn-icon w-8 h-8 rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors" onClick={fetchAll} title="Refresh">
            <RotateCw className="w-4 h-4 text-slate-600" />
          </button>
          <button 
            className={cn(
              "zoho-btn zoho-btn-icon w-8 h-8 rounded border flex items-center justify-center transition-colors", 
              showSidebar ? "bg-orange-50 border-orange-200 text-orange-600" : "border-slate-200 hover:bg-slate-50 text-slate-600"
            )} 
            onClick={() => setShowSidebar(!showSidebar)} 
            title="Toggle Sidebar Filters"
          >
            <Filter className="w-4 h-4" />
          </button>
          <button className="zoho-btn zoho-btn-icon w-8 h-8 rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors" onClick={handleExportCSV} title="Export CSV">
            <FileDown className="w-4 h-4 text-slate-600" />
          </button>
          <button className="h-8 px-3 border border-slate-200 hover:bg-slate-50 rounded text-xs text-slate-700 font-semibold flex items-center gap-1.5 transition-colors" onClick={() => setShowTrips(true)} title="Trip Manager">
            <Link2 className="w-3.5 h-3.5" /> Trips
          </button>
          <button 
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-8 px-3.5 rounded text-xs flex items-center gap-1 shadow-sm transition-colors" 
            onClick={() => toast.info("New Booking flow can be triggered from booking workspace operations")}
          >
            + New Booking
          </button>
        </div>
      </div>

      {/* ACTION CHIPS BAR */}
      <div className="flex items-center gap-3 px-6 py-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto flex-shrink-0">
        {[
          { label: 'Needs Attention', value: 'needs_attention', count: 4, icon: HelpCircle },
          { label: 'Payment Pending', value: 'payment_pending', count: 6, icon: Wallet },
          { label: 'Ticket Pending', value: 'ticket_pending', count: 3, icon: Ticket },
          { label: 'Operations Pending', value: 'ops_pending', count: 2, icon: ShieldAlert },
          { label: 'Today\'s Departure', value: 'today_departure', count: 1, icon: Compass },
          { label: 'Refund Approval', value: 'refund_approval', count: 0, icon: AlertCircle },
          { label: 'Completed', value: 'completed_bookings', count: 18, icon: CheckCircle2 }
        ].map(chip => {
          const isActive = quickFilter === chip.value;
          return (
            <button
              key={chip.value}
              onClick={() => setQuickFilter(isActive ? 'confirmed_bookings' : chip.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-sm transition-colors whitespace-nowrap",
                isActive 
                  ? "bg-orange-500 border-orange-500 text-white" 
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
            >
              <chip.icon className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-slate-500")} />
              <span>{chip.label}</span>
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.2 rounded-full",
                isActive ? "bg-white text-orange-600" : "bg-slate-100 text-slate-800"
              )}>
                {chip.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* HORIZONTAL FILTER INPUTS ROW */}
      {showSidebar && (
        <div className="grid grid-cols-10 gap-2.5 px-6 py-3 bg-white border-b border-slate-200 flex-shrink-0">
          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Search Booking</label>
            <input
              type="text"
              className="w-full h-8 px-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded text-xs outline-none"
              placeholder="ID, name, email, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Trip</label>
            <select
              value={filterTrip}
              onChange={e => setFilterTrip(e.target.value)}
              className="w-full h-8 px-2 bg-white border border-slate-200 rounded text-xs outline-none"
            >
              <option value="all">All Trips</option>
              {trips.map(t => (
                <option key={t.id} value={t.tripCode}>{t.tripCode}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Departure Date</label>
            <input
              type="date"
              onChange={e => {
                if (e.target.value) {
                  setQuickFilter('departure_date_' + e.target.value);
                } else {
                  setQuickFilter('confirmed_bookings');
                }
              }}
              className="w-full h-8 px-2 bg-white border border-slate-200 rounded text-xs outline-none text-slate-600"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Booking Status</label>
            <select
              value={selectedStatuses[0] || 'all'}
              onChange={e => setSelectedStatuses(e.target.value === 'all' ? [] : [e.target.value])}
              className="w-full h-8 px-2 bg-white border border-slate-200 rounded text-xs outline-none"
            >
              <option value="all">All Status</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Unconfirmed">Unconfirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Status</label>
            <select
              onChange={e => {
                if (e.target.value !== 'all') {
                  setQuickFilter(e.target.value);
                } else {
                  setQuickFilter('confirmed_bookings');
                }
              }}
              className="w-full h-8 px-2 bg-white border border-slate-200 rounded text-xs outline-none"
            >
              <option value="all">All Payment</option>
              <option value="payment_pending">Pending</option>
              <option value="payment_overdue">Overdue</option>
              <option value="complete">Fully Paid</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned To</label>
            <select
              value={filterSalesAdmin}
              onChange={e => setFilterSalesAdmin(e.target.value)}
              className="w-full h-8 px-2 bg-white border border-slate-200 rounded text-xs outline-none"
            >
              <option value="all">All Members</option>
              {salesOptions.map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2 flex items-end gap-1.5">
            <button
              onClick={() => {
                setSearch("");
                setFilterTrip("all");
                setFilterSalesAdmin("all");
                setSelectedStatuses([]);
                setQuickFilter("confirmed_bookings");
              }}
              className="flex-1 h-8 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-xs transition-colors flex items-center justify-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="zoho-main flex flex-1 overflow-hidden">
        {/* FILTER PANEL */}


        {/* CONTENT & TABLE AREA */}
        <div className="zoho-content-left">
          {/* APPLIED FILTER INDICATOR */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">Showing:</span>
              <span className="text-slate-800 font-bold capitalize text-[12px]">
                {quickFilter.replace('_', ' ')}
              </span>
              {(selectedStatuses.length > 0 || filterTrip !== 'all' || filterSalesAdmin !== 'all' || search !== "") && (
                <span className="text-slate-400">|</span>
              )}
              {selectedStatuses.length > 0 && (
                <span className="bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                  Statuses: {selectedStatuses.join(', ')}
                </span>
              )}
              {filterTrip !== 'all' && (
                <span className="bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                  Trip: {filterTrip}
                </span>
              )}
              {filterSalesAdmin !== 'all' && (
                <span className="bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                  Executive: {filterSalesAdmin}
                </span>
              )}
              {search !== "" && (
                <span className="bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px] truncate max-w-[120px]">
                  Query: "{search}"
                </span>
              )}
            </div>
            {(search !== "" || filterTrip !== 'all' || filterSalesAdmin !== 'all' || selectedStatuses.length > 0 || quickFilter !== 'confirmed_bookings') && (
              <button onClick={clearFilters} className="text-orange-600 hover:text-orange-700 font-bold text-[11px] hover:underline flex items-center gap-0.5">
                [Clear Filters]
              </button>
            )}
          </div>

          <div className="zoho-table-area">
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 py-10 font-bold">
                <RotateCw className="w-5 h-5 animate-spin mr-2" /> Loading Bookings...
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12 text-center">
                <Users className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="font-bold text-slate-700 text-sm mb-1">No Reservations Found</h3>
                <p className="text-slate-400 text-xs max-w-sm">No reservations fit the selected criteria.</p>
              </div>
            ) : (
              <div className="zoho-table-wrapper">
                <table className="zoho-table">
                  <thead>
                    <tr>
                      <th className="zoho-th-checkbox">
                        <input 
                          type="checkbox" 
                          className="checkbox"
                          checked={selectedIds.length === filteredBookings.length && filteredBookings.length > 0} 
                          onChange={selectAll} 
                        />
                      </th>
                      <th className="zoho-th-priority"></th>
                      <th className="col-customer">Customer</th>
                      <th className="col-phone">Phone</th>
                      <th className="col-trip">Trip Code</th>
                      <th className="col-departure">Departure</th>
                      <th className="col-days">Days</th>
                      <th className="col-pass">Pass.</th>
                      <th className="col-exec">Executive</th>
                      <th className="col-package">Package</th>
                      <th className="col-balance text-right pr-4">Balance</th>
                      <th className="col-received text-right pr-4">Received</th>
                      <th className="col-progress text-center">Progress</th>
                      <th className="col-next text-center">Next Action</th>
                      <th className="col-status text-center">Status</th>
                      <th className="col-activity text-center">Last Activity</th>
                      <th className="col-actions text-left pl-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map(b => {
                      const isSelected = selectedIds.includes(b.id);
                      const priority = getPriority(b);
                      const days = getDays(b);
                      const progress = getProgress(b);
                      const nextAction = getNextAction(b);
                      const flowStatus = getFlowStatus(b);
                      const activityTime = getActivityTime(b);
                      const meta = getBookingMetaData(b);

                      const role = (currentAdmin?.role || 'admin').toLowerCase();
                      const showPayment = ['admin', 'superadmin', 'senior', 'sales', 'accounts'].includes(role);
                      const showPassengers = ['admin', 'superadmin', 'senior', 'sales', 'operations'].includes(role);
                      const showDocuments = ['admin', 'superadmin', 'senior', 'operations', 'accounts'].includes(role);
                      const showTicketing = ['admin', 'superadmin', 'senior', 'sales', 'operations'].includes(role);
                      const showOperations = ['admin', 'superadmin', 'senior', 'operations'].includes(role);
                      const showChecklist = ['admin', 'superadmin', 'senior', 'operations'].includes(role);
                      const showNotes = true;

                      let paymentDot: 'red' | 'amber' | undefined = undefined;
                      if (b.remainingAmount > 0 && b.paymentStatus !== 'Paid') {
                        const isOverdue = b.departureDate && (new Date(b.departureDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) <= 3;
                        paymentDot = isOverdue ? 'red' : 'amber';
                      }

                      let passengersDot: 'amber' | undefined = undefined;
                      if (!b.numberOfTravelers || b.numberOfTravelers === 0) {
                        passengersDot = 'amber';
                      }

                      let documentsDot: 'red' | undefined = undefined;
                      if (!b.isVerified) {
                        documentsDot = 'red';
                      }

                      let ticketingDot: 'amber' | undefined = undefined;
                      if (b.trainTicketStatus === 'Pending' || b.trainTicketStatus === 'Waitlisted') {
                        ticketingDot = 'amber';
                      }

                      let operationsDot: 'red' | undefined = undefined;
                      if (b.status === 'confirmed' && progress < 85) {
                        operationsDot = 'red';
                      }

                      let checklistDot: 'green' | undefined = undefined;
                      if (progress === 100) {
                        checklistDot = 'green';
                      }

                      let notesDot: 'blue' | undefined = undefined;
                      if (b.notes?.includes('[Task Assigned')) {
                        notesDot = 'blue';
                      }

                      return (
                        <tr 
                          key={b.id} 
                          className={cn(isSelected && "selected")} 
                          onClick={() => setPreviewTarget(b)}
                        >
                          <td className="zoho-td-checkbox" onClick={e => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              className="checkbox" 
                              checked={isSelected}
                              onChange={() => toggleSelect(b.id)}
                            />
                          </td>
                          <td className={cn(
                            "zoho-td-priority",
                            (b.status === 'confirmed' && progress < 85) || (b.remainingAmount > 0 && b.departureDate && (new Date(b.departureDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) <= 3) ? 'bg-[#dc2626]' :
                            b.status === 'pending' ? 'bg-[#d97706]' :
                            b.status === 'confirmed' && progress < 100 ? 'bg-[#2563eb]' :
                            progress === 100 ? 'bg-[#16a34a]' : 'bg-[#94a3b8]'
                          )} onClick={e => e.stopPropagation()} />
                          <td className="zoho-customer col-customer truncate" title={b.fullName}>{b.fullName}</td>
                          <td className="zoho-phone col-phone truncate" title={b.mobile}>{b.mobile}</td>
                          <td className="col-trip truncate" title={b.tripName || b.tripId}>{b.tripId}</td>
                          <td className="col-departure">{safeFormatDate(b.departureDate, { day: '2-digit', month: 'short' }, 'No Dep')}</td>
                          <td className="col-days">{days}d</td>
                          <td className="col-pass font-bold">{b.numberOfTravelers || 1}</td>
                          <td className="col-exec truncate" title={meta.bookedBy}>{meta.bookedBy}</td>
                          <td className="col-package">{b.trainClass || 'Sleeper'}</td>
                          <td className="zoho-balance font-mono col-balance text-right pr-4">₹{Number(b.remainingAmount || 0).toLocaleString('en-IN')}</td>
                          <td className="zoho-received font-mono col-received text-right pr-4">₹{Number(b.advancePaid || 0).toLocaleString('en-IN')}</td>
                          <td className="col-progress">
                            <div className="zoho-progress-container">
                              <div className="zoho-progress-bar">
                                <div className="zoho-progress-fill" style={{ width: `${progress}%` }} />
                              </div>
                               <div className="zoho-progress-text">{progress}%</div>
                            </div>
                          </td>
                          <td className="col-next truncate" title={nextAction}>
                            <span className="zoho-next-action">{nextAction}</span>
                          </td>
                          <td className="col-status text-center">
                            <span className={cn("zoho-status-badge px-2 py-0.5 rounded-full text-[10px] font-bold border", 
                              flowStatus === 'Confirmed' ? "bg-green-50 text-green-700 border-green-200" :
                              flowStatus === 'Completed' ? "bg-teal-50 text-teal-700 border-teal-200" :
                              flowStatus === 'Cancelled' ? "bg-red-50 text-red-700 border-red-200" :
                              "bg-amber-50 text-amber-700 border-amber-200"
                            )}>
                              {flowStatus}
                            </span>
                          </td>
                          <td className="col-activity text-center truncate" title={activityTime}>{activityTime}</td>
                          <td className="col-actions" onClick={e => e.stopPropagation()}>
                             <div className="flex items-center gap-1 justify-start pl-1">
                               {showPayment && (
                                 <button 
                                   className={cn(
                                     "relative w-[26px] h-[26px] rounded border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-all",
                                     paymentDot ? "text-amber-600 hover:text-amber-700" : "text-slate-500 hover:text-slate-800"
                                   )}
                                   title={paymentDot === 'red' ? "Payment Overdue (Red Indicator)" : "Payment Details"}
                                   onClick={() => openBookingDetails(b, 'payments')}
                                 >
                                   <CreditCard className="w-3 h-3" />
                                   {paymentDot && (
                                     <span className={cn(
                                       "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white",
                                       paymentDot === 'red' ? 'bg-[#dc2626]' : 'bg-[#d97706]'
                                     )} />
                                   )}
                                 </button>
                               )}
                               {showPassengers && (
                                 <button 
                                   className="relative w-[26px] h-[26px] rounded border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-all text-slate-500 hover:text-slate-800"
                                   title="Passenger Manifest"
                                   onClick={() => openBookingDetails(b, 'passengers')}
                                 >
                                   <Users className="w-3 h-3" />
                                   {passengersDot && (
                                     <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white bg-[#d97706]" />
                                   )}
                                 </button>
                               )}
                               {showDocuments && (
                                 <button 
                                   className="relative w-[26px] h-[26px] rounded border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-all text-slate-500 hover:text-slate-800"
                                   title="Files & Documents"
                                   onClick={() => openBookingDetails(b, 'files')}
                                 >
                                   <FileText className="w-3 h-3" />
                                   {documentsDot && (
                                     <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white bg-[#dc2626]" />
                                   )}
                                 </button>
                               )}
                               {showTicketing && (
                                 <button 
                                   className="relative w-[26px] h-[26px] rounded border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-all text-slate-500 hover:text-slate-800"
                                   title="Train Tickets"
                                   onClick={() => openBookingDetails(b, 'ticketing')}
                                 >
                                   <Train className="w-3 h-3" />
                                   {ticketingDot && (
                                     <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white bg-[#d97706]" />
                                   )}
                                 </button>
                               )}
                               {showOperations && (
                                 <button 
                                   className="relative w-[26px] h-[26px] rounded border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-all text-slate-500 hover:text-slate-800"
                                   title="Operations & Tasks"
                                   onClick={() => openBookingDetails(b, 'operations')}
                                 >
                                   <CheckSquare className="w-3 h-3" />
                                   {operationsDot && (
                                     <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white bg-[#dc2626]" />
                                   )}
                                 </button>
                               )}
                               {showChecklist && (
                                 <button 
                                   className="relative w-[26px] h-[26px] rounded border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-all text-slate-500 hover:text-slate-800"
                                   title="Checklist / Departure Readiness"
                                   onClick={() => openBookingDetails(b, 'verification')}
                                 >
                                   <ClipboardList className="w-3 h-3" />
                                   {checklistDot && (
                                     <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white bg-[#16a34a]" />
                                   )}
                                 </button>
                               )}
                               {showNotes && (
                                 <button 
                                   className="relative w-[26px] h-[26px] rounded border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-all text-slate-500 hover:text-slate-800"
                                   title="Notes & Activities"
                                   onClick={() => openBookingDetails(b, 'notes')}
                                 >
                                   <MessageSquare className="w-3 h-3" />
                                   {notesDot && (
                                     <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white bg-[#2563eb]" />
                                   )}
                                 </button>
                               )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2.5 bg-slate-50 text-xs shrink-0 font-semibold">
              <p className="text-slate-555">
                Showing {totalCount === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount} reservations
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none"
                  >
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setPage(p => Math.max(1, p - 1))} 
                    disabled={page <= 1}
                    className="h-8 w-8 rounded border-slate-200 hover:bg-slate-50 bg-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                    disabled={page >= totalPages}
                    className="h-8 w-8 rounded border-slate-200 hover:bg-slate-50 bg-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* BULK ACTIONS DRAWER */}
          <div className={cn("zoho-bulk-actions", selectedIds.length > 0 && "visible")}>
            <span className="font-bold text-white mr-4">{selectedIds.length} Selected</span>
            <button className="zoho-btn bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs py-1 px-3" onClick={() => handleBulkAction('assign')}>Assign Executive</button>
            <button className="zoho-btn bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs py-1 px-3" onClick={() => handleBulkAction('reminder')}>Send Reminder</button>
            <button className="zoho-btn bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs py-1 px-3" onClick={() => handleBulkAction('link')}>Payment Link</button>
            <button className="zoho-btn bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs py-1 px-3" onClick={() => handleBulkAction('assign_task')}>Assign Task</button>
            <button className="zoho-btn bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs py-1 px-3" onClick={() => handleBulkAction('mark_complete')}>Mark Complete</button>
          </div>
        </div>
      </div>

      {/* PREVIEW DRAWER SLIDE-OUT */}
      {previewTarget && (
        <>
          <div className="zoho-preview-overlay" onClick={() => setPreviewTarget(null)} />
          <div className={cn("zoho-preview-panel", previewTarget && "active")}>
            <div className="zoho-preview-header">
              <div className="zoho-preview-title">#{previewTarget.bookingId} - {previewTarget.fullName}</div>
              <button className="zoho-preview-close" onClick={() => setPreviewTarget(null)}>✕</button>
            </div>
            <div className="zoho-preview-body">
              <div className="zoho-preview-section">
                <div className="zoho-preview-section-title">Customer</div>
                <div className="zoho-preview-row">
                  <span className="zoho-preview-label">Name</span>
                  <span className="zoho-preview-value">{previewTarget.fullName}</span>
                </div>
                <div className="zoho-preview-row">
                  <span className="zoho-preview-label">Phone</span>
                  <span className="zoho-preview-value font-mono">{previewTarget.mobile}</span>
                </div>
                <div className="zoho-preview-row">
                  <span className="zoho-preview-label">Email</span>
                  <span className="zoho-preview-value font-mono">{previewTarget.email || 'no email'}</span>
                </div>
                <div className="zoho-preview-row">
                  <span className="zoho-preview-label">Salesperson</span>
                  <span className="zoho-preview-value">{getBookingMetaData(previewTarget).bookedBy}</span>
                </div>
              </div>

              <div className="zoho-preview-section">
                <div className="zoho-preview-section-title">Trip Details</div>
                <div className="zoho-preview-row">
                  <span className="zoho-preview-label">Trip</span>
                  <span className="zoho-preview-value">{previewTarget.tripName || previewTarget.tripId}</span>
                </div>
                <div className="zoho-preview-row">
                  <span className="zoho-preview-label">Departure</span>
                  <span className="zoho-preview-value">{safeFormatDate(previewTarget.departureDate, { day: '2-digit', month: 'short', year: 'numeric' }, 'Not Scheduled')}</span>
                </div>
                <div className="zoho-preview-row">
                  <span className="zoho-preview-label">Passengers</span>
                  <span className="zoho-preview-value">{previewTarget.numberOfTravelers || 1} pax</span>
                </div>
                <div className="zoho-preview-row">
                  <span className="zoho-preview-label">Package Option</span>
                  <span className="zoho-preview-value">{previewTarget.trainClass || 'Sleeper'}</span>
                </div>
              </div>

              <div className="zoho-preview-section">
                <div className="zoho-preview-section-title">Payment Summary</div>
                <div className="zoho-preview-row">
                  <span className="zoho-preview-label">Total Amount</span>
                  <span className="zoho-preview-value">₹{Number(previewTarget.totalAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="zoho-preview-row">
                  <span className="zoho-preview-label">Received</span>
                  <span className="zoho-preview-value text-emerald-600">₹{Number(previewTarget.advancePaid || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="zoho-preview-row">
                  <span className="zoho-preview-label">Pending</span>
                  <span className="zoho-preview-value text-rose-600">₹{Number(previewTarget.remainingAmount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="zoho-preview-section">
                <div className="zoho-preview-section-title">Status</div>
                <div className="zoho-preview-row">
                  <span className="zoho-preview-label">Booking status</span>
                  <span className="zoho-preview-value uppercase">{getFlowStatus(previewTarget)}</span>
                </div>
                <div className="zoho-preview-row">
                  <span className="zoho-preview-label">Next Action</span>
                  <span className="zoho-preview-value text-blue-600">{getNextAction(previewTarget)}</span>
                </div>
              </div>
            </div>
            <div className="zoho-preview-actions">
              <button 
                className="zoho-btn zoho-btn-primary w-full justify-center py-2 h-9 text-xs" 
                onClick={() => { setDetailsTarget(previewTarget); setPreviewTarget(null); }}
              >
                Open Full Workspace
              </button>
            </div>
          </div>
        </>
      )}

      {/* Trip & Confirm modals */}
      <TripManager open={showTrips} onClose={() => setShowTrips(false)} onRefresh={fetchAll} />
      <ConfirmModal booking={confirmTarget} trips={trips} onClose={() => setConfirmTarget(null)} onDone={() => { setConfirmTarget(null); fetchAll(); }} />
      
      {/* BULK ACTIONS MODAL */}
      {bulkModalAction && (
        <Dialog open={!!bulkModalAction} onOpenChange={v => !v && setBulkModalAction(null)}>
          <DialogContent className="sm:max-w-[420px] p-0 border border-slate-200 rounded-lg overflow-hidden shadow-premium bg-white">
            <DialogHeader className="bg-slate-900 px-4 py-3 text-white">
              <DialogTitle className="text-xs font-bold uppercase tracking-wider text-white">
                {bulkModalAction === 'assign' && 'Assign Executive'}
                {bulkModalAction === 'reminder' && 'Send Reminders'}
                {bulkModalAction === 'link' && 'Generate Payment Links'}
                {bulkModalAction === 'assign_task' && 'Assign Tasks'}
                {bulkModalAction === 'mark_complete' && 'Mark as Complete'}
              </DialogTitle>
              <DialogDescription className="sr-only">Bulk operations for selected bookings.</DialogDescription>
            </DialogHeader>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-500 font-semibold">
                You have selected <span className="font-bold text-slate-800">{selectedIds.length}</span> bookings to update.
              </p>

              {bulkModalAction === 'assign' && (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase text-slate-400">Select Executive / Salesperson</label>
                  <Select value={bulkSalesperson} onValueChange={setBulkSalesperson}>
                    <SelectTrigger className="h-9 text-xs rounded bg-white"><SelectValue placeholder="Choose salesperson..." /></SelectTrigger>
                    <SelectContent>
                      {salesOptions.map(id => (
                        <SelectItem key={id} value={id} className="text-xs">{id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {bulkModalAction === 'reminder' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400">Reminder Channel</label>
                    <Select value={bulkReminderChannel} onValueChange={setBulkReminderChannel}>
                      <SelectTrigger className="h-9 text-xs rounded bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WhatsApp" className="text-xs">WhatsApp Notification</SelectItem>
                        <SelectItem value="Email" className="text-xs">Email Reminder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400">Custom message notes (Optional)</label>
                    <textarea 
                      className="w-full min-h-[60px] p-2 bg-white border border-slate-200 rounded text-xs outline-none"
                      placeholder="Type custom note to attach to the template..."
                      value={bulkReminderMessage}
                      onChange={e => setBulkReminderMessage(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {bulkModalAction === 'link' && (
                <div className="bg-slate-55 p-3 rounded border border-slate-100/80 text-[11px] leading-relaxed text-slate-600">
                  This will generate and trigger automated billing invoice payment links for the selected reservations, delivering them to the primary passenger's email address.
                </div>
              )}

              {bulkModalAction === 'assign_task' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400">Task Title / Description</label>
                    <Input 
                      value={bulkTaskTitle} 
                      onChange={e => setBulkTaskTitle(e.target.value)} 
                      placeholder="e.g. Call client for train tickets preference"
                      className="h-9 text-xs rounded bg-white" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400">Assign to Colleague / Executive</label>
                    <Select value={bulkTaskAssignee} onValueChange={setBulkTaskAssignee}>
                      <SelectTrigger className="h-9 text-xs rounded bg-white"><SelectValue placeholder="Select colleague..." /></SelectTrigger>
                      <SelectContent>
                        {salesOptions.map(id => (
                          <SelectItem key={id} value={id} className="text-xs">{id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-400">Due Date</label>
                      <Input 
                        type="date"
                        value={bulkTaskDueDate} 
                        onChange={e => setBulkTaskDueDate(e.target.value)} 
                        className="h-9 text-xs rounded bg-white font-mono" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-400">Priority</label>
                      <Select value={bulkTaskPriority} onValueChange={setBulkTaskPriority}>
                        <SelectTrigger className="h-9 text-xs rounded bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low" className="text-xs">Low</SelectItem>
                          <SelectItem value="Medium" className="text-xs">Medium</SelectItem>
                          <SelectItem value="High" className="text-xs">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {bulkModalAction === 'mark_complete' && (
                <div className="bg-slate-55 p-3 rounded border border-slate-100/80 text-[11px] leading-relaxed text-slate-600">
                  Are you sure you want to mark all {selectedIds.length} selected bookings as <span className="text-green-600 font-bold">CONFIRMED</span> and set their payment status to <span className="text-green-600 font-bold">PAID</span>?
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={executeBulkAction} 
                  disabled={bulkProcessing}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold h-9 rounded text-xs"
                >
                  {bulkProcessing ? 'Processing...' : 'Confirm Action'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setBulkModalAction(null)}
                  disabled={bulkProcessing}
                  className="h-9 rounded text-xs border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {editTarget && (
        <Dialog open={!!editTarget} onOpenChange={v => !v && setEditTarget(null)}>
          <DialogContent className="sm:max-w-[460px] p-0 border border-slate-200 rounded-lg overflow-hidden shadow-luxury bg-white">
            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900">Edit Reservation</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Ref: {editTarget.bookingId}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                  <Input value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} className="h-8 text-xs rounded bg-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Mobile</label>
                  <Input value={editForm.mobile} onChange={e => setEditForm({...editForm, mobile: e.target.value})} className="h-8 text-xs rounded font-mono bg-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Age</label>
                  <Input type="number" value={editForm.age} onChange={e => setEditForm({...editForm, age: e.target.value})} className="h-8 text-xs rounded bg-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Gender</label>
                  <Select value={editForm.gender} onValueChange={v => setEditForm({...editForm, gender: v})}>
                    <SelectTrigger className="h-8 text-xs rounded bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male" className="text-xs">Male</SelectItem>
                      <SelectItem value="Female" className="text-xs">Female</SelectItem>
                      <SelectItem value="Other" className="text-xs">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1">
                   <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Email</label>
                   <Input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="h-8 text-xs rounded font-mono bg-white" />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button onClick={saveEdit} className="w-full bg-slate-900 hover:bg-slate-800 text-white h-9 rounded text-xs font-bold shadow-sm">
                  Update Reservation
                </Button>
                <Button variant="ghost" onClick={() => setEditTarget(null)} className="w-full h-8 rounded text-xs font-medium text-slate-450 hover:text-slate-800">
                  Discard Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Simple Helper
function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
      <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.553.553 0 0 1-1.1 0L7.1 4.995z"/>
    </svg>
  );
}
