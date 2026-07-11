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
    <div className="space-y-6 animate-fade-in p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter">Vendors</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">Manage hotels, transport, guides & other service partners</p>
        </div>
        <Button onClick={openCreate} className="rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest">
          <Plus className="h-4 w-4 mr-2" /> Add Vendor
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
          <div key={i} className="bg-white border-2 border-border rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <s.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{s.label}</p>
              <p className="text-xl font-black">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "hotel", "transport", "guide", "meals", "equipment", "other"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
              filter === t ? "bg-primary text-white shadow-lg" : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {t === "all" ? "All" : t}
          </button>
        ))}
      </div>

      {/* Vendors Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-bold">No vendors found</p>
          <p className="text-sm">Add your first vendor partner to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => {
            const TypeIcon = VENDOR_TYPE_ICONS[v.type] || HelpCircle;
            return (
              <div key={v.id} className="bg-white border-2 border-border rounded-2xl p-6 space-y-4 hover:shadow-xl transition-all group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${VENDOR_TYPE_COLORS[v.type]}`}>
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm uppercase tracking-tight">{v.name}</h3>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${VENDOR_TYPE_COLORS[v.type]}`}>
                        {v.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(v)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(v.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground">
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
                  <p className="text-xs text-muted-foreground italic bg-muted/30 p-2 rounded-lg">"{v.notes}"</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight">
              {editing ? "Edit Vendor" : "Add New Vendor"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Vendor Name *</label>
              <Input
                placeholder="e.g. Mountain View Hotel"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Type *</label>
              <Select value={form.type} onValueChange={(v: Vendor["type"]) => setForm({ ...form, type: v })}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
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
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Phone</label>
                <Input
                  placeholder="+91..."
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Email</label>
                <Input
                  placeholder="vendor@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Location</label>
              <Input
                placeholder="e.g. Manali, Himachal Pradesh"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Notes</label>
              <Input
                placeholder="Internal notes about this vendor..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSave} disabled={submitting} className="rounded-xl font-bold">
              {submitting ? "Saving..." : editing ? "Update Vendor" : "Create Vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
