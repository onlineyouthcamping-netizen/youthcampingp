import { useEffect, useState } from "react";
import { ensureGuideToken } from "@/store/auth.store";
import { guideService, Guide } from "@/services/guide.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Phone,
  MessageSquare,
  Trash2
} from "lucide-react";

export default function GuidesListPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
    isActive: "active",
    email: "",
    profilePhoto: "",
    address: "",
    notes: ""
  });

  const fetchGuides = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await guideService.getGuides();
      setGuides(data);
    } catch (err) {
      console.error("Failed to load guides list:", err);
      setError("Guide API server is offline or returned an error. Please verify the API server status.");
      toast.error("Failed to load guides list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await ensureGuideToken("9999999999", "admin");
      fetchGuides();
    };
    init();
  }, []);

  const handleOpenAdd = () => {
    setEditingGuide(null);
    setForm({
      name: "",
      phone: "",
      dailyRate: 1500,
      emergencyContact: "",
      isActive: "active",
      email: "",
      profilePhoto: "",
      address: "",
      notes: ""
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (guide: Guide) => {
    setEditingGuide(guide);
    setForm({
      name: guide.name,
      phone: guide.phone,
      dailyRate: guide.dailyRate || 1500,
      emergencyContact: guide.emergencyContact || "",
      isActive: guide.isActive || "active",
      email: guide.email || "",
      profilePhoto: guide.profilePhoto || "",
      address: guide.address || "",
      notes: guide.notes || ""
    });
    setModalOpen(true);
  };

  const handleDeleteGuide = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name}? This will delete all of their assignments, work days, and logs.`)) {
      return;
    }
    try {
      await guideService.deleteGuide(id);
      toast.success("Guide removed successfully");
      fetchGuides();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to delete guide";
      toast.error(msg);
    }
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
          isActive: form.isActive,
          email: form.email || null,
          profilePhoto: form.profilePhoto || null,
          address: form.address || null,
          notes: form.notes || null
        });
        toast.success("Guide profile updated successfully");
      } else {
        await guideService.createGuide({
          name: form.name,
          phone: form.phone,
          dailyRate: Number(form.dailyRate),
          emergencyContact: form.emergencyContact || undefined,
          isActive: form.isActive,
          email: form.email || null,
          profilePhoto: form.profilePhoto || null,
          address: form.address || null,
          notes: form.notes || null
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
        {editingGuide ? "Save Changes" : "Register Guide"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-[#F4F7FB] min-h-screen -mx-6 -my-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Users className="w-5 h-5 text-[#F97316]" />
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Guides Directory</h1>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Manage registered guides, rates, and active assignments</p>
          </div>
        </div>
        <Button 
          onClick={handleOpenAdd}
          disabled={!!error}
          className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Add Guide
        </Button>
      </div>

      {/* Guide List Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Loading guide registry...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4 max-w-md mx-auto">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Guide API Offline</h3>
              <p className="text-xs text-slate-450 leading-relaxed">{error}</p>
            </div>
            <Button 
              onClick={fetchGuides} 
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
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Name & Email</th>
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
                        {guide.profilePhoto ? (
                          <img src={guide.profilePhoto} alt={guide.name} className="h-7 w-7 rounded-full object-cover border border-slate-200 shadow-sm" />
                        ) : (
                          <div className="h-7 w-7 rounded bg-orange-50 flex items-center justify-center text-[10px] font-bold text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                            {guide.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-800">{guide.name}</span>
                          {guide.email && <span className="text-[10px] text-slate-400 font-medium">{guide.email}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span>{guide.phone}</span>
                        <a href={`tel:+91${guide.phone}`} className="p-1 rounded hover:bg-slate-105 hover:text-primary transition-all text-slate-400">
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a href={`https://wa.me/91${guide.phone}`} target="_blank" rel="noreferrer" className="p-1 rounded hover:bg-slate-105 hover:text-emerald-500 transition-all text-slate-400">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
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
                      <div className="flex justify-end gap-1">
                        <Button 
                          onClick={() => handleOpenEdit(guide)}
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-slate-100 hover:text-primary transition-all rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          onClick={() => handleDeleteGuide(guide.id, guide.name)}
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-rose-50 hover:text-destructive transition-all rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
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
        description={editingGuide ? "Update daily rates, active status, or contact configuration" : "Add a guide to start assigning them to trails"}
        footer={modalFooter}
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
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
              <div className="flex h-11 rounded-md border border-slate-200 overflow-hidden focus-within:ring-1 focus-within:ring-blue-600 transition-all">
                <div className="w-12 h-full bg-slate-50 border-r border-slate-200 flex items-center justify-center text-xs font-black text-slate-400">
                  +91
                </div>
                <Input 
                  value={form.phone} 
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="10-digit number" 
                  className="h-full border-none rounded-none flex-1 focus-visible:ring-0"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</Label>
              <Input 
                type="email"
                value={form.email} 
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. rahul@example.com" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Daily Payout Rate (₹) *</Label>
              <Input 
                type="number"
                value={form.dailyRate} 
                onChange={e => setForm({ ...form, dailyRate: Number(e.target.value) })}
                placeholder="1500" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Bio / Notes</Label>
            <Textarea 
              value={form.notes} 
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional details or special notes about the guide..." 
              className="rounded-md border-slate-200"
            />
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
