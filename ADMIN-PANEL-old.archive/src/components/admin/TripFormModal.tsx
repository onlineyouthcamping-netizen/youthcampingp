import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminModal } from "./AdminModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Trip, TripFormData, ItineraryDay, FAQ } from "@/types";
import { Plus, Trash2, CalendarDays, ImagePlus, Image as ImageIcon, X, HelpCircle, Star, CheckCircle, XCircle, FileText, Globe, Upload, Plane, Car, Train, ArrowUp, ArrowDown, MessageSquare, MapPin, Settings2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { settingsService } from "@/services/settings.service";
import { ImageUpload } from "./ImageUpload";
import { attractionsService, Attraction } from "@/services/attractions.service";
import api from "@/services/api";
import { cn } from "@/lib/utils";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const emptyDay = (day: number): ItineraryDay => ({
  day, title: "", description: "", location: "", activities: [], stay: "", meals: "", photos: [],
});

const deleteServerFile = async (url: string) => {
  if (!url || url.startsWith('http') || url.startsWith('blob:') || !url.startsWith('/uploads/')) return;
  try {
    await api.delete("/upload/photo", { data: { url } });
  } catch (err) {
    console.error("Failed to delete file from server:", url, err);
  }
};

const emptyFaq = (): FAQ => ({ question: "", answer: "" });

interface CustomSection {
  id: string;
  type: string;
  title: string;
  content: any;
}

interface SEOData {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  ogImage: string;
  canonicalUrl: string;
  faqSchema: any[];
}

const defaultForm: TripFormData & { customSections?: CustomSection[], seo?: SEOData } = {
  title: "", slug: "", description: "", heroImage: "", price: 0, location: "",
  duration: "", category: "", images: [], itinerary: [], highlights: [],
  inclusions: [], exclusions: [], faqs: [], availableDates: [], 
  variants: [], pickupCities: [], travelOptions: [], roomOptions: [], addons: [], status: "draft",
  maxGroupSize: 20, difficulty: "moderate", departureCity: "", ageLimit: "", bookingUrl: "",
  customSections: [],
  attractions: [],
  activities: [],
  accommodations: [],
  popupDetails: {
    cancellation: [],
    terms: [],
    carry: [],
    etiquette: []
  },
  route: [],
  seo: {
    metaTitle: "",
    metaDescription: "",
    focusKeyword: "",
    ogImage: "",
    canonicalUrl: "",
    faqSchema: []
  }
};

const CATEGORIES = ["Himalayan", "Beach", "Adventure", "Cultural", "Wildlife", "Luxury", "City", "Backpacking", "Road Trip", "Trekking", "Pilgrimage", "Bike Expedition", "Workation", "Spiritual"];

const TabBtn = ({ value, label }: { value: string, label: string }) => (
  <TabsTrigger 
    value={value} 
    className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all
               data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20"
  >
    {label}
  </TabsTrigger>
);

interface TripFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Trip | null;
  onSave: (data: TripFormData, editingId?: string) => Promise<void>;
}

export default function TripFormModal({ open, onOpenChange, editing, onSave }: TripFormModalProps) {
  const [form, setForm] = useState<any>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [customFields, setCustomFields] = useState([]);
  const [globalAttractions, setGlobalAttractions] = useState<Attraction[]>([]);
  
  const [newHighlight, setNewHighlight] = useState("");
  const [newCityName, setNewCityName] = useState("");
  const [newPickupPoint, setNewPickupPoint] = useState("");
  const [newSkipDays, setNewSkipDays] = useState(0);
  const [newDeduction, setNewDeduction] = useState(0);
  const [previewCityIndex, setPreviewCityIndex] = useState<number | "">("");
  const [newInclusion, setNewInclusion] = useState("");
  const [newExclusion, setNewExclusion] = useState("");
  const [repeatFreq, setRepeatFreq] = useState("weekly");
  const [repeatCount, setRepeatCount] = useState(4);
  const [repeatStartDate, setRepeatStartDate] = useState("");

  // 1. Fetch Global Custom Field Definitions
  useEffect(() => {
    settingsService.get().then(res => {
      setCustomFields(res.tripCustomFields || []);
    });
    attractionsService.getAll().then(res => {
      setGlobalAttractions(res || []);
    });
  }, []);

  // 2. Sync Form Data when Editing state changes
  useEffect(() => {
    const ensureArray = (val: any) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
      }
      return [];
    };

    if (editing) {
      setForm({
        ...editing,
        itinerary: ensureArray(editing.itinerary),
        highlights: editing.highlights || [],
        inclusions: editing.inclusions || [],
        exclusions: editing.exclusions || [],
        faqs: editing.faqs || [],
        availableDates: editing.availableDates || [],
        variants: editing.variants || [],
        pickupCities: (editing as any).pickupCities || [],
        addons: editing.addons || [],
        travelOptions: editing.travelOptions || [],
        roomOptions: editing.roomOptions || [],
        customSections: (editing as any).customSections || [],
        activities: (editing as any).activities || [],
        accommodations: (editing as any).accommodations || [],
        reviews: (editing as any).reviews || [],
        reels: (editing as any).reels || [],
        seo: {
          ...defaultForm.seo,
          ...(editing as any).seo
        }
      });
    } else {
      setForm(defaultForm);
    }
  }, [editing, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const normalize = (data: any) => {
        const cleanDoc = (obj: any): any => {
          if (Array.isArray(obj)) return obj.map(cleanDoc);
          if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
            const { _id, id, createdAt, updatedAt, __v, ...rest } = obj;
            const result: any = {};
            for (const key in rest) {
              result[key] = cleanDoc(rest[key]);
            }
            return result;
          }
          return obj;
        };

        const clean = cleanDoc(data);
        if (clean.difficulty) clean.difficulty = clean.difficulty.toLowerCase();
        if (clean.status) clean.status = clean.status.toLowerCase();
        if (clean.price) clean.price = Number(clean.price);
        if (clean.maxGroupSize) clean.maxGroupSize = Number(clean.maxGroupSize);

        if (clean.availableDates) {
          clean.availableDates = clean.availableDates.map((d: any) => ({
            date: d.date || d,
            capacity: Number(d.capacity || 20),
            bookedCount: Number(d.bookedCount || 0)
          }));
        }

        if (clean.gallery) {
          clean.gallery = clean.gallery.map((img: any, i: number) => ({
            url: typeof img === 'string' ? img : img.url,
            alt: img.alt || "",
            order: Number(img.order || i)
          }));
        }

        if (clean.accommodations) {
          clean.accommodations = clean.accommodations.map((acc: any) => ({
            ...acc,
            gallery: (acc.gallery || []).map((g: any) => {
              if (typeof g === 'string') return { url: g, category: 'All' };
              return { url: g.url || "", category: g.category || "All" };
            }).filter((g: any) => g.url)
          }));
        }

        if (clean.reviews) {
          clean.reviews = clean.reviews
            .filter((rev: any) => rev.userName && rev.comment && String(rev.userName).trim() !== "" && String(rev.comment).trim() !== "")
            .map((rev: any) => {
              const original = (form.reviews || []).find((r: any) => r.userName === rev.userName);
              return {
                ...rev,
                id: original?.id || original?._id || undefined,
                _id: original?._id || original?.id || undefined
              };
            });
        }
        if (clean.pickupCities) {
          clean.pickupCities = clean.pickupCities.map((pc: any) => ({
            cityName: pc.cityName || "",
            pickupPoint: pc.pickupPoint || "",
            skipDays: Number(pc.skipDays || 0),
            deductionAmount: Number(pc.deductionAmount || 0)
          }));
        }
        return clean;
      };

      const cleanData = normalize(form);
      const editingId = editing?.id || (editing as any)?._id;
      await onSave(cleanData, editingId);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const formatUrl = (url: string | undefined) => {
    if (!url) return "";
    const cleanUrl = url.split('|')[0];
    if (cleanUrl.startsWith("http")) return cleanUrl;
    const apiBase = api.defaults.baseURL || "https://api.youthcamping.online/api";
    const serverBase = apiBase.split('/api')[0];
    return `${serverBase}${cleanUrl}`;
  };

  // List helpers
  const addToList = (field: "highlights" | "inclusions" | "exclusions", value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    const items = value.split(/[,\n]/).map(s => s.trim().replace(/^[•\-\*]\s*/, "")).filter(Boolean);
    setForm({ ...form, [field]: [...form[field], ...items] });
    setter("");
  };

  const removeFromList = (field: "highlights" | "inclusions" | "exclusions", index: number) => {
    setForm({ ...form, [field]: form[field].filter((_, i) => i !== index) });
  };

  const addDay = () => setForm({ ...form, itinerary: [...form.itinerary, emptyDay(form.itinerary.length + 1)] });
  const updateDay = (index: number, field: keyof ItineraryDay, value: any) => {
    const updated = [...form.itinerary];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, itinerary: updated });
  };
  const removeDay = (index: number) => {
    const updated = form.itinerary.filter((_, i) => i !== index).map((d, i) => ({ ...d, day: i + 1 }));
    setForm({ ...form, itinerary: updated });
  };
  const addDayPhoto = (index: number) => {
    const url = prompt("Enter image URL:");
    if (!url) return;
    const updated = [...form.itinerary];
    updated[index] = { ...updated[index], photos: [...(updated[index].photos || []), url] };
    setForm({ ...form, itinerary: updated });
  };
  const removeDayPhoto = async (dayIndex: number, photoIndex: number) => {
    const rawPhoto = form.itinerary[dayIndex].photos[photoIndex];
    if (!rawPhoto) return;
    const [url] = rawPhoto.split('|');
    if (confirm("Permanently delete this photo from the server?")) {
      await deleteServerFile(url);
      const updated = [...form.itinerary];
      updated[dayIndex] = { ...updated[dayIndex], photos: (updated[dayIndex].photos || []).filter((_, i) => i !== photoIndex) };
      setForm({ ...form, itinerary: updated });
    }
  };

  const addFaq = () => setForm({ ...form, faqs: [...form.faqs, emptyFaq()] });
  const updateFaq = (index: number, field: keyof FAQ, value: string) => {
    const updated = [...form.faqs];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, faqs: updated });
  };
  const removeFaq = (index: number) => setForm({ ...form, faqs: form.faqs.filter((_, i) => i !== index) });

  const generateRepeatDates = () => {
    if (!repeatStartDate) return;
    const start = new Date(repeatStartDate);
    const newDates = [{ date: repeatStartDate, capacity: 99, bookedCount: 0 }];
    for (let i = 1; i < repeatCount; i++) {
      const next = new Date(start);
      if (repeatFreq === "weekly") next.setDate(start.getDate() + (i * 7));
      else if (repeatFreq === "monthly") next.setMonth(start.getMonth() + i);
      newDates.push({ date: next.toISOString().split('T')[0], capacity: 99, bookedCount: 0 });
    }
    setForm({ ...form, availableDates: [...new Set([...form.availableDates, ...newDates])].sort((a:any, b:any) => a.date.localeCompare(b.date)) });
  };

  const footer = (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</span>
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", form.status === 'published' ? 'bg-green-500' : 'bg-amber-500')} />
            <span className="text-sm font-bold uppercase tracking-tight text-slate-900">{form.status || 'Draft'}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-12 px-6 font-bold text-slate-600 border-slate-200">
          Discard
        </Button>
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] h-12 px-10 rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-95"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {editing ? "Update Experience" : "Create Experience"}
        </Button>
      </div>
    </div>
  );

  return (
    <AdminModal
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Update Experience" : "Create New Experience"}
      description="Configure all details for this expedition"
      footer={footer}
      maxWidth="max-w-4xl"
    >
      <Tabs defaultValue="details" className="w-full">
        <div className="mb-10 space-y-6">
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Configuration Modules</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <TabsList className="col-span-full h-auto p-1 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-4 md:grid-cols-7 lg:grid-cols-12 gap-1">
                <TabBtn value="details" label="Details" />
                <TabBtn value="gallery" label="Gallery" />
                <TabBtn value="pricing" label="Pricing" />
                <TabBtn value="multicity" label="Cities" />
                <TabBtn value="dates" label="Dates" />
                <TabBtn value="itinerary" label="Itin" />
                <TabBtn value="highlights" label="High" />
                <TabBtn value="inclexcl" label="Inc/Exc" />
                <TabBtn value="faqs" label="FAQs" />
                <TabBtn value="attractions" label="Attrs" />
                <TabBtn value="seo" label="SEO" />
                <TabBtn value="advanced" label="Adv" />
              </TabsList>
            </div>
          </div>
        </div>

          <TabsContent value="details">
            <div className="space-y-6 pt-4">
              <ImageUpload 
                label="Main Experience Image"
                value={form.heroImage}
                onUpload={(url) => setForm({ ...form, heroImage: url })}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest opacity-50">Trip Title</Label>
                  <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })} className="rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tripCode" className="text-[10px] font-black uppercase tracking-widest opacity-50">Trip Code (Manual)</Label>
                  <Input 
                    id="tripCode" 
                    value={form.shortName || form.id || ""} 
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setForm({ ...form, id: val, shortName: val, tripCode: val });
                    }} 
                    placeholder="e.g. MKA1" 
                    autoComplete="off"
                    className="rounded-xl font-bold uppercase" 
                  />
                  <p className="text-[8px] text-muted-foreground ml-1">Editable anytime. Use short codes like MKA1 for easy tracking.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="order" className="text-[10px] font-black uppercase tracking-widest opacity-50">Display Order</Label>
                  <Input 
                    id="order" 
                    type="number"
                    value={form.order || 0} 
                    onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} 
                    className="rounded-xl font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Base Price (₹)</Label>
                  <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Location</Label>
                  <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="rounded-xl" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Duration</Label>
                  <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Category</Label>
                  <Input 
                    value={form.category} 
                    onChange={(e) => setForm({ ...form, category: e.target.value })} 
                    list="trip-categories"
                    className="rounded-xl"
                    placeholder="Type or select category..."
                  />
                  <datalist id="trip-categories">
                    {CATEGORIES.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Age Group</Label>
                  <Input value={form.ageGroup || ""} onChange={(e) => setForm({ ...form, ageGroup: e.target.value })} placeholder="18-35" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Max Altitude</Label>
                  <Input value={form.maxAltitude || ""} onChange={(e) => setForm({ ...form, maxAltitude: e.target.value })} placeholder="14,000 ft" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Trip Type</Label>
                  <Input value={form.tripType || ""} onChange={(e) => setForm({ ...form, tripType: e.target.value })} placeholder="Group Trip" className="rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Start / End</Label>
                  <Input value={form.startEnd || ""} onChange={(e) => setForm({ ...form, startEnd: e.target.value })} placeholder="Manali to Manali" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Pickup Mode</Label>
                  <Input value={form.pickupMode || ""} onChange={(e) => setForm({ ...form, pickupMode: e.target.value })} placeholder="Volvo / Traveler" className="rounded-xl" />
                </div>
              </div>

              <div className="pt-6 border-t space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest opacity-50">Full Circuit / Route Summary</Label>
                <div className="flex gap-2">
                  <div className="flex-1 flex gap-2">
                    <Input 
                      id="new-route-stop"
                      placeholder="Add Stop (e.g. Ahmedabad)" 
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const input = e.currentTarget as HTMLInputElement;
                          if (input.value) {
                            setForm({ ...form, route: [...(form.route || []), { label: input.value, icon: "car" }] });
                            input.value = "";
                          }
                        }
                      }}
                      className="rounded-xl h-10 text-xs" 
                    />
                    <div className="flex gap-1">
                       {['plane', 'car', 'train'].map(icon => (
                         <Button 
                            key={icon}
                            variant="outline" 
                            size="icon" 
                            className="h-10 w-10 rounded-xl"
                            onClick={() => {
                              const input = document.getElementById("new-route-stop") as HTMLInputElement;
                              if (input.value) {
                                setForm({ ...form, route: [...(form.route || []), { label: input.value, icon }] });
                                input.value = "";
                              }
                            }}
                         >
                           {icon === 'plane' && <Plane className="w-3.5 h-3.5" />}
                           {icon === 'car' && <Car className="w-3.5 h-3.5" />}
                           {icon === 'train' && <Train className="w-3.5 h-3.5" />}
                         </Button>
                       ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {(form.route || []).map((stop: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/20 text-[10px] font-bold">
                      {stop.icon === 'plane' && <Plane className="w-3 h-3" />}
                      {stop.icon === 'car' && <Car className="w-3 h-3" />}
                      {stop.icon === 'train' && <Train className="w-3 h-3" />}
                      {stop.label}
                      <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => setForm({ ...form, route: form.route.filter((_:any, idx:number) => idx !== i) })} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="multicity">
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Multi-City Pickup Points</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Allow users to join from other cities and automatically calculate deductions and skipped days.</p>
                </div>
              </div>

              {/* Add City Form */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Add Pickup City</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="cityName" className="text-[10px] font-black uppercase tracking-widest opacity-50">City Name *</Label>
                    <Input 
                      id="cityName" 
                      placeholder="e.g. Ahmedabad" 
                      value={newCityName} 
                      onChange={e => setNewCityName(e.target.value)} 
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pickupPoint" className="text-[10px] font-black uppercase tracking-widest opacity-50">Pickup Point *</Label>
                    <Input 
                      id="pickupPoint" 
                      placeholder="e.g. Kalupur Railway Station Platform 1" 
                      value={newPickupPoint} 
                      onChange={e => setNewPickupPoint(e.target.value)} 
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="skipDays" className="text-[10px] font-black uppercase tracking-widest opacity-50">Skip Days *</Label>
                    <Input 
                      id="skipDays" 
                      type="number"
                      placeholder="e.g. 2" 
                      value={newSkipDays} 
                      onChange={e => setNewSkipDays(parseInt(e.target.value) || 0)} 
                      className="h-9 text-xs rounded-xl"
                    />
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Number of itinerary days to omit from trip start</p>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="deductionAmount" className="text-[10px] font-black uppercase tracking-widest opacity-50">Deduction Amount (₹) *</Label>
                    <Input 
                      id="deductionAmount" 
                      type="number"
                      placeholder="e.g. 1500" 
                      value={newDeduction} 
                      onChange={e => setNewDeduction(parseFloat(e.target.value) || 0)} 
                      className="h-9 text-xs rounded-xl font-mono text-emerald-600 font-bold"
                    />
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Deducted from base package price</p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button 
                    type="button"
                    onClick={() => {
                      if (!newCityName.trim() || !newPickupPoint.trim()) {
                        alert("City Name and Pickup Point are required!");
                        return;
                      }
                      if (newSkipDays < 0) {
                        alert("Skip Days must be non-negative!");
                        return;
                      }
                      if (newSkipDays >= form.itinerary.length) {
                        alert(`Cannot skip ${newSkipDays} days! The total trip duration is only ${form.itinerary.length} days.`);
                        return;
                      }
                      if (newDeduction < 0) {
                        alert("Deduction amount must be non-negative!");
                        return;
                      }
                      if (newDeduction > form.price) {
                        alert(`Deduction amount (₹${newDeduction}) cannot exceed the base price (₹${form.price})!`);
                        return;
                      }

                      // Append to list
                      const newCity = {
                        cityName: newCityName.trim(),
                        pickupPoint: newPickupPoint.trim(),
                        skipDays: Number(newSkipDays),
                        deductionAmount: Number(newDeduction)
                      };

                      setForm({
                        ...form,
                        pickupCities: [...(form.pickupCities || []), newCity]
                      });

                      // Clear fields
                      setNewCityName("");
                      setNewPickupPoint("");
                      setNewSkipDays(0);
                      setNewDeduction(0);
                    }}
                    className="bg-primary text-black font-black uppercase text-[10px] tracking-widest h-9 px-6 rounded-xl"
                  >
                    Add City Configuration
                  </Button>
                </div>
              </div>

              {/* Configure List */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Configured Pickup Cities ({form.pickupCities?.length || 0})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {form.pickupCities?.map((city: any, idx: number) => (
                    <div key={idx} className="border border-slate-200 bg-white rounded-2xl p-5 relative group flex flex-col justify-between hover:border-primary/30 transition-all">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        type="button"
                        className="absolute top-3 right-3 h-8 w-8 text-destructive hover:bg-destructive/5 rounded-xl"
                        onClick={() => {
                          setForm({
                            ...form,
                            pickupCities: form.pickupCities.filter((_: any, i: number) => i !== idx)
                          });
                          if (previewCityIndex === idx) {
                            setPreviewCityIndex("");
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      
                      <div className="space-y-3">
                        <div>
                          <span className="inline-block bg-primary/10 text-primary font-black uppercase tracking-widest text-[9px] px-2 py-0.5 rounded-full mb-1">
                            ₹{city.deductionAmount} Deduction
                          </span>
                          <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">{city.cityName}</h4>
                          <p className="text-xs text-slate-500 font-medium">{city.pickupPoint}</p>
                        </div>
                        <div className="flex gap-2 text-[10px] font-bold uppercase text-slate-400 font-mono">
                          <span>Skip Days: {city.skipDays}</span>
                          <span>·</span>
                          <span>Adjusted Price: ₹{(form.price - city.deductionAmount).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t flex justify-end">
                        <Button
                          variant={previewCityIndex === idx ? "default" : "outline"}
                          size="sm"
                          type="button"
                          onClick={() => setPreviewCityIndex(previewCityIndex === idx ? "" : idx)}
                          className={cn(
                            "text-[9px] font-black uppercase tracking-widest h-8 rounded-lg",
                            previewCityIndex === idx ? "bg-slate-900 text-white" : ""
                          )}
                        >
                          {previewCityIndex === idx ? "Close Preview" : "Preview Itinerary"}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!form.pickupCities || form.pickupCities.length === 0) && (
                    <div className="col-span-full border border-dashed border-slate-200 p-8 rounded-2xl text-center space-y-2">
                      <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No custom pickup cities configured yet.</p>
                      <p className="text-[10px] text-slate-300 font-medium">Use the form above to add pickup cities with specific deductions and skipped itinerary days.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Itinerary Preview for selected city */}
              {previewCityIndex !== "" && form.pickupCities?.[previewCityIndex] && (
                <div className="pt-6 border-t space-y-4">
                  {(() => {
                    const selCity = form.pickupCities[previewCityIndex];
                    const skipped = selCity.skipDays;
                    const remainingItinerary = (form.itinerary || []).slice(skipped);

                    return (
                      <div className="bg-slate-900 text-white rounded-[32px] p-8 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-4">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Live Preview</span>
                            <h4 className="text-xl font-bold uppercase tracking-tight">Joining From: {selCity.cityName}</h4>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Adjusted Pricing</p>
                            <p className="text-2xl font-black text-primary">₹{(form.price - selCity.deductionAmount).toLocaleString()} <span className="text-xs font-bold text-white/40 line-through">₹{form.price.toLocaleString()}</span></p>
                          </div>
                        </div>

                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                          <p className="text-xs font-bold uppercase tracking-widest text-white/50">Adjusted Day-Wise Itinerary (Skipped first {skipped} days)</p>
                          {remainingItinerary.map((day: any, dIdx: number) => (
                            <div key={dIdx} className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-1">
                              <span className="bg-white/10 text-white/80 font-black uppercase tracking-widest text-[9px] px-2 py-0.5 rounded">
                                Day {dIdx + 1} (Orig Day {day.day})
                              </span>
                              <h5 className="text-sm font-bold">{day.title}</h5>
                              <p className="text-xs text-white/60 font-medium leading-relaxed line-clamp-2">{day.description}</p>
                            </div>
                          ))}
                          {remainingItinerary.length === 0 && (
                            <p className="text-xs text-amber-400 italic">No remaining itinerary days. Try reducing skip days.</p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pricing">
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-widest opacity-50">Location Variants</Label>
                <Button variant="outline" size="sm" onClick={() => setForm({ ...form, variants: [...form.variants, { location: "", duration: "", originalPrice: 0, discountedPrice: 0, image: "" }] })} className="rounded-xl h-8 text-[10px] font-black uppercase">
                  <Plus className="h-3 w-3 mr-1" />Add Variant
                </Button>
              </div>
              <div className="space-y-4">
                {form.variants?.map((v:any, i:number) => (
                   <div key={i} className="border bg-muted/20 rounded-2xl p-4 space-y-3 relative group">
                     <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100" onClick={() => setForm({ ...form, variants: form.variants.filter((_:any, idx:number) => idx !== i) })}><Trash2 className="h-3 w-3" /></Button>
                     
                     <div className="flex gap-4">
                       <div className="w-24 shrink-0">
                         <ImageUpload 
                           value={v.image}
                           onUpload={(url) => {
                             const updated = [...form.variants];
                             updated[i].image = url;
                             setForm({ ...form, variants: updated });
                           }}
                         />
                       </div>
                       
                       <div className="flex-1 space-y-3">
                         <div className="grid grid-cols-2 gap-3">
                           <Input value={v.location} placeholder="Location (e.g. Delhi)" onChange={(e) => { const updated = [...form.variants]; updated[i].location = e.target.value; setForm({ ...form, variants: updated }); }} className="h-9 text-xs" />
                           <Input value={v.duration} placeholder="Duration (e.g. 5D/4N)" onChange={(e) => { const updated = [...form.variants]; updated[i].duration = e.target.value; setForm({ ...form, variants: updated }); }} className="h-9 text-xs" />
                         </div>
                         <div className="grid grid-cols-2 gap-3">
                            <Input type="number" value={v.originalPrice} placeholder="Orig. Price" onChange={(e) => { const updated = [...form.variants]; updated[i].originalPrice = Number(e.target.value); setForm({ ...form, variants: updated }); }} className="h-9 text-xs" />
                            <Input type="number" value={v.discountedPrice} placeholder="Disc. Price" onChange={(e) => { const updated = [...form.variants]; updated[i].discountedPrice = Number(e.target.value); setForm({ ...form, variants: updated }); }} className="h-9 text-xs" />
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <input 
                              type="checkbox" 
                              id={`excludeTravel-modal-${i}`}
                              checked={v.excludeTravel || false} 
                              onChange={(e) => {
                                const updated = [...form.variants];
                                updated[i].excludeTravel = e.target.checked;
                                setForm({ ...form, variants: updated });
                              }} 
                              className="accent-[#FF5400] h-4 w-4 cursor-pointer"
                            />
                            <label htmlFor={`excludeTravel-modal-${i}`} className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                              Direct Join (Exclude Travel/Train Options)
                            </label>
                          </div>
                       </div>
                     </div>
                   </div>
                ))}
              </div>


              {/* Travel Options Section */}
              <div className="pt-6 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Plane className="w-3 h-3" /> Travelling Options
                  </Label>
                  <Button variant="outline" size="sm" onClick={() => setForm({ ...form, travelOptions: [...(form.travelOptions || []), { label: "", priceDelta: 0, description: "" }] })} className="h-7 text-[9px] font-black uppercase">Add Option</Button>
                </div>
                <div className="space-y-3">
                   {(form.travelOptions || []).map((opt: any, i: number) => (
                     <div key={i} className="bg-muted/30 p-4 rounded-xl space-y-2 relative group border border-transparent hover:border-primary/20">
                       <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100" onClick={() => {
                          const updated = form.travelOptions.filter((_:any, idx:number) => idx !== i);
                          setForm({ ...form, travelOptions: updated });
                       }}><Trash2 className="h-3 w-3" /></Button>
                       <div className="grid grid-cols-2 gap-2">
                          <Input value={opt.label} placeholder="Label (e.g. AC Sleeper)" onChange={(e) => {
                            const updated = [...form.travelOptions]; updated[i].label = e.target.value; setForm({ ...form, travelOptions: updated });
                          }} className="h-8 text-xs font-bold" />
                          <Input type="number" value={opt.priceDelta} placeholder="Price Delta (+)" onChange={(e) => {
                            const updated = [...form.travelOptions]; updated[i].priceDelta = Number(e.target.value); setForm({ ...form, travelOptions: updated });
                          }} className="h-8 text-xs" />
                       </div>
                       <Input value={opt.description} placeholder="Short Description" onChange={(e) => {
                          const updated = [...form.travelOptions]; updated[i].description = e.target.value; setForm({ ...form, travelOptions: updated });
                       }} className="h-7 text-[10px] bg-background" />
                     </div>
                   ))}
                </div>
              </div>

              {/* Room Options Section */}
              <div className="pt-6 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Star className="w-3 h-3" /> Room Sharing Options
                  </Label>
                  <Button variant="outline" size="sm" onClick={() => setForm({ ...form, roomOptions: [...(form.roomOptions || []), { label: "", priceDelta: 0 }] })} className="h-7 text-[9px] font-black uppercase">Add Option</Button>
                </div>
                <div className="space-y-3">
                   {(form.roomOptions || []).map((opt: any, i: number) => (
                     <div key={i} className="bg-muted/30 p-3 rounded-xl flex gap-3 items-center relative group">
                        <Input value={opt.label} placeholder="e.g. Triple Sharing" onChange={(e) => {
                          const updated = [...form.roomOptions]; updated[i].label = e.target.value; setForm({ ...form, roomOptions: updated });
                        }} className="h-8 text-xs font-bold" />
                        <Input type="number" value={opt.priceDelta} placeholder="+ Price" onChange={(e) => {
                          const updated = [...form.roomOptions]; updated[i].priceDelta = Number(e.target.value); setForm({ ...form, roomOptions: updated });
                        }} className="h-8 text-xs w-24" />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100" onClick={() => {
                          const updated = form.roomOptions.filter((_:any, idx:number) => idx !== i);
                          setForm({ ...form, roomOptions: updated });
                        }}><Trash2 className="h-3 w-3" /></Button>
                     </div>
                   ))}
                </div>
              </div>

              <div className="pt-6 border-t space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Star className="w-3 h-3" /> Sticky Action Card
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase font-black opacity-50">Sticky Price (₹)</Label>
                    <Input type="number" value={form.stickyCardPrice || 0} onChange={(e) => setForm({ ...form, stickyCardPrice: Number(e.target.value) })} className="rounded-xl h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase font-black opacity-50">Sticky Label</Label>
                    <Input value={form.stickyCardLabel || ""} onChange={(e) => setForm({ ...form, stickyCardLabel: e.target.value })} placeholder="e.g. per person" className="rounded-xl h-10" />
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Star className="w-3 h-3" /> Booking Form Labels
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase font-black opacity-50">Joining Point Title</Label>
                    <Input value={form.bookingFormLabels?.joiningPoint || ""} onChange={(e) => setForm({ ...form, bookingFormLabels: { ...form.bookingFormLabels, joiningPoint: e.target.value } })} placeholder="e.g. Joining Point" className="rounded-xl h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase font-black opacity-50">Travelers Manifest Title</Label>
                    <Input value={form.bookingFormLabels?.travelers || ""} onChange={(e) => setForm({ ...form, bookingFormLabels: { ...form.bookingFormLabels, travelers: e.target.value } })} placeholder="e.g. Traveler Manifest" className="rounded-xl h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase font-black opacity-50">Travel Option Title</Label>
                    <Input value={form.bookingFormLabels?.travelOption || ""} onChange={(e) => setForm({ ...form, bookingFormLabels: { ...form.bookingFormLabels, travelOption: e.target.value } })} placeholder="e.g. Train Ticket Option" className="rounded-xl h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase font-black opacity-50">Room Sharing Option Title</Label>
                    <Input value={form.bookingFormLabels?.roomSharing || ""} onChange={(e) => setForm({ ...form, bookingFormLabels: { ...form.bookingFormLabels, roomSharing: e.target.value } })} placeholder="e.g. Room Sharing Option" className="rounded-xl h-10" />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="addons">
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-widest opacity-50">Trip Add-ons</Label>
                <Button variant="outline" size="sm" onClick={() => setForm({ ...form, addons: [...(form.addons || []), { name: "", rate: 0, description: "", minQuantity: 1, maxQuantity: 99 }] })} className="rounded-xl h-8 text-[10px] font-black uppercase">
                  <Plus className="h-3 w-3 mr-1" />Add Add-on
                </Button>
              </div>
              <div className="space-y-4">
                {form.addons?.map((addon:any, i:number) => (
                  <div key={i} className="border bg-muted/20 rounded-2xl p-4 space-y-3 relative group">
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100" onClick={() => setForm({ ...form, addons: form.addons.filter((_:any, idx:number) => idx !== i) })}><Trash2 className="h-3 w-3" /></Button>
                    <Input value={addon.name} placeholder="Add-on Name (e.g. Rafting)" onChange={(e) => { const updated = [...form.addons]; updated[i].name = e.target.value; setForm({ ...form, addons: updated }); }} className="h-9 text-xs font-bold" />
                    <div className="grid grid-cols-3 gap-3">
                      <Input type="number" value={addon.rate} placeholder="Rate" onChange={(e) => { const updated = [...form.addons]; updated[i].rate = Number(e.target.value); setForm({ ...form, addons: updated }); }} className="h-9 text-xs" />
                      <Input type="number" value={addon.minQuantity} placeholder="Min" onChange={(e) => { const updated = [...form.addons]; updated[i].minQuantity = Number(e.target.value); setForm({ ...form, addons: updated }); }} className="h-9 text-xs" />
                      <Input type="number" value={addon.maxQuantity} placeholder="Max" onChange={(e) => { const updated = [...form.addons]; updated[i].maxQuantity = Number(e.target.value); setForm({ ...form, addons: updated }); }} className="h-9 text-xs" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dates">
            <div className="space-y-6 pt-4">
              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Bulk Generate Dates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-black opacity-50">Start Date</Label>
                    <Input type="date" value={repeatStartDate} onChange={(e) => setRepeatStartDate(e.target.value)} className="h-9 text-xs rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-black opacity-50">Frequency</Label>
                    <Select value={repeatFreq} onValueChange={setRepeatFreq}>
                      <SelectTrigger className="h-9 text-xs rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-end gap-4">
                  <div className="flex-1 space-y-1">
                    <Label className="text-[9px] uppercase font-black opacity-50">Repeat Count</Label>
                    <Input type="number" value={repeatCount} onChange={(e) => setRepeatCount(Number(e.target.value))} className="h-9 text-xs rounded-xl" />
                  </div>
                  <Button variant="secondary" className="h-9 text-[10px] font-black uppercase rounded-xl" onClick={generateRepeatDates}>Generate</Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest opacity-50">Available Departure Dates</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {form.availableDates?.map((d: any, i: number) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-xl border text-[10px] font-bold">
                      {typeof d === 'string' ? new Date(d).toLocaleDateString() : new Date(d.date || d).toLocaleDateString()}
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => {
                        const updated = form.availableDates.filter((_:any, idx:number) => idx !== i);
                        setForm({ ...form, availableDates: updated });
                      }}><X className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  {form.availableDates?.length === 0 && <p className="col-span-full text-center py-8 text-[10px] font-medium opacity-50 italic">No dates selected</p>}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="itinerary">
            <div className="space-y-4 pt-4">
              {form.itinerary?.map((day:any, idx:number) => (
                <div key={idx} className="border bg-muted/10 p-4 rounded-2xl space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-black uppercase tracking-widest text-primary">Day {day.day}</Label>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100" onClick={() => removeDay(idx)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                  <Input value={day.title} placeholder="Title (e.g. Arrival in Manali)" onChange={(e) => updateDay(idx, "title", e.target.value)} className="h-9 text-xs font-bold" />
                  <Input value={day.location} placeholder="Location" onChange={(e) => updateDay(idx, "location", e.target.value)} className="h-9 text-xs" />
                  <Textarea value={day.description} placeholder="What will happen today?" onChange={(e) => updateDay(idx, "description", e.target.value)} className="text-xs min-h-[80px]" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={day.stay} placeholder="Stay (e.g. Luxury Camp)" onChange={(e) => updateDay(idx, "stay", e.target.value)} className="h-8 text-[10px]" />
                    <Input value={day.meals} placeholder="Meals (e.g. B, D)" onChange={(e) => updateDay(idx, "meals", e.target.value)} className="h-8 text-[10px]" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t">
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase opacity-50 font-black tracking-widest">Uploaded Photos</Label>
                      <div className="flex gap-3 overflow-x-auto pb-2 min-h-[96px] bg-slate-50/50 p-2.5 rounded-xl border border-dashed border-slate-200">
                        {day.photos?.map((p: string, pIdx: number) => {
                          const [url, caption = ""] = p.split('|');
                          return (
                            <div key={pIdx} className="relative group shrink-0 w-20 flex flex-col items-center">
                              <div className="relative w-20 h-20 rounded-xl overflow-hidden border bg-white shadow-sm transition-all hover:border-primary/50">
                                <img src={formatUrl(url)} className="w-full h-full object-cover" />
                                <button 
                                  type="button"
                                  className="absolute top-1 right-1 bg-destructive text-white rounded-full p-0.5 shadow hover:bg-destructive/90 transition-all z-10"
                                  onClick={() => removeDayPhoto(idx, pIdx)}
                                >
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </div>
                              <Input 
                                value={caption}
                                placeholder="Photo Name"
                                onChange={(e) => {
                                  const newCaption = e.target.value.replace(/\|/g, ""); // prevent breaking split
                                  const newPhotos = [...(day.photos || [])];
                                  newPhotos[pIdx] = newCaption ? `${url}|${newCaption}` : url;
                                  updateDay(idx, "photos", newPhotos);
                                }}
                                className="h-6 text-[9px] px-1 py-0.5 rounded-lg border border-slate-200 w-full text-center mt-1 focus-visible:ring-primary focus-visible:border-primary bg-white font-medium"
                              />
                            </div>
                          );
                        })}
                        {(!day.photos || day.photos.length === 0) && (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-4">
                            <ImageIcon className="w-6 h-6 opacity-30 mb-1" />
                            <p className="text-[9px] font-bold uppercase tracking-wider opacity-50">No photos uploaded</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase opacity-50 font-black tracking-widest">Add Photos</Label>
                      <ImageUpload 
                        multiple
                        onUpload={url => updateDay(idx, "photos", [...(day.photos || []), url])} 
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button onClick={addDay} className="w-full h-12 border-dashed rounded-2xl" variant="outline"><Plus className="h-4 w-4 mr-2" />Add Day to Itinerary</Button>
            </div>
          </TabsContent>

          <TabsContent value="highlights">
            <div className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black uppercase tracking-widest opacity-50">Trip Highlights</Label>
                  <Button variant="outline" size="sm" onClick={() => setForm({ ...form, highlights: [...(form.highlights || []), { name: "", image: "", description: "" }] })} className="h-8 text-[10px] font-black uppercase rounded-xl">
                    <Plus className="h-3 w-3 mr-1" />Add Highlight
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1">
                  {form.highlights?.map((h: any, i: number) => {
                    const isStr = typeof h === "string";
                    const item = isStr ? { name: h, image: "", description: "" } : h;
                    return (
                      <div key={i} className="border bg-muted/20 rounded-2xl p-4 space-y-3 relative group">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100" 
                          onClick={() => {
                            const updated = form.highlights.filter((_: any, idx: number) => idx !== i);
                            setForm({ ...form, highlights: updated });
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                        <div className="flex gap-4">
                          <div className="w-20 shrink-0">
                            <ImageUpload 
                              value={item.image || ""}
                              onUpload={(url) => {
                                const updated = [...form.highlights];
                                const currentItem = typeof updated[i] === "string" ? { name: updated[i], image: "", description: "" } : { ...updated[i] };
                                currentItem.image = url;
                                updated[i] = currentItem;
                                setForm({ ...form, highlights: updated });
                              }}
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <Input 
                              value={item.name || ""} 
                              placeholder="Highlight Name" 
                              onChange={(e) => {
                                const updated = [...form.highlights];
                                const currentItem = typeof updated[i] === "string" ? { name: updated[i], image: "", description: "" } : { ...updated[i] };
                                currentItem.name = e.target.value;
                                currentItem.slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                                updated[i] = currentItem;
                                setForm({ ...form, highlights: updated });
                              }} 
                              className="h-8 text-xs font-semibold" 
                            />
                            <Input 
                              value={item.description || ""} 
                              placeholder="Description (Optional)" 
                              onChange={(e) => {
                                const updated = [...form.highlights];
                                const currentItem = typeof updated[i] === "string" ? { name: updated[i], image: "", description: "" } : { ...updated[i] };
                                currentItem.description = e.target.value;
                                updated[i] = currentItem;
                                setForm({ ...form, highlights: updated });
                              }} 
                              className="h-8 text-[11px]" 
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="inclexcl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-green-600">Inclusions</Label>
                <div className="flex gap-2">
                  <Input value={newInclusion} onChange={(e) => setNewInclusion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addToList("inclusions", newInclusion, setNewInclusion)} className="rounded-xl h-9 text-xs" />
                  <Button size="icon" onClick={() => addToList("inclusions", newInclusion, setNewInclusion)} className="rounded-xl h-9 w-9"><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                  {form.inclusions?.map((item: string, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-green-50/30 rounded-xl border border-green-100 text-[10px]">
                      <span className="font-bold text-green-800">{item}</span>
                      <X className="h-3 w-3 text-green-400 cursor-pointer" onClick={() => removeFromList("inclusions", i)} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-red-600">Exclusions</Label>
                <div className="flex gap-2">
                  <Input value={newExclusion} onChange={(e) => setNewExclusion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addToList("exclusions", newExclusion, setNewExclusion)} className="rounded-xl h-9 text-xs" />
                  <Button size="icon" variant="destructive" onClick={() => addToList("exclusions", newExclusion, setNewExclusion)} className="rounded-xl h-9 w-9"><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                  {form.exclusions?.map((item: string, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-red-50/30 rounded-xl border border-red-100 text-[10px]">
                      <span className="font-bold text-red-800">{item}</span>
                      <X className="h-3 w-3 text-red-400 cursor-pointer" onClick={() => removeFromList("exclusions", i)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="faqs">
            <div className="space-y-4 pt-4">
              {form.faqs?.map((faq:any, i:number) => (
                <div key={i} className="border bg-muted/10 p-4 rounded-2xl space-y-2 relative group">
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100" onClick={() => removeFaq(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  <Input value={faq.question} placeholder="Question" onChange={(e) => updateFaq(i, "question", e.target.value)} className="h-9 text-xs font-bold" />
                  <Textarea value={faq.answer} placeholder="Answer" onChange={(e) => updateFaq(i, "answer", e.target.value)} className="text-xs min-h-[60px]" />
                </div>
              ))}
              <Button onClick={addFaq} className="w-full h-12 border-dashed rounded-2xl" variant="outline"><Plus className="h-4 w-4 mr-2" />Add New FAQ</Button>
            </div>
          </TabsContent>

          <TabsContent value="attractions">
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-widest opacity-50">Local Attractions</Label>
                <div className="flex gap-2">
                  <Select onValueChange={(slug) => {
                    const found = globalAttractions.find(a => a.slug === slug);
                    if (found) {
                      setForm({ ...form, attractions: [...(form.attractions || []), { name: found.name, image: found.image, slug: found.slug, description: found.description, order: form.attractions?.length || 0 }] });
                    }
                  }}>
                    <SelectTrigger className="w-[180px] h-8 text-[10px] font-black uppercase tracking-widest rounded-xl bg-muted/50 border-none">
                      <SelectValue placeholder="PULL FROM LIBRARY" />
                    </SelectTrigger>
                    <SelectContent>
                      {globalAttractions.map(a => <SelectItem key={a.slug} value={a.slug}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => setForm({ ...form, attractions: [...(form.attractions || []), { name: "", image: "", slug: "", description: "", order: form.attractions?.length || 0 }] })} className="rounded-xl h-8 text-[10px] font-black uppercase">
                    <Plus className="h-3 w-3 mr-1" />Custom
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                {(form.attractions || []).map((item: any, i: number) => (
                  <div key={i} className="border bg-muted/20 rounded-2xl p-6 space-y-4 relative group">
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => {
                        if (i === 0) return;
                        const updated = [...form.attractions];
                        [updated[i-1], updated[i]] = [updated[i], updated[i-1]];
                        setForm({ ...form, attractions: updated });
                      }} disabled={i === 0}><ArrowUp className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => {
                        if (i === form.attractions.length - 1) return;
                        const updated = [...form.attractions];
                        [updated[i], updated[i+1]] = [updated[i+1], updated[i]];
                        setForm({ ...form, attractions: updated });
                      }} disabled={i === form.attractions.length - 1}><ArrowDown className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setForm({ ...form, attractions: form.attractions.filter((_:any, idx:number) => idx !== i) })}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                    <div className="flex gap-4">
                       <ImageUpload 
                         value={item.image} 
                         className="w-48 shrink-0"
                         onUpload={url => {
                            const updated = [...form.attractions];
                            updated[i].image = url;
                            setForm({ ...form, attractions: updated });
                         }}
                       />
                       <div className="flex-1 space-y-3">
                          <Input value={item.name} placeholder="Attraction Name" onChange={(e) => {
                            const updated = [...form.attractions];
                            updated[i].name = e.target.value;
                            updated[i].slug = slugify(e.target.value);
                            setForm({ ...form, attractions: updated });
                          }} className="h-10 text-xs font-bold" />
                           <Textarea 
                             value={item.description} 
                             placeholder="Short details..." 
                             onChange={(e) => {
                               const updated = [...form.attractions];
                               updated[i].description = e.target.value;
                               setForm({ ...form, attractions: updated });
                             }}
                             className="h-20 text-[10px] font-medium"
                           />
                           <Input value={item.slug} placeholder="Slug" readOnly className="h-8 text-[10px] bg-muted/50" />
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activities">
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-widest opacity-50">Trip Activities</Label>
                <div className="flex gap-2">
                  <Select onValueChange={(slug) => {
                    const found = globalAttractions.find(a => a.slug === slug);
                    if (found) {
                      setForm({ ...form, activities: [...(form.activities || []), { name: found.name, image: found.image, slug: found.slug, description: found.description, order: form.activities?.length || 0 }] });
                    }
                  }}>
                    <SelectTrigger className="w-[180px] h-8 text-[10px] font-black uppercase tracking-widest rounded-xl bg-muted/50 border-none">
                      <SelectValue placeholder="PULL FROM LIBRARY" />
                    </SelectTrigger>
                    <SelectContent>
                      {globalAttractions.map(a => <SelectItem key={a.slug} value={a.slug}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => setForm({ ...form, activities: [...(form.activities || []), { name: "", image: "", slug: "", description: "", order: form.activities?.length || 0 }] })} className="rounded-xl h-8 text-[10px] font-black uppercase">
                    <Plus className="h-3 w-3 mr-1" />Custom
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                {(form.activities || []).map((item: any, i: number) => (
                  <div key={i} className="border bg-muted/20 rounded-2xl p-6 space-y-4 relative group">
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => {
                        if (i === 0) return;
                        const updated = [...form.activities];
                        [updated[i-1], updated[i]] = [updated[i], updated[i-1]];
                        setForm({ ...form, activities: updated });
                      }} disabled={i === 0}><ArrowUp className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => {
                        if (i === form.activities.length - 1) return;
                        const updated = [...form.activities];
                        [updated[i], updated[i+1]] = [updated[i+1], updated[i]];
                        setForm({ ...form, activities: updated });
                      }} disabled={i === form.activities.length - 1}><ArrowDown className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setForm({ ...form, activities: form.activities.filter((_:any, idx:number) => idx !== i) })}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                    <div className="flex gap-4">
                       <ImageUpload 
                         value={item.image} 
                         className="w-48 shrink-0"
                         onUpload={url => {
                            const updated = [...form.activities];
                            updated[i].image = url;
                            setForm({ ...form, activities: updated });
                         }}
                       />
                       <div className="flex-1 space-y-3">
                          <Input value={item.name} placeholder="Activity Name" onChange={(e) => {
                            const updated = [...form.activities];
                            updated[i].name = e.target.value;
                            updated[i].slug = slugify(e.target.value);
                            setForm({ ...form, activities: updated });
                          }} className="h-10 text-xs font-bold" />
                           <Textarea 
                             value={item.description} 
                             placeholder="Short details..." 
                             onChange={(e) => {
                               const updated = [...form.activities];
                               updated[i].description = e.target.value;
                               setForm({ ...form, activities: updated });
                             }}
                             className="h-20 text-[10px] font-medium"
                           />
                           <Input value={item.slug} placeholder="Slug" readOnly className="h-8 text-[10px] bg-muted/50" />
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stay">
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-widest opacity-50">Accommodation Strategy</Label>
                <Button variant="outline" size="sm" onClick={() => setForm({ ...form, accommodations: [...(form.accommodations || []), { name: "", location: "", nights: "", type: "", starRating: "", roomType: "", meals: "", image: "", gallery: [] }] })} className="rounded-xl h-8 text-[10px] font-black uppercase">
                  <Plus className="h-3 w-3 mr-1" />Define Stay
                </Button>
              </div>
              <div className="space-y-6">
                {(form.accommodations || []).map((item: any, i: number) => (
                  <div key={i} className="border bg-muted/20 rounded-[32px] p-8 space-y-6 relative group transition-all hover:bg-muted/30">
                    <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-8 w-8 text-destructive opacity-0 group-hover:opacity-100" onClick={() => setForm({ ...form, accommodations: form.accommodations.filter((_:any, idx:number) => idx !== i) })}><Trash2 className="h-4 w-4" /></Button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <div className="space-y-4">
                          <ImageUpload 
                            label="Primary Visual"
                            value={item.image} 
                            onUpload={url => {
                               const updated = [...form.accommodations];
                               updated[i].image = url;
                               setForm({ ...form, accommodations: updated });
                            }}
                          />
                          <div className="space-y-6 pt-4">
                             {['Exterior', 'Interior', 'Premium Room', 'Bathroom', 'Swimming Pool', 'Dining'].map(cat => (
                               <div key={cat} className="space-y-3">
                                  <div className="flex items-center justify-between">
                                     <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{cat}</Label>
                                     <ImageUpload 
                                       multiple
                                       label={`Upload ${cat}`}
                                       onUpload={urls => {
                                          const updated = [...form.accommodations];
                                          const newImgs = (Array.isArray(urls) ? urls : [urls]).map(url => ({ url, category: cat }));
                                          updated[i].gallery = [...(updated[i].gallery || []), ...newImgs];
                                          setForm({ ...form, accommodations: updated });
                                       }}
                                     />
                                  </div>
                                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3 p-4 bg-zinc-50 rounded-2xl border border-dashed">
                                     {(item.gallery || []).filter((img: any) => img.category === cat).map((img: any, gidx: number) => {
                                       // Find absolute index in main gallery array for deletion
                                       const absoluteIndex = item.gallery.findIndex((g:any) => g === img);
                                       return (
                                         <div key={gidx} className="relative aspect-square rounded-xl overflow-hidden border bg-white group">
                                            <img src={img.url} className="w-full h-full object-cover" />
                                            <button 
                                              onClick={() => {
                                                const updated = [...form.accommodations];
                                                updated[i].gallery = updated[i].gallery.filter((_:any, idx:number) => idx !== absoluteIndex);
                                                setForm({ ...form, accommodations: updated });
                                              }} 
                                              className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                              <X className="w-2.5 h-2.5" />
                                            </button>
                                         </div>
                                       );
                                     })}
                                     {(!item.gallery || item.gallery.filter((img: any) => img.category === cat).length === 0) && (
                                       <div className="col-span-full py-4 text-center">
                                          <p className="text-[9px] font-bold text-zinc-300 uppercase italic">No {cat} photos</p>
                                       </div>
                                     )}
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>

                       <div className="md:col-span-2 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Nights in Location</Label>
                                <Input value={item.nights} placeholder="e.g. 2 Nights in Havelock" onChange={(e) => {
                                   const updated = [...form.accommodations];
                                   updated[i].nights = e.target.value;
                                   setForm({ ...form, accommodations: updated });
                                }} className="rounded-xl h-10 text-xs font-bold" />
                             </div>
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Property Name</Label>
                                <Input value={item.name} placeholder="e.g. Sandy Waves Resort" onChange={(e) => {
                                   const updated = [...form.accommodations];
                                   updated[i].name = e.target.value;
                                   setForm({ ...form, accommodations: updated });
                                }} className="rounded-xl h-10 text-xs font-bold" />
                             </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Star Rating / Type</Label>
                                <Input value={item.starRating} placeholder="e.g. 4 Star Resort" onChange={(e) => {
                                   const updated = [...form.accommodations];
                                   updated[i].starRating = e.target.value;
                                   setForm({ ...form, accommodations: updated });
                                }} className="rounded-xl h-10 text-xs" />
                             </div>
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Room Category</Label>
                                <Input value={item.roomType} placeholder="e.g. Premium Room" onChange={(e) => {
                                   const updated = [...form.accommodations];
                                   updated[i].roomType = e.target.value;
                                   setForm({ ...form, accommodations: updated });
                                }} className="rounded-xl h-10 text-xs" />
                             </div>
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Inclusions (Meals)</Label>
                                <Input value={item.meals} placeholder="e.g. Breakfast" onChange={(e) => {
                                   const updated = [...form.accommodations];
                                   updated[i].meals = e.target.value;
                                   setForm({ ...form, accommodations: updated });
                                }} className="rounded-xl h-10 text-xs" />
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="policies">
            <div className="space-y-8 pt-4">
              {/* Cancellation */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Cancellation Policy Rules</Label>
                    <Button variant="outline" size="sm" onClick={() => setForm({ ...form, popupDetails: { ...form.popupDetails, cancellation: [...(form.popupDetails?.cancellation || []), { label: "", val: "" }] } })} className="h-7 text-[9px] font-black uppercase">Add Rule</Button>
                 </div>
                 <div className="space-y-2">
                    {(form.popupDetails?.cancellation || []).map((c: any, i: number) => (
                      <div key={i} className="flex gap-2 group">
                        <Input value={c.label} placeholder="Timeline (e.g. 30+ Days)" onChange={(e) => {
                          const updated = [...form.popupDetails.cancellation]; updated[i].label = e.target.value;
                          setForm({ ...form, popupDetails: { ...form.popupDetails, cancellation: updated } });
                        }} className="h-8 text-xs" />
                        <Input value={c.val} placeholder="Deduction (e.g. 10%)" onChange={(e) => {
                          const updated = [...form.popupDetails.cancellation]; updated[i].val = e.target.value;
                          setForm({ ...form, popupDetails: { ...form.popupDetails, cancellation: updated } });
                        }} className="h-8 text-xs w-32" />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100" onClick={() => {
                          const updated = form.popupDetails.cancellation.filter((_:any, idx:number) => idx !== i);
                          setForm({ ...form, popupDetails: { ...form.popupDetails, cancellation: updated } });
                        }}><X className="h-3 w-3" /></Button>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Carry */}
              <div className="space-y-4 pt-4 border-t">
                 <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Things to Carry (Categorical)</Label>
                    <Button variant="outline" size="sm" onClick={() => setForm({ ...form, popupDetails: { ...form.popupDetails, carry: [...(form.popupDetails?.carry || []), { category: "", items: [] }] } })} className="h-7 text-[9px] font-black uppercase">Add Category</Button>
                 </div>
                 <div className="space-y-6">
                    {(form.popupDetails?.carry || []).map((cat: any, catIdx: number) => (
                      <div key={catIdx} className="bg-muted/20 p-4 rounded-2xl border border-zinc-100 space-y-4 relative group">
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100" onClick={() => {
                          const updated = form.popupDetails.carry.filter((_:any, idx:number) => idx !== catIdx);
                          setForm({ ...form, popupDetails: { ...form.popupDetails, carry: updated } });
                        }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase opacity-40">Category Name</Label>
                          <Input value={cat.category} placeholder="e.g. Mandatory Requirements" onChange={(e) => {
                            const updated = [...form.popupDetails.carry]; updated[catIdx].category = e.target.value;
                            setForm({ ...form, popupDetails: { ...form.popupDetails, carry: updated } });
                          }} className="h-9 text-xs font-bold" />
                        </div>

                        <div className="space-y-2 pl-4 border-l-2 border-zinc-100">
                          <div className="flex items-center justify-between mb-2">
                             <Label className="text-[8px] font-black uppercase opacity-40">Items</Label>
                             <Button variant="ghost" size="sm" onClick={() => {
                               const updated = [...form.popupDetails.carry];
                               updated[catIdx].items = [...(updated[catIdx].items || []), { text: "", link: "", linkText: "" }];
                               setForm({ ...form, popupDetails: { ...form.popupDetails, carry: updated } });
                             }} className="h-5 text-[8px] font-black uppercase">+ Add Item</Button>
                          </div>
                          <div className="space-y-2">
                            {(cat.items || []).map((item: any, itemIdx: number) => (
                              <div key={itemIdx} className="flex gap-2 items-start">
                                <Input value={item.text} placeholder="Item text" onChange={(e) => {
                                  const updated = [...form.popupDetails.carry]; updated[catIdx].items[itemIdx].text = e.target.value;
                                  setForm({ ...form, popupDetails: { ...form.popupDetails, carry: updated } });
                                }} className="h-8 text-[10px] flex-1" />
                                <Input value={item.linkText} placeholder="Link Text" onChange={(e) => {
                                  const updated = [...form.popupDetails.carry]; updated[catIdx].items[itemIdx].linkText = e.target.value;
                                  setForm({ ...form, popupDetails: { ...form.popupDetails, carry: updated } });
                                }} className="h-8 text-[10px] w-24" />
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                                  const updated = [...form.popupDetails.carry];
                                  updated[catIdx].items = updated[catIdx].items.filter((_:any, idx:number) => idx !== itemIdx);
                                  setForm({ ...form, popupDetails: { ...form.popupDetails, carry: updated } });
                                }}><X className="h-3 w-3" /></Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Gears (Categorical) */}
              <div className="space-y-4 pt-4 border-t">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Rented Gears (Categorical)</Label>
                       <div className="flex items-center gap-2">
                          <Switch 
                             checked={form.popupDetails?.showRentedGears !== false}
                             onCheckedChange={(checked) => setForm({
                               ...form,
                               popupDetails: {
                                 ...(form.popupDetails || {}),
                                 showRentedGears: checked
                               }
                             })}
                          />
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Visible on Trip Details</span>
                       </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setForm({ ...form, popupDetails: { ...form.popupDetails, gears: [...(form.popupDetails?.gears || []), { category: "", items: [] }] } })} className="h-7 text-[9px] font-black uppercase">Add Gear Category</Button>
                 </div>
                 <div className="space-y-6">
                    {(form.popupDetails?.gears || []).map((cat: any, catIdx: number) => (
                      <div key={catIdx} className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-4 relative group">
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100" onClick={() => {
                          const updated = form.popupDetails.gears.filter((_:any, idx:number) => idx !== catIdx);
                          setForm({ ...form, popupDetails: { ...form.popupDetails, gears: updated } });
                        }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase opacity-40">Category Name</Label>
                          <Input value={cat.category} placeholder="e.g. Trekking Essentials" onChange={(e) => {
                            const updated = [...form.popupDetails.gears]; updated[catIdx].category = e.target.value;
                            setForm({ ...form, popupDetails: { ...form.popupDetails, gears: updated } });
                          }} className="h-9 text-xs font-bold" />
                        </div>

                        <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                          <div className="flex items-center justify-between mb-2">
                             <Label className="text-[8px] font-black uppercase opacity-40">Items & Pricing</Label>
                             <Button variant="ghost" size="sm" onClick={() => {
                               const updated = [...form.popupDetails.gears];
                               updated[catIdx].items = [...(updated[catIdx].items || []), { item: "", price: "" }];
                               setForm({ ...form, popupDetails: { ...form.popupDetails, gears: updated } });
                             }} className="h-5 text-[8px] font-black uppercase">+ Add Item</Button>
                          </div>
                          <div className="space-y-2">
                            {(cat.items || []).map((item: any, itemIdx: number) => (
                              <div key={itemIdx} className="flex gap-2 items-start">
                                <Input value={item.item} placeholder="Gear Item" onChange={(e) => {
                                  const updated = [...form.popupDetails.gears]; updated[catIdx].items[itemIdx].item = e.target.value;
                                  setForm({ ...form, popupDetails: { ...form.popupDetails, gears: updated } });
                                }} className="h-8 text-[10px] flex-1" />
                                <Input value={item.price} placeholder="Price" onChange={(e) => {
                                  const updated = [...form.popupDetails.gears]; updated[catIdx].items[itemIdx].price = e.target.value;
                                  setForm({ ...form, popupDetails: { ...form.popupDetails, gears: updated } });
                                }} className="h-8 text-[10px] w-24" />
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                                  const updated = [...form.popupDetails.gears];
                                  updated[catIdx].items = updated[catIdx].items.filter((_:any, idx:number) => idx !== itemIdx);
                                  setForm({ ...form, popupDetails: { ...form.popupDetails, gears: updated } });
                                }}><X className="h-3 w-3" /></Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Terms */}
              <div className="space-y-4 pt-4 border-t">
                 <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Terms & Conditions</Label>
                    <Button variant="outline" size="sm" onClick={() => setForm({ ...form, popupDetails: { ...form.popupDetails, terms: [...(form.popupDetails?.terms || []), ""] } })} className="h-7 text-[9px] font-black uppercase">Add Term</Button>
                 </div>
                 <div className="space-y-2">
                    {(form.popupDetails?.terms || []).map((t: string, i: number) => (
                      <div key={i} className="flex gap-2 group">
                        <Textarea value={t} placeholder="Enter term..." onChange={(e) => {
                          const updated = [...form.popupDetails.terms]; updated[i] = e.target.value;
                          setForm({ ...form, popupDetails: { ...form.popupDetails, terms: updated } });
                        }} className="text-xs min-h-[40px] flex-1" />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100" onClick={() => {
                          const updated = form.popupDetails.terms.filter((_:any, idx:number) => idx !== i);
                          setForm({ ...form, popupDetails: { ...form.popupDetails, terms: updated } });
                        }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Etiquette */}
              <div className="space-y-4 pt-4 border-t">
                 <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Local Etiquette & Rules</Label>
                    <Button variant="outline" size="sm" onClick={() => setForm({ ...form, popupDetails: { ...form.popupDetails, etiquette: [...(form.popupDetails?.etiquette || []), { title: "", desc: "" }] } })} className="h-7 text-[9px] font-black uppercase">Add Rule</Button>
                 </div>
                 <div className="space-y-3">
                    {(form.popupDetails?.etiquette || []).map((e: any, i: number) => (
                      <div key={i} className="bg-muted/30 p-3 rounded-xl space-y-2 relative group">
                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100" onClick={() => {
                          const updated = form.popupDetails.etiquette.filter((_:any, idx:number) => idx !== i);
                          setForm({ ...form, popupDetails: { ...form.popupDetails, etiquette: updated } });
                        }}><Trash2 className="h-3 w-3" /></Button>
                        <Input value={e.title} placeholder="Title" onChange={(val) => {
                          const updated = [...form.popupDetails.etiquette]; updated[i].title = val.target.value;
                          setForm({ ...form, popupDetails: { ...form.popupDetails, etiquette: updated } });
                        }} className="h-8 text-xs font-bold" />
                        <Textarea value={e.desc} placeholder="Description" onChange={(val) => {
                          const updated = [...form.popupDetails.etiquette]; updated[i].desc = val.target.value;
                          setForm({ ...form, popupDetails: { ...form.popupDetails, etiquette: updated } });
                        }} className="text-[10px] min-h-[50px]" />
                      </div>
                    ))}
                 </div>
              </div>
              
              {/* Custom Policies */}
              <div className="space-y-4 pt-4 border-t">
                 <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Custom Policy Sections</Label>
                    <Button variant="outline" size="sm" onClick={() => setForm({ ...form, popupDetails: { ...form.popupDetails, customPolicies: [...(form.popupDetails?.customPolicies || []), { label: "", type: "simple", content: "" }] } })} className="h-7 text-[9px] font-black uppercase">Add Custom Section</Button>
                 </div>
                 <div className="space-y-4">
                    {(form.popupDetails?.customPolicies || []).map((cp: any, i: number) => (
                      <div key={i} className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-3 relative group">
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100" onClick={() => {
                          const updated = form.popupDetails.customPolicies.filter((_:any, idx:number) => idx !== i);
                          setForm({ ...form, popupDetails: { ...form.popupDetails, customPolicies: updated } });
                        }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase opacity-40">Section Title</Label>
                          <Input value={cp.label} placeholder="e.g. Health & Safety" onChange={(val) => {
                            const updated = [...form.popupDetails.customPolicies]; updated[i].label = val.target.value;
                            setForm({ ...form, popupDetails: { ...form.popupDetails, customPolicies: updated } });
                          }} className="h-9 text-xs font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase opacity-40">Content (Simple List - One per line)</Label>
                          <Textarea value={Array.isArray(cp.content) ? cp.content.join('\n') : cp.content} placeholder="Enter points..." onChange={(val) => {
                            const updated = [...form.popupDetails.customPolicies]; 
                            updated[i].content = val.target.value.split('\n').filter(Boolean);
                            setForm({ ...form, popupDetails: { ...form.popupDetails, customPolicies: updated } });
                          }} className="text-xs min-h-[100px]" />
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="videos">
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-widest opacity-50">YouTube Video Gallery</Label>
                <Button variant="outline" size="sm" onClick={() => setForm({ ...form, videos: [...(form.videos || []), { id: "", title: "" }] })} className="rounded-xl h-8 text-[10px] font-black uppercase">
                  <Plus className="h-3 w-3 mr-1" />Add Video
                </Button>
              </div>
              <div className="space-y-4">
                {(form.videos || []).map((video: any, i: number) => (
                  <div key={i} className="border bg-muted/20 rounded-2xl p-4 space-y-3 relative group">
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100" onClick={() => setForm({ ...form, videos: form.videos.filter((_:any, idx:number) => idx !== i) })}><Trash2 className="h-3.5 w-3.5" /></Button>
                    <div className="flex gap-4">
                       <div className="w-24 aspect-video bg-black rounded-lg overflow-hidden shrink-0">
                          {video.id && <img src={`https://img.youtube.com/vi/${video.id}/default.jpg`} className="w-full h-full object-cover" />}
                       </div>
                       <div className="flex-1 space-y-2">
                          <Input value={video.id} placeholder="YouTube Video ID (e.g. j6hb-iOZalE)" onChange={(e) => {
                            const updated = [...form.videos]; updated[i].id = e.target.value; setForm({ ...form, videos: updated });
                          }} className="h-8 text-[10px] font-bold" />
                          <Input value={video.title} placeholder="Video Title" onChange={(e) => {
                            const updated = [...form.videos]; updated[i].title = e.target.value; setForm({ ...form, videos: updated });
                          }} className="h-8 text-[10px]" />
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="custom">
            <div className="space-y-6 pt-4">
               {customFields.length === 0 ? (
                 <div className="text-center py-20 opacity-30 border-2 border-dashed rounded-[32px]">
                   <p className="text-xs font-black uppercase tracking-widest">No custom sections defined</p>
                 </div>
               ) : (
                 <div className="space-y-6">
                   {customFields.map((field: any, idx: number) => {
                     const existing = (form.customSections || []).find((s:any) => s.label === field.label);
                     return (
                       <div key={idx} className="space-y-2">
                         <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-2">
                           <FileText className="w-3 h-3 text-primary" /> {field.label}
                         </Label>
                         <Textarea 
                           value={existing?.content || ""} 
                           onChange={(e) => {
                             const sections = [...(form.customSections || [])];
                             const sIdx = sections.findIndex((s:any) => s.label === field.label);
                             if (sIdx > -1) sections[sIdx].content = e.target.value;
                             else sections.push({ label: field.label, content: e.target.value });
                             setForm({ ...form, customSections: sections });
                           }}
                           placeholder={`Enter info for ${field.label}...`}
                           className="rounded-2xl text-xs font-medium min-h-[120px]"
                         />
                       </div>
                     );
                   })}
                 </div>
               )}
            </div>
          </TabsContent>

          <TabsContent value="seo">
            <div className="space-y-8 pt-6">
               <div className="bg-primary/5 p-6 rounded-[32px] border border-primary/10 flex items-start gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                    <Globe className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight">Search Engine Master</h4>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-1">Control how this trip appears on Google & Social Media</p>
                  </div>
               </div>

               <div className="grid gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Meta Title</Label>
                    <Input 
                      value={form.seo?.metaTitle || ""} 
                      onChange={(e) => setForm({ ...form, seo: { ...form.seo, metaTitle: e.target.value } })}
                      className="rounded-2xl font-bold border-2 focus:border-primary h-12" 
                    />
                    <div className="flex justify-between items-center">
                      <div className="text-[9px] font-black text-primary uppercase">{form.seo?.metaTitle?.length || 0}/60 Characters</div>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">Ideal: 50-60</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Meta Description</Label>
                    <Textarea 
                      value={form.seo?.metaDescription || ""} 
                      onChange={(e) => setForm({ ...form, seo: { ...form.seo, metaDescription: e.target.value } })}
                      className="rounded-2xl font-medium min-h-[120px] border-2 focus:border-primary text-xs" 
                    />
                    <div className="flex justify-between items-center">
                      <div className="text-[9px] font-black text-primary uppercase">{form.seo?.metaDescription?.length || 0}/160 Characters</div>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">Ideal: 150-160</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Focus Keyword</Label>
                       <Input value={form.seo?.focusKeyword || ""} onChange={(e) => setForm({ ...form, seo: { ...form.seo, focusKeyword: e.target.value } })} className="rounded-xl border-none bg-muted/50 h-10" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">URL Slug</Label>
                       <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} className="rounded-xl border-none bg-muted/50 h-10" />
                    </div>
                  </div>
               </div>

               <div className="space-y-4 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-[11px] font-black uppercase tracking-widest">JSON-LD FAQ Schema</h5>
                      <p className="text-[9px] text-muted-foreground">Boost CTR with rich search results</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                        const schema = [...(form.seo?.faqSchema || []), { question: "", answer: "" }];
                        setForm({ ...form, seo: { ...form.seo, faqSchema: schema } });
                    }} className="rounded-xl h-8 text-[9px] font-black uppercase">Add FAQ Row</Button>
                  </div>
                  
                  <div className="space-y-3">
                    {(form.seo?.faqSchema || []).map((faq:any, idx:number) => (
                      <div key={idx} className="p-4 bg-muted/30 rounded-2xl relative group border">
                        <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" onClick={() => {
                            const schema = form.seo.faqSchema.filter((_:any, i:number) => i !== idx);
                            setForm({ ...form, seo: { ...form.seo, faqSchema: schema } });
                        }}><X className="w-3 h-3" /></Button>
                        <Input value={faq.question} onChange={(e) => {
                          const schema = [...form.seo.faqSchema]; schema[idx].question = e.target.value; setForm({ ...form, seo: { ...form.seo, faqSchema: schema } });
                        }} placeholder="Question" className="bg-transparent border-none font-bold mb-1 p-0 h-auto focus-visible:ring-0 text-xs" />
                        <Textarea value={faq.answer} onChange={(e) => {
                          const schema = [...form.seo.faqSchema]; schema[idx].answer = e.target.value; setForm({ ...form, seo: { ...form.seo, faqSchema: schema } });
                        }} placeholder="Answer" className="bg-transparent border-none text-[10px] font-medium p-0 h-auto min-h-[40px] focus-visible:ring-0" />
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </TabsContent>
          <TabsContent value="advanced">
            <div className="space-y-8 pt-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Departure City</Label>
                    <Input value={form.departureCity} onChange={(e) => setForm({ ...form, departureCity: e.target.value })} placeholder="e.g. Ahmedabad" className="rounded-xl h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Age Limit</Label>
                    <Input value={form.ageLimit} onChange={(e) => setForm({ ...form, ageLimit: e.target.value })} placeholder="e.g. 15-35 Years" className="rounded-xl h-10" />
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Max Group Size</Label>
                    <Input type="number" value={form.maxGroupSize} onChange={(e) => setForm({ ...form, maxGroupSize: Number(e.target.value) })} className="rounded-xl h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Difficulty</Label>
                    <Select value={form.difficulty} onValueChange={(v:any) => setForm({ ...form, difficulty: v })}>
                      <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">External Booking URL</Label>
                  <Input value={form.bookingUrl} onChange={(e) => setForm({ ...form, bookingUrl: e.target.value })} placeholder="https://external-booking.com/..." className="rounded-xl h-10" />
               </div>

               </div>
          </TabsContent>
          <TabsContent value="gallery">

            <div className="space-y-10 pt-4">

               {/* ═══ SECTION 1: Trip Cover Images (images[] — shown on the trip detail page grid) ═══ */}
               <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-navy uppercase italic">Trip Cover Images</h3>
                    <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">These 4 images appear next to the Hero Image on the trip page</p>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {[0, 1, 2, 3].map((slot) => {
                      const currentUrl = (form.images || [])[slot] || "";
                      return (
                        <div key={slot} className="space-y-2">
                          <Label className="text-[8px] font-black uppercase opacity-40">Image {slot + 1}</Label>
                          {currentUrl ? (
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-100 border group">
                              <img src={formatUrl(currentUrl)} className="w-full h-full object-cover" alt={`Cover ${slot + 1}`} onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }} />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  id={`cover-replace-${slot}`}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const fd = new FormData();
                                    fd.append("image", file);
                                    try {
                                      const res = await api.post("/upload/single", fd, { headers: { "Content-Type": "multipart/form-data" } });
                                      if (res.data.success) {
                                        const updated = [...(form.images || [])];
                                        while (updated.length <= slot) updated.push("");
                                        updated[slot] = res.data.url;
                                        setForm({ ...form, images: updated });
                                      }
                                    } catch (err) { console.error(err); }
                                    e.target.value = '';
                                  }}
                                />
                                <Label htmlFor={`cover-replace-${slot}`} className="cursor-pointer bg-white/90 text-black px-3 py-1.5 rounded-lg text-[9px] font-black uppercase hover:bg-white transition-all">
                                  Replace
                                </Label>
                                <button
                                  className="bg-destructive/90 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase hover:bg-destructive transition-all"
                                  onClick={() => {
                                    const updated = [...(form.images || [])];
                                    updated.splice(slot, 1);
                                    setForm({ ...form, images: updated });
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              <Input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id={`cover-upload-${slot}`}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const fd = new FormData();
                                  fd.append("image", file);
                                  try {
                                    const res = await api.post("/upload/single", fd, { headers: { "Content-Type": "multipart/form-data" } });
                                    if (res.data.success) {
                                      const updated = [...(form.images || [])];
                                      while (updated.length <= slot) updated.push("");
                                      updated[slot] = res.data.url;
                                      setForm({ ...form, images: updated });
                                    }
                                  } catch (err) { console.error(err); }
                                  e.target.value = '';
                                }}
                              />
                              <Label htmlFor={`cover-upload-${slot}`} className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 cursor-pointer hover:bg-zinc-100 hover:border-primary/30 transition-all">
                                <Upload className="w-5 h-5 text-zinc-300 mb-1" />
                                <span className="text-[9px] font-bold text-zinc-400 uppercase">Add Image</span>
                              </Label>
                            </div>
                          )}
                          {/* URL Input for pasting external URLs */}
                          <Input
                            value={currentUrl}
                            placeholder="Or paste URL..."
                            onChange={(e) => {
                              const updated = [...(form.images || [])];
                              while (updated.length <= slot) updated.push("");
                              updated[slot] = e.target.value;
                              setForm({ ...form, images: updated });
                            }}
                            className="h-7 text-[9px] bg-zinc-50 border-zinc-100 rounded-lg"
                          />
                        </div>
                      );
                    })}
                  </div>
               </div>

               {/* Divider */}
               <div className="border-t border-zinc-100" />

               {/* ═══ SECTION 2: Extended Gallery (gallery[] — shown in photo modal) ═══ */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-navy uppercase italic">Extended Gallery</h3>
                      <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">Full photo collection shown in the "Explore All" modal</p>
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        type="file" 
                        id="gallery-upload-v2" 
                        multiple 
                        className="hidden" 
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;
                          const formData = new FormData();
                          for (let i = 0; i < files.length; i++) formData.append("images", files[i]);
                          try {
                            const res = await api.post("/upload/multiple", formData, {
                              headers: { "Content-Type": "multipart/form-data" }
                            });
                            if (res.data.success) {
                              const existingGallery = form.gallery || [];
                              const newItems = res.data.urls.map((url: string, idx: number) => ({
                                url,
                                alt: "",
                                order: existingGallery.length + idx
                              }));
                              setForm({ ...form, gallery: [...existingGallery, ...newItems] });
                            }
                          } catch (err) {
                            console.error(err);
                          }
                          e.target.value = '';
                        }}
                      />
                      <Label htmlFor="gallery-upload-v2" className="h-10 px-6 bg-primary text-black text-[10px] font-black uppercase rounded-xl flex items-center gap-2 cursor-pointer border hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                        <Upload className="w-3.5 h-3.5" /> Upload Photos
                      </Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto p-4 bg-zinc-50 rounded-[32px] border border-zinc-100">
                    {(form.gallery || []).map((img: any, i: number) => (
                      <div key={i} className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-zinc-100 relative group hover:shadow-md transition-all">
                        <div className="relative h-16 w-16 rounded-xl overflow-hidden shadow-inner border bg-zinc-100">
                          <img src={formatUrl(typeof img === 'string' ? img : img.url)} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                             <Label className="text-[8px] font-black uppercase opacity-40">Alt Description</Label>
                             <Input value={img.alt || ""} placeholder="e.g. Campfire in Manali" onChange={(e) => {
                               const updated = [...form.gallery]; updated[i] = { ...updated[i], alt: e.target.value }; setForm({ ...form, gallery: updated });
                             }} className="h-9 text-xs font-bold bg-zinc-50 border-none" />
                          </div>
                          <div className="space-y-1">
                             <Label className="text-[8px] font-black uppercase opacity-40">Sort Order</Label>
                             <Input type="number" value={img.order || 0} placeholder="Order" onChange={(e) => {
                               const updated = [...form.gallery]; updated[i] = { ...updated[i], order: Number(e.target.value) }; setForm({ ...form, gallery: updated });
                             }} className="h-9 text-xs font-bold bg-zinc-50 border-none" />
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive h-10 w-10 hover:bg-destructive/10 rounded-full" onClick={() => setForm({ ...form, gallery: form.gallery.filter((_:any, idx:number) => idx !== i) })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {(form.gallery || []).length === 0 && (
                      <div className="py-24 text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                          <ImagePlus className="w-6 h-6 text-zinc-200" />
                        </div>
                        <p className="text-[10px] opacity-40 uppercase font-black tracking-[0.2em]">Your extended gallery is empty</p>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          </TabsContent>
          <TabsContent value="advanced">
            <div className="space-y-8 pt-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Departure City</Label>
                    <Input value={form.departureCity} onChange={(e) => setForm({ ...form, departureCity: e.target.value })} placeholder="e.g. Ahmedabad" className="rounded-xl h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Age Limit</Label>
                    <Input value={form.ageLimit} onChange={(e) => setForm({ ...form, ageLimit: e.target.value })} placeholder="e.g. 15-35 Years" className="rounded-xl h-10" />
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Max Group Size</Label>
                    <Input type="number" value={form.maxGroupSize} onChange={(e) => setForm({ ...form, maxGroupSize: Number(e.target.value) })} className="rounded-xl h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Difficulty</Label>
                    <Select value={form.difficulty} onValueChange={(v:any) => setForm({ ...form, difficulty: v })}>
                      <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">External Booking URL</Label>
                  <Input value={form.bookingUrl} onChange={(e) => setForm({ ...form, bookingUrl: e.target.value })} placeholder="https://external-booking.com/..." className="rounded-xl h-10" />
               </div>

            </div>
          </TabsContent>
          <TabsContent value="reels" className="space-y-6 pt-6">
             <div className="flex items-center justify-between">
               <div className="space-y-1">
                 <h3 className="text-xl font-black text-navy uppercase italic">Traveler Reels</h3>
                 <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">Add vertical videos to showcase real moments</p>
               </div>
               <Button 
                 onClick={() => setForm({ ...form, reels: [...(form.reels || []), { url: "", thumbnail: "", caption: "" }] })}
                 className="rounded-xl font-black uppercase text-[10px] tracking-widest px-6"
               >
                 <Plus className="w-3 h-3 mr-2" /> Add Reel
               </Button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
               {(form.reels || []).map((reel: any, idx: number) => (
                 <div key={idx} className="bg-zinc-50 rounded-[32px] p-8 border border-zinc-100 relative group transition-all hover:border-primary/30">
                    <button 
                      onClick={() => {
                        const updated = [...form.reels];
                        updated.splice(idx, 1);
                        setForm({ ...form, reels: updated });
                      }}
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-2 shadow-xl opacity-0 group-hover:opacity-100 transition-all z-10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="space-y-6">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Reel URL (YouTube/Insta/MP4)</Label>
                          <Input 
                            value={reel.url} 
                            onChange={e => {
                              const updated = [...form.reels];
                              updated[idx].url = e.target.value;
                              setForm({ ...form, reels: updated });
                            }}
                            placeholder="Enter video link..."
                            className="rounded-2xl font-bold bg-white h-11"
                          />
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Cover Image</Label>
                             <div className="flex flex-col gap-3">
                                {reel.thumbnail && (
                                  <div className="aspect-[9/16] w-full rounded-2xl overflow-hidden border shadow-inner bg-black flex items-center justify-center">
                                     <img src={reel.thumbnail} className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <ImageUpload 
                                  onUpload={url => {
                                     const updated = [...form.reels];
                                     updated[idx].thumbnail = url;
                                     setForm({ ...form, reels: updated });
                                  }}
                                />
                             </div>
                          </div>

                          <div className="space-y-2 flex flex-col">
                             <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Caption</Label>
                             <Textarea 
                               value={reel.caption} 
                               onChange={e => {
                                 const updated = [...form.reels];
                                 updated[idx].caption = e.target.value;
                                 setForm({ ...form, reels: updated });
                               }}
                               placeholder="Brief moment description..."
                               className="rounded-2xl font-bold flex-1 resize-none bg-white p-4"
                             />
                          </div>
                       </div>
                    </div>
                 </div>
               ))}
               {(!form.reels || form.reels.length === 0) && (
                 <div className="col-span-full py-24 text-center border-2 border-dashed rounded-[40px] border-zinc-100 bg-zinc-50/50">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                       <Upload className="w-6 h-6 text-zinc-300" />
                    </div>
                    <p className="text-zinc-400 font-black uppercase italic text-[10px] tracking-widest">Share the magic! Add your first traveler reel.</p>
                 </div>
               )}
             </div>
          </TabsContent>
          <TabsContent value="reviews" className="space-y-6 pt-6">
             <div className="flex items-center justify-between">
               <div className="space-y-1">
                 <h3 className="text-xl font-black text-navy uppercase italic">Trip Reviews</h3>
                 <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">Manage authentic feedback for this expedition</p>
               </div>
               <Button 
                 onClick={() => setForm({ ...form, reviews: [...(form.reviews || []), { userName: "", city: "", comment: "", rating: 5, userImage: "", photos: [], tripType: "Joined Group Trip" }] })}
                 className="rounded-xl font-black uppercase text-[10px] tracking-widest px-6 shadow-lg shadow-primary/20"
               >
                 <Plus className="w-3 h-3 mr-2" /> Add Review
               </Button>
             </div>
             
             <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar pb-20">
               {(form.reviews || []).map((rev: any, idx: number) => (
                 <div key={idx} className="bg-white border border-zinc-100 rounded-[40px] p-8 relative group transition-all hover:shadow-xl hover:border-primary/20">
                    {!rev.userName || !rev.comment ? (
                      <div className="absolute top-4 left-8 bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-amber-200 animate-pulse">
                         Incomplete - Fill name & comment to save
                      </div>
                    ) : null}
                    <button 
                      onClick={() => {
                        const updated = [...form.reviews];
                        updated.splice(idx, 1);
                        setForm({ ...form, reviews: updated });
                      }}
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-2 shadow-xl opacity-0 group-hover:opacity-100 transition-all z-10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                       {/* Left side: Basic Info */}
                       <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Reviewer Name</Label>
                                <Input 
                                  value={rev.userName} 
                                  onChange={e => {
                                    const updated = [...form.reviews];
                                    updated[idx].userName = e.target.value;
                                    setForm({ ...form, reviews: updated });
                                  }}
                                  placeholder="e.g. Deep Bhuvar"
                                  className="rounded-xl font-bold bg-zinc-50 h-11"
                                />
                             </div>
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">City</Label>
                                <Input 
                                  value={rev.city} 
                                  onChange={e => {
                                    const updated = [...form.reviews];
                                    updated[idx].city = e.target.value;
                                    setForm({ ...form, reviews: updated });
                                  }}
                                  placeholder="e.g. Ahmedabad"
                                  className="rounded-xl font-bold bg-zinc-50 h-11"
                                />
                             </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Trip Type Label</Label>
                                <Input 
                                  value={rev.tripType} 
                                  onChange={e => {
                                    const updated = [...form.reviews];
                                    updated[idx].tripType = e.target.value;
                                    setForm({ ...form, reviews: updated });
                                  }}
                                  placeholder="e.g. Joined Group Trip"
                                  className="rounded-xl font-bold bg-zinc-50 h-11"
                                />
                             </div>
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Rating (1-5)</Label>
                                <div className="flex gap-1 h-11 items-center px-4 bg-zinc-50 rounded-xl border border-input">
                                   {[1,2,3,4,5].map(star => (
                                     <Star 
                                       key={star} 
                                       onClick={() => {
                                          const updated = [...form.reviews];
                                          updated[idx].rating = star;
                                          setForm({ ...form, reviews: updated });
                                       }}
                                       className={`w-4 h-4 cursor-pointer transition-all ${star <= rev.rating ? "fill-yellow-400 text-yellow-400" : "text-zinc-300 hover:text-yellow-200"}`} 
                                     />
                                   ))}
                                </div>
                             </div>
                          </div>

                          <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center justify-between">
                                Feedback / Comment
                                <span className="text-[8px] text-primary-orange">Required</span>
                             </Label>
                             <Textarea 
                               value={rev.comment} 
                               onChange={e => {
                                 const updated = [...form.reviews];
                                 updated[idx].comment = e.target.value;
                                 setForm({ ...form, reviews: updated });
                               }}
                               placeholder="Write the review here..."
                               className="rounded-2xl font-medium leading-relaxed bg-zinc-50 h-32 p-4"
                             />
                          </div>
                       </div>

                       {/* Right side: Photos */}
                       <div className="space-y-6">
                          <div className="space-y-3">
                             <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Reviewer Image</Label>
                             <div className="flex items-center gap-4">
                                {rev.userImage && (
                                  <div className="w-12 h-12 rounded-full overflow-hidden border shadow-sm">
                                     <img src={rev.userImage} className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <ImageUpload 
                                  onUpload={url => {
                                     const updated = [...form.reviews];
                                     updated[idx].userImage = url;
                                     setForm({ ...form, reviews: updated });
                                  }}
                                />
                             </div>
                          </div>

                          <div className="space-y-3">
                             <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Review Gallery (Up to 4)</Label>
                             <div className="grid grid-cols-4 gap-2 mb-2">
                                {(rev.photos || []).map((p: string, pidx: number) => (
                                  <div key={pidx} className="relative aspect-square rounded-lg overflow-hidden border bg-zinc-100 group/img">
                                     <img src={p} className="w-full h-full object-cover" />
                                     <button 
                                       onClick={async () => {
                                          const url = rev.photos[pidx];
                                          if (confirm("Permanently delete this photo from the server?")) {
                                            await deleteServerFile(url);
                                            const updated = [...form.reviews];
                                            updated[idx].photos = updated[idx].photos.filter((_:any, pi:number) => pi !== pidx);
                                            setForm({ ...form, reviews: updated });
                                          }
                                       }}
                                       className="absolute top-1 right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-all"
                                     >
                                        <X className="w-2 h-2" />
                                     </button>
                                  </div>
                                ))}
                             </div>
                             <ImageUpload 
                               multiple
                               onUpload={urls => {
                                  const updated = [...form.reviews];
                                  const newPhotos = [...(updated[idx].photos || []), ...(Array.isArray(urls) ? urls : [urls])].slice(0, 4);
                                  updated[idx].photos = newPhotos;
                                  setForm({ ...form, reviews: updated });
                               }}
                             />
                          </div>
                       </div>
                    </div>
                 </div>
               ))}
               {(!form.reviews || form.reviews.length === 0) && (
                 <div className="py-20 text-center border-2 border-dashed rounded-[40px] border-zinc-100 bg-zinc-50/20">
                    <MessageSquare className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                    <p className="text-zinc-400 font-bold uppercase italic text-[10px] tracking-widest">No reviews added for this trip yet</p>
                 </div>
               )}
             </div>
          </TabsContent>
        </Tabs>
    </AdminModal>
  );
}
