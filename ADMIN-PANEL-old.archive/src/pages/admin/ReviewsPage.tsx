import { useEffect, useState, useCallback } from "react";
import { reviewsService } from "@/services/reviews.service";
import { tripsService } from "@/services/trips.service";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Star, MessageSquare, Camera, MapPin, X, Globe } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/admin/ImageUpload";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    userName: "",
    city: "",
    tripId: "",
    tripName: "",
    tripType: "Joined Group Trip",
    comment: "",
    rating: 5,
    userImage: "",
    instagram: "",
    isFeatured: true,
    photos: [] as string[]
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [revs, tps] = await Promise.all([
        reviewsService.getAll(),
        tripsService.getAll()
      ]);
      setReviews(revs);
      setTrips(tps);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setFormData({
      userName: "",
      city: "",
      tripId: "",
      tripName: "",
      tripType: "Joined Group Trip",
      comment: "",
      rating: 5,
      userImage: "",
      instagram: "",
      isFeatured: true,
      photos: []
    });
    setModalOpen(true);
  };

  const openEdit = (r: any) => {
    setEditing(r);
    setFormData({
      userName: r.userName,
      city: r.city || "",
      tripId: r.tripId || "",
      tripName: r.tripName || "",
      tripType: r.tripType || "Joined Group Trip",
      comment: r.comment,
      rating: r.rating,
      userImage: r.userImage || "",
      instagram: r.instagram || "",
      isFeatured: r.isFeatured,
      photos: r.photos || []
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.userName) return toast.error("Customer name is required");
    if (!formData.city) return toast.error("City is required");
    if (!formData.comment) return toast.error("Comment is required");
    if (!formData.tripId) return toast.error("Please select a trip");
    
    let finalInstagram = formData.instagram.trim();
    if (finalInstagram && !finalInstagram.startsWith("http")) {
      finalInstagram = `https://instagram.com/${finalInstagram.replace('@', '')}`;
    }

    const payload = {
      ...formData,
      instagram: finalInstagram,
      rating: Number(formData.rating) || 5
    };

    try {
      if (editing) {
        await reviewsService.update(editing._id || editing.id, payload);
        toast.success("Review updated");
      } else {
        await reviewsService.create(payload);
        toast.success("Review added");
      }
      setModalOpen(false);
      load();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to save review";
      toast.error(msg);
      console.error("Save Review Error:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    try {
      await reviewsService.remove(id);
      toast.success("Review deleted");
      load();
    } catch (error) {
      toast.error("Failed to delete review");
    }
  };

  const toggleFeatured = async (r: any) => {
    try {
      await reviewsService.update(r.id || r._id, { isFeatured: !r.isFeatured });
      toast.success(r.isFeatured ? "Removed from featured" : "Set as featured");
      load();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const columns = [
    { key: "userName", header: "Customer", render: (r: any) => (
      <div className="flex items-center gap-3">
        {r.userImage ? (
           <img src={r.userImage} alt="" className="h-10 w-10 rounded-full object-cover border border-border" />
        ) : (
           <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-xs uppercase">
             {r.userName?.split(' ').map((n: string) => n[0]).join('')}
           </div>
        )}
        <div>
          <p className="font-bold text-card-foreground leading-none mb-1">{r.userName}</p>
          <div className="flex items-center gap-2">
            {r.city && <span className="text-[10px] uppercase font-black tracking-widest text-primary-orange flex items-center gap-1"><MapPin className="h-2 w-2" /> {r.city}</span>}
            <span className="text-[10px] uppercase font-bold text-muted-foreground">{r.tripName}</span>
          </div>
        </div>
      </div>
    )},
    { key: "comment", header: "Feedback", render: (r: any) => (
      <div className="max-w-md">
        <p className="text-sm text-muted-foreground line-clamp-2 italic">"{r.comment}"</p>
        <div className="flex gap-1 mt-2">
          {(r.photos || []).slice(0, 4).map((p: string, i: number) => (
            <img key={i} src={p} className="h-8 w-8 rounded-md object-cover border" />
          ))}
        </div>
      </div>
    )},
    { key: "rating", header: "Rating", render: (r: any) => (
      <div className="flex items-center gap-1 text-orange-400">
        <Star className="h-3 w-3 fill-current" />
        <span className="font-bold text-xs">{r.rating}/5</span>
      </div>
    )},
    { key: "isFeatured", header: "Featured", render: (r: any) => (
      <Switch checked={r.isFeatured} onCheckedChange={() => toggleFeatured(r)} />
    )},
    { key: "actions", header: "", render: (r: any) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id || r._id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-[#F4F7FB] min-h-screen -mx-6 -my-6">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-5 h-5 text-[#F97316]" />
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Customer Reviews</h1>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Manage trip-specific reviews</p>
          </div>
        </div>
        <Button onClick={openCreate} className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white flex items-center gap-1.5 shadow-sm"><Plus className="h-4 w-4 mr-1" />Add Review</Button>
      </div>

      <DataTable
        columns={columns} data={reviews} loading={loading}
        searchKey="userName" searchPlaceholder="Search by customer name..."
        emptyMessage="No reviews found" emptyIcon={<MessageSquare className="h-10 w-10 text-muted-foreground" />}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl w-[95vw] sm:w-full rounded-md p-4 sm:p-8 max-h-[95dvh] overflow-y-auto custom-scrollbar border border-slate-200 shadow-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">{editing ? 'Edit Review' : 'Add New Review'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:gap-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Customer Name</Label>
                 <Input className="rounded-md h-9 text-sm font-medium" value={formData.userName} onChange={(e) => setFormData({...formData, userName: e.target.value})} placeholder="e.g. Deep Bhuvar" />
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">City / Location</Label>
                 <Input className="rounded-md h-9 text-sm font-medium" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="e.g. Ahmedabad" />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Linked Trip</Label>
                 <Select 
                   value={formData.tripId} 
                   onValueChange={(val) => {
                     const selected = trips.find(t => t.id === val || t._id === val);
                     setFormData({...formData, tripId: val, tripName: selected?.title || ""});
                   }}
                 >
                   <SelectTrigger className="rounded-sm h-9 text-sm font-medium border-gray-300">
                     <SelectValue placeholder="Select Trip" />
                   </SelectTrigger>
                   <SelectContent className="rounded-sm border-gray-200">
                      {trips.map(t => (
                        <SelectItem key={t.id || t._id} value={t.id || t._id}>{t.title}</SelectItem>
                      ))}
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trip Label / Type</Label>
                 <Input className="rounded-md h-9 text-sm font-medium" value={formData.tripType} onChange={(e) => setFormData({...formData, tripType: e.target.value})} placeholder="e.g. Joined Group Trip" />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rating (1-5)</Label>
                 <Input type="number" min="1" max="5" className="rounded-md h-9 text-sm font-medium" value={formData.rating} onChange={(e) => setFormData({...formData, rating: parseInt(e.target.value)})} />
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Instagram (Link or @)</Label>
                 <Input className="rounded-md h-9 text-sm font-medium" value={formData.instagram} onChange={(e) => setFormData({...formData, instagram: e.target.value})} placeholder="@deepbhuvar" />
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
               <div className="space-y-4">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Customer Profile Photo</Label>
                 <ImageUpload 
                   value={formData.userImage} 
                   onUpload={(url) => setFormData({...formData, userImage: url})} 
                 />
               </div>
               <div className="space-y-4">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Review Gallery (Up to 4 Photos)</Label>
                 <div className="space-y-3">
                   <div className="grid grid-cols-4 gap-2">
                     {formData.photos.map((p, i) => (
                       <div key={i} className="relative aspect-square rounded-lg overflow-hidden border group">
                          <img src={p} className="w-full h-full object-cover" />
                          <button 
                            onClick={() => {
                              const next = [...formData.photos];
                              next.splice(i, 1);
                              setFormData({...formData, photos: next});
                            }}
                            className="absolute top-1 right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all"
                          >
                             <X className="w-2.5 h-2.5" />
                          </button>
                       </div>
                     ))}
                   </div>
                   <ImageUpload 
                     multiple
                     onUpload={(urls) => {
                       const next = [...formData.photos, ...(Array.isArray(urls) ? urls : [urls])].slice(0, 4);
                       setFormData({...formData, photos: next});
                     }} 
                   />
                 </div>
               </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Comment / Review</Label>
              <Textarea className="rounded-md h-32 p-3 text-sm font-medium leading-relaxed" value={formData.comment} onChange={(e) => setFormData({...formData, comment: e.target.value})} placeholder="What did the traveler say about their experience?" />
            </div>

            <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-md border border-slate-200">
               <Switch id="isFeatured" checked={formData.isFeatured} onCheckedChange={(v) => setFormData({...formData, isFeatured: v})} />
               <Label htmlFor="isFeatured" className="text-sm font-bold opacity-70">Feature this review on Home page</Label>
            </div>
          </div>
          <DialogFooter className="pt-6 border-t mt-6 flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="w-full sm:w-auto rounded-[4px] h-8.5 px-6 font-semibold text-xs">Cancel</Button>
            <Button onClick={handleSave} className="w-full sm:w-auto rounded-[4px] h-8.5 px-6 font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white shadow-sm">Save Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

