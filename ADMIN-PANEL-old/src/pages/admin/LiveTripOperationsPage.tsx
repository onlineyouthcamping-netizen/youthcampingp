import React, { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/auth.store";
import { guideService, Assignment } from "@/services/guide.service";
import { settingsService } from "@/services/settings.service";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Calendar,
  User,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Utensils,
  Camera,
  Compass,
  Lock,
  Plus,
  Trash2,
  Activity,
  Star,
  RefreshCw,
} from "lucide-react";

export default function LiveTripOperationsPage() {
  const { admin } = useAuthStore();

  // Settings for Sales Permissions
  const [settings, setSettings] = useState<any>(null);
  const [newSalesEmail, setNewSalesEmail] = useState("");

  // Data States
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [timeline, setTimeline] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [travelers, setTravelers] = useState<any[]>([]);
  const [statsTab, setStatsTab] = useState<"overview" | "travelers">("overview");
  const [syncingTraveler, setSyncingTraveler] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  // Load Initial Configurations & Assignments
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // 1. Fetch settings
      const settingsData = await settingsService.get();
      setSettings(settingsData || {});

      // 2. Fetch assignments
      const assignList = await guideService.getAssignments();
      setAssignments(assignList);
    } catch (e) {
      console.error("Failed to load initial operations metadata", e);
      toast.error("Failed to fetch initial page configurations");
    }
  };

  // Check Permissions for current user
  const isSales = admin?.role === "sales";
  const allowedEmails = settings?.allowedSalesEmails || [];
  const isAllowedSales = isSales && allowedEmails.includes(admin?.email);
  const hasAccess = admin?.role === "admin" || admin?.role === "superadmin" || isAllowedSales;

  // Load dynamic operations timeline and statistics based on filters
  useEffect(() => {
    if (!hasAccess) return;
    loadTimelineAndStats();
  }, [selectedAssignmentId, selectedType, selectedDate, hasAccess]);

  const loadTimelineAndStats = async () => {
    setLoading(true);
    try {
      const parsedAssignId = selectedAssignmentId !== "all" ? parseInt(selectedAssignmentId, 10) : undefined;
      
      // 1. Load alerts
      const activeAlerts = await guideService.getLiveOperationsAlerts();
      setAlerts(activeAlerts || []);

      // 2. Load timeline
      const filters: any = {};
      if (parsedAssignId) filters.assignmentId = parsedAssignId;
      if (selectedType !== "all") filters.type = selectedType;
      if (selectedDate) filters.date = selectedDate;

      const timelineItems = await guideService.getLiveOperationsTimeline(filters);
      setTimeline(timelineItems || []);

      // 3. Load stats and travelers if a specific trip/assignment is selected
      if (parsedAssignId) {
        const statsData = await guideService.getLiveOperationsStats(parsedAssignId);
        setStats(statsData);

        const travelersData = await guideService.getAssignmentTravelers(parsedAssignId);
        setTravelers(travelersData || []);
      } else {
        setStats(null);
        setTravelers([]);
      }
    } catch (e) {
      console.error("Failed to load operations data:", e);
      toast.error("Error loading live operations updates");
    } finally {
      setLoading(false);
    }
  };

  // Sync Food preference to Main Backend Booking
  const handleSyncFoodPreference = async (traveler: any, newPref: string) => {
    if (!traveler.bookingCuid) {
      toast.error("Missing internal booking reference for sync");
      return;
    }
    setSyncingTraveler(traveler.name);
    try {
      await guideService.syncFoodPreference(
        traveler.bookingCuid,
        traveler.bookingId,
        traveler.name,
        newPref,
        traveler.isPrimaryBooker
      );
      toast.success(`Food preference synced successfully for ${traveler.name}`);
      loadTimelineAndStats();
    } catch (e) {
      console.error("Failed to sync food preference:", e);
      toast.error("Failed to sync food preference to booking database");
    } finally {
      setSyncingTraveler(null);
    }
  };

  // Add a Sales user to allowed list
  const handleAddSalesEmail = async () => {
    if (!newSalesEmail.trim()) return;
    try {
      const updatedEmails = [...(settings?.allowedSalesEmails || [])];
      if (!updatedEmails.includes(newSalesEmail.trim())) {
        updatedEmails.push(newSalesEmail.trim());
      }

      const updatedSettings = {
        ...settings,
        allowedSalesEmails: updatedEmails,
      };

      await settingsService.update(updatedSettings);
      setSettings(updatedSettings);
      setNewSalesEmail("");
      toast.success("Sales agent permission granted successfully!");
    } catch (e) {
      console.error("Failed to save sales permissions:", e);
      toast.error("Error updating system settings");
    }
  };

  // Remove a Sales user from allowed list
  const handleRemoveSalesEmail = async (emailToRemove: string) => {
    try {
      const updatedEmails = (settings?.allowedSalesEmails || []).filter(
        (email: string) => email !== emailToRemove
      );

      const updatedSettings = {
        ...settings,
        allowedSalesEmails: updatedEmails,
      };

      await settingsService.update(updatedSettings);
      setSettings(updatedSettings);
      toast.success("Sales agent permission revoked.");
    } catch (e) {
      console.error("Failed to revoke sales permissions:", e);
      toast.error("Error updating system settings");
    }
  };

  // Approve Hotel stay check-in / Mark hotel updates Done
  const handleApproveHotel = async (hotelUpdateId: number) => {
    setResolvingId(hotelUpdateId);
    try {
      await guideService.approveHotelUpdate(hotelUpdateId, "done", "Approved and verified by Admin");
      toast.success("Hotel check-in stay verified successfully!");
      loadTimelineAndStats();
    } catch (e) {
      console.error("Failed to approve hotel update:", e);
      toast.error("Failed to update hotel status");
    } finally {
      setResolvingId(null);
    }
  };

  // Export Combined Operational Data to CSV
  const handleExportCSV = () => {
    if (timeline.length === 0) {
      toast.warning("No operational data available to export");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Timestamp,Trip/Tour,Guide Name,Update Type,Location,Status,Details,Guide Notes,Media Links\r\n";

    timeline.forEach((item) => {
      const time = new Date(item.timestamp).toLocaleString();
      const trip = `"${item.tripName.replace(/"/g, '""')}"`;
      const guide = `"${item.guideName.replace(/"/g, '""')}"`;
      const type = item.type.toUpperCase();
      const loc = `"${(item.location || "").replace(/"/g, '""')}"`;
      const status = item.status.toUpperCase();
      const notes = `"${(item.notes || "").replace(/"/g, '""')}"`;
      const details = `"${JSON.stringify(item.details || {}).replace(/"/g, '""')}"`;
      const media = `"${[item.photoUrl, item.videoUrl].filter(Boolean).join(" | ")}"`;

      csvContent += `${time},${trip},${guide},${type},${loc},${status},${details},${notes},${media}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Trip_Operations_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Operations report downloaded successfully.");
  };

  // Render Access Denied state if sales user is unauthorized
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 mb-6">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2">Access Restricted</h1>
        <p className="text-slate-500 font-medium max-w-md text-sm leading-relaxed mb-6">
          Live operational data contains active guide movements and traveler information. 
          Your sales account does not currently have permissions to view this panel.
        </p>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Contact System Administrator to request access
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">Live Trip Operations</h1>
          <p className="text-muted-foreground font-medium text-sm">Monitor guides transit updates, hotel room checks, food quality, and traveler syncs live.</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadTimelineAndStats}
            variant="outline"
            className="rounded-xl font-bold uppercase text-[10px] tracking-wider h-11"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button
            onClick={handleExportCSV}
            className="bg-primary hover:bg-primary/90 text-white rounded-xl font-bold uppercase text-[10px] tracking-wider h-11 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Export CSV Report
          </Button>
        </div>
      </div>

      {/* Grid of Anomalies alerts & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Alerts panel */}
        <Card className="lg:col-span-1 border-2 rounded-3xl overflow-hidden shadow-sm">
          <CardHeader className="bg-slate-50 border-b p-5">
            <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-500" /> Real-time Anomaly Detector
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4 max-h-[350px] overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                ✓ No active issues reported
              </div>
            ) : (
              alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border-l-4 ${
                    alert.severity === "critical"
                      ? "bg-rose-50 border-rose-500 text-rose-800"
                      : alert.severity === "high"
                      ? "bg-amber-50 border-amber-500 text-amber-800"
                      : "bg-blue-50 border-blue-500 text-blue-800"
                  } space-y-1.5`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {alert.type.replace("_", " ")}
                    </span>
                    <Badge variant="outline" className="text-[9px] uppercase font-bold border-current">
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed">{alert.message}</p>
                  <div className="text-[9px] font-bold opacity-80">
                    Trip: {alert.tripName} · Guide: {alert.guideName}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Selected Trip traveler counts and synced meal preferences */}
        <Card className="lg:col-span-2 border-2 rounded-3xl overflow-hidden shadow-sm">
          <CardHeader className="bg-slate-50 border-b p-5">
            <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-primary" /> Live Traveler Sync Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {stats ? (
              <div className="space-y-6">
                {/* Tab switcher */}
                <div className="flex gap-2 border-b pb-3">
                  <Button
                    variant={statsTab === "overview" ? "default" : "outline"}
                    onClick={() => setStatsTab("overview")}
                    className="rounded-xl text-[10px] font-bold uppercase tracking-wider h-9"
                  >
                    Overview & Stats
                  </Button>
                  <Button
                    variant={statsTab === "travelers" ? "default" : "outline"}
                    onClick={() => setStatsTab("travelers")}
                    className="rounded-xl text-[10px] font-bold uppercase tracking-wider h-9"
                  >
                    Travelers & Meal Sync ({travelers.length})
                  </Button>
                </div>

                {statsTab === "overview" ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Traveler Ratio</Label>
                        <div className="text-2xl font-black mt-1">{stats.totalParticipants} Guests</div>
                        <div className="text-[11px] font-bold text-slate-500 mt-1">
                          {stats.confirmedCount} Confirmed · {stats.pendingCount} Pending
                        </div>
                      </div>
                      <div>
                        <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Gender ratio</Label>
                        <div className="text-lg font-black mt-1">
                          {stats.maleCount} Male / {stats.femaleCount} Female
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Meal Preferences (Synced)</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border">
                            <div className="text-lg font-black">{stats.jainPreferenceCount}</div>
                            <div className="text-[9px] font-bold uppercase">Jain Synced</div>
                          </div>
                          <div className="bg-amber-50 text-amber-800 p-2.5 rounded-xl border">
                            <div className="text-lg font-black">{stats.nonJainPreferenceCount}</div>
                            <div className="text-[9px] font-bold uppercase">Non-Jain Synced</div>
                          </div>
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase mt-2">
                          Other diet: {stats.otherFoodPreferenceCount} travelers
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Pickup Cities Distribution</Label>
                      <div className="max-h-[140px] overflow-y-auto space-y-2 mt-1">
                        {Object.entries(stats.pickupCityBreakdown || {}).map(([city, count]) => (
                          <div key={city} className="flex justify-between items-center text-xs font-semibold border-b pb-1">
                            <span className="text-slate-600">{city}</span>
                            <Badge variant="secondary" className="font-bold">{count as number} guests</Badge>
                          </div>
                        ))}
                        {Object.keys(stats.pickupCityBreakdown || {}).length === 0 && (
                          <div className="text-xs text-muted-foreground font-semibold italic">No pickup data.</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in">
                    {/* Meal Mismatch Alert */}
                    {(() => {
                      const latestFood = timeline.find((item) => item.type === "food");
                      const reportedJain = latestFood?.details?.jainCount || 0;
                      const reportedNonJain = latestFood?.details?.nonJainCount || 0;
                      const syncedJain = stats.jainPreferenceCount || 0;
                      const syncedNonJain = stats.nonJainPreferenceCount || 0;

                      if (latestFood && (reportedJain !== syncedJain || reportedNonJain !== syncedNonJain)) {
                        return (
                          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-2xl flex items-center justify-between text-xs font-semibold">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                              <span>
                                Meal Mismatch: Guide reported {reportedJain} Jain / {reportedNonJain} Non-Jain today, but database has {syncedJain} Jain / {syncedNonJain} Non-Jain preferences. Update details below.
                              </span>
                            </div>
                            <Badge variant="outline" className="text-amber-800 border-amber-300 font-bold uppercase text-[9px] shrink-0">
                              Mismatch
                            </Badge>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Traveler sync table */}
                    <div className="overflow-x-auto border-2 rounded-2xl max-h-[300px] overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b text-[10px] font-black uppercase tracking-wider text-slate-500">
                            <th className="p-3">Name & Role</th>
                            <th className="p-3">Booking ID</th>
                            <th className="p-3">Synced Preference</th>
                            <th className="p-3 text-right">Approve Synced Meal / Change</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-xs font-medium text-slate-700">
                          {travelers.map((t, idx) => {
                            const isMissing = !t.foodPreference || t.foodPreference === "Other";
                            return (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-3">
                                  <div className="font-bold text-slate-900">{t.name}</div>
                                  <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                                    {t.isPrimaryBooker ? "Booker" : "Co-Traveler"} · {t.gender || "Unknown"}
                                  </div>
                                </td>
                                <td className="p-3 text-slate-500 font-mono">{t.bookingId}</td>
                                <td className="p-3">
                                  {isMissing ? (
                                    <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-200 text-[10px] font-bold uppercase">
                                      ⚠️ Missing / Other
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold uppercase">
                                      {t.foodPreference}
                                    </Badge>
                                  )}
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <select
                                      value={t.foodPreference || "Other"}
                                      onChange={(e) => {
                                        const updated = [...travelers];
                                        updated[idx].foodPreference = e.target.value;
                                        setTravelers(updated);
                                      }}
                                      className="h-8 border-2 rounded-lg px-2 text-xs font-semibold focus:outline-none"
                                    >
                                      <option value="Jain">Jain</option>
                                      <option value="Non-Jain">Non-Jain</option>
                                      <option value="Other">Not Specified</option>
                                    </select>
                                    <Button
                                      onClick={() => handleSyncFoodPreference(t, t.foodPreference || "Other")}
                                      disabled={syncingTraveler === t.name}
                                      size="sm"
                                      className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider h-8"
                                    >
                                      {syncingTraveler === t.name ? (
                                        <RefreshCw className="animate-spin w-3 h-3" />
                                      ) : (
                                        "Approve Sync"
                                      )}
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {travelers.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-slate-400 font-semibold italic">
                                No traveler records found for this trip.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 space-y-2">
                <Compass className="w-10 h-10 text-slate-300" />
                <span className="text-xs font-bold uppercase tracking-wider">Select a specific active Trip below to view Traveler Stats</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter panel */}
      <Card className="border-2 rounded-3xl overflow-hidden shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="assignment-filter" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Select Active Assignment/Trip</Label>
              <select
                id="assignment-filter"
                value={selectedAssignmentId}
                onChange={(e) => setSelectedAssignmentId(e.target.value)}
                className="w-full h-11 border-2 rounded-xl px-3 text-xs font-semibold focus:border-primary focus:outline-none"
              >
                <option value="all">ALL ACTIVE TRIPS & GUIDES</option>
                {assignments.map((assign) => (
                  <option key={assign.id} value={assign.id}>
                    {assign.tripName} ({assign.guideName})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type-filter" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Filter Update Type</Label>
              <select
                id="type-filter"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full h-11 border-2 rounded-xl px-3 text-xs font-semibold focus:border-primary focus:outline-none"
              >
                <option value="all">ALL OPERATIONAL UPDATES</option>
                <option value="checkin">LOCATION CHECK-INS</option>
                <option value="hotel">HOTEL CHECK-INS</option>
                <option value="food">DINNER & MEALS Logs</option>
                <option value="movement">MOVEMENT & TRANSIT</option>
                <option value="group_photo">SIGHTSEEING PHOTOS</option>
                <option value="timing">DELAYS & DESTINATIONS</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-filter" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Filter Date</Label>
              <Input
                id="date-filter"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-11 border-2 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card className="border-2 rounded-3xl overflow-hidden shadow-sm">
        <CardHeader className="bg-slate-50 border-b p-5 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-black uppercase tracking-wider">Unified Activity Timeline</CardTitle>
          <Badge className="bg-primary text-white font-bold">{timeline.length} Updates</Badge>
        </CardHeader>
        <CardContent className="p-6">
          {timeline.length === 0 ? (
            <div className="text-center py-20 text-slate-400 flex flex-col items-center justify-center space-y-2">
              <Compass className="w-12 h-12 text-slate-300" />
              <div className="text-xs font-black uppercase tracking-widest">No updates matched your filters</div>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-8">
              {timeline.map((item) => {
                const isHotelIssue = item.type === "hotel" && (item.status === "issue_reported" || item.status === "pending");
                
                return (
                  <div key={item.id} className="relative">
                    {/* Icon Dot */}
                    <span className="absolute -left-[35px] top-1.5 w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shadow-sm">
                      {item.type === "checkin" && <MapPin className="w-3.5 h-3.5 text-blue-500" />}
                      {item.type === "hotel" && <Compass className="w-3.5 h-3.5 text-purple-500" />}
                      {item.type === "food" && <Utensils className="w-3.5 h-3.5 text-amber-500" />}
                      {item.type === "group_photo" && <Camera className="w-3.5 h-3.5 text-indigo-500" />}
                      {item.type === "movement" && <Compass className="w-3.5 h-3.5 text-emerald-500" />}
                      {item.type === "timing" && <Clock className="w-3.5 h-3.5 text-rose-500" />}
                    </span>

                    {/* Timeline Item Card */}
                    <Card className="rounded-2xl border hover:border-slate-300 transition-all shadow-none">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-black uppercase text-[9px] tracking-wider px-2 py-0.5">
                              {item.type.replace("_", " ")}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-semibold">
                              {new Date(item.timestamp).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                            </span>
                            <span className="text-xs text-slate-400 font-bold">· {new Date(item.timestamp).toLocaleDateString()}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-700">{item.guideName}</span>
                            <span className="text-xs text-slate-400">({item.tripName})</span>
                          </div>
                        </div>

                        {/* Location / Action Status */}
                        {item.location && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>{item.location}</span>
                          </div>
                        )}

                        {/* Notes */}
                        <p className="text-xs font-medium text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl">
                          {item.notes}
                        </p>

                        {/* Media display */}
                        {(item.photoUrl || item.videoUrl) && (
                          <div className="mt-3">
                            <Label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block mb-2">Media Attachment Proof</Label>
                            <div className="flex flex-wrap gap-3">
                              {item.photoUrl && (
                                <div className="border rounded-2xl overflow-hidden shadow-sm max-w-[280px]">
                                  <img
                                    src={item.photoUrl}
                                    alt="Live Operations Proof"
                                    className="max-h-[160px] object-cover hover:scale-105 transition-all cursor-zoom-in"
                                    onClick={() => window.open(item.photoUrl, "_blank")}
                                  />
                                </div>
                              )}
                              {item.videoUrl && (
                                <div className="border rounded-2xl overflow-hidden shadow-sm max-w-[280px] bg-black">
                                  <video
                                    src={item.videoUrl}
                                    controls
                                    className="max-h-[160px]"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Admin Action for Hotel allocations */}
                        {isHotelIssue && (
                          <div className="flex items-center justify-between bg-purple-50/50 border border-purple-100 p-3.5 rounded-xl mt-3">
                            <div className="flex items-center gap-2 text-purple-900 text-xs font-semibold">
                              <AlertTriangle className="w-4 h-4 text-purple-500 shrink-0" />
                              <span>Hotel stay check-in requires approval/resolution.</span>
                            </div>
                            <Button
                              onClick={() => handleApproveHotel(parseInt(item.id.replace("hotel-", ""), 10))}
                              disabled={resolvingId === parseInt(item.id.replace("hotel-", ""), 10)}
                              className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider h-8"
                            >
                              {resolvingId === parseInt(item.id.replace("hotel-", ""), 10) ? (
                                <RefreshCw className="animate-spin w-4 h-4" />
                              ) : (
                                "Approve & Mark Done"
                              )}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissions Management Widget (Visible to Admin/Superadmin only) */}
      {(admin?.role === "admin" || admin?.role === "superadmin") && (
        <Card className="border-2 rounded-3xl overflow-hidden shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50 border-b p-5">
            <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4.5 h-4.5 text-slate-500" /> Sales Live Operations Access Control
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Grant access form */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-1">Grant Access to Sales Agent</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">Enter the email address of the sales agent to authorize access to live trip updates.</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="e.g. sales.agent@youthcamping.online"
                      value={newSalesEmail}
                      onChange={(e) => setNewSalesEmail(e.target.value)}
                      className="h-11 border-2 rounded-xl"
                    />
                  </div>
                  <Button
                    onClick={handleAddSalesEmail}
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase text-[10px] tracking-wider h-11 px-5"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Grant Access
                  </Button>
                </div>
              </div>

              {/* Allowed sales list */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Authorized Sales Agents</h4>
                <div className="max-h-[160px] overflow-y-auto border-2 rounded-2xl p-3 space-y-2">
                  {allowedEmails.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400 font-bold uppercase tracking-wider">
                      No sales agents authorized yet
                    </div>
                  ) : (
                    allowedEmails.map((email: string) => (
                      <div key={email} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border">
                        <span className="text-xs font-bold text-slate-700">{email}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveSalesEmail(email)}
                          className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
