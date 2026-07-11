import { useEffect, useState, useCallback } from "react";
import { attractionsService, Attraction } from "@/services/attractions.service";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import AttractionFormModal from "@/components/admin/AttractionFormModal";
import { Plus, Pencil, Trash2, MapPin, Map } from "lucide-react";
import { toast } from "sonner";

export default function AttractionsPage() {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Attraction | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await attractionsService.getAll();
      setAttractions(data);
    } catch (error) {
      toast.error("Failed to load attractions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (a: Attraction) => { setEditing(a); setModalOpen(true); };

  const handleSave = async (data: any, id?: string) => {
    try {
      if (id) {
        await attractionsService.update(id, data);
        toast.success("Attraction updated");
      } else {
        await attractionsService.create(data);
        toast.success("Attraction created");
      }
      load();
      setModalOpen(false);
    } catch (error: any) {
      toast.error("Failed to save attraction");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this attraction?")) return;
    try {
      await attractionsService.remove(id);
      toast.success("Attraction deleted");
      load();
    } catch (error) {
      toast.error("Failed to delete attraction");
    }
  };

  const columns = [
    { key: "name", header: "Attraction", render: (a: Attraction) => (
      <div className="flex items-center gap-3">
        {a.image && <img src={a.image} alt="" className="h-10 w-16 rounded-lg object-cover" />}
        <div>
          <p className="font-bold text-card-foreground text-sm uppercase tracking-tight">{a.name}</p>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
            <MapPin className="h-3 w-3" /> {a.location}
          </div>
        </div>
      </div>
    )},
    { key: "category", header: "Category", render: (a: Attraction) => <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-muted rounded-md">{a.category}</span> },
    { key: "altitude", header: "Altitude", render: (a: Attraction) => <span className="text-[10px] font-bold text-muted-foreground">{a.altitude || "N/A"}</span> },
    { key: "actions", header: "", render: (a: Attraction) => (
      <div className="flex gap-1 justify-end">
        <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id || (a as any)._id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="p-3 bg-white rounded-2xl shadow-sm">
              <Map className="w-6 h-6 text-primary" />
           </div>
           <h1 className="text-xl font-black text-foreground italic uppercase tracking-tighter">Attractions Library</h1>
        </div>
        <Button onClick={openCreate} className="rounded-xl shadow-lg shadow-primary/20 font-black uppercase text-[10px] tracking-widest"><Plus className="h-4 w-4 mr-2" />New Attraction</Button>
      </div>

      <DataTable
        columns={columns} data={attractions} loading={loading}
        searchKey="name" searchPlaceholder="Search attractions..."
        emptyMessage="No attractions yet" emptyIcon={<Map className="h-10 w-10 text-muted-foreground" />}
      />

      <AttractionFormModal open={modalOpen} onOpenChange={setModalOpen} editing={editing} onSave={handleSave} />
    </div>
  );
}
