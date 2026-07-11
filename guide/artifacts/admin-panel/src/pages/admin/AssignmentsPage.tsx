import { useEffect, useState } from "react";
import { guideService, Assignment, Guide, GuideTrip } from "@/services/guide.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminModal } from "@/components/admin/AdminModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  MapPin, 
  Plus, 
  Edit2, 
  Trash2,
  Loader2,
  Calendar,
  Compass
} from "lucide-react";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [trips, setTrips] = useState<GuideTrip[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [form, setForm] = useState({
    guideId: "",
    tripId: "",
    departureDate: "",
    role: "guide" as 'guide' | 'coordinator' | 'captain',
    perDayAmount: 1500,
    allowedLatitude: "" as string | number,
    allowedLongitude: "" as string | number,
    allowedRadius: 3000
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assignsData, guidesData, tripsData] = await Promise.all([
        guideService.getAssignments(),
        guideService.getGuides(),
        guideService.getTrips()
      ]);
      setAssignments(assignsData);
      setGuides(guidesData);
      setTrips(tripsData);
    } catch (error) {
      toast.error("Failed to load assignment registry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      allowedRadius: 3000
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setForm({
      guideId: String(assignment.guideId),
      tripId: String(assignment.tripId),
      departureDate: assignment.departureDate,
      role: assignment.role,
      perDayAmount: assignment.perDayAmount,
      allowedLatitude: assignment.allowedLatitude ?? "",
      allowedLongitude: assignment.allowedLongitude ?? "",
      allowedRadius: assignment.allowedRadius
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
    const postData = {
      guideId: Number(form.guideId),
      tripId: Number(form.tripId),
      departureDate: form.departureDate,
      role: form.role,
      perDayAmount: Number(form.perDayAmount),
      allowedLatitude: form.allowedLatitude ? Number(form.allowedLatitude) : null,
      allowedLongitude: form.allowedLongitude ? Number(form.allowedLongitude) : null,
      allowedRadius: Number(form.allowedRadius)
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
        className="rounded-xl h-11 px-5 text-xs font-semibold text-slate-650"
      >
        Discard
      </Button>
      <Button 
        onClick={handleSubmit} 
        disabled={submitting}
        className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-11 px-6 rounded-xl shadow-md transition-all"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {editingAssignment ? "Save Assignment" : "Confirm Assignment"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="admin-title">Guides Assignments</h1>
          <p className="admin-body">Link guides to active excursions and configure geofence coordinates</p>
        </div>
        <Button 
          onClick={handleOpenAdd}
          className="bg-primary hover:bg-primary/90 text-white rounded-lg h-8.5 px-4 font-semibold text-[10.5px] uppercase tracking-wide flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Assign Guide
        </Button>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden !p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Loading assignments registry...</p>
          </div>
        ) : (
          <div className="responsive-table">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Guide</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Trip / Location</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Departure</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Role</th>
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
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-medium whitespace-nowrap">{as.departureDate}</td>
                    <td className="px-4 py-3 capitalize text-xs text-slate-650 font-semibold">{as.role}</td>
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
                        <span className="text-slate-350 text-[10px] italic">Not set (Uses default trip coordinates)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
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
                    <td colSpan={7} className="px-4 py-12 text-center">
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
        <div className="space-y-6">
          {/* Guide Selection */}
          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Select Guide *</Label>
            <Select value={form.guideId} onValueChange={(v) => setForm({ ...form, guideId: v })}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200">
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
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Select Trip *</Label>
            <Select value={form.tripId} onValueChange={(v) => setForm({ ...form, tripId: v })}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200">
                <SelectValue placeholder="Select trip" />
              </SelectTrigger>
              <SelectContent>
                {trips.map(t => (
                  <SelectItem key={t.id} value={String(t.id)}>{t.name} ({t.location})</SelectItem>
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
                <SelectTrigger className="h-11 rounded-xl border-slate-200">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="guide">Guide</SelectItem>
                  <SelectItem value="coordinator">Coordinator</SelectItem>
                  <SelectItem value="captain">Captain</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
    </div>
  );
}
