import { useCallback, useEffect, useMemo, useState } from "react";
import { bookingLinksService, type BookingLinkRecord } from "@/services/bookingLinks.service";
import { tripsService } from "@/services/trips.service";
import type { Trip } from "@/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, Loader2, MapPin, Plus, Share2, Trash2, Link2, CalendarDays, BadgeCheck, BadgeX } from "lucide-react";
import { cn } from "@/lib/utils";

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
};

const normalizeDateInput = (value: string) => {
  // Keep yyyy-mm-dd for HTML date input
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toISOString().slice(0, 10);
};

const getTripPickupCities = (trip: any): string[] => {
  if (!trip) return [];
  if (Array.isArray(trip.variants) && trip.variants.length > 0) {
    return trip.variants.map((v: any) => v?.location).filter(Boolean);
  }
  if (Array.isArray(trip.pickupCities) && trip.pickupCities.length > 0) {
    return trip.pickupCities.map((c: any) => c?.cityName).filter(Boolean);
  }
  return [];
};

export default function BookingLinksPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [links, setLinks] = useState<BookingLinkRecord[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [analytics, setAnalytics] = useState<{
    linksGenerated: number;
    opened: number;
    completedBookings: number;
    revenueGenerated: number;
  } | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareMsg, setShareMsg] = useState("");

  const [formData, setFormData] = useState({
    tripId: "",
    tripName: "",
    departureDate: "",
    paymentMode: "Full Payment" as "Full Payment" | "Partial Payment",
    customAmount: 2000,
    pickupCity: "",
    customTime: "9:00 AM – 6:00 PM IST",
    headerTitle: "Talk That Damn Point",
    headerSubtitle: "Join the wait list for Before Monday Begins",
    expiresAt: "",
  });

  const selectedTrip = useMemo(() => trips.find((t) => t.id === formData.tripId) || null, [trips, formData.tripId]);

  const pickupCities = useMemo(() => {
    return getTripPickupCities(selectedTrip);
  }, [selectedTrip]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [linksData, tripsData, analyticsData] = await Promise.all([
        bookingLinksService.getAll(),
        tripsService.getAll(),
        bookingLinksService.getAnalytics(),
      ]);
      setLinks(Array.isArray(linksData) ? linksData : []);
      setTrips(Array.isArray(tripsData) ? tripsData : []);
      setAnalytics(analyticsData || null);
    } catch {
      toast.error("Failed to load booking links");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleTripSelect = (tripId: string) => {
    const trip = trips.find((t) => t.id === tripId);
    const cities = getTripPickupCities(trip);
    setFormData((prev) => ({
      ...prev,
      tripId,
      tripName: trip?.title || "",
      pickupCity: cities.length > 0 ? cities[0] : prev.pickupCity,
    }));
  };

  const openShare = (link: BookingLinkRecord) => {
    const url = link.shareUrl || "";
    if (!url) {
      toast.error("Share URL not available");
      return;
    }
    setShareUrl(url);
    const dateStr = formData.departureDate ? formatDate(formData.departureDate) : "";
    const tripStr = link.tripName || formData.tripName || "";
    const msg = `Hello\n\nPlease complete your booking here:\n${url}\n\nTrip: ${tripStr}\nDate: ${dateStr}\n\nTeam YouthCamping`;
    setShareMsg(msg);
    setShareOpen(true);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const openWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMsg)}`;
    window.open(url, "_blank");
  };

  const handleGenerate = async () => {
    if (!formData.tripId || !formData.departureDate || !formData.pickupCity) {
      toast.error("Select Trip, Departure Date, and Pickup City");
      return;
    }
    setGenerating(true);
    try {
      const result = await bookingLinksService.create({
        tripId: formData.tripId,
        departureDate: formData.departureDate,
        paymentMode: formData.paymentMode,
        customAmount: Number(formData.customAmount) || 0,
        pickupCity: formData.pickupCity,
        customTime: formData.customTime || undefined,
        headerTitle: formData.headerTitle || undefined,
        headerSubtitle: formData.headerSubtitle || undefined,
        expiresAt: formData.expiresAt ? formData.expiresAt : null,
      });

      toast.success("Booking link generated");
      setCreateOpen(false);

      // Open share UI
      openShare(result);

      // Reload list
      await load();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to generate booking link";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await bookingLinksService.revoke(id);
      toast.success("Link revoked");
      await load();
    } catch {
      toast.error("Failed to revoke link");
    }
  };

  const statusBadge = (status: string) => {
    if (status === "active") return <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />;
    if (status === "expired") return <BadgeX className="h-3.5 w-3.5 text-amber-700" />;
    return <BadgeX className="h-3.5 w-3.5 text-rose-600" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground uppercase tracking-tighter">
            Booking Links
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground font-medium mt-1">
            Generate and share tokenized booking links per trip & date.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="w-full sm:w-auto rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="h-4 w-4" /> Generate Link
        </Button>
      </div>

      {/* ─── Analytics row ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white border-2 border-border rounded-2xl p-4 md:p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Link2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Links generated</p>
            <p className="text-xl md:text-2xl font-black">{analytics?.linksGenerated ?? 0}</p>
          </div>
        </div>
        <div className="bg-white border-2 border-border rounded-2xl p-4 md:p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Opened</p>
            <p className="text-xl md:text-2xl font-black">{analytics?.opened ?? 0}</p>
          </div>
        </div>
        <div className="bg-white border-2 border-border rounded-2xl p-4 md:p-5 flex items-center gap-4 sm:col-span-2 lg:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Completed + Revenue</p>
            <p className="text-xl md:text-2xl font-black">
              {analytics?.completedBookings ?? 0} / ₹{(analytics?.revenueGenerated ?? 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* ─── List ─── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : links.length === 0 ? (
        <div className="text-center py-24 bg-muted/20 rounded-[32px] border-2 border-dashed border-border">
          <Link2 className="h-14 w-14 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-black uppercase tracking-tight text-muted-foreground">
            No Booking Links Yet
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Generate your first tokenized booking link for a trip. Customers complete the form using the shared link.
          </p>
          <Button
            onClick={() => setCreateOpen(true)}
            className="mt-6 rounded-xl h-11 px-8 font-black uppercase text-[10px] tracking-widest"
          >
            <Plus className="h-4 w-4 mr-2" /> Create First Link
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {links.map((link) => (
            <div
              key={link.id}
              className="bg-white border-2 border-border rounded-2xl p-6 space-y-4 hover:shadow-xl hover:border-primary/30 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-sm uppercase tracking-tight truncate">
                    {link.tripName || "Untitled Trip"}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                      <CalendarDays className="h-3 w-3" /> {formatDate(link.departureDate)}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      Token: <span className="font-mono">{link.tokenPrefix}</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(link.status)}
                  <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">
                    {link.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 text-xs font-bold">
                <span className="text-muted-foreground">
                  Opens: <span className="text-foreground">{link.openedCount}</span>
                </span>
                <span className="text-muted-foreground">
                  Completed: <span className="text-foreground">{link.completedCount}</span>
                </span>
              </div>

              <div className="flex gap-2">
                <a
                  href={link.shareUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "flex items-center justify-center gap-2 h-10 rounded-xl border-2 border-border bg-muted/30 text-xs font-bold uppercase tracking-wider hover:bg-muted/60 transition-colors",
                    !link.shareUrl && "pointer-events-none opacity-60"
                  )}
                >
                  <Link2 className="h-3.5 w-3.5 text-primary" /> Open Link
                </a>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!link.shareUrl) return toast.error("Share URL not available");
                    copyToClipboard(link.shareUrl, "Link");
                  }}
                  className="h-10 rounded-xl text-[10px] font-black uppercase tracking-wider gap-2"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (!link.shareUrl) return toast.error("Share URL not available");
                    const msg = `Hello\n\nPlease complete your booking here:\n${link.shareUrl}\n\nTrip: ${link.tripName || ""}\nDate: ${formatDate(
                      link.departureDate
                    )}\n\nTeam YouthCamping`;
                    setShareUrl(link.shareUrl || "");
                    setShareMsg(msg);
                    setShareOpen(true);
                  }}
                  className="flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Share2 className="h-3 w-3" /> Share
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRevoke(link.id)}
                  disabled={link.status !== "active"}
                  className="flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-600" /> Revoke
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── CREATE MODAL ─── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[520px] w-[95vw] max-h-[95dvh] overflow-y-auto custom-scrollbar p-4 md:p-6 rounded-[24px] md:rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight text-lg">
              Generate Booking Link
            </DialogTitle>
            <DialogDescription className="sr-only">Select trip and parameters to generate a booking link.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Select Trip *
              </label>
              <Select value={formData.tripId} onValueChange={handleTripSelect}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Choose a trip..." />
                </SelectTrigger>
                <SelectContent>
                  {trips.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Departure Date *
                </label>
                <Input
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => setFormData((p) => ({ ...p, departureDate: normalizeDateInput(e.target.value) }))}
                  className="h-12 rounded-xl font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Expiry Date (optional)
                </label>
                <Input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData((p) => ({ ...p, expiresAt: normalizeDateInput(e.target.value) }))}
                  className="h-12 rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Pickup / Joining City *
              </label>

              {pickupCities.length > 0 ? (
                <Select
                  value={formData.pickupCity}
                  onValueChange={(v) => setFormData((p) => ({ ...p, pickupCity: v }))}
                >
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Choose pickup city..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pickupCities.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Enter pickup city"
                  value={formData.pickupCity}
                  onChange={(e) => setFormData((p) => ({ ...p, pickupCity: e.target.value }))}
                  className="h-12 rounded-xl font-bold"
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Payment Mode *
              </label>
              <Select
                value={formData.paymentMode}
                onValueChange={(v) => setFormData((p) => ({ ...p, paymentMode: v as any }))}
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

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Custom Booking Amount (deposit per traveler) *
              </label>
              <Input
                type="number"
                value={formData.customAmount}
                onChange={(e) => setFormData((p) => ({ ...p, customAmount: Number(e.target.value) || 0 }))}
                className="h-12 rounded-xl font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Event Time (shown on booking page)
              </label>
              <Input
                type="text"
                placeholder="e.g. 9:00 AM – 6:00 PM IST"
                value={formData.customTime}
                onChange={(e) => setFormData((p) => ({ ...p, customTime: e.target.value }))}
                className="h-12 rounded-xl font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Header Title (booking page logo text)
              </label>
              <Input
                type="text"
                placeholder="e.g. Talk That Damn Point"
                value={formData.headerTitle}
                onChange={(e) => setFormData((p) => ({ ...p, headerTitle: e.target.value }))}
                className="h-12 rounded-xl font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Header Subtitle (CTA button text)
              </label>
              <Input
                type="text"
                placeholder="e.g. Join the wait list for Before Monday Begins"
                value={formData.headerSubtitle}
                onChange={(e) => setFormData((p) => ({ ...p, headerSubtitle: e.target.value }))}
                className="h-12 rounded-xl font-bold"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
              <strong>Note:</strong> The booking link token is validated on access, and the link can be revoked from this dashboard.
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
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── SHARE MODAL ─── */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-[520px] w-[95vw] max-h-[95dvh] overflow-y-auto custom-scrollbar p-4 md:p-6 rounded-[24px] md:rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" /> Share Booking Link
            </DialogTitle>
            <DialogDescription className="sr-only">Copy and share the booking link.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Booking Link</label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="h-10 rounded-xl text-xs font-mono bg-muted/30"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-xl flex-shrink-0"
                  onClick={() => copyToClipboard(shareUrl, "Link")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

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
                <Share2 className="h-4 w-4" /> Send WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

