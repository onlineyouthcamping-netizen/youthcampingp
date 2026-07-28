import { useEffect, useState, useCallback, useMemo } from "react";
import { bookingLinksService, type BookingLinkRecord } from "@/services/bookingLinks.service";
import { tripsService } from "@/services/trips.service";
import type { Trip } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Link2, Plus, Trash2, ExternalLink, Copy, Share2, Pencil,
  FileSpreadsheet, ClipboardCheck, Loader2, MessageCircle,
  CalendarDays, MapPin, Send, Search, Eye, AlertCircle, CheckCircle2, ChevronRight, ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

const getYYYYMMDD = (dateVal: any): string => {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) {
      const match = String(dateVal).match(/\d{4}-\d{2}-\d{2}/);
      return match ? match[0] : String(dateVal).slice(0, 10);
    }
    return d.toISOString().split("T")[0];
  } catch {
    return String(dateVal).slice(0, 10);
  }
};

interface MockDepartureDate {
  date: string;
  status: "Open for Booking" | "Closing Soon" | "Full" | "Closed" | "Cancelled" | "Completed / Past Departure";
  capacity: string;
  cutoff: string;
}

export default function BookingLinksPage() {
  const [links, setLinks] = useState<BookingLinkRecord[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Workflow Pages: "directory" | "departures" | "workspace"
  const [workflowPage, setWorkflowPage] = useState<"directory" | "departures" | "workspace">("directory");
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);

  // Search & Filter state for Trip Directory
  const [tripSearch, setTripSearch] = useState("");
  const [tripFilterTab, setTripFilterTab] = useState<"all" | "open" | "active">("all");
  const [linkFilterTab, setLinkFilterTab] = useState<"active" | "used">("active");

  // Duplicate safety check warning dialog
  const [duplicateWarningOpen, setDuplicateWarningOpen] = useState(false);
  const [existingFormMatch, setExistingFormMatch] = useState<BookingLinkRecord | null>(null);

  const [formData, setFormData] = useState({
    paymentMode: "Full Payment" as "Full Payment" | "Partial Payment",
    customAmount: 2000,
    pickupCity: "",
    customTime: "9:00 AM – 6:00 PM IST",
    headerTitle: "Join the Waitlist",
    headerSubtitle: "Complete your booking",
    expiresAt: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    travelerCount: 1,
    internalNote: ""
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [linksData, tripsData] = await Promise.all([
        bookingLinksService.getAll(1, 200),
        tripsService.getAll()
      ]);
      setLinks(Array.isArray(linksData.data) ? linksData.data : []);
      setTrips(Array.isArray(tripsData) ? tripsData : []);
    } catch {
      toast.error("Failed to load booking links");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    
    // Support quick launch from trip details
    const handleQuickLaunch = (e: any) => {
      const { tripId, date } = e.detail || {};
      if (tripId) {
        tripsService.getAll().then(data => {
          const matched = data.find((t: any) => t.id === tripId);
          if (matched) {
            setSelectedTrip(matched);
            setWorkflowPage("departures");
            if (date) {
              const cleanDate = typeof date === 'string' ? date : date?.date || "";
              setSelectedDate(cleanDate);
              setWorkflowPage("workspace");
            }
          }
        });
      }
    };
    window.addEventListener("quick-launch-booking-forms", handleQuickLaunch);
    return () => window.removeEventListener("quick-launch-booking-forms", handleQuickLaunch);
  }, [load]);

  const formatDate = (dateStr: any) => {
    if (!dateStr) return "";
    const cleanDate = typeof dateStr === 'string' ? dateStr : dateStr.date || String(dateStr);
    try {
      const d = new Date(cleanDate);
      if (isNaN(d.getTime())) {
        return String(cleanDate);
      }
      return d.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch {
      return String(cleanDate);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const confirmDelete = (id: string) => {
    setFormToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!formToDelete) return;
    try {
      await bookingLinksService.remove(formToDelete);
      toast.success("Record removed");
      setDeleteConfirmOpen(false);
      setFormToDelete(null);
      load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const checkAndOpenGenerate = () => {
    if (!selectedTrip || !selectedDate) return;
    
    // Check duplicate safety
    const existing = links.find(f => 
      f.tripName.toLowerCase() === selectedTrip.title.toLowerCase() && 
      getYYYYMMDD(f.departureDate) === getYYYYMMDD(selectedDate)
    );

    if (existing) {
      setExistingFormMatch(existing);
      setDuplicateWarningOpen(true);
    } else {
      setCreateOpen(true);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTrip || !selectedDate) return;

    setGenerating(true);
    try {
      const dateStr = typeof selectedDate === 'string' ? selectedDate : (selectedDate as any)?.date || "";
      const result = await bookingLinksService.create({
        tripId: selectedTrip.id,
        departureDate: dateStr,
        paymentMode: formData.paymentMode,
        customAmount: Number(formData.customAmount) || 0,
        pickupCity: formData.pickupCity || "TBD",
        customTime: formData.customTime || undefined,
        headerTitle: formData.headerTitle || undefined,
        headerSubtitle: formData.headerSubtitle || undefined,
        expiresAt: formData.expiresAt ? formData.expiresAt : null,
        customerName: formData.customerName || undefined,
        customerPhone: formData.customerPhone || undefined,
        customerEmail: formData.customerEmail || undefined,
        travelerCount: Number(formData.travelerCount) || 1,
        internalNote: formData.internalNote || undefined
      });
      toast.success("Booking link generated successfully!");
      setCreateOpen(false);
      setDuplicateWarningOpen(false);
      setExistingFormMatch(null);
      load();
      openShare(result);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to generate form link";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const openShare = (link: BookingLinkRecord) => {
    const url = link.shareUrl || "";
    if (!url) {
      toast.error("Share URL not available");
      return;
    }
    setShareUrl(url);
    const dateStr = selectedDate ? formatDate(selectedDate) : "";
    const tripStr = link.tripName || selectedTrip?.title || "";
    const msg = `Hello 😊\n\nPlease complete your booking here:\n${url}\n\nTrip: ${tripStr}\nDate: ${dateStr}\n\nTeam YouthCamping 🏕️`;
    setShareMsg(msg);
    setShareOpen(true);
  };

  // Generate Mock Departures List for selected Trip
  const departuresList = useMemo<MockDepartureDate[]>(() => {
    if (!selectedTrip) return [];
    const rawDates = selectedTrip.availableDates && selectedTrip.availableDates.length > 0 
      ? selectedTrip.availableDates 
      : ["2026-07-11", "2026-07-18", "2026-07-25", "2026-08-01", "2026-08-08", "2026-08-15"];
    const dates = rawDates.map((d: any) => typeof d === 'string' ? d : d?.date || "");

    return dates.map((dateStr, idx) => {
      let status: MockDepartureDate["status"] = "Open for Booking";
      let capacity = "18 / 30";
      if (idx === 2) {
        status = "Closing Soon";
        capacity = "28 / 30";
      } else if (idx === 3) {
        status = "Full";
        capacity = "30 / 30";
      } else if (idx === 4) {
        status = "Closed";
        capacity = "12 / 30";
      } else if (idx === 5) {
        status = "Completed / Past Departure";
        capacity = "24 / 30";
      }

      const d = new Date(dateStr);
      let cutoff = "N/A";
      if (!isNaN(d.getTime())) {
        d.setDate(d.getDate() - 3);
        cutoff = d.toISOString().split('T')[0];
      }

      return {
        date: dateStr,
        status,
        capacity,
        cutoff
      };
    });
  }, [selectedTrip]);

  // Selected Date Workspace Links
  const workspaceLinks = useMemo(() => {
    if (!selectedTrip || !selectedDate) return [];
    return links.filter(f => 
      f.tripName.toLowerCase() === selectedTrip.title.toLowerCase() && 
      getYYYYMMDD(f.departureDate) === getYYYYMMDD(selectedDate)
    );
  }, [links, selectedTrip, selectedDate]);

  const displayedLinks = useMemo(() => {
    return workspaceLinks.filter(form => {
      const isUsed = form.status === 'used' || (form.completedCount && form.completedCount > 0);
      if (linkFilterTab === 'used') {
        return isUsed;
      } else {
        return !isUsed;
      }
    });
  }, [workspaceLinks, linkFilterTab]);

  // Filtered trips list for Directory
  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      const matchesSearch = 
        trip.title.toLowerCase().includes(tripSearch.toLowerCase()) || 
        trip.id.toLowerCase().includes(tripSearch.toLowerCase());

      return matchesSearch;
    });
  }, [trips, tripSearch]);

  return (
    <div className="space-y-4 pb-12 select-none px-4 py-3 bg-[#F4F7FB] min-h-screen text-[#162B45] font-sans antialiased">
      
      {/* ─── WORKFLOW PAGE 1: TRIP DIRECTORY ─── */}
      {workflowPage === "directory" && (
        <>
          <div className="flex items-center justify-between pb-1.5 border-b border-[#E3EAF2]">
            <div>
              <h1 className="text-[19px] font-[600] text-[#162B45] tracking-tight leading-none">
                Booking Forms
              </h1>
              <p className="text-[#74839A] text-[11px] font-[500] mt-1 leading-none">
                Select a trip and departure date to create or manage booking links.
              </p>
            </div>
            
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#74839A]" />
                <input
                  type="text"
                  placeholder="Search trip or code..."
                  value={tripSearch}
                  onChange={e => setTripSearch(e.target.value)}
                  className="w-48 h-8 pl-8 pr-2.5 bg-white border border-[#E3EAF2] rounded-md text-[11px] outline-none text-[#162B45] focus:ring-1 focus:ring-[#F97316] placeholder:text-[#74839A]/60"
                />
              </div>
            </div>
          </div>

          {/* Directory Grid */}
          {loading ? (
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-28 bg-white border border-[#E3EAF2] rounded-[10px] animate-pulse" />
              ))}
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="text-center py-20 bg-white border border-[#E3EAF2] rounded-[10px] space-y-2">
              <MapPin className="h-8 w-8 mx-auto text-[#74839A]/40" />
              <p className="text-xs font-bold text-[#74839A] uppercase tracking-wider">No Trips Found</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {filteredTrips.map(trip => {
                const upcomingCount = trip.availableDates?.length || 6;
                const activeLinksCount = links.filter(f => f.tripName.toLowerCase() === trip.title.toLowerCase()).length;
                const rawNext = trip.availableDates?.[0];
                const nextDeparture = typeof rawNext === 'string' ? rawNext : rawNext?.date || "2026-07-11";

                return (
                  <div
                    key={trip.id}
                    className="bg-white border border-[#E3EAF2] rounded-[10px] p-3.5 space-y-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-[#F97316]/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-[12px] text-[#162B45] line-clamp-2 max-w-[200px] leading-tight" title={trip.title}>
                          {trip.title}
                        </h3>
                        <span className="text-[9px] font-extrabold uppercase text-[#74839A] bg-slate-50 border border-[#E3EAF2] px-1.5 py-0.5 rounded">
                          {trip.id.substring(0, 4).toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="mt-2.5 space-y-1 text-[10px] text-[#74839A] font-semibold">
                        <p>{upcomingCount} upcoming departures · {Math.max(1, upcomingCount - 2)} open for booking</p>
                        <p className="text-[#16A34A]">{activeLinksCount} active booking links</p>
                        <p className="text-[#162B45]">Next departure: {formatDate(nextDeparture)}</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        setSelectedTrip(trip);
                        setWorkflowPage("departures");
                      }}
                      className="w-full mt-3 h-8 bg-slate-50 border border-[#E3EAF2] hover:bg-slate-100 text-[#162B45] text-[10.5px] font-bold rounded-md flex items-center justify-center gap-1"
                    >
                      View Departure Dates <ChevronRight className="w-3 h-3 text-[#74839A]" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── WORKFLOW PAGE 2: TRIP DEPARTURES TABLE ─── */}
      {workflowPage === "departures" && selectedTrip && (
        <>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[#74839A] pb-1">
            <button onClick={() => setWorkflowPage("directory")} className="hover:text-[#F97316] flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Booking Forms
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-[#162B45] truncate max-w-[200px]">{selectedTrip.title}</span>
          </div>

          <div className="flex items-center justify-between pb-1.5 border-b border-[#E3EAF2]">
            <div>
              <h1 className="text-[17px] font-[600] text-[#162B45] tracking-tight leading-none">
                {selectedTrip.title}
              </h1>
              <p className="text-[#74839A] text-[11px] font-[500] mt-1 leading-none">
                Select a departure date row to manage or create booking links.
              </p>
            </div>
          </div>

          {/* Departures Table */}
          <div className="bg-white border border-[#E3EAF2] rounded-[10px] overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E3EAF2] bg-slate-50">
                  <th className="px-4 py-3 font-bold text-[#74839A] uppercase tracking-wider text-[10px]">Departure Date</th>
                  <th className="px-4 py-3 font-bold text-[#74839A] uppercase tracking-wider text-[10px]">Booking Status</th>
                  <th className="px-4 py-3 font-bold text-[#74839A] uppercase tracking-wider text-[10px] text-center">Seats / Capacity</th>
                  <th className="px-4 py-3 font-bold text-[#74839A] uppercase tracking-wider text-[10px]">Cutoff Date</th>
                  <th className="px-4 py-3 font-bold text-[#74839A] uppercase tracking-wider text-[10px] text-center">Active Links</th>
                  <th className="px-4 py-3 font-bold text-[#74839A] uppercase tracking-wider text-[10px] text-center">Total Opens</th>
                  <th className="px-4 py-3 font-bold text-[#74839A] uppercase tracking-wider text-[10px] text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departuresList.map((dep) => {
                  const linksCount = links.filter(f => f.tripName.toLowerCase() === selectedTrip.title.toLowerCase() && getYYYYMMDD(f.departureDate) === getYYYYMMDD(dep.date)).length;
                  const isEligible = dep.status === "Open for Booking" || dep.status === "Closing Soon";

                  return (
                    <tr
                      key={dep.date}
                      onClick={() => {
                        setSelectedDate(dep.date);
                        setWorkflowPage("workspace");
                      }}
                      className="hover:bg-[#F8FAFD] transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-bold text-[#162B45]">{formatDate(dep.date)}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-[8.5px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-sm border",
                          dep.status === "Open for Booking" ? "bg-[#ECFDF3] text-[#16A34A] border-emerald-200" :
                          dep.status === "Closing Soon" ? "bg-[#FFF7E6] text-[#D97706] border-amber-200" :
                          dep.status === "Full" ? "bg-slate-100 text-slate-700 border-slate-300" :
                          dep.status === "Cancelled" ? "bg-[#FFF1F3] text-[#E23D4D] border-rose-200" :
                          "bg-slate-50 text-[#74839A] border-slate-200"
                        )}>
                          {dep.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700">{dep.capacity}</td>
                      <td className="px-4 py-3 font-semibold text-[#74839A]">{formatDate(dep.cutoff)}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700">{linksCount}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700">{linksCount * 12}</td>
                      <td className="px-4 py-2 text-center" onClick={e => e.stopPropagation()}>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedDate(dep.date);
                            setWorkflowPage("workspace");
                          }}
                          className="h-7 text-[10px] font-bold bg-[#F97316] hover:bg-[#EA580C] text-white px-2.5 rounded"
                        >
                          Manage Links
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── WORKFLOW PAGE 3: DEPARTURE DATE WORKSPACE ─── */}
      {workflowPage === "workspace" && selectedTrip && selectedDate && (
        <>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[#74839A] pb-1">
            <button onClick={() => setWorkflowPage("directory")} className="hover:text-[#F97316] flex items-center gap-1">
              Booking Forms
            </button>
            <span className="text-slate-300">/</span>
            <button onClick={() => setWorkflowPage("departures")} className="hover:text-[#F97316] truncate max-w-[150px]">
              {selectedTrip.title}
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-[#162B45] font-bold">{formatDate(selectedDate)}</span>
          </div>

          <div className="flex items-center justify-between pb-1.5 border-b border-[#E3EAF2]">
            <div>
              <h1 className="text-[17px] font-[600] text-[#162B45] tracking-tight leading-none">
                Departure: {formatDate(selectedDate)}
              </h1>
              <p className="text-[#74839A] text-[11px] font-[500] mt-1 leading-none">
                Trip: <span className="font-bold text-[#162B45]">{selectedTrip.title}</span> · Status: Open for Booking
              </p>
            </div>

            <Button
              onClick={checkAndOpenGenerate}
              className="bg-[#F97316] hover:bg-[#EA580C] text-white rounded-md h-8 px-3.5 font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all"
            >
              <Plus className="h-3.5 w-3.5" /> Generate Booking Link
            </Button>
          </div>

          {/* Tabs for Active/Used Links */}
          <div className="flex items-center gap-1.5 pt-2">
            <button
              onClick={() => setLinkFilterTab("active")}
              className={cn(
                "px-3 py-1.5 text-[11px] font-bold rounded-md transition-all border",
                linkFilterTab === "active"
                  ? "bg-[#162B45] text-white border-[#162B45] shadow-sm"
                  : "bg-white text-slate-600 border-[#E3EAF2] hover:bg-slate-50"
              )}
            >
              Active Links ({workspaceLinks.filter(f => f.status !== 'used' && (f.completedCount || 0) === 0).length})
            </button>
            <button
              onClick={() => setLinkFilterTab("used")}
              className={cn(
                "px-3 py-1.5 text-[11px] font-bold rounded-md transition-all border",
                linkFilterTab === "used"
                  ? "bg-[#162B45] text-white border-[#162B45] shadow-sm"
                  : "bg-white text-slate-600 border-[#E3EAF2] hover:bg-slate-50"
              )}
            >
              Used Links ({workspaceLinks.filter(f => f.status === 'used' || (f.completedCount || 0) > 0).length})
            </button>
          </div>

          {/* Links grid for selected Date */}
          {displayedLinks.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#E3EAF2] rounded-[10px] space-y-3">
              <Link2 className="h-8 w-8 mx-auto text-[#74839A]/30" />
              <p className="text-xs font-bold text-[#74839A]">No {linkFilterTab === 'active' ? 'Active' : 'Used'} Booking Links found for this departure date.</p>
              {linkFilterTab === 'active' && (
                <Button onClick={checkAndOpenGenerate} className="bg-[#F97316] hover:bg-[#EA580C] text-white text-[11px] font-bold h-8 rounded-md px-3.5">
                  Generate Booking Link
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {displayedLinks.map((form) => {
                const status = 
                  form.status === 'revoked' ? 'Revoked' :
                  form.status === 'used' || (form.completedCount && form.completedCount > 0) ? 'Used' :
                  form.expiresAt && new Date(form.expiresAt) < new Date() ? 'Expired' : 'Active';
                const opens = form.openedCount || 0;
                const comps = form.completedCount || 0;

                return (
                  <div
                    key={form.id || form._id}
                    className="bg-white border border-[#E3EAF2] rounded-[10px] p-3.5 space-y-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[11px] font-bold text-[#162B45] font-mono">Token: {(form.id || form._id || '').substring(0, 8)}</p>
                          <p className="text-[9px] text-[#74839A] font-semibold mt-1">Created {formatDate(form.createdAt || new Date().toISOString())}</p>
                        </div>
                        <span className={cn(
                          "text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded border",
                          status === "Active" ? "bg-[#ECFDF3] text-[#16A34A] border-emerald-200" :
                          status === "Used" ? "bg-[#EFF6FF] text-[#2563EB] border-blue-200" :
                          "bg-slate-50 text-slate-500 border-slate-200"
                        )}>
                          {status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-1.5 px-2 bg-slate-50 border border-[#E3EAF2] rounded-md text-center text-xs mt-3">
                        <div>
                          <p className="text-[8px] font-bold text-[#74839A] uppercase tracking-wider">Opened</p>
                          <p className="font-bold text-[#162B45] text-xs mt-0.5">{opens}</p>
                        </div>
                        <div className="border-x border-slate-200">
                          <p className="text-[8px] font-bold text-[#74839A] uppercase tracking-wider">Completed</p>
                          <p className="font-bold text-[#162B45] text-xs mt-0.5">{comps}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-[#74839A] uppercase tracking-wider">Conversion</p>
                          <p className="font-bold text-slate-800 text-xs mt-0.5">{opens > 0 ? Math.round((comps / opens) * 100) : 0}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-100 mt-2">
                      <a
                        href={form.shareUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center h-8 rounded border border-[#E3EAF2] bg-white hover:bg-slate-50 text-[10px] font-bold uppercase text-slate-700"
                      >
                        Open
                      </a>
                      <Button
                        variant="outline"
                        className="h-8 rounded text-[10px] font-bold uppercase border border-[#E3EAF2] text-slate-700"
                        onClick={() => copyToClipboard(form.shareUrl || "", "Link")}
                      >
                        Copy
                      </Button>
                      <Button
                        className="h-8 rounded text-[10px] font-bold uppercase bg-[#16A34A] hover:bg-emerald-700 text-white"
                        onClick={() => openShare(form)}
                      >
                        Share
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 rounded text-[10px] font-bold uppercase border-rose-200 text-[#E23D4D] hover:bg-rose-50"
                        onClick={() => confirmDelete(form.id || form._id!)}
                      >
                        Revoke
                      </Button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── CREATE MODAL ─── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[440px] w-[95vw] p-4 md:p-6 rounded-[10px]">
          <DialogHeader>
            <DialogTitle className="font-bold uppercase tracking-tight text-xs text-[#162B45]">
              Generate Booking Link
            </DialogTitle>
            <DialogDescription className="sr-only">Pre-filled date booking form generator</DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="space-y-0.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#74839A]">Selected Trip</label>
              <Input value={selectedTrip?.title || ""} readOnly className="h-9 rounded bg-slate-50 text-xs text-slate-700 font-bold" />
            </div>

            <div className="space-y-0.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#74839A]">Departure Date</label>
              <Input value={selectedDate ? formatDate(selectedDate) : ""} readOnly className="h-9 rounded bg-slate-50 text-xs text-slate-700 font-bold" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#74839A]">Payment Mode</label>
                <Select value={formData.paymentMode} onValueChange={val => setFormData(prev => ({ ...prev, paymentMode: val as any }))}>
                  <SelectTrigger className="h-9 rounded">
                    <SelectValue placeholder="Select Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full Payment">Full Payment</SelectItem>
                    <SelectItem value="Partial Payment">Partial Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#74839A]">Amount (₹)</label>
                <Input
                  type="number"
                  placeholder="2000"
                  value={formData.customAmount || ""}
                  onChange={e => setFormData(prev => ({ ...prev, customAmount: Number(e.target.value) }))}
                  className="h-9 rounded text-xs font-bold"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setCreateOpen(false)} className="text-xs font-semibold h-9 rounded">
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleGenerate} 
              disabled={generating}
              className="text-xs bg-[#F97316] hover:bg-[#EA580C] text-white font-bold px-4 h-9 rounded"
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Generate Booking Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── DUPLICATE LINK WARNING SAFETY SCREEN ─── */}
      <Dialog open={duplicateWarningOpen} onOpenChange={setDuplicateWarningOpen}>
        <DialogContent className="sm:max-w-[460px] w-[95vw] p-6 rounded-[10px] text-center space-y-4">
          <AlertCircle className="w-10 h-10 mx-auto text-[#D97706]" />
          
          <div className="space-y-1.5">
            <h3 className="font-bold text-[#162B45] text-sm uppercase tracking-wide">Active Link Already Exists</h3>
            <p className="text-xs text-[#74839A] leading-relaxed">
              An active booking link already exists for this departure date. Creating multiple public links can lead to duplicate tracking issues.
            </p>
          </div>

          {existingFormMatch && (
            <div className="bg-slate-50 border border-dashed border-[#E3EAF2] rounded p-3 text-left text-[11px] font-semibold space-y-1">
              <p>Trip: {existingFormMatch.tripName}</p>
              <p>Departure: {formatDate(existingFormMatch.departureDate)}</p>
              <p>Token: {(existingFormMatch.id || existingFormMatch._id || '').substring(0, 8)}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              variant="outline"
              className="h-9 rounded text-xs font-bold text-[#162B45] uppercase tracking-wide border border-[#E3EAF2]"
              onClick={() => {
                if (existingFormMatch) {
                  copyToClipboard(existingFormMatch.shareUrl || "", "Booking Link");
                  setDuplicateWarningOpen(false);
                }
              }}
            >
              Copy Existing Link
            </Button>
            <a
              href={existingFormMatch ? existingFormMatch.shareUrl : "#"}
              target="_blank"
              rel="noreferrer"
              className="h-9 rounded text-xs font-bold text-white bg-[#2563EB] uppercase tracking-wide flex items-center justify-center"
            >
              Open Existing Link
            </a>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                setDuplicateWarningOpen(false);
                setCreateOpen(true);
              }}
              className="text-[10px] font-bold uppercase tracking-wider text-[#74839A] hover:text-[#F97316] underline"
            >
              Generate Another Link Anyway
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── SHARE MODAL ─── */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-[480px] w-[95vw] p-4 md:p-6 rounded-[10px]">
          <DialogHeader>
            <DialogTitle className="font-bold uppercase tracking-tight text-sm text-[#162B45]">
              Share Booking Link
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#74839A]">
                Copy booking link
              </label>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="h-10 rounded-md text-xs bg-slate-50 flex-1 font-mono" />
                <Button className="h-10 rounded-md px-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold" onClick={() => copyToClipboard(shareUrl, "Booking link")}>
                  Copy
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#74839A]">
                WhatsApp Share Message
              </label>
              <textarea
                value={shareMsg}
                onChange={e => setShareMsg(e.target.value)}
                className="w-full h-32 text-xs border border-slate-200 rounded-md p-2 outline-none font-mono focus:ring-1 focus:ring-[#F97316]"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setShareOpen(false)} className="text-xs font-semibold h-9 rounded-md">
              Close
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                const url = `https://wa.me/?text=${encodeURIComponent(shareMsg)}`;
                window.open(url, "_blank");
              }}
              className="text-xs bg-[#16A34A] hover:bg-emerald-700 text-white font-bold px-4 h-9 rounded-md flex items-center gap-1"
            >
              <MessageCircle className="w-4 h-4" /> Share on WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── DELETE ALERT DIALOG ─── */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-[10px] p-6 max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-sm text-[#162B45] uppercase tracking-wide">
              Revoke booking form link?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#74839A]">
              Are you sure you want to revoke this booking link? Clients will no longer be able to use it to submit new bookings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex items-center justify-end gap-2 mt-4">
            <AlertDialogCancel className="h-9 rounded-md text-xs font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-[#E23D4D] hover:bg-red-700 text-white font-bold h-9 rounded-md text-xs" onClick={handleDelete}>
              Revoke Link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
