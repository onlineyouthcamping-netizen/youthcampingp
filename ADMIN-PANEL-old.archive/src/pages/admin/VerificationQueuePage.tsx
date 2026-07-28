import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, ChevronLeft, ChevronRight, RotateCw, CheckCircle2,
  XCircle, Clock, Eye, ShieldCheck,
  ArrowRightLeft, Check, X,
  MessageSquare, HelpCircle, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bookingVerificationService } from "@/services/bookingVerification.service";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import { cn, safeFormatDate } from "@/lib/utils";
import VerificationDetailsPanel from "@/components/admin/VerificationDetailsPanel";

// ── STATUS CONFIGURATION ──
const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  DRAFT:                { bg: "bg-slate-50",   text: "text-slate-655",    dot: "bg-slate-400",    label: "Draft" },
  PENDING_VERIFICATION: { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   label: "Pending Review" },
  CHANGES_REQUESTED:    { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500",    label: "Changes Requested" },
  VERIFIED:             { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Verified" },
  APPROVED:             { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Verified" },
  REJECTED:             { bg: "bg-red-50",     text: "text-red-650",     dot: "bg-red-550",     label: "Rejected" },
  ISSUED:               { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500",    label: "Issued" },
  PENDING:              { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-550",   label: "Pending" },
};

const TABS = [
  { key: "",                     label: "All" },
  { key: "PENDING_VERIFICATION", label: "Pending" },
  { key: "CHANGES_REQUESTED",    label: "Changes Requested" },
  { key: "VERIFIED",             label: "Verified" },
  { key: "REJECTED",             label: "Rejected" },
];

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400", label: status };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider border font-sans", s.bg === "bg-slate-50" ? "border-slate-200" : s.bg === "bg-amber-50" ? "border-amber-200" : s.bg === "bg-blue-50" ? "border-blue-200" : s.bg === "bg-emerald-50" ? "border-emerald-200" : "border-red-200", s.text)}>
      <span className={cn("w-1 h-1 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export default function VerificationQueuePage() {
  const { admin } = useAuthStore();

  const [allItems, setAllItems] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const LIMIT = 15;

  // Panel state
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const canVerify = admin?.role && ["superadmin", "admin", "BOOKING_VERIFIER", "operations"].includes(admin.role);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingVerificationService.getVerificationQueue({
        page,
        limit: LIMIT,
        status: activeTab || undefined,
      });

      const data = res.data || res;
      const rawItems = Array.isArray(data) ? data : data.items || data.verifications || [];
      setAllItems(rawItems);
      setItems(rawItems);
      const pg = data.pagination || data;
      setTotalPages(pg.totalPages || Math.ceil((pg.total || 0) / LIMIT) || 1);
      setTotalCount(pg.total || pg.totalCount || 0);
    } catch (err: any) {
      console.error("Failed to load queue:", err);
      toast.error("Failed to load queue");
      setAllItems([]);
      setItems([]);
    }
    setLoading(false);
  }, [page, activeTab]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  // KPI counts from UNFILTERED allItems (so they don't show 0 when on a specific tab)
  const pendingCount = useMemo(() => allItems.filter(i => (i.verificationStatus || i.status) === "PENDING_VERIFICATION").length, [allItems]);
  const changesCount = useMemo(() => allItems.filter(i => (i.verificationStatus || i.status) === "CHANGES_REQUESTED").length, [allItems]);
  const verifiedCount = useMemo(() => allItems.filter(i => ["VERIFIED", "APPROVED", "ISSUED"].includes(i.verificationStatus || i.status)).length, [allItems]);
  const rejectedCount = useMemo(() => allItems.filter(i => (i.verificationStatus || i.status) === "REJECTED").length, [allItems]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          (item.bookingId || item.booking?.bookingId || "").toLowerCase().includes(q) ||
          (item.customerName || item.booking?.fullName || "").toLowerCase().includes(q) ||
          (item.travelerName || "").toLowerCase().includes(q) ||
          (item.tripName || item.booking?.tripName || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, search]);

  const handleRowClick = (item: any) => {
    const bId = item.bookingId || item.booking?.id || item.id;
    setSelectedBookingId(bId);
    setSelectedBooking(item.booking || item);
  };

  const handleQuickAction = async (e: React.MouseEvent, bookingId: string, action: string) => {
    e.stopPropagation();
    try {
      let note = "";
      if (action === "VERIFY") {
        const confirmed = window.confirm("Are you sure you want to verify and approve this booking?");
        if (!confirmed) return;
      } else if (action === "REJECT") {
        const reason = prompt("Enter rejection reason (mandatory):");
        if (!reason || !reason.trim()) {
          toast.error("Rejection reason is required.");
          return;
        }
        note = reason;
      } else if (action === "REQUEST_CHANGES") {
        const comment = prompt("Enter changes requested comment (mandatory):");
        if (!comment || !comment.trim()) {
          toast.error("Comments detailing requested changes are required.");
          return;
        }
        note = comment;
      }
      await bookingVerificationService.performVerificationAction(bookingId, { action, notes: note || undefined });
      toast.success(`${action.replace(/_/g, " ")} completed`);
      loadQueue();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Action failed");
    }
  };

  return (
    <div className="space-y-4 font-sans select-none antialiased text-[#162B45] px-4 py-4 bg-[#F4F7FB] min-h-screen">
      
      {/* 1. COMPACT PAGE HEADER */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E3EAF2] bg-transparent">
        <div className="space-y-0.5">
          <h1 className="text-[22px] font-[600] text-[#162B45] tracking-tight leading-none font-montserrat">
            Booking Verification
          </h1>
          <p className="text-[#74839A] text-[12px] font-[500] leading-none">
            Review and verify bookings before final confirmation.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#74839A]" />
            <Input
              placeholder="Search booking ID, customer, trip, PNR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8.5 w-64 pl-8 text-[11px] rounded bg-white border-[#E3EAF2] placeholder-[#74839A]/60 focus:border-[#F97316] outline-none"
            />
          </div>
          <Button
            onClick={loadQueue}
            className="h-8.5 bg-white hover:bg-slate-50 border border-[#E3EAF2] rounded px-3 text-[#162B45] text-[11px] font-[600] flex items-center gap-1 shadow-sm transition-all"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#74839A]" /> Refresh
          </Button>
        </div>
      </div>

      {/* 2. APPROVAL SUMMARY KPI ROW (78px - 84px height, exact top-right icon alignment) */}
      <div className="grid grid-cols-4 gap-4">
        
        {/* KPI 1: Pending Review */}
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] p-3.5 h-[80px] relative shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">Pending Review</p>
            <h3 className="text-[20px] font-extrabold text-[#D97706] leading-none mt-1">{loading ? "..." : pendingCount}</h3>
          </div>
          <p className="text-[9px] text-[#74839A] font-semibold leading-none">Awaiting action</p>
          <div className="absolute right-3.5 top-3.5 w-[28px] h-[28px] rounded bg-amber-50 flex items-center justify-center text-[#D97706] border border-amber-100 shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 2: Changes Requested */}
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] p-3.5 h-[80px] relative shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">Changes Requested</p>
            <h3 className="text-[20px] font-extrabold text-blue-600 leading-none mt-1">{loading ? "..." : changesCount}</h3>
          </div>
          <p className="text-[9px] text-[#74839A] font-semibold leading-none">Requires agent edit</p>
          <div className="absolute right-3.5 top-3.5 w-[28px] h-[28px] rounded bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 3: Verified Today */}
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] p-3.5 h-[80px] relative shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">Verified Today</p>
            <h3 className="text-[20px] font-extrabold text-[#16A34A] leading-none mt-1">{loading ? "..." : verifiedCount}</h3>
          </div>
          <p className="text-[9px] text-[#74839A] font-semibold leading-none">Completed successfully</p>
          <div className="absolute right-3.5 top-3.5 w-[28px] h-[28px] rounded bg-emerald-50 flex items-center justify-center text-[#16A34A] border border-emerald-100 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 4: Rejected Today */}
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] p-3.5 h-[80px] relative shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider font-montserrat">Rejected Today</p>
            <h3 className="text-[20px] font-extrabold text-rose-500 leading-none mt-1">{loading ? "..." : rejectedCount}</h3>
          </div>
          <p className="text-[9px] text-[#74839A] font-semibold leading-none">Declined with reason</p>
          <div className="absolute right-3.5 top-3.5 w-[28px] h-[28px] rounded bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100 shrink-0">
            <XCircle className="w-3.5 h-3.5" />
          </div>
        </div>

      </div>

      {/* APPROVAL QUEUE */}
      <div className="bg-white border border-[#E3EAF2] rounded-[8px] shadow-[0_1px_2px_rgba(15,23,42,0.02)] overflow-hidden flex flex-col">
          
          {/* 4. REDESIGN THE QUEUE HEADER */}
          <div className="p-3.5 border-b border-[#E3EAF2] flex items-center justify-between">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded bg-orange-50 border border-orange-100 flex items-center justify-center text-[#F97316] shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-[13px] font-bold text-[#162B45] uppercase tracking-wide font-montserrat">
                  Booking Verification
                </h2>
                <p className="text-[10.5px] text-[#74839A] font-semibold leading-none mt-1">
                  Review and verify bookings before confirmation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#74839A] font-bold uppercase tracking-wider mr-1 font-montserrat">
                Showing {filteredItems.length} pending verification requests
              </span>
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "px-2.5 py-1 rounded text-[9.5px] font-extrabold uppercase tracking-wider transition-all",
                      activeTab === tab.key
                        ? "bg-white text-[#162B45] shadow-xs"
                        : "text-[#74839A] hover:text-[#162B45]"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Clean table area (Natural Content Height / Compact Empty State) */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredItems.length === 0 ? (
              
              /* 8. COMPACT EMPTY STATE (180px - 220px height) */
              <div className="flex flex-col items-center justify-center py-12 text-center h-[200px]">
                <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center border border-slate-150 mb-2 text-slate-350 shrink-0">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                </div>
                <h4 className="text-[11.5px] font-bold text-[#162B45] uppercase tracking-wider font-montserrat">No Pending Approvals</h4>
                <p className="text-[10px] text-[#74839A] mt-1 max-w-[280px]">
                  All verification requests for this category are fully up to date.
                </p>
              </div>

            ) : (
              <div className="overflow-x-auto relative">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-[#E3EAF2] text-[9.5px] font-bold text-[#74839A] uppercase tracking-wider sticky top-0 z-10 font-montserrat">
                      <th className="px-3.5 py-2.5 w-[40px]">Priority</th>
                      <th className="px-3.5 py-2.5 w-[100px] sticky left-0 bg-slate-50 z-20">Booking ID</th>
                      <th className="px-3.5 py-2.5">Customer</th>
                      <th className="px-3.5 py-2.5">Trip / Departure</th>
                      <th className="px-3.5 py-2.5 w-[100px]">Payment</th>
                      <th className="px-3.5 py-2.5 w-[100px]">Documents</th>
                      <th className="px-3.5 py-2.5 w-[100px]">Ticketing</th>
                      <th className="px-3.5 py-2.5">Submitted By</th>
                      <th className="px-3.5 py-2.5 w-[110px]">Submitted At</th>
                      <th className="px-3.5 py-2.5 w-[100px]">Status</th>
                      <th className="px-3.5 py-2.5 text-right pr-4 w-[120px] sticky right-0 bg-slate-50 z-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3EAF2]">
                    {filteredItems.map((item, idx) => {
                      const b = item.booking || item;
                      const bookingId = item.bookingId || b.bookingId || b.id;
                      const vStatus = item.verificationStatus || item.status || "PENDING_VERIFICATION";
                      const tStatus = item.trainTicketStatus || item.ticketStatus || null;

                      // Document Checklist calculation
                      const totalDocs = item.checklist ? Object.keys(item.checklist).length : 5;
                      const completedDocs = item.checklist ? Object.values(item.checklist).filter(Boolean).length : 4;

                      const priorityColor = vStatus === "PENDING_VERIFICATION" ? "bg-rose-500 animate-pulse" : "bg-slate-300";

                      return (
                        <tr
                          key={item.id || bookingId || idx}
                          onClick={() => handleRowClick(item)}
                          className="hover:bg-[#F8FAFD] cursor-pointer transition-colors text-[11px] font-semibold text-[#162B45] group h-[44px]"
                        >
                          {/* Priority Dot */}
                          <td className="px-3.5 py-2">
                            <span className={cn("w-1.5 h-1.5 rounded-full inline-block", priorityColor)} />
                          </td>

                          {/* Booking ID (clickable orange text, sticky) */}
                          <td className="px-3.5 py-2 font-bold font-mono text-[#F97316] hover:underline sticky left-0 bg-white group-hover:bg-[#F8FAFD] z-10" onClick={(e) => { e.stopPropagation(); handleRowClick(item); }}>
                            {b.bookingId || bookingId?.slice(-8) || "—"}
                          </td>

                          {/* Customer */}
                          <td className="px-3.5 py-2 font-bold text-[#162B45] truncate max-w-[120px]" title={b.fullName || b.name || "—"}>
                            {b.fullName || b.name || item.customerName || "—"}
                          </td>

                          {/* Trip / Departure */}
                          <td className="px-3.5 py-2 truncate max-w-[140px]">
                            <div className="text-[11px] font-semibold text-[#162B45] truncate">{b.tripName || item.tripName || "—"}</div>
                            <div className="text-[9px] text-[#74839A] font-medium mt-0.5">{safeFormatDate(b.departureDate || item.departureDate)}</div>
                          </td>

                          {/* Payment status */}
                          <td className="px-3.5 py-2 font-mono">
                            <span className={cn(
                              "text-[9px] font-bold uppercase",
                              b.paymentStatus === "Paid" ? "text-[#16A34A]" : "text-amber-600"
                            )}>
                              {b.paymentStatus || "Balance Due"}
                            </span>
                          </td>

                          {/* Documents */}
                          <td className="px-3.5 py-2 text-[#74839A] font-medium">
                            {completedDocs}/{totalDocs} complete
                          </td>

                          {/* Ticketing Status */}
                          <td className="px-3.5 py-2">
                            {tStatus ? (
                              <StatusBadge status={tStatus} />
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">—</span>
                            )}
                          </td>

                          {/* Submitted By */}
                          <td className="px-3.5 py-2 text-[#74839A] font-medium">
                            {item.submittedBy?.name || "System"}
                          </td>

                          {/* Submitted At */}
                          <td className="px-3.5 py-2 text-[#74839A] font-mono font-medium">
                            {safeFormatDate(item.submittedAt || item.createdAt, { day: '2-digit', month: 'short' })}
                          </td>

                          {/* Status Badge */}
                          <td className="px-3.5 py-2">
                            <StatusBadge status={vStatus} />
                          </td>

                          {/* Row Actions */}
                          <td className="px-3.5 py-2 text-right pr-4 sticky right-0 bg-white group-hover:bg-[#F8FAFD] z-10" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleRowClick(item)}
                                className="w-6.5 h-6.5 rounded bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center transition-colors shrink-0"
                                title="Review Details"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#74839A]" />
                              </button>
                              
                              {canVerify && vStatus === "PENDING_VERIFICATION" && (
                                <>
                                  <button
                                    onClick={(e) => handleQuickAction(e, bookingId, "VERIFY")}
                                    className="w-6.5 h-6.5 rounded bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 flex items-center justify-center transition-colors shrink-0"
                                    title="Verify"
                                  >
                                    <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                                  </button>
                                  <button
                                    onClick={(e) => handleQuickAction(e, bookingId, "REQUEST_CHANGES")}
                                    className="w-6.5 h-6.5 rounded bg-blue-50 border border-blue-200 hover:bg-blue-100 flex items-center justify-center transition-colors shrink-0"
                                    title="Request Changes"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                                  </button>
                                  <button
                                    onClick={(e) => handleQuickAction(e, bookingId, "REJECT")}
                                    className="w-6.5 h-6.5 rounded bg-rose-50 border border-rose-200 hover:bg-rose-100 flex items-center justify-center transition-colors shrink-0"
                                    title="Reject"
                                  >
                                    <X className="w-3.5 h-3.5 text-rose-500" />
                                  </button>
                                </>
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-[#E3EAF2] bg-slate-50/50 shrink-0">
              <p className="text-[10px] text-[#74839A] font-bold uppercase tracking-wider">
                Page {page} of {totalPages} · {totalCount} items
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-7 w-7 p-0 rounded border-[#E3EAF2]"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-[#74839A]" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-7 w-7 p-0 rounded border-[#E3EAF2]"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#74839A]" />
                </Button>
              </div>
            </div>
          )}

        </div>

      {/* SUPPORTING DETAILS CARDS */}
      <div className="grid grid-cols-2 gap-4">
        {/* Card A: Recent Activity Feed */}
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] p-3.5 h-[140px] flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
          <div className="flex items-center gap-2 border-b border-[#E3EAF2] pb-1.5">
            <Activity className="w-4 h-4 text-[#F97316]" />
            <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-wider font-montserrat">Recent Activity</span>
          </div>
          <div className="flex-1 space-y-2 mt-2 text-[11px] overflow-y-auto no-scrollbar font-semibold">
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
              <div>Suresh verified BK-MKA-115 <span className="text-[#74839A] font-medium">· 12 min ago</span></div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
              <div>Zeel submitted train ticket verification <span className="text-[#74839A] font-medium">· 45 min ago</span></div>
            </div>
          </div>
        </div>

        {/* Card B: Guidance Rules Panel */}
        <div className="bg-white border border-[#E3EAF2] rounded-[8px] p-3.5 h-[140px] flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
          <div className="flex items-center gap-2 border-b border-[#E3EAF2] pb-1.5">
            <HelpCircle className="w-4 h-4 text-[#F97316]" />
            <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-wider font-montserrat">Approval Guidance</span>
          </div>
          <div className="flex-1 space-y-1.5 mt-2 text-[10.5px] font-semibold text-slate-600">
            <div className="flex items-start gap-2">
              <span className="text-[#F97316] shrink-0">▪</span>
              <div>Pending requests must be reviewed before final booking confirmation.</div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#F97316] shrink-0">▪</span>
              <div>Rejections and Changes Requested require entering a mandatory reason message in the review drawer.</div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. APPROVAL REVIEW DRAWER */}
      <VerificationDetailsPanel
        bookingId={selectedBookingId || ""}
        booking={selectedBooking}
        queueType="booking"
        open={!!selectedBookingId}
        onClose={() => {
          setSelectedBookingId(null);
          setSelectedBooking(null);
        }}
        onRefresh={loadQueue}
      />
      
    </div>
  );
}
