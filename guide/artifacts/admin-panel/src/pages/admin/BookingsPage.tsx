import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Copy, Trash2, CheckCircle, Clock, Filter, X, Link2, Users, ChevronDown, Edit, Pencil, FileDown, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bookingsService } from "@/services/bookings.service";
import BookingDetailsView from "@/components/admin/BookingDetailsView";
import type { Booking, BookingTrip } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

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
      <DialogContent className="sm:max-w-[500px] p-0 border border-slate-200 rounded-lg overflow-hidden shadow-premium">
        <DialogHeader className="bg-slate-900 px-4 py-3 text-white">
          <DialogTitle className="text-sm font-bold uppercase tracking-wider">Trip Manager</DialogTitle>
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
              <div key={t.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200/60 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary text-[10px]">{t.tripCode}</span>
                  <span className="font-medium text-slate-700">{t.tripName}</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded font-mono">₹{t.price?.toLocaleString('en-IN') || 0}</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" className="text-blue-500 h-7 w-7 p-0" onClick={() => startEdit(t)} title="Edit trip">
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-slate-500 h-7 w-7 p-0" onClick={() => copyLink(t.formLink)} title="Copy form link">
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (booking) {
      setEmail(booking.email || "");
      const trip = trips.find(t => t.tripCode === booking.tripId);
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
      <DialogContent className="sm:max-w-[420px] p-0 border border-slate-200 rounded-lg overflow-hidden shadow-premium">
        <DialogHeader className="bg-emerald-600 px-4 py-3 text-white">
          <DialogTitle className="text-xs font-bold uppercase tracking-wider">Confirm Booking</DialogTitle>
          <DialogDescription className="sr-only">Confirm the booking details and payments.</DialogDescription>
        </DialogHeader>
        <div className="p-4 space-y-3.5 text-xs">
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200/60">
            <p className="font-bold text-slate-800">{booking?.fullName || "No Name"}</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{booking?.bookingId} · {booking?.tripId} · {booking?.mobile} · {booking?.email || "No Email"}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-400">Total Amount *</label>
              <Input type="number" value={total} onChange={e => setTotal(e.target.value)} placeholder="₹" className="font-bold font-mono h-8 text-xs rounded" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-400">Advance Paid</label>
              <Input type="number" value={advance} onChange={e => setAdvance(e.target.value)} placeholder="₹" className="font-bold font-mono text-emerald-600 h-8 text-xs rounded" />
            </div>
          </div>
          <div className="flex items-center justify-between bg-red-50/50 px-3 py-2 rounded border border-red-150">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Remaining Balance</span>
            <span className="font-bold font-mono text-red-700">₹{rem.toLocaleString('en-IN')}</span>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase text-slate-400">Payment Mode</label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="h-8 text-xs rounded"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="UPI" className="text-xs">UPI</SelectItem>
                <SelectItem value="Cash" className="text-xs">Cash</SelectItem>
                <SelectItem value="Bank Transfer" className="text-xs">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase text-slate-400">Customer Email (For confirmation)</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="customer@example.com" className="h-8 text-xs rounded" />
          </div>
          <Button onClick={handleConfirm} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider h-9 rounded text-[10px] mt-2 shadow-sm">
            {saving ? "Processing..." : "Confirm Booking"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── CUSTOM ACCORDION FILTER COMPONENT ──
interface AccordionSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}
function AccordionSection({ title, isOpen, onToggle, children }: AccordionSectionProps) {
  return (
    <div className="border-b border-slate-200/70 py-1.5">
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between py-1.5 px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-50/50 rounded transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <span className="text-[8px] text-slate-400 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
          {title}
        </span>
      </button>
      <div 
        className="overflow-hidden transition-[max-height,opacity] duration-200 ease-in-out" 
        style={{ 
          maxHeight: isOpen ? '300px' : '0px', 
          opacity: isOpen ? 1 : 0,
          marginTop: isOpen ? '4px' : '0px'
        }}
      >
        <div className="px-2 pb-2 pt-0.5 space-y-1.5">
          {children}
        </div>
      </div>
    </div>
  );
}

// Booking source helper for list + details view
const getBookingMetaData = (booking: Booking) => {
  const salesAdminId = (booking as any).salesAdminId as string | undefined;
  const link = (booking as any).sourceBookingLink as
    | { tokenPrefix?: string | null; id?: string | null; shareUrl?: string | null }
    | undefined;

  let bookedBy = salesAdminId ? `Sales ${salesAdminId}` : "Website / Unknown Sales";
  let source = link?.tokenPrefix ? `Booking Link #${link.tokenPrefix}` : "Website / Inquiry";

  // Keep compatibility with legacy notes patterns if present
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

// ── MAIN PAGE ──
export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trips, setTrips] = useState<BookingTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'confirmed'>('pending');
  const [search, setSearch] = useState("");
  const [filterTrip, setFilterTrip] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [filterSalesAdmin, setFilterSalesAdmin] = useState("all");
  const [bookingStart, setBookingStart] = useState("");
  const [bookingEnd, setBookingEnd] = useState("");
  const [depStart, setDepStart] = useState("");
  const [depEnd, setDepEnd] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [showTrips, setShowTrips] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Booking | null>(null);
  const [editTarget, setEditTarget] = useState<Booking | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  
  // Custom states added for redesign
  const [balanceOnly, setBalanceOnly] = useState(false);
  const [activePreset, setActivePreset] = useState<'all' | 'due' | 'unconfirmed'>('all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    quick: true,
    search: true,
    trips: true,
    dates: false,
    depDates: false,
    status: true,
    paymentStatus: true,
    source: false,
    collections: false,
    language: false,
    paymentType: false,
    channel: false,
    agent: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [b, t] = await Promise.all([
        bookingsService.getAll().catch(err => { console.error("Bookings failed", err); return []; }),
        bookingsService.getTrips().catch(err => { console.error("Trips failed", err); return []; })
      ]);
      setBookings(Array.isArray(b) ? b : []); 
      setTrips(Array.isArray(t) ? t : []);
    } catch (err) {
      console.error("🔥 Critical fetch error:", err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchAll(); }, []);

  // Keep detailsTarget up-to-date with latest bookings list
  useEffect(() => {
    if (detailsTarget) {
      const updated = bookings.find(b => b.id === detailsTarget.id);
      if (updated) {
        setDetailsTarget(updated);
      }
    }
  }, [bookings, detailsTarget?.id]);

  const filtered = bookings.filter(b => {
    // Keep existing "pending vs confirmed" tabs, but include cancelled in the non-confirmed tab.
    if (tab === 'confirmed') {
      if (b.status !== 'confirmed') return false;
    } else {
      if (b.status === 'confirmed') return false;
    }
    if (balanceOnly && (b.remainingAmount || 0) <= 0) return false;
    if (filterTrip !== 'all' && b.tripId !== filterTrip) return false;
    if (filterSalesAdmin !== 'all' && String((b as any).salesAdminId || '') !== filterSalesAdmin) return false;
    if (statusFilter !== 'all' && b.paymentStatus?.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (paymentStatusFilter !== 'all' && (b.payment_status || 'pending').toLowerCase() !== paymentStatusFilter.toLowerCase()) return false;
    if (tab === 'confirmed' && filterPayment !== 'all' && b.paymentStatus?.toLowerCase() !== filterPayment) return false;
    if (search) {
      const s = search.toLowerCase();
      const match = b.fullName?.toLowerCase().includes(s) || 
                    b.mobile?.includes(s) || 
                    b.bookingId?.toLowerCase().includes(s) ||
                    b.email?.toLowerCase().includes(s);
      if (!match) return false;
    }
    if (bookingStart || bookingEnd) {
      const bDate = new Date(b.createdAt);
      if (bookingStart && bDate < new Date(bookingStart)) return false;
      if (bookingEnd) {
        const end = new Date(bookingEnd);
        end.setHours(23, 59, 59, 999);
        if (bDate > end) return false;
      }
    }
    if (depStart || depEnd) {
      if (!b.departureDate) return false;
      const dDate = new Date(b.departureDate);
      if (depStart && dDate < new Date(depStart)) return false;
      if (depEnd) {
        const end = new Date(depEnd);
        end.setHours(23, 59, 59, 999);
        if (dDate > end) return false;
      }
    }
    return true;
  });

  const salesOptions = useMemo(() => {
    return Array.from(
      new Set(
        bookings
          .map((b) => (b as any).salesAdminId)
          .filter((v) => typeof v === "string" && v.length > 0)
      )
    );
  }, [bookings]);

  const getFlowStatus = (b: any): 
    | "Inquiry"
    | "Pending Payment"
    | "Partially Paid"
    | "Confirmed"
    | "Cancelled"
    | "Expired" => {
    const expiresAt =
      b?.sourceMeta?.expiresAt ||
      b?.sourceBookingLink?.expiresAt ||
      null;
    const isExpired =
      expiresAt &&
      b?.status === "pending" &&
      new Date(expiresAt).getTime() < Date.now();

    if (b?.status === "cancelled") return "Cancelled";
    if (b?.status === "confirmed") return "Confirmed";
    if (isExpired) return "Expired";

    // Pending lifecycle
    const paymentStatus = (b?.paymentStatus || "").toString().toLowerCase();
    const advance = Number(b?.advancePaid || 0);
    if (paymentStatus === "partial") return "Partially Paid";
    if (paymentStatus === "pending" && advance <= 0) return "Inquiry";
    if (paymentStatus === "pending" && advance > 0) return "Pending Payment";
    if (paymentStatus === "paid") return "Pending Payment";
    return "Inquiry";
  };

  const { admin: currentAdmin } = useAuthStore();

  const canManageBooking = (b: any) => {
    if (!currentAdmin) return false;
    if (currentAdmin.role === "admin") return true;
    if (currentAdmin.role === "sales") return String(b?.salesAdminId || "") === String(currentAdmin.id || "");
    return false;
  };

  const openEdit = (b: Booking) => {
    setEditTarget(b);
    setEditForm({ 
      fullName: b.fullName, 
      mobile: b.mobile, 
      email: b.email || '', 
      age: b.age, 
      gender: b.gender, 
      tripId: b.tripId,
      trainClass: b.trainClass, 
      ticketStatus: b.ticketStatus, 
      roomType: b.roomType, 
      totalAmount: b.totalAmount, 
      advancePaid: b.advancePaid, 
      paymentMode: b.paymentMode, 
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
    setFilterTrip("all");
    setFilterPayment("all");
    setBookingStart("");
    setBookingEnd("");
    setDepStart("");
    setDepEnd("");
    setStatusFilter("all");
    setPaymentStatusFilter("all");
    setBalanceOnly(false);
    setActivePreset('all');
  };

  const setPreset = (preset: 'all' | 'due' | 'unconfirmed') => {
    clearFilters();
    setActivePreset(preset);
    if (preset === 'all') {
      setTab('confirmed');
    } else if (preset === 'due') {
      setTab('confirmed');
      setBalanceOnly(true);
    } else if (preset === 'unconfirmed') {
      setTab('pending');
    }
  };

  const handleQuickFilterChange = (filter: 'incomplete' | 'balance') => {
    if (filter === 'incomplete') {
      if (tab === 'pending') {
        // Toggle off: default to confirmed
        setTab('confirmed');
        setActivePreset('all');
      } else {
        setTab('pending');
        setBalanceOnly(false);
        setActivePreset('unconfirmed');
      }
    } else if (filter === 'balance') {
      if (tab === 'confirmed' && balanceOnly) {
        setBalanceOnly(false);
        setActivePreset('all');
      } else {
        setTab('confirmed');
        setBalanceOnly(true);
        setActivePreset('due');
      }
    }
  };

  // CSV Export function
  const handleExportCSV = () => {
    if (filtered.length === 0) return toast.error("No bookings to export");
    const headers = ["Booking ID", "Guest Name", "Email", "Mobile", "Expedition ID", "Total Price", "Advance Paid", "Balance Due", "Status", "Created Date"];
    const rows = filtered.map(b => [
      `"${b.bookingId}"`,
      `"${b.fullName}"`,
      `"${b.email || 'N/A'}"`,
      `"${b.mobile}"`,
      `"${b.tripId}"`,
      b.totalAmount || 0,
      b.advancePaid || 0,
      b.remainingAmount || 0,
      `"${b.status === 'confirmed' ? b.paymentStatus : 'Pending Confirmation'}"`,
      `"${new Date(b.createdAt).toLocaleDateString('en-IN')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bookings_${tab}_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filtered.length} bookings exported to CSV!`);
  };

  // Metrics for quick stats strip
  const totalAmountDue = bookings.reduce((sum, b) => sum + (b.remainingAmount || 0), 0);
  const totalPendingInquiries = bookings.filter(b => b.status === 'pending').length;
  const totalConfirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  if (detailsTarget) {
    return (
      <BookingDetailsView
        booking={detailsTarget}
        onBack={() => setDetailsTarget(null)}
        onRefresh={fetchAll}
        trips={trips}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-premium text-xs">
      
      {/* ─── Top Header Action Panel ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div className="space-y-1">
          <h1 className="admin-title">Bookings</h1>
          <p className="admin-body">Manage customer reservations, payments, and departures</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Button onClick={() => setShowTrips(true)} className="admin-button-outline">
            <Link2 className="w-4 h-4" /> Trips Manager
          </Button>
          <Button onClick={clearFilters} className="admin-button-secondary">
            Reset Filters
          </Button>
          <button 
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="md:hidden admin-button border border-slate-350 bg-white"
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      {/* ─── Quick Stats Strip ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 admin-card">
        <div className="space-y-1">
          <span className="admin-label block">Total Inquiries</span>
          <span className="text-[20px] font-medium tracking-tight text-slate-900">{bookings.length}</span>
        </div>
        <div className="border-l border-slate-200 pl-6 space-y-1">
          <span className="admin-label block">Confirmed Bookings</span>
          <span className="text-[20px] font-medium tracking-tight text-emerald-600">{totalConfirmedCount}</span>
        </div>
        <div className="border-l border-slate-200 pl-6 space-y-1">
          <span className="admin-label block">Pending Confirmation</span>
          <span className="text-[20px] font-medium tracking-tight text-amber-500">{totalPendingInquiries}</span>
        </div>
        <div className="border-l border-slate-200 pl-6 space-y-1">
          <span className="admin-label block">Balance Outstanding</span>
          <span className="text-[20px] font-medium tracking-tight text-rose-600 font-mono">₹{totalAmountDue.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* ─── Presets Row ─── */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200/50 px-4 py-2 rounded-xl text-xs text-slate-650 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="admin-label">Saved Presets:</span>
          <button 
            onClick={() => setPreset('all')} 
            className={cn("px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors font-medium text-xs", activePreset === 'all' && "bg-slate-950 border-slate-950 text-white hover:bg-slate-950")}
          >
            All Bookings
          </button>
          <button 
            onClick={() => setPreset('due')} 
            className={cn("px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors font-medium text-xs", activePreset === 'due' && "bg-slate-950 border-slate-950 text-white hover:bg-slate-950")}
          >
            Due Balance
          </button>
          <button 
            onClick={() => setPreset('unconfirmed')} 
            className={cn("px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors font-medium text-xs", activePreset === 'unconfirmed' && "bg-slate-950 border-slate-950 text-white hover:bg-slate-950")}
          >
            Pending Inquiry
          </button>
        </div>
        <div className="admin-label">
          Showing {filtered.length} of {bookings.length} reservations
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 items-start">
        
        {/* ─── Left Filters Sidebar ─── */}
        <div className={cn(
          "col-span-12 md:col-span-3 xl:col-span-2.5 bg-white border border-slate-200 rounded p-2.5 space-y-1.5 sticky top-[72px] self-start shadow-sm max-h-[82vh] overflow-y-auto no-scrollbar",
          mobileFiltersOpen ? "block" : "hidden md:block"
        )}>
          <div className="pb-1.5 border-b border-slate-200/80 px-2 flex justify-between items-center">
            <span className="font-bold text-[10px] uppercase text-slate-800 tracking-wider">Booking Filters</span>
            {mobileFiltersOpen && (
              <button onClick={() => setMobileFiltersOpen(false)} className="md:hidden text-slate-400 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <AccordionSection title="Quick Filters" isOpen={openSections.quick} onToggle={() => toggleSection('quick')}>
            <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer py-0.5">
              <input 
                type="checkbox" 
                checked={tab === 'pending'} 
                onChange={() => handleQuickFilterChange('incomplete')} 
                className="rounded border-slate-350 text-primary focus:ring-primary w-3.5 h-3.5" 
              />
              <span>Incomplete Form</span>
            </label>
            <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer py-0.5">
              <input 
                type="checkbox" 
                checked={tab === 'confirmed' && balanceOnly} 
                onChange={() => handleQuickFilterChange('balance')} 
                className="rounded border-slate-350 text-primary focus:ring-primary w-3.5 h-3.5" 
              />
              <span>Balance Payment</span>
            </label>
          </AccordionSection>

          <AccordionSection title="Search For A Booking" isOpen={openSections.search} onToggle={() => toggleSection('search')}>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text"
                placeholder="ID, name, phone, email"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-2.5 h-8 bg-slate-50 border border-slate-200/80 rounded text-[11px] font-medium focus-visible:ring-1 focus-visible:ring-slate-300 outline-none"
              />
            </div>
          </AccordionSection>

          <AccordionSection title="Booking Status" isOpen={openSections.status} onToggle={() => toggleSection('status')}>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-[11px] rounded bg-slate-50 border-slate-200/80 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Payments</SelectItem>
                <SelectItem value="paid" className="text-xs">Paid</SelectItem>
                <SelectItem value="partial" className="text-xs">Partial</SelectItem>
                <SelectItem value="pending" className="text-xs">Pending</SelectItem>
              </SelectContent>
            </Select>
          </AccordionSection>

          <AccordionSection title="Payment Status (UPI)" isOpen={openSections.paymentStatus} onToggle={() => toggleSection('paymentStatus')}>
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger className="h-8 text-[11px] rounded bg-slate-50 border-slate-200/80 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All (UPI)</SelectItem>
                <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                <SelectItem value="confirmed" className="text-xs">Confirmed</SelectItem>
                <SelectItem value="failed" className="text-xs">Failed</SelectItem>
              </SelectContent>
            </Select>
          </AccordionSection>

          <AccordionSection title="Expedition Trip" isOpen={openSections.trips} onToggle={() => toggleSection('trips')}>
            <Select value={filterTrip} onValueChange={setFilterTrip}>
              <SelectTrigger className="h-8 text-[11px] rounded bg-slate-50 border-slate-200/80 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Expeditions</SelectItem>
                {trips.map(t => (
                  <SelectItem key={t.id} value={t.tripCode} className="text-xs">{t.tripCode}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AccordionSection>

          <AccordionSection title="Booking Dates" isOpen={openSections.dates} onToggle={() => toggleSection('dates')}>
            <div className="space-y-1 mt-1">
              <input type="date" value={bookingStart} onChange={e => setBookingStart(e.target.value)} className="w-full h-8 px-2 bg-slate-50 border border-slate-200/80 rounded text-[11px] outline-none" />
              <input type="date" value={bookingEnd} onChange={e => setBookingEnd(e.target.value)} className="w-full h-8 px-2 bg-slate-50 border border-slate-200/80 rounded text-[11px] outline-none" />
            </div>
          </AccordionSection>

          <AccordionSection title="Departure Dates" isOpen={openSections.depDates} onToggle={() => toggleSection('depDates')}>
            <div className="space-y-1 mt-1">
              <input type="date" value={depStart} onChange={e => setDepStart(e.target.value)} className="w-full h-8 px-2 bg-slate-50 border border-slate-200/80 rounded text-[11px] outline-none" />
              <input type="date" value={depEnd} onChange={e => setDepEnd(e.target.value)} className="w-full h-8 px-2 bg-slate-50 border border-slate-200/80 rounded text-[11px] outline-none" />
            </div>
          </AccordionSection>

          {/* Visual matches to VacationLabs */}
          <AccordionSection title="Booking Source" isOpen={openSections.source} onToggle={() => toggleSection('source')}>
            <span className="text-[10px] text-slate-400 italic block py-0.5">Direct, Agent, Web Inquiry</span>
          </AccordionSection>

          <AccordionSection title="Collections" isOpen={openSections.collections} onToggle={() => toggleSection('collections')}>
            <span className="text-[10px] text-slate-400 italic block py-0.5">Himachal, Ladakh, Trekking</span>
          </AccordionSection>

          <AccordionSection title="Booking Language" isOpen={openSections.language} onToggle={() => toggleSection('language')}>
            <span className="text-[10px] text-slate-400 italic block py-0.5">English, Hindi</span>
          </AccordionSection>

          <AccordionSection title="Payment Type" isOpen={openSections.paymentType} onToggle={() => toggleSection('paymentType')}>
            <span className="text-[10px] text-slate-400 italic block py-0.5">UPI, Cash, Bank, Card</span>
          </AccordionSection>

          <AccordionSection title="Channel Type" isOpen={openSections.channel} onToggle={() => toggleSection('channel')}>
            <span className="text-[10px] text-slate-400 italic block py-0.5">B2C Portal, OTA, B2B Agent</span>
          </AccordionSection>

          <AccordionSection title="Search By Agent" isOpen={openSections.agent} onToggle={() => toggleSection('agent')}>
            <div className="pt-1 space-y-2">
              <Select value={filterSalesAdmin} onValueChange={setFilterSalesAdmin}>
                <SelectTrigger className="h-8 text-[11px] rounded bg-slate-50 border-slate-200/80 mt-1">
                  <SelectValue placeholder="All Sales" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All Sales
                  </SelectItem>
                  {salesOptions.length === 0 ? (
                    <SelectItem value="all" className="text-xs text-slate-400">
                      No agents yet
                    </SelectItem>
                  ) : (
                    salesOptions.map((id) => (
                      <SelectItem key={id} value={id} className="text-xs">
                        {id}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </AccordionSection>

          {/* Sidebar Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <button 
              onClick={() => setMobileFiltersOpen(false)}
              className="flex items-center justify-center gap-1.5 h-8 bg-slate-800 text-white font-bold uppercase text-[9px] tracking-wider rounded hover:bg-slate-700 transition-colors shadow-sm"
            >
              <Filter className="w-3 h-3" /> Filter
            </button>
            <button 
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-1.5 h-8 bg-white border border-slate-200 text-slate-700 font-bold uppercase text-[9px] tracking-wider rounded hover:bg-slate-50 transition-colors shadow-sm"
            >
              <FileDown className="w-3 h-3" /> CSV
            </button>
          </div>
        </div>

        {/* ─── Right Booking Table Panel ─── */}
        <div className="col-span-12 md:col-span-9 xl:col-span-9.5">
          
          {/* SKELETON LOADER */}
          {loading ? (
            <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
              <table className="w-full text-left table-striped">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-3 py-2">Tour details</th>
                    <th className="px-3 py-2">Contact details</th>
                    <th className="px-3 py-2 hidden lg:table-cell">Departure details</th>
                    <th className="px-3 py-2">UPI Reference</th>
                    <th className="px-3 py-2 text-right lg:text-left">Booking status</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-slate-100">
                      <td className="px-3 py-2.5">
                        <div className="h-3.5 bg-slate-100 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-slate-50 rounded w-1/2"></div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="h-3.5 bg-slate-100 rounded w-2/3 mb-1"></div>
                        <div className="h-3 bg-slate-50 rounded w-1/2"></div>
                      </td>
                      <td className="px-3 py-2.5 hidden lg:table-cell">
                        <div className="h-3.5 bg-slate-100 rounded w-1/2 mb-1"></div>
                        <div className="h-3 bg-slate-50 rounded w-1/3"></div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="h-3.5 bg-slate-100 rounded w-16 mb-1"></div>
                        <div className="h-3 bg-slate-50 rounded w-12"></div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="h-5 bg-slate-100 rounded w-24 ml-auto lg:ml-0"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : bookings.length === 0 ? (
            /* EMPTY STATE: NO BOOKINGS FOUND */
            <div className="bg-white border border-slate-200 rounded p-12 text-center shadow-sm">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-350 mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 mb-1">No Reservations Found</h3>
              <p className="text-slate-400 max-w-sm mx-auto text-[11px] mb-4">No guest bookings have been recorded in the travel CRM database yet.</p>
              <Button onClick={fetchAll} size="sm" className="bg-primary text-white font-bold text-[10px] uppercase h-8 rounded px-4">
                <RotateCw className="w-3.5 h-3.5 mr-1.5" /> Refresh List
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            /* EMPTY STATE: NO FILTERS MATCHED */
            <div className="bg-white border border-slate-200 rounded p-12 text-center shadow-sm">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-350 mb-3">
                <Filter className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 mb-1">No Filters Matched</h3>
              <p className="text-slate-400 max-w-sm mx-auto text-[11px] mb-4">No reservations match the currently selected filter values. Clear filters to see all.</p>
              <div className="flex justify-center gap-2">
                <Button onClick={clearFilters} variant="outline" size="sm" className="border-slate-200 text-[10px] uppercase font-bold h-8 rounded">
                  Clear Filters
                </Button>
                <Button onClick={fetchAll} variant="ghost" size="sm" className="text-slate-500 text-[10px] uppercase font-bold h-8 rounded">
                  Refresh
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="hidden md:block admin-card !p-0 overflow-hidden">
                <div className="responsive-table max-h-[75vh]">
                  <table className="w-full text-left table-striped border-collapse">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-150 z-10">
                      <tr className="text-xs font-semibold text-slate-500 tracking-tight">
                        <th className="px-4 py-3 font-semibold">Tour Details</th>
                        <th className="px-4 py-3 font-semibold">Contact Details</th>
                        <th className="px-4 py-3 font-semibold hidden lg:table-cell">Departure Details</th>
                        <th className="px-4 py-3 font-semibold">UPI Reference</th>
                        <th className="px-4 py-3 font-semibold text-right lg:text-left">Booking Status</th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map(b => {
                      const tripName = b.tripName || trips.find(t => t.tripCode === b.tripId)?.tripName || "Expedition Tour Package";
                      const meta = getBookingMetaData(b);
                      return (
                        <tr 
                          key={b.id} 
                          className="hover-actions cursor-pointer hover:bg-slate-50/70 transition-colors"
                          onClick={() => setDetailsTarget(b)}
                        >
                          {/* 1. TOUR DETAILS */}
                          <td className="px-3.5 py-2.5 align-top">
                            <div className="space-y-0.5 max-w-[280px]">
                              <p className="font-semibold text-rose-700 hover:underline text-xs leading-tight">
                                {b.tripId} - {tripName}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 flex-wrap">
                                <span className="font-mono bg-slate-100 text-slate-650 px-1 py-0.2 rounded font-bold">#{b.bookingId}</span>
                                <span>·</span>
                                <span>{new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                <span>at</span>
                                <span className="text-slate-400 font-mono">{new Date(b.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                              </div>
                              
                              {/* Extra departure details in table columns on tablet viewport */}
                              <div className="lg:hidden text-[10px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                                <span className="font-medium text-slate-600">Dep:</span>
                                <span>{b.departureDate ? new Date(b.departureDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'N/A'}</span>
                                <span>·</span>
                                <span className="flex items-center gap-0.5">👤 {b.numberOfTravelers || 1} Pax</span>
                              </div>
                            </div>
                          </td>

                          {/* 2. CONTACT DETAILS */}
                          <td className="px-3.5 py-2.5 align-top">
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-800 leading-tight">{b.fullName}</p>
                              <p className="text-[10px] text-slate-500 font-mono tracking-tight">{b.email || 'no-email@details.com'}</p>
                              <p className="text-[10px] text-slate-500 font-mono tracking-tight">{b.mobile}</p>
                              
                              {/* Booked By Info */}
                              <div className="pt-1.5 border-t border-slate-100 mt-1.5 space-y-0.5 text-[10.5px] text-slate-400">
                                <p className="leading-tight">
                                  Booked by: <span className="text-slate-600 font-semibold">{meta.bookedBy}</span>
                                </p>
                                <p className="text-[9.5px] leading-tight">
                                  Source: <span className="text-slate-500">{meta.source}</span>
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* 3. DEPARTURE DETAILS (Hidden on Tablet) */}
                          <td className="px-3.5 py-2.5 align-top hidden lg:table-cell">
                            <div className="space-y-0.5">
                              <p className="font-semibold text-slate-700">
                                {b.departureDate ? new Date(b.departureDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not Scheduled'}
                              </p>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                <Users className="w-3 h-3 text-slate-350" />
                                <span>{b.numberOfTravelers || 1} passenger{(b.numberOfTravelers || 1) > 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          </td>

                          {/* UPI Reference Column */}
                          <td className="px-3.5 py-2.5 align-top">
                            <div className="space-y-0.5">
                              {b.upi_reference ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-slate-700 font-medium bg-slate-100 px-1 py-0.2 rounded">{b.upi_reference}</span>
                                  <button onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(b.upi_reference || '');
                                    toast.success("UPI reference copied!");
                                  }} className="text-slate-400 hover:text-slate-650" title="Copy reference">
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 font-mono italic">No Ref</span>
                              )}
                              <div className="text-[10px] text-slate-400 italic uppercase">
                                {b.payment_method || 'upi'}
                              </div>
                            </div>
                          </td>

                          {/* 4. BOOKING STATUS & HOVER ACTIONS */}
                          <td className="px-3.5 py-2.5 align-top text-right lg:text-left">
                            <div className="flex flex-col lg:items-start items-end gap-1">
                              
                              {/* BADGES */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={cn("text-[8.5px] font-bold px-1.5 py-0.5 rounded-sm tracking-wide text-white uppercase", 
                                  getFlowStatus(b) === 'Confirmed'
                                    ? "bg-[#2f855a]"
                                    : getFlowStatus(b) === 'Cancelled'
                                      ? "bg-[#9b2c2c]"
                                      : getFlowStatus(b) === 'Expired'
                                        ? "bg-[#d97706]"
                                        : "bg-[#dd6b20]"
                                )}>
                                  {getFlowStatus(b)}
                                </span>
                                <span className={cn("text-[8.5px] font-bold px-1.5 py-0.5 rounded-sm tracking-wide text-white uppercase", 
                                  (b.payment_status || 'pending').toLowerCase() === 'confirmed'
                                    ? "bg-[#2f855a]"
                                    : (b.payment_status || 'pending').toLowerCase() === 'failed'
                                      ? "bg-[#9b2c2c]"
                                      : "bg-amber-500"
                                )}>
                                  UPI: {b.payment_status || 'pending'}
                                </span>
                                {getFlowStatus(b) === 'Confirmed' && (b.remainingAmount || 0) > 0 && (
                                  <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded-sm bg-[#9b2c2c] text-white font-mono flex items-center gap-0.5">
                                    ₹{Number(b.remainingAmount).toLocaleString('en-IN')} balance
                                    <span className="opacity-75 cursor-help pl-0.5" title="Outstanding balance due">?</span>
                                  </span>
                                )}
                                {getFlowStatus(b) === 'Confirmed' && (b.remainingAmount || 0) <= 0 && (
                                  <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-700 text-white font-mono uppercase">
                                    Paid
                                  </span>
                                )}
                              </div>

                              {/* HOVER ACTION BUTTONS */}
                              <div 
                                onClick={e => e.stopPropagation()} 
                                className="action-btn-group flex gap-1 mt-1 shrink-0 justify-end"
                              >
                                {['Inquiry', 'Pending Payment', 'Partially Paid'].includes(getFlowStatus(b)) && canManageBooking(b) && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => setConfirmTarget(b)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold h-6 px-2 rounded shrink-0 shadow-sm"
                                  >
                                    Confirm
                                  </Button>
                                )}
                                {(b.payment_status || 'pending').toLowerCase() !== 'confirmed' && canManageBooking(b) && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleConfirmPayment(b.id)}
                                    className="bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-bold h-6 px-2 rounded shrink-0 shadow-sm"
                                  >
                                    Confirm Payment
                                  </Button>
                                )}
                                {canManageBooking(b) && (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => openEdit(b)}
                                      className="h-6 w-6 rounded border border-slate-200/50 bg-slate-50/50 hover:bg-slate-100 text-slate-400 hover:text-slate-800"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => handleDelete(b.id)}
                                      className="h-6 w-6 rounded border border-slate-200/50 bg-rose-50/20 hover:bg-rose-100 hover:border-rose-200 text-rose-400 hover:text-rose-600"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </>
                                )}
                              </div>

                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

              {/* CARD LIST VIEW (Mobile Breakpoint) */}
              <div className="md:hidden space-y-2">
                {filtered.map(b => {
                  const tripName = b.tripName || trips.find(t => t.tripCode === b.tripId)?.tripName || "Expedition Tour Package";
                  const meta = getBookingMetaData(b);
                  return (
                    <div 
                      key={b.id} 
                      onClick={() => setDetailsTarget(b)} 
                      className="bg-white border border-slate-200 rounded p-2.5 space-y-2 hover:border-primary/40 cursor-pointer shadow-sm active:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-semibold text-rose-700 text-[10px] uppercase block leading-none mb-0.5">{b.tripId}</span>
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-1 leading-tight">{tripName}</h4>
                        </div>
                        <span className="font-mono text-[9px] bg-slate-100 text-slate-650 px-1 py-0.2 rounded shrink-0">#{b.bookingId}</span>
                      </div>
                      <div className="flex justify-between items-start text-[10px] gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-750 truncate">{b.fullName}</p>
                          <p className="text-slate-400 font-mono mt-0.2">{b.mobile}</p>
                          
                          {/* Mobile booked by details */}
                          <div className="text-[9px] text-slate-400 mt-1 space-y-0.2">
                            <p className="leading-tight">Booked by: <span className="text-slate-550 font-medium">{meta.bookedBy}</span></p>
                            <p className="leading-tight">Source: <span className="text-slate-450">{meta.source}</span></p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-slate-500 font-medium">{b.departureDate ? new Date(b.departureDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'No Dep'}</p>
                          <p className="text-slate-400">{b.numberOfTravelers || 1} Pax</p>
                        </div>
                      </div>
                      {b.upi_reference && (
                        <div className="text-[10px] text-slate-500 font-mono bg-slate-50 p-1 rounded">
                          UPI Ref: <span className="font-bold text-slate-700">{b.upi_reference}</span>
                        </div>
                      )}
                      <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={cn("text-[8.5px] font-bold px-1.5 py-0.5 rounded-sm tracking-wide text-white uppercase", 
                            getFlowStatus(b) === 'Confirmed'
                              ? "bg-[#2f855a]"
                              : getFlowStatus(b) === 'Cancelled'
                                ? "bg-[#9b2c2c]"
                                : getFlowStatus(b) === 'Expired'
                                  ? "bg-[#d97706]"
                                  : "bg-[#dd6b20]"
                          )}>
                            {getFlowStatus(b)}
                          </span>
                          <span className={cn("text-[8.5px] font-bold px-1.5 py-0.5 rounded-sm tracking-wide text-white uppercase", 
                            (b.payment_status || 'pending').toLowerCase() === 'confirmed'
                              ? "bg-[#2f855a]"
                              : (b.payment_status || 'pending').toLowerCase() === 'failed'
                                ? "bg-[#9b2c2c]"
                                : "bg-amber-500"
                          )}>
                            UPI: {b.payment_status || 'pending'}
                          </span>
                          {getFlowStatus(b) === 'Confirmed' && (b.remainingAmount || 0) > 0 && (
                            <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded-sm bg-[#9b2c2c] text-white font-mono">
                              ₹{Number(b.remainingAmount).toLocaleString('en-IN')} due
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1 flex-wrap" onClick={e => e.stopPropagation()}>
                          {['Inquiry', 'Pending Payment', 'Partially Paid'].includes(getFlowStatus(b)) && canManageBooking(b) && (
                            <button onClick={() => setConfirmTarget(b)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold h-6 px-2 rounded">Confirm</button>
                          )}
                          {(b.payment_status || 'pending').toLowerCase() !== 'confirmed' && canManageBooking(b) && (
                            <button onClick={() => handleConfirmPayment(b.id)} className="bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-bold h-6 px-2 rounded">Confirm Payment</button>
                          )}
                          {canManageBooking(b) && (
                            <>
                              <button onClick={() => openEdit(b)} className="text-slate-400 hover:text-slate-800 p-1 border border-slate-200/60 rounded bg-slate-50/50"><Pencil className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDelete(b.id)} className="text-rose-450 hover:text-rose-600 p-1 border border-slate-200/60 rounded bg-rose-50/20"><Trash2 className="w-3.5 h-3.5" /></button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

        </div>
      </div>

      {/* ─── Modals ─── */}
      <TripManager open={showTrips} onClose={() => setShowTrips(false)} onRefresh={fetchAll} />
      <ConfirmModal booking={confirmTarget} trips={trips} onClose={() => setConfirmTarget(null)} onDone={() => { setConfirmTarget(null); fetchAll(); }} />
      
      {editTarget && (
        <Dialog open={!!editTarget} onOpenChange={v => !v && setEditTarget(null)}>
          <DialogContent className="sm:max-w-[460px] p-0 border border-slate-200 rounded-lg overflow-hidden shadow-luxury">
            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900">Edit Reservation</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Ref: {editTarget.bookingId}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                  <Input value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} className="h-8 text-xs rounded" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Mobile</label>
                  <Input value={editForm.mobile} onChange={e => setEditForm({...editForm, mobile: e.target.value})} className="h-8 text-xs rounded font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Age</label>
                  <Input type="number" value={editForm.age} onChange={e => setEditForm({...editForm, age: e.target.value})} className="h-8 text-xs rounded" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Gender</label>
                  <Select value={editForm.gender} onValueChange={v => setEditForm({...editForm, gender: v})}>
                    <SelectTrigger className="h-8 text-xs rounded"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male" className="text-xs">Male</SelectItem>
                      <SelectItem value="Female" className="text-xs">Female</SelectItem>
                      <SelectItem value="Other" className="text-xs">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1">
                   <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Email</label>
                   <Input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="h-8 text-xs rounded font-mono" />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button onClick={saveEdit} className="w-full bg-slate-900 hover:bg-slate-800 text-white h-9 rounded text-xs font-bold shadow-sm">
                  Update Reservation
                </Button>
                <Button variant="ghost" onClick={() => setEditTarget(null)} className="w-full h-8 rounded text-xs font-medium text-slate-400 hover:text-slate-800">
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

