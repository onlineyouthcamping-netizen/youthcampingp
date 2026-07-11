import { useEffect, useState, useCallback } from "react";
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
  CalendarDays, MapPin, Send
} from "lucide-react";

export default function BookingFormsPage() {
  const [forms, setForms] = useState<BookingFormRecord[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const [shareFormUrl, setShareFormUrl] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [formToEdit, setFormToEdit] = useState<BookingFormRecord | null>(null);

  const [formData, setFormData] = useState({
    tripName: "",
    date: "",
    tripId: "",
    paymentMode: "Full Payment",
    bookingAmount: 0
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [formsData, tripsData] = await Promise.all([
        bookingFormsService.getAll(),
        tripsService.getAll()
      ]);
      setForms(formsData);
      setTrips(Array.isArray(tripsData) ? tripsData : []);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleTripSelect = (tripId: string) => {
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      setFormData(prev => ({
        ...prev,
        tripName: trip.title,
        tripId: trip.id
      }));
    }
  };

  const handleGenerate = async () => {
    if (!formData.tripName.trim() || !formData.date) {
      toast.error("Select a trip and date");
      return;
    }

    setGenerating(true);
    try {
      const result = await bookingFormsService.create(formData);
      toast.success("Booking form created!");
      setCreateOpen(false);
      setFormData({ tripName: "", date: "", tripId: "" });
      load();

      // Auto-open share dialog
      openShare(result);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to generate form";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const getInternalBookingUrl = (form: BookingFormRecord) => {
    // Strictly use VITE_FRONTEND_URL from environment for production
    const baseUrl = import.meta.env.VITE_FRONTEND_URL || "https://youthcamping.online";
    
    const params = new URLSearchParams({
      trip: (form.tripName || '').trim(),
      date: (form.date || '').trim(),
      tid: (form.tripId || '').trim(),
      payMode: form.paymentMode || 'Full Payment',
      bookAmt: (form.bookingAmount || 0).toString()
    });
    
    console.log("🔗 [Admin] Generated Booking Link:", `${baseUrl}/book?${params.toString()}`);
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

  const handleUpdate = async () => {
    if (!formToEdit) return;
    setGenerating(true);
    try {
      await bookingFormsService.update(formToEdit.id || formToEdit._id!, {
        sheetUrl: formToEdit.sheetUrl,
        tripName: formToEdit.tripName,
        date: formToEdit.date,
        paymentMode: formToEdit.paymentMode,
        bookingAmount: formToEdit.bookingAmount
      });
      toast.success("Link updated!");
      setEditOpen(false);
      load();
    } catch {
      toast.error("Failed to update");
    } finally {
      setGenerating(false);
    }
  };

  const openEdit = (form: BookingFormRecord) => {
    setFormToEdit({ ...form });
    setEditOpen(true);
  };

  const openWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMsg)}`;
    window.open(url, "_blank");
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch { return dateStr; }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground uppercase tracking-tighter">Booking Forms</h1>
          <p className="text-xs md:text-sm text-muted-foreground font-medium mt-1">
            Generate Google Form links per trip & date — auto-synced to Google Sheets
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="w-full sm:w-auto rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="h-4 w-4" /> Generate Form Link
        </Button>
      </div>

      {/* ─── Info Banner ─── */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row items-start gap-4">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <Link2 className="h-5 w-5 md:h-6 md:w-6 text-emerald-700" />
        </div>
        <div>
          <h3 className="font-black text-xs md:text-sm uppercase tracking-tight text-emerald-900">How It Works</h3>
          <p className="text-[10px] md:text-xs text-emerald-700 mt-1 leading-relaxed">
            <strong>1.</strong> Select a trip and travel date →{" "}
            <strong>2.</strong> System creates a Google Form + Sheet →{" "}
            <strong>3.</strong> Share the link with clients →{" "}
            <strong>4.</strong> Responses auto-flow to a sheet named <code className="bg-emerald-100 px-1 rounded font-mono text-[10px]">TripName-Date</code>
          </p>
        </div>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white border-2 border-border rounded-2xl p-4 md:p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Link2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total Forms</p>
            <p className="text-xl md:text-2xl font-black">{forms.length}</p>
          </div>
        </div>
        <div className="bg-white border-2 border-border rounded-2xl p-4 md:p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Unique Trips</p>
            <p className="text-xl md:text-2xl font-black">
              {new Set(forms.map(f => f.tripName)).size}
            </p>
          </div>
        </div>
        <div className="bg-white border-2 border-border rounded-2xl p-4 md:p-5 flex items-center gap-4 sm:col-span-2 lg:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Travel Dates</p>
            <p className="text-xl md:text-2xl font-black">
              {new Set(forms.map(f => f.date)).size}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Forms List ─── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-44 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-24 bg-muted/20 rounded-[32px] border-2 border-dashed border-border">
          <Link2 className="h-14 w-14 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-black uppercase tracking-tight text-muted-foreground">No Booking Forms Yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Generate your first booking form link for a trip. Clients fill the form, data goes straight to Google Sheets.
          </p>
          <Button
            onClick={() => setCreateOpen(true)}
            className="mt-6 rounded-xl h-11 px-8 font-black uppercase text-[10px] tracking-widest"
          >
            <Plus className="h-4 w-4 mr-2" /> Create First Form
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forms.map((form) => (
            <div
              key={form.id || form._id}
              className="bg-white border-2 border-border rounded-2xl p-6 space-y-4 hover:shadow-xl hover:border-primary/30 transition-all group"
            >
              {/* Title Row */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-sm uppercase tracking-tight truncate">
                    {form.tripName}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                      <CalendarDays className="h-3 w-3" /> {formatDate(form.date)}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      Created {formatDate(form.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(form);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDelete(form.id || form._id!);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={getInternalBookingUrl(form)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 h-10 rounded-xl border-2 border-border bg-muted/30 text-xs font-bold uppercase tracking-wider hover:bg-muted/60 transition-colors"
                >
                  <Link2 className="h-3.5 w-3.5 text-primary" /> Open Link
                </a>
                <Button
                  variant="ghost"
                  asChild
                  disabled={!form.sheetUrl || !form.sheetUrl.startsWith('http')}
                  className={`flex items-center justify-center gap-2 h-10 rounded-xl border-2 border-border bg-muted/30 text-xs font-bold uppercase tracking-wider transition-colors ${(!form.sheetUrl || !form.sheetUrl.startsWith('http')) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/60'}`}
                >
                  {form.sheetUrl && form.sheetUrl.startsWith('http') ? (
                    <a href={form.sheetUrl} target="_blank" rel="noreferrer">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> View Sheet
                    </a>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" /> No Sheet
                    </div>
                  )}
                </Button>

              </div>

              {/* Share Row */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider gap-1.5"
                  onClick={() => copyToClipboard(form.formUrl, "Form link")}
                >
                  <Copy className="h-3 w-3" /> Copy Link
                </Button>
                <Button
                  size="sm"
                  className="flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => openShare(form)}
                >
                  <Share2 className="h-3 w-3" /> Share
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── CREATE MODAL ─── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[480px] w-[95vw] max-h-[95dvh] overflow-y-auto custom-scrollbar p-4 md:p-6 rounded-[24px] md:rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight text-lg">
              Generate Booking Form
            </DialogTitle>
            <DialogDescription className="sr-only">Select a trip and date to generate a booking form.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Select Trip *
              </label>
              <Select onValueChange={handleTripSelect}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Choose a trip..." />
                </SelectTrigger>
                <SelectContent>
                  {trips.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {t.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {formData.tripName && (
                <p className="text-xs text-muted-foreground font-medium">
                  Selected: <span className="font-bold text-foreground">{formData.tripName}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Or Enter Trip Name Manually
              </label>
              <Input
                placeholder="e.g. Manali Kasol Backpacking"
                value={formData.tripName}
                onChange={(e) => setFormData(prev => ({ ...prev, tripName: e.target.value }))}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Travel Date *
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="h-12 rounded-xl font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Payment Mode *
                </label>
                <Select 
                  value={formData.paymentMode} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, paymentMode: v }))}
                >
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full Payment">Full Payment</SelectItem>
                    <SelectItem value="Partial Payment">Partial Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.paymentMode === "Partial Payment" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Booking Amount *
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 2000"
                    value={formData.bookingAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, bookingAmount: parseFloat(e.target.value) || 0 }))}
                    className="h-12 rounded-xl font-bold"
                  />
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
              <strong>Note:</strong> If a form already exists for this trip + date, the existing one will be returned instead of creating a duplicate.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="rounded-xl font-black uppercase text-xs tracking-widest gap-2 min-w-[180px]"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating Form...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" /> Generate Link
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── SHARE MODAL ─── */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-[480px] w-[95vw] max-h-[95dvh] overflow-y-auto custom-scrollbar p-4 md:p-6 rounded-[24px] md:rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" /> Share Booking Link
            </DialogTitle>
            <DialogDescription className="sr-only">Copy and share the booking form link.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Form URL */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Form Link</label>
              <div className="flex gap-2">
                <Input
                  value={shareFormUrl}
                  readOnly
                  className="h-10 rounded-xl text-xs font-mono bg-muted/30"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-xl flex-shrink-0"
                  onClick={() => copyToClipboard(shareFormUrl, "Form link")}
                >
                  <ClipboardCheck className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Share Message */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                Share Message (WhatsApp / SMS)
              </label>
              <textarea
                value={shareMsg}
                onChange={(e) => setShareMsg(e.target.value)}
                rows={7}
                className="w-full rounded-xl border-2 border-border p-4 text-sm font-medium bg-muted/20 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(shareMsg, "Message")}
                className="rounded-xl h-11 font-black uppercase text-[10px] tracking-widest gap-2"
              >
                <Copy className="h-4 w-4" /> Copy Message
              </Button>
              <Button
                onClick={openWhatsApp}
                className="rounded-xl h-11 font-black uppercase text-[10px] tracking-widest gap-2 bg-[#25D366] hover:bg-[#1da851] text-white"
              >
                <MessageCircle className="h-4 w-4" /> Send WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── EDIT MODAL ─── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[480px] w-[95vw] max-h-[95dvh] overflow-y-auto custom-scrollbar p-4 md:p-6 rounded-[24px] md:rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight text-lg">
              Edit Booking Form Link
            </DialogTitle>
            <DialogDescription className="sr-only">Edit the google sheet link associated with this booking form.</DialogDescription>
          </DialogHeader>

          {formToEdit && (
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Trip Name
                </label>
                <Input
                  value={formToEdit.tripName}
                  onChange={(e) => setFormToEdit({ ...formToEdit, tripName: e.target.value })}
                  className="h-12 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Google Sheet URL
                </label>
                <Input
                  placeholder="Paste Google Sheet URL here..."
                  value={formToEdit.sheetUrl}
                  onChange={(e) => setFormToEdit({ ...formToEdit, sheetUrl: e.target.value })}
                  className="h-12 rounded-xl"
                />
                <p className="text-[10px] text-muted-foreground mt-1 px-1">
                  If the automatic creation failed, you can manually paste the link here.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Payment Mode
                  </label>
                  <Select 
                    value={formToEdit.paymentMode} 
                    onValueChange={(v) => setFormToEdit({ ...formToEdit, paymentMode: v })}
                  >
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full Payment">Full Payment</SelectItem>
                      <SelectItem value="Partial Payment">Partial Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formToEdit.paymentMode === "Partial Payment" && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Booking Amount
                    </label>
                    <Input
                      type="number"
                      value={formToEdit.bookingAmount}
                      onChange={(e) => setFormToEdit({ ...formToEdit, bookingAmount: parseFloat(e.target.value) || 0 })}
                      className="h-12 rounded-xl font-bold"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={generating}
              className="rounded-xl font-black uppercase text-xs tracking-widest gap-2"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── DELETE CONFIRMATION ─── */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-[24px] md:rounded-3xl border-2 w-[95vw] max-w-[400px] p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black uppercase tracking-tight text-xl">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-slate-600">
              This will remove the booking form record from your dashboard. 
              <span className="block mt-2 font-bold text-red-500 uppercase text-[10px] tracking-widest">
                Note: The actual Google Form and Sheet will NOT be deleted.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
            >
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
