import { useEffect, useState } from "react";
import { guideService, Guide } from "@/services/guide.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminModal } from "@/components/admin/AdminModal";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Users, 
  Plus, 
  Edit2, 
  AlertTriangle,
  Loader2,
  Phone
} from "lucide-react";

export default function GuidesListPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [form, setForm] = useState({
    name: "",
    phone: "",
    dailyRate: 1500,
    emergencyContact: "",
    isActive: "active"
  });

  const fetchGuides = async () => {
    setLoading(true);
    try {
      const data = await guideService.getGuides();
      setGuides(data);
    } catch (error) {
      toast.error("Failed to load guides list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  const handleOpenAdd = () => {
    setEditingGuide(null);
    setForm({
      name: "",
      phone: "",
      dailyRate: 1500,
      emergencyContact: "",
      isActive: "active"
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (guide: Guide) => {
    setEditingGuide(guide);
    // Let's get details or guess if emergencyContact is missing
    setForm({
      name: guide.name,
      phone: guide.phone,
      dailyRate: 1500, // default if not returned in listing, edit will update
      emergencyContact: "",
      isActive: guide.todayStatus === "idle" ? "active" : "active" // fallback
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone) {
      toast.error("Name and phone number are required");
      return;
    }

    setSubmitting(true);
    try {
      if (editingGuide) {
        await guideService.updateGuide(editingGuide.id, {
          name: form.name,
          phone: form.phone,
          dailyRate: Number(form.dailyRate),
          emergencyContact: form.emergencyContact || undefined,
          isActive: form.isActive
        });
        toast.success("Guide profile updated successfully");
      } else {
        await guideService.createGuide({
          name: form.name,
          phone: form.phone,
          dailyRate: Number(form.dailyRate),
          emergencyContact: form.emergencyContact || undefined,
          isActive: form.isActive
        });
        toast.success("New guide registered successfully");
      }
      setModalOpen(false);
      fetchGuides();
    } catch (error: any) {
      const msg = error.response?.data?.error || "Failed to save guide";
      toast.error(msg);
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
        {editingGuide ? "Save Changes" : "Register Guide"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="admin-title">Guides Directory</h1>
          <p className="admin-body">Manage registered guides, rates, and active assignments</p>
        </div>
        <Button 
          onClick={handleOpenAdd}
          className="bg-primary hover:bg-primary/90 text-white rounded-lg h-8.5 px-4 font-semibold text-[10.5px] uppercase tracking-wide flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Add Guide
        </Button>
      </div>

      {/* Guide List Table */}
      <div className="admin-card overflow-hidden !p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Loading guide registry...</p>
          </div>
        ) : (
          <div className="responsive-table">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Name</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Trip</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Today Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Last Check-in</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Red Flags</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {guides.map((guide) => (
                  <tr key={guide.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded bg-orange-50 flex items-center justify-center text-[10px] font-bold text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                          {guide.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-slate-800">{guide.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-medium">{guide.phone}</td>
                    <td className="px-4 py-3 text-xs text-slate-650 font-semibold">{guide.activeTripName || <span className="text-slate-300 italic font-medium">None</span>}</td>
                    <td className="px-4 py-3">
                      <StatusBadge 
                        variant={
                          guide.todayStatus === "checked_out" ? "success" : 
                          guide.todayStatus === "checked_in" ? "primary" : 
                          guide.todayStatus === "missing" ? "warning" : "secondary"
                        }
                        className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                      >
                        {guide.todayStatus.replace("_", " ")}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {guide.lastCheckInTime ? new Date(guide.lastCheckInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {guide.flagged ? (
                        <div className="flex items-center gap-1 text-destructive font-semibold text-xs">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Flagged</span>
                        </div>
                      ) : (
                        <span className="text-emerald-500 text-xs font-semibold">Clear</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button 
                        onClick={() => handleOpenEdit(guide)}
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 hover:bg-slate-100 hover:text-primary transition-all rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {guides.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="space-y-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mx-auto text-slate-300">
                          <Users className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-medium text-slate-400 italic">No guides registered in the system</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Guide Dialog */}
      <AdminModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingGuide ? "Modify Guide Profile" : "Register New Guide"}
        description={editingGuide ? "Update daily rates, active status, or phone configuration" : "Add a guide to start assigning them to trails"}
        footer={modalFooter}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name *</Label>
              <Input 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Rahul Sharma" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number *</Label>
              <div className="flex h-11 rounded-xl border border-slate-200 overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                <div className="w-12 h-full bg-slate-50 border-r border-slate-200 flex items-center justify-center text-xs font-black text-slate-400">
                  +91
                </div>
                <Input 
                  value={form.phone} 
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="10-digit number" 
                  className="h-full border-none rounded-none flex-1 focus-visible:ring-0 shadow-none pl-3"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Daily Payout Rate (₹) *</Label>
              <Input 
                type="number"
                value={form.dailyRate} 
                onChange={e => setForm({ ...form, dailyRate: Number(e.target.value) })}
                placeholder="1500" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Emergency Contact Number</Label>
              <Input 
                value={form.emergencyContact} 
                onChange={e => setForm({ ...form, emergencyContact: e.target.value })}
                placeholder="Optional 10-digit number" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Active Status</Label>
            <Select value={form.isActive} onValueChange={(v) => setForm({ ...form, isActive: v })}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200">
                <SelectValue placeholder="Select active status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active (Available for assignments)</SelectItem>
                <SelectItem value="inactive">Inactive (Suspended / On Leave)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
