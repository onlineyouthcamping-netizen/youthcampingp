import { useEffect, useState, useCallback } from "react";
import { vendorsService } from "@/services/vendors.service";
import type { Vendor } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Building2, Truck, UserCheck,
  UtensilsCrossed, Wrench, HelpCircle, Phone, Mail, MapPin
} from "lucide-react";

const VENDOR_TYPE_ICONS: Record<string, any> = {
  hotel: Building2,
  transport: Truck,
  guide: UserCheck,
  meals: UtensilsCrossed,
  equipment: Wrench,
  other: HelpCircle,
};

const VENDOR_TYPE_COLORS: Record<string, string> = {
  hotel: "bg-blue-100 text-blue-700",
  transport: "bg-amber-100 text-amber-700",
  guide: "bg-emerald-100 text-emerald-700",
  meals: "bg-orange-100 text-orange-700",
  equipment: "bg-purple-100 text-purple-700",
  other: "bg-gray-100 text-gray-700",
};

const emptyForm = {
  name: "",
  type: "hotel" as Vendor["type"],
  phone: "",
  email: "",
  location: "",
  notes: "",
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await vendorsService.getAll();
      setVendors(data);
    } catch {
      toast.error("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (v: Vendor) => {
    setEditing(v);
    setForm({
      name: v.name,
      type: v.type,
      phone: v.phone || "",
      email: v.email || "",
      location: v.location || "",
      notes: v.notes || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Vendor name is required");
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await vendorsService.update(editing.id, form);
        toast.success("Vendor updated");
      } else {
        await vendorsService.create(form);
        toast.success("Vendor created");
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save vendor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this vendor and all trip assignments?")) return;
    try {
      await vendorsService.remove(id);
      toast.success("Vendor removed");
      load();
    } catch {
      toast.error("Failed to delete vendor");
    }
  };

  const filtered = filter === "all" ? vendors : vendors.filter(v => v.type === filter);

  const stats = {
    total: vendors.length,
    hotel: vendors.filter(v => v.type === "hotel").length,
    transport: vendors.filter(v => v.type === "transport").length,
    guide: vendors.filter(v => v.type === "guide").length,
  };

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-[#F4F7FB] min-h-screen -mx-6 -my-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Building2 className="w-5 h-5 text-[#F97316]" />
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Vendors</h1>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Manage hotels, transport, guides & other service partners</p>
          </div>
        </div>
        <Button onClick={openCreate} className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white flex items-center gap-1.5 shadow-sm">
          <Plus className="h-4 w-4" /> Add Vendor
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Vendors", value: stats.total, icon: Building2 },
          { label: "Hotels", value: stats.hotel, icon: Building2 },
          { label: "Transport", value: stats.transport, icon: Truck },
          { label: "Guides", value: stats.guide, icon: UserCheck },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-md border border-slate-200 shadow-sm p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#F97316]/10 flex items-center justify-center">
              <s.icon className="h-4 w-4 text-[#F97316]" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-white rounded-md border border-slate-200 p-1 shadow-sm">
        {["all", "hotel", "transport", "guide", "meals", "equipment", "other"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded text-xs font-semibold transition-all ${
              filter === t ? "bg-[#F97316] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t === "all" ? "All" : t}
          </button>
        ))}
      </div>

      {/* Vendors Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white animate-pulse rounded-md border border-slate-200" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-md border border-slate-200 shadow-sm">
          <Building2 className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">No vendors found</p>
          <p className="text-xs text-slate-400 mt-1">Add your first vendor partner to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => {
            const TypeIcon = VENDOR_TYPE_ICONS[v.type] || HelpCircle;
            return (
              <div key={v.id} className="bg-white border border-slate-200 rounded-md p-4 space-y-3 hover:border-[#F97316]/30 transition-all shadow-sm group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center ${VENDOR_TYPE_COLORS[v.type]}`}>
                      <TypeIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-800">{v.name}</h3>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[4px] ${VENDOR_TYPE_COLORS[v.type]}`}>
                        {v.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[4px] hover:bg-slate-50" onClick={() => openEdit(v)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[4px] text-destructive hover:bg-rose-50" onClick={() => handleDelete(v.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500">
                  {v.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" /> {v.phone}
                    </div>
                  )}
                  {v.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" /> {v.email}
                    </div>
                  )}
                  {v.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" /> {v.location}
                    </div>
                  )}
                </div>

                {v.notes && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-[4px] border border-slate-100">"{v.notes}"</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[4px] border border-slate-200 p-5 bg-white shadow-sm">
          <DialogHeader className="border-b border-[#E2E8F0] pb-3">
            <DialogTitle className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#F97316]" />
              {editing ? "Edit Vendor" : "Add New Vendor"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Vendor Name *</label>
              <Input
                placeholder="e.g. Mountain View Hotel"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Type *</label>
              <Select value={form.type} onValueChange={(v: Vendor["type"]) => setForm({ ...form, type: v })}>
                <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hotel">🏨 Hotel</SelectItem>
                  <SelectItem value="transport">🚐 Transport</SelectItem>
                  <SelectItem value="guide">🧑‍🤝‍🧑 Guide</SelectItem>
                  <SelectItem value="meals">🍽️ Meals</SelectItem>
                  <SelectItem value="equipment">🔧 Equipment</SelectItem>
                  <SelectItem value="other">📦 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone</label>
                <Input
                  placeholder="+91..."
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email</label>
                <Input
                  placeholder="vendor@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs font-medium"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Location</label>
              <Input
                placeholder="e.g. Manali, Himachal Pradesh"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Notes</label>
              <Input
                placeholder="Internal notes about this vendor..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs font-medium"
              />
            </div>
          </div>
          <DialogFooter className="pt-3 border-t border-[#E2E8F0] gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="rounded-[4px] text-xs font-semibold h-8.5">Cancel</Button>
            <Button onClick={handleSave} disabled={submitting} className="rounded-[4px] font-semibold text-xs h-8.5 bg-primary-orange hover:bg-primary-orange/90 text-white">
              {submitting ? "Saving..." : editing ? "Update Vendor" : "Create Vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
