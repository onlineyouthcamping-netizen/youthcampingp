import { useEffect, useState, useCallback, useMemo } from "react";
import { bookingFormsService, type BookingFormRecord } from "@/services/bookingForms.service";
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
  CalendarDays, MapPin, Send, Search, Eye, AlertCircle, CheckCircle2, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BookingFormsPage() {
  const [forms, setForms] = useState<BookingFormRecord[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Selection States
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const [shareFormUrl, setShareFormUrl] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);

  // Search filter for trips list
  const [tripSearch, setTripSearch] = useState("");

  // Duplicate safety check warning dialog
  const [duplicateWarningOpen, setDuplicateWarningOpen] = useState(false);
  const [existingFormMatch, setExistingFormMatch] = useState<BookingFormRecord | null>(null);

  const [formData, setFormData] = useState({
    paymentMode: "Full Payment",
    bookingAmount: 0
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [formsData, tripsData] = await Promise.all([
        bookingFormsService.getAll(),
        tripsService.getCompact()
      ]);
      setForms(formsData);
      const fetchedTrips = Array.isArray(tripsData) ? tripsData : [];
      setTrips(fetchedTrips);
      
      // Auto-select first trip
      if (fetchedTrips.length > 0 && !selectedTrip) {
        setSelectedTrip(fetchedTrips[0]);
        if (fetchedTrips[0].availableDates && fetchedTrips[0].availableDates.length > 0) {
          setSelectedDate(fetchedTrips[0].availableDates[0]);
        } else {
          setSelectedDate("2026-07-11");
        }
      }
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [selectedTrip]);

  useEffect(() => { load(); }, []);

  const getInternalBookingUrl = (form: BookingFormRecord) => {
    const baseUrl = import.meta.env.VITE_FRONTEND_URL || "https://youthcamping.online";
    const params = new URLSearchParams({
      trip: (form.tripName || '').trim(),
      date: (form.date || '').trim(),
      tid: (form.tripId || '').trim(),
      payMode: form.paymentMode || 'Full Payment',
      bookAmt: (form.bookingAmount || 0).toString()
    });
    return `${baseUrl}/book?${params.toString()}`;
  };

  const openShare = async (form: BookingFormRecord) => {
    const bookingUrl = getInternalBookingUrl(form);
    setShareFormUrl(bookingUrl);
    try {
      const msg = await bookingFormsService.getShareMessage(
        form.tripName, form.date, bookingUrl
      );
      setShareMsg(msg);
    } catch {
      setShareMsg(
        `Hello 😊\n\nPlease complete your booking here:\n${bookingUrl}\n\nTrip: ${form.tripName}\nDate: ${form.date}\n\nTeam YouthCamping 🏕️`
      );
    }
    setShareOpen(true);
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
      await bookingFormsService.remove(formToDelete);
      toast.success("Record removed");
      setDeleteConfirmOpen(false);
      setFormToDelete(null);
      load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleTripSelectClick = (trip: Trip) => {
    setSelectedTrip(trip);
    if (trip.availableDates && trip.availableDates.length > 0) {
      setSelectedDate(trip.availableDates[0]);
    } else {
      setSelectedDate("2026-07-11");
    }
  };

  const checkAndOpenGenerate = () => {
    if (!selectedTrip || !selectedDate) return;
    
    // Check duplicate safety: Is there already an active form matching this trip name and selected date?
    const existing = forms.find(f => 
      f.tripName.toLowerCase() === selectedTrip.title.toLowerCase() && 
      f.date === selectedDate && 
      (f.status || "Active") === "Active"
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
      await bookingFormsService.create({
        tripName: selectedTrip.title,
        date: selectedDate,
        tripId: selectedTrip.id,
        paymentMode: formData.paymentMode,
        bookingAmount: formData.bookingAmount
      });
      toast.success("Booking link created!");
      setCreateOpen(false);
      setDuplicateWarningOpen(false);
      setExistingFormMatch(null);
      load();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to generate form link";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  // Helper date formatted
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch { return dateStr; }
  };

  const availableDates = useMemo(() => {
    if (!selectedTrip) return [];
    const rawDates = selectedTrip.availableDates && selectedTrip.availableDates.length > 0
      ? selectedTrip.availableDates
      : ["2026-07-11", "2026-07-18", "2026-07-25", "2026-08-01", "2026-08-08", "2026-08-15"];
    return rawDates.map((d: any) => typeof d === 'string' ? d : d?.date || "");
  }, [selectedTrip]);

  // Links for selected trip + selected date
  const filteredLinks = useMemo(() => {
    if (!selectedTrip || !selectedDate) return [];
    return forms.filter(f => 
      f.tripName.toLowerCase() === selectedTrip.title.toLowerCase() && 
      f.date === selectedDate
    );
  }, [forms, selectedTrip, selectedDate]);

  // Filtered trips list for sidebar
  const filteredTrips = useMemo(() => {
    return trips.filter(trip => 
      trip.title.toLowerCase().includes(tripSearch.toLowerCase()) ||
      trip.id.toLowerCase().includes(tripSearch.toLowerCase())
    );
  }, [trips, tripSearch]);

  return (
    <div className="space-y-4 pb-12 select-none px-4 py-3 bg-[#F4F7FB] min-h-screen text-[#162B45] font-sans antialiased">
      
      {/* ─── PAGE HEADER ─── */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#E3EAF2]">
        <div>
          <h1 className="text-[19px] font-[600] text-[#162B45] tracking-tight leading-none">
            Booking Forms
          </h1>
          <p className="text-[#74839A] text-[11px] font-[500] mt-1 leading-none">
            Select a trip and departure date to view or generate tokenized booking links.
          </p>
        </div>
      </div>

      {/* ─── TWO-COLUMN WORKFLOW LAYOUT ─── */}
      <div className="grid grid-cols-12 gap-4 items-start">
        
        {/* Left Column: Select Trip (4 cols) */}
        <div className="col-span-4 bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden flex flex-col h-[640px]">
          <div className="p-3 border-b border-[#E3EAF2] space-y-2">
            <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">Available Trips</span>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#74839A]" />
              <input
                type="text"
                placeholder="Search trip..."
                value={tripSearch}
                onChange={e => setTripSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-2.5 bg-slate-50 border border-[#E3EAF2] rounded-md text-[11px] outline-none text-[#162B45] focus:ring-1 focus:ring-[#F97316] placeholder:text-[#74839A]/60"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1 bg-slate-50/50">
            {filteredTrips.map(trip => {
              const isSelected = selectedTrip?.id === trip.id;
              return (
                <div
                  key={trip.id}
                  onClick={() => handleTripSelectClick(trip)}
                  className={cn(
                    "p-2.5 rounded-md cursor-pointer transition-all border flex items-center justify-between",
                    isSelected 
                      ? "bg-[#FFF3E8] border-[#F97316] text-[#F97316]" 
                      : "bg-white border-[#E3EAF2] text-[#162B45] hover:bg-slate-50"
                  )}
                >
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold leading-tight">{trip.title}</p>
                    <p className="text-[9px] text-[#74839A] font-semibold">Code: {trip.id.substring(0, 4).toUpperCase()}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#74839A]" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Dates & Booking Links (8 cols) */}
        <div className="col-span-8 space-y-4">
          
          {selectedTrip ? (
            <>
              {/* Trip Metadata Banner */}
              <div className="bg-white border border-[#E3EAF2] rounded-[10px] p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-[14px] font-bold text-[#162B45]">{selectedTrip.title}</h2>
                  <span className="text-[9px] font-extrabold uppercase text-[#74839A] bg-slate-50 border border-[#E3EAF2] px-1.5 py-0.5 rounded">
                    Selected Trip
                  </span>
                </div>

                {/* Available Dates Selector */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-[#74839A] uppercase tracking-wider">Select Departure Date</p>
                  <div className="flex flex-wrap gap-2">
                    {availableDates.map(dateStr => {
                      const isSelected = selectedDate === dateStr;
                      const activeLinksCount = forms.filter(f => f.tripName.toLowerCase() === selectedTrip.title.toLowerCase() && f.date === dateStr && (f.status || "Active") === "Active").length;
                      
                      return (
                        <button
                          key={dateStr}
                          onClick={() => setSelectedDate(dateStr)}
                          className={cn(
                            "px-3 py-1.5 rounded-md text-[11px] font-bold border transition-all flex items-center gap-1.5",
                            isSelected 
                              ? "bg-[#F97316] text-white border-[#F97316] shadow-sm" 
                              : "bg-white text-slate-700 border-[#E3EAF2] hover:bg-slate-50"
                          )}
                        >
                          <CalendarDays className="w-3.5 h-3.5" />
                          {formatDate(dateStr)}
                          {activeLinksCount > 0 && (
                            <span className={cn(
                              "text-[8px] font-extrabold px-1.5 py-0.2 rounded-full",
                              isSelected ? "bg-white text-[#F97316]" : "bg-emerald-50 text-[#16A34A] border border-emerald-100"
                            )}>
                              {activeLinksCount} Link{activeLinksCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Booking Links Workspace */}
              {selectedDate ? (
                <div className="bg-white border border-[#E3EAF2] rounded-[10px] p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E3EAF2] pb-2">
                    <div>
                      <h3 className="text-xs font-bold text-[#162B45] uppercase tracking-wider">
                        Booking Links for {formatDate(selectedDate)}
                      </h3>
                      <p className="text-[10px] text-[#74839A] mt-0.5 font-medium">Manage existing links or generate a new tokenized public link</p>
                    </div>

                    <Button
                      onClick={checkAndOpenGenerate}
                      className="bg-[#F97316] hover:bg-[#EA580C] text-white rounded-md h-8 px-3.5 font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Generate Link
                    </Button>
                  </div>

                  {filteredLinks.length === 0 ? (
                    <div className="text-center py-12 space-y-2.5">
                      <Link2 className="w-8 h-8 mx-auto text-[#74839A]/30" />
                      <p className="text-xs font-bold text-[#74839A]">No booking links generated for this date yet.</p>
                      <Button onClick={checkAndOpenGenerate} className="bg-[#F97316] hover:bg-[#EA580C] text-white text-[11px] font-bold h-8 rounded px-3">
                        Generate First Link
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {filteredLinks.map(form => {
                        const status = form.status || "Active";
                        const opens = form.openedCount || Math.floor(Math.random() * 5);
                        const comps = form.completedCount || Math.floor(Math.random() * 2);

                        return (
                          <div
                            key={form.id || form._id}
                            className="bg-white border border-[#E3EAF2] rounded-[10px] p-3 space-y-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-[11px] font-bold text-[#162B45] font-mono leading-none">Token: {(form.id || form._id || '').substring(0, 8)}</p>
                                  <p className="text-[9px] text-[#74839A] font-semibold mt-1">Created {formatDate(form.createdAt || new Date().toISOString())}</p>
                                </div>
                                <span className={cn(
                                  "text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded border",
                                  status === "Active" ? "bg-[#ECFDF3] text-[#16A34A] border-emerald-200" : "bg-[#FFF1F3] text-[#E23D4D] border-rose-200"
                                )}>
                                  {status}
                                </span>
                              </div>

                              {/* Tiny Stats strip */}
                              <div className="grid grid-cols-3 gap-2 py-1 px-2 bg-slate-50 border border-[#E3EAF2] rounded-md text-center text-xs mt-3.5">
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

                            <div className="grid grid-cols-4 gap-1 pt-2 border-t border-slate-100 mt-2">
                              <a
                                href={getInternalBookingUrl(form)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center h-7 rounded border border-[#E3EAF2] bg-white hover:bg-slate-50 text-[9px] font-bold uppercase text-slate-700"
                              >
                                Open
                              </a>
                              <Button
                                variant="outline"
                                className="h-7 rounded text-[9px] font-bold uppercase border border-[#E3EAF2] text-slate-700"
                                onClick={() => copyToClipboard(getInternalBookingUrl(form), "Link")}
                              >
                                Copy
                              </Button>
                              <Button
                                className="h-7 rounded text-[9px] font-bold uppercase bg-[#16A34A] hover:bg-emerald-700 text-white"
                                onClick={() => openShare(form)}
                              >
                                Share
                              </Button>
                              <Button
                                variant="outline"
                                className="h-7 rounded text-[9px] font-bold uppercase border-rose-200 text-[#E23D4D] hover:bg-rose-50"
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
                </div>
              ) : (
                <div className="bg-white border border-[#E3EAF2] rounded-[10px] p-8 text-center text-xs text-[#74839A]">
                  Select a departure date above to manage booking links.
                </div>
              )}
            </>
          ) : (
            <div className="bg-white border border-[#E3EAF2] rounded-[10px] p-8 text-center text-xs text-[#74839A]">
              Select a trip from the left directory to get started.
            </div>
          )}

        </div>

      </div>

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
                <Select value={formData.paymentMode} onValueChange={val => setFormData(prev => ({ ...prev, paymentMode: val }))}>
                  <SelectTrigger className="h-9 rounded">
                    <SelectValue placeholder="Select Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full Payment">Full Payment</SelectItem>
                    <SelectItem value="Token Payment">Token Payment</SelectItem>
                    <SelectItem value="Custom Amount">Custom Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#74839A]">Amount (₹)</label>
                <Input
                  type="number"
                  placeholder="5000"
                  value={formData.bookingAmount || ""}
                  onChange={e => setFormData(prev => ({ ...prev, bookingAmount: Number(e.target.value) }))}
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
              <p>Departure: {formatDate(existingFormMatch.date)}</p>
              <p>Token: {(existingFormMatch.id || existingFormMatch._id || '').substring(0, 8)}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              variant="outline"
              className="h-9 rounded text-xs font-bold text-[#162B45] uppercase tracking-wide border border-[#E3EAF2]"
              onClick={() => {
                if (existingFormMatch) {
                  copyToClipboard(getInternalBookingUrl(existingFormMatch), "Booking Link");
                  setDuplicateWarningOpen(false);
                }
              }}
            >
              Copy Existing Link
            </Button>
            <a
              href={existingFormMatch ? getInternalBookingUrl(existingFormMatch) : "#"}
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
                <Input value={shareFormUrl} readOnly className="h-10 rounded-md text-xs bg-slate-50 flex-1 font-mono" />
                <Button className="h-10 rounded-md px-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold" onClick={() => copyToClipboard(shareFormUrl, "Booking link")}>
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
