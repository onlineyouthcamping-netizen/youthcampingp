import { useEffect, useState } from "react";
import { ensureGuideToken } from "@/store/auth.store";
import { guideService, Assignment, Guide, MainBackendTrip, TripStatusUpdate } from "@/services/guide.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminModal } from "@/components/admin/AdminModal";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AssignmentTravelersModal from "@/components/admin/AssignmentTravelersModal";
import { toast } from "sonner";
import { 
  Plus, 
  Edit2, 
  Trash2,
  Loader2,
  Calendar,
  Compass,
  AlertTriangle,
  Users,
  Clock,
  MapPin
} from "lucide-react";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [trips, setTrips] = useState<MainBackendTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Synced travelers modal state
  const [selectedAssignmentForTravelers, setSelectedAssignmentForTravelers] = useState<Assignment | null>(null);
  
  // Timeline modal state
  const [selectedAssignmentForTimeline, setSelectedAssignmentForTimeline] = useState<Assignment | null>(null);
  const [timeline, setTimeline] = useState<TripStatusUpdate[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Form states
  const [form, setForm] = useState({
    guideId: "",
    tripId: "",
    departureDate: "",
    role: "guide" as 'guide' | 'coordinator' | 'captain' | 'lead_guide' | 'assistant_guide',
    perDayAmount: 1500,
    allowedLatitude: "" as string | number,
    allowedLongitude: "" as string | number,
    allowedRadius: 3000,
    status: "assigned" as 'assigned' | 'ongoing' | 'completed' | 'cancelled'
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [assignsData, guidesData, tripsData] = await Promise.all([
        guideService.getAssignments(),
        guideService.getGuides(),
        guideService.getMainBackendTrips() // Pull trips from main backend!
      ]);
      setAssignments(assignsData);
      setGuides(guidesData);
      setTrips(tripsData);
    } catch (err) {
      console.error("Failed to load assignment registry:", err);
      setError("Guide API server is offline or returned an error. Please verify the API server status.");
      toast.error("Failed to load assignment registry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await ensureGuideToken("9999999999", "admin");
      fetchData();
    };
    init();
  }, []);

  const fetchTimeline = async (assignmentId: number) => {
    setLoadingTimeline(true);
    try {
      const logs = await guideService.getTripStatusTimeline(assignmentId);
      setTimeline(logs);
    } catch (error) {
      toast.error("Failed to load trip timeline updates");
    } finally {
      setLoadingTimeline(false);
    }
  };

  useEffect(() => {
    if (selectedAssignmentForTimeline) {
      fetchTimeline(selectedAssignmentForTimeline.id);
    }
  }, [selectedAssignmentForTimeline]);

  const handleOpenAdd = () => {
    setEditingAssignment(null);
    setForm({
      guideId: "",
      tripId: "",
      departureDate: new Date().toISOString().split("T")[0],
      role: "guide",
      perDayAmount: 1500,
      allowedLatitude: "",
      allowedLongitude: "",
      allowedRadius: 3000,
      status: "assigned"
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setForm({
      guideId: String(assignment.guideId),
      tripId: assignment.mainBackendTripId || String(assignment.tripId || ""),
      departureDate: assignment.departureDate,
      role: assignment.role,
      perDayAmount: assignment.perDayAmount,
      allowedLatitude: assignment.allowedLatitude ?? "",
      allowedLongitude: assignment.allowedLongitude ?? "",
      allowedRadius: assignment.allowedRadius,
      status: assignment.status || "assigned"
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this trip assignment?")) return;
    try {
      await guideService.deleteAssignment(id);
      toast.success("Assignment deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete assignment");
    }
  };

  const handleSubmit = async () => {
    if (!form.guideId || !form.tripId || !form.departureDate) {
      toast.error("Guide, trip, and departure date are required");
      return;
    }

    setSubmitting(true);
    const selectedTrip = trips.find(t => String(t.id) === String(form.tripId));
    // If selected trip ID is non-numeric (e.g. cuid), it's a main backend trip
    const isMainBackendTrip = selectedTrip && isNaN(Number(form.tripId));

    const postData = {
      guideId: Number(form.guideId),
      tripId: isMainBackendTrip ? null : Number(form.tripId),
      departureDate: form.departureDate,
      role: form.role,
      perDayAmount: Number(form.perDayAmount),
      allowedLatitude: form.allowedLatitude ? Number(form.allowedLatitude) : null,
      allowedLongitude: form.allowedLongitude ? Number(form.allowedLongitude) : null,
      allowedRadius: Number(form.allowedRadius),
      status: form.status,
      mainBackendTripId: isMainBackendTrip ? String(form.tripId) : null,
      mainBackendTripName: isMainBackendTrip ? selectedTrip.title : null
    };

    try {
      if (editingAssignment) {
        await guideService.updateAssignment(editingAssignment.id, postData);
        toast.success("Assignment updated successfully");
      } else {
        await guideService.createAssignment(postData);
        toast.success("Guide assigned to trip successfully");
      }
      setModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to save assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const modalFooter = (
    <div className="flex w-full items-center justify-end gap-3">
      <Button 
        variant="outline" 
        onClick={() => setModalOpen(false)} 
        className="rounded-[4px] h-8.5 px-4 text-xs font-semibold text-slate-650"
      >
        Discard
      </Button>
      <Button 
        onClick={handleSubmit} 
        disabled={submitting}
        className="bg-primary-orange hover:bg-primary-orange/90 text-white font-semibold text-xs h-8.5 px-4 rounded-[4px] shadow-sm transition-all flex items-center gap-1.5"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {editingAssignment ? "Save Assignment" : "Confirm Assignment"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-[#F4F7FB] min-h-screen -mx-6 -my-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Compass className="w-5 h-5 text-[#F97316]" />
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Guides Assignments</h1>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Link guides to active excursions and configure geofence coordinates</p>
          </div>
        </div>
        <Button 
          onClick={handleOpenAdd}
          disabled={!!error}
          className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Assign Guide
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Loading assignments registry...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4 max-w-md mx-auto">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Guide API Offline</h3>
              <p className="text-xs text-slate-450 leading-relaxed">{error}</p>
            </div>
            <Button 
              onClick={fetchData} 
              className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white shadow-sm transition-all"
            >
              Retry Connection
            </Button>
          </div>
        ) : (
          <div className="responsive-table">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Guide</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Trip / Excursion</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Departure</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Role</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Payout Rate</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Geofence Coordinates</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((as) => (
                  <tr key={as.id} className="hover:bg-slate-50/80 transition-colors group align-middle">
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-slate-800">{as.guideName}</span>
                    </td>
                    <td className="px-4 py-3 space-y-0.5">
                      <span className="text-xs font-semibold text-slate-800">{as.tripName}</span>
                      {as.mainBackendTripId && (
                        <span className="inline-block text-[9px] px-1.5 py-0.2 bg-blue-50 text-blue-600 font-bold rounded border border-blue-100 uppercase tracking-wide">
                          Synced
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-medium whitespace-nowrap">{as.departureDate}</td>
                    <td className="px-4 py-3 capitalize text-xs text-slate-650 font-semibold">
                      {as.role.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge 
                        variant={
                          as.status === "completed" ? "success" : 
                          as.status === "ongoing" ? "primary" : 
                          as.status === "cancelled" ? "destructive" : "secondary"
                        }
                        className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                      >
                        {as.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800">₹{as.perDayAmount.toLocaleString()}/day</td>
                    <td className="px-4 py-3 space-y-1">
                      {as.allowedLatitude && as.allowedLongitude ? (
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-semibold text-slate-600">
                            Lat: {as.allowedLatitude}, Long: {as.allowedLongitude}
                          </p>
                          <p className="text-[9px] font-bold text-emerald-500">Radius: {as.allowedRadius}m</p>
                        </div>
                      ) : (
                        <span className="text-slate-350 text-[10px] italic">Not set (Uses default coordinates)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {as.mainBackendTripId && (
                          <>
                            <Button
                              onClick={() => setSelectedAssignmentForTravelers(as)}
                              variant="ghost"
                              size="icon"
                              title="Sync Travelers & Live Attendance"
                              className="h-8 w-8 hover:bg-slate-100 hover:text-primary transition-all rounded-lg"
                            >
                              <Users className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              onClick={() => setSelectedAssignmentForTimeline(as)}
                              variant="ghost"
                              size="icon"
                              title="Trip Milestone Timeline"
                              className="h-8 w-8 hover:bg-slate-100 hover:text-orange-500 transition-all rounded-lg"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                        <Button 
                          onClick={() => handleOpenEdit(as)}
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-slate-100 hover:text-primary transition-all rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          onClick={() => handleDelete(as.id)}
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-rose-50 text-destructive hover:bg-rose-100 transition-all rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {assignments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="space-y-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mx-auto text-slate-300">
                          <Compass className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-medium text-slate-400 italic">No guide assignments configured yet</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AdminModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingAssignment ? "Modify Trip Assignment" : "Assign Guide to Trip"}
        description={editingAssignment ? "Edit payroll rate, role details, or GPS geofence configuration" : "Allocate a guide to an upcoming trip departure"}
        footer={modalFooter}
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          {/* Guide Selection */}
          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Select Guide *</Label>
            <Select value={form.guideId} onValueChange={(v) => setForm({ ...form, guideId: v })}>
              <SelectTrigger className="h-11 rounded-md border-slate-200">
                <SelectValue placeholder="Select guide" />
              </SelectTrigger>
              <SelectContent>
                {guides.map(g => (
                  <SelectItem key={g.id} value={String(g.id)}>{g.name} ({g.phone})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trip Selection */}
          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Select Trip (Main Backend) *</Label>
            <Select value={form.tripId} onValueChange={(v) => setForm({ ...form, tripId: v })}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200">
                <SelectValue placeholder="Select trip" />
              </SelectTrigger>
              <SelectContent>
                {trips.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.title} ({t.location || 'N/A'})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Departure & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Departure Date *</Label>
              <div className="relative">
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input 
                  type="date"
                  value={form.departureDate} 
                  onChange={e => setForm({ ...form, departureDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Assignment Role *</Label>
              <Select value={form.role} onValueChange={(v: any) => setForm({ ...form, role: v })}>
                <SelectTrigger className="h-11 rounded-md border-slate-200">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="guide">Guide</SelectItem>
                  <SelectItem value="coordinator">Coordinator</SelectItem>
                  <SelectItem value="captain">Captain</SelectItem>
                  <SelectItem value="lead_guide">Lead Guide</SelectItem>
                  <SelectItem value="assistant_guide">Assistant Guide</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Assignment Status</Label>
            <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200">
                <SelectValue placeholder="Select assignment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Daily Rate & Radius */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Per Day Payout Rate (₹) *</Label>
              <Input 
                type="number"
                value={form.perDayAmount} 
                onChange={e => setForm({ ...form, perDayAmount: Number(e.target.value) })}
                placeholder="1500" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Geofence Radius (meters)</Label>
              <Input 
                type="number"
                value={form.allowedRadius} 
                onChange={e => setForm({ ...form, allowedRadius: Number(e.target.value) })}
                placeholder="3000" 
              />
            </div>
          </div>

          {/* GPS Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Allowed Latitude</Label>
              <Input 
                type="number"
                step="any"
                value={form.allowedLatitude} 
                onChange={e => setForm({ ...form, allowedLatitude: e.target.value })}
                placeholder="e.g. 32.2396" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Allowed Longitude</Label>
              <Input 
                type="number"
                step="any"
                value={form.allowedLongitude} 
                onChange={e => setForm({ ...form, allowedLongitude: e.target.value })}
                placeholder="e.g. 77.1887" 
              />
            </div>
          </div>
        </div>
      </AdminModal>

      {/* Sync Traveler Attendance Modal */}
      {selectedAssignmentForTravelers && (
        <AssignmentTravelersModal
          assignment={selectedAssignmentForTravelers}
          open={!!selectedAssignmentForTravelers}
          onClose={() => setSelectedAssignmentForTravelers(null)}
        />
      )}

      {/* Trip Timeline/Milestones Modal */}
      <AdminModal
        open={!!selectedAssignmentForTimeline}
        onOpenChange={(open) => !open && setSelectedAssignmentForTimeline(null)}
        title="Trip Milestones & Status Timeline"
        description={`Live updates logged by guides for assignment of ${selectedAssignmentForTimeline?.guideName || ''} on ${selectedAssignmentForTimeline?.mainBackendTripName || ''}`}
        footer={
          <div className="flex w-full justify-end">
            <Button onClick={() => setSelectedAssignmentForTimeline(null)} className="rounded-[4px] px-4 h-8.5 text-xs font-semibold">Close</Button>
          </div>
        }
      >
        {loadingTimeline ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Loading milestone history...</span>
          </div>
        ) : timeline.length === 0 ? (
          <div className="text-center py-12 text-slate-400 italic text-xs">
            No status updates logged yet for this trip assignment.
          </div>
        ) : (
          <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-6 max-h-[50vh] overflow-y-auto py-2">
            {timeline.map((item) => (
              <div key={item.id} className="relative">
                {/* Dot */}
                <div className="absolute -left-[31px] mt-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-white flex items-center justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                </div>
                {/* Content */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 capitalize">
                      {item.status.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(item.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  {item.location && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{item.location}</span>
                    </div>
                  )}
                  {item.notes && (
                    <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg italic">
                      "{item.notes}"
                    </p>
                  )}
                  <p className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">
                    Marked by: {item.guideName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminModal>
    </div>
  );
}
