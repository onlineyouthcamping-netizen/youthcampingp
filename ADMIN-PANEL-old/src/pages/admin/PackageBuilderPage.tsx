import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import {
  DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { cn, safeFormatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { packageBuilderService } from "@/services/packageBuilder.service";
import {
  ArrowLeft, Save, Plus, Trash2, Pencil, GripVertical, Eye, Send, Copy, RefreshCw,
  Loader2, X, ChevronDown, ChevronUp, Hotel, Car, Bus, MapPin, Utensils, Users,
  Calendar, Plane, Train, Package, DollarSign, Percent, FileText, Building2,
  BedDouble, Settings2, Wifi, Ban, Star, Clock, Luggage, ShieldCheck,
  MessageSquare, Phone, Mail, ChevronRight, CheckCircle2, AlertCircle,
  ArrowUpDown, Wallet, Wallet2, Receipt, CreditCard, BadgePercent, ScrollText,
  Bookmark, BookOpen, Sun, Moon, UserCheck, Baby, Heart, Activity,
  Shirt, Beef, Coffee, Sandwich, Wine, ChefHat, Sparkles,
} from "lucide-react";
import type { AdminRole } from "@/types";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface CustomerDetails {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  packageName: string;
  stateId: string;
  stateName: string;
  destinationCityIds: string[];
  destinationCityNames: string[];
  departureCity: string;
  travelStartDate: string;
  travelEndDate: string;
  totalNights: number;
  totalDays: number;
  adults: number;
  children: number;
  couples: number;
  rooms: number;
  specialNotes: string;
  _couplesRooms?: number;
  _tripleRooms?: number;
}

interface ItineraryItem {
  id: string;
  type: "hotel" | "vehicle" | "transfer" | "activity" | "meal" | "guide" | "train_flight" | "addon";
  label: string;
  description?: string;
  vendorId?: string;
  vendorName?: string;
  rate: number;
  quantity: number;
  nights?: number;
  unit: string;
  details?: Record<string, any>;
  sortOrder: number;
}

interface ItineraryDay {
  id: string;
  dayNumber: number;
  date: string;
  stayCity: string;
  title: string;
  routeFrom: string;
  routeTo: string;
  distance: string;
  travelTime: string;
  notes: string;
  items: ItineraryItem[];
}

interface PackageState {
  id: string | null;
  status: "draft" | "quoted" | "converted";
  customer: CustomerDetails;
  days: ItineraryDay[];
  discountPercent: number;
  gstPercent: number;
  serviceCharge: number;
  showInternalCost: boolean;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function calcNights(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(0, Math.round((e.getTime() - s.getTime()) / 86400000));
}

function calcDays(start: string, end: string): number {
  const n = calcNights(start, end);
  return n > 0 ? n + 1 : 0;
}

function calcRooms(adults: number, children: number, couples: number): { couplesRooms: number; tripleRooms: number; total: number } {
  const couplesRooms = couples;
  const remaining = adults + (children > 0 ? Math.ceil(children / 2) : 0);
  const tripleRooms = Math.ceil(remaining / 3);
  const total = couplesRooms + tripleRooms;
  return { couplesRooms, tripleRooms, total };
}

const defaultCustomer: CustomerDetails = {
  customerName: "", customerPhone: "", customerEmail: "", packageName: "",
  stateId: "", stateName: "", destinationCityIds: [], destinationCityNames: [],
  departureCity: "", travelStartDate: "", travelEndDate: "",
  totalNights: 0, totalDays: 0, adults: 2, children: 0, couples: 0, rooms: 1,
  specialNotes: "",
};

function createDay(dayNumber: number, date: string): ItineraryDay {
  return {
    id: uuidv4(), dayNumber, date, stayCity: "", title: "",
    routeFrom: "", routeTo: "", distance: "", travelTime: "", notes: "",
    items: [],
  };
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function SortableDayCard({
  day,
  dayIdx,
  onUpdate,
  onDelete,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onItemSortEnd,
  openHotelModal,
  openVehicleModal,
  openActivityModal,
  openTransferModal,
  openMealModal,
  openGuideModal,
  openTrainModal,
  openAddonModal,
  states,
  cities,
}: {
  day: ItineraryDay;
  dayIdx: number;
  onUpdate: (id: string, data: Partial<ItineraryDay>) => void;
  onDelete: (id: string) => void;
  onAddItem: (dayId: string) => void;
  onEditItem: (dayId: string, item: ItineraryItem) => void;
  onDeleteItem: (dayId: string, itemId: string) => void;
  onItemSortEnd: (dayId: string, items: ItineraryItem[]) => void;
  openHotelModal: (dayId: string) => void;
  openVehicleModal: (dayId: string) => void;
  openActivityModal: (dayId: string) => void;
  openTransferModal: (dayId: string) => void;
  openMealModal: (dayId: string) => void;
  openGuideModal: (dayId: string) => void;
  openTrainModal: (dayId: string) => void;
  openAddonModal: (dayId: string) => void;
  states: any[];
  cities: any[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: day.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);

  const dayCost = useMemo(() => day.items.reduce((sum, i) => sum + (i.rate * i.quantity), 0), [day.items]);

  const typeIcons: Record<string, any> = {
    hotel: Hotel, vehicle: Car, transfer: Bus, activity: Activity,
    meal: Utensils, guide: Users, train_flight: Train, addon: Package,
  };
  const typeColors: Record<string, string> = {
    hotel: "text-violet-600 bg-violet-50", vehicle: "text-amber-600 bg-amber-50",
    transfer: "text-blue-600 bg-blue-50", activity: "text-emerald-600 bg-emerald-50",
    meal: "text-orange-600 bg-orange-50", guide: "text-cyan-600 bg-cyan-50",
    train_flight: "text-rose-600 bg-rose-50", addon: "text-slate-600 bg-slate-50",
  };

  const addServiceOptions = [
    { label: "Hotel", icon: Hotel, action: () => { openHotelModal(day.id); setShowAddMenu(false); } },
    { label: "Vehicle", icon: Car, action: () => { openVehicleModal(day.id); setShowAddMenu(false); } },
    { label: "Transfer", icon: Bus, action: () => { openTransferModal(day.id); setShowAddMenu(false); } },
    { label: "Activity", icon: Activity, action: () => { openActivityModal(day.id); setShowAddMenu(false); } },
    { label: "Meal", icon: Utensils, action: () => { openMealModal(day.id); setShowAddMenu(false); } },
    { label: "Guide", icon: Users, action: () => { openGuideModal(day.id); setShowAddMenu(false); } },
    { label: "Train/Flight", icon: Train, action: () => { openTrainModal(day.id); setShowAddMenu(false); } },
    { label: "Add-on", icon: Package, action: () => { openAddonModal(day.id); setShowAddMenu(false); } },
  ];

  return (
    <div ref={setNodeRef} style={style} className={`bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden transition-all ${isDragging ? 'opacity-50 ring-2 ring-violet-400 ring-offset-2' : ''}`}>
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <button {...attributes} {...listeners} className="text-slate-300 hover:text-violet-600 transition-colors cursor-grab active:cursor-grabbing">
          <GripVertical className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 bg-violet-600 text-white font-bold text-xs px-3 py-1 rounded-lg">
          <Calendar className="w-3.5 h-3.5" />
          Day {day.dayNumber}
        </div>
        <Input
          type="date"
          value={day.date}
          onChange={e => onUpdate(day.id, { date: e.target.value })}
          className="w-36 h-8 text-xs font-medium rounded-lg border-slate-200"
        />
        <Input
          placeholder="Stay city"
          value={day.stayCity}
          onChange={e => onUpdate(day.id, { stayCity: e.target.value })}
          className="w-36 h-8 text-xs font-medium rounded-lg border-slate-200"
        />
        <Input
          placeholder="Title (optional)"
          value={day.title}
          onChange={e => onUpdate(day.id, { title: e.target.value })}
          className="flex-1 h-8 text-xs font-medium rounded-lg border-slate-200"
        />
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0" onClick={() => onDelete(day.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="px-4 pt-3 flex gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-[9px] font-bold uppercase text-slate-400">Route From</Label>
              <Input value={day.routeFrom} onChange={e => onUpdate(day.id, { routeFrom: e.target.value })} className="h-7 text-xs rounded-lg border-slate-200" placeholder="From" />
            </div>
            <div className="flex-1">
              <Label className="text-[9px] font-bold uppercase text-slate-400">Route To</Label>
              <Input value={day.routeTo} onChange={e => onUpdate(day.id, { routeTo: e.target.value })} className="h-7 text-xs rounded-lg border-slate-200" placeholder="To" />
            </div>
            <div className="w-24">
              <Label className="text-[9px] font-bold uppercase text-slate-400">Distance</Label>
              <Input value={day.distance} onChange={e => onUpdate(day.id, { distance: e.target.value })} className="h-7 text-xs rounded-lg border-slate-200" placeholder="km" />
            </div>
            <div className="w-24">
              <Label className="text-[9px] font-bold uppercase text-slate-400">Travel Time</Label>
              <Input value={day.travelTime} onChange={e => onUpdate(day.id, { travelTime: e.target.value })} className="h-7 text-xs rounded-lg border-slate-200" placeholder="hrs" />
            </div>
          </div>
          <Textarea
            value={day.notes}
            onChange={e => onUpdate(day.id, { notes: e.target.value })}
            placeholder="Day notes..."
            className="h-14 text-xs rounded-lg border-slate-200 resize-none"
          />
        </div>
      </div>

      {day.items.length > 0 && (
        <div className="px-4 pb-2 pt-2 space-y-1.5">
          {day.items.map((item, idx) => {
            const Icon = typeIcons[item.type] || Package;
            return (
              <div key={item.id} className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 group hover:border-slate-200 transition-colors">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className={`p-1.5 rounded-lg ${typeColors[item.type] || 'text-slate-500 bg-slate-100'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{item.label}</p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {item.type === "hotel" && `${item.details?.roomType || ''} · ${item.details?.mealPlan || ''} · ${item.nights || 0} night${item.nights !== 1 ? 's' : ''}`}
                      {item.type === "vehicle" && `${item.details?.route || ''} · ${item.details?.days || 0} day${item.details?.days !== 1 ? 's' : ''}`}
                      {item.type === "transfer" && `${item.details?.from || ''} → ${item.details?.to || ''}`}
                      {item.type === "activity" && `${item.quantity} pax`}
                      {item.type === "meal" && `${item.details?.mealPlan || ''} · ${item.quantity} pax`}
                      {item.type === "guide" && `${item.quantity} day${item.quantity !== 1 ? 's' : ''}`}
                      {item.type === "train_flight" && item.description}
                      {item.type === "addon" && item.description}
                    </p>
                  </div>
                  <div className="text-xs font-bold text-slate-700 shrink-0">₹{(item.rate * item.quantity).toLocaleString("en-IN")}</div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" onClick={() => setEditingItem(editingItem?.id === item.id ? null : item)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" onClick={() => onDeleteItem(day.id, item.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="px-4 pb-3 pt-1 flex items-center justify-between">
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="h-8 text-[10px] font-bold rounded-lg border-dashed border-slate-300 text-slate-500 hover:text-violet-600 hover:border-violet-300 gap-1"
          >
            <Plus className="w-3 h-3" /> Add Service
          </Button>
          {showAddMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border-2 border-slate-200 rounded-xl shadow-xl z-20 p-1.5 w-48 grid grid-cols-2 gap-0.5">
              {addServiceOptions.map(opt => (
                <button
                  key={opt.label}
                  onClick={opt.action}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-violet-50 text-[10px] font-semibold text-slate-700 hover:text-violet-700 transition-colors"
                >
                  <opt.icon className="w-3 h-3" /> {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
          Day Total: <span className="text-violet-600">₹{dayCost.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* Edit Item Modal */}
      <Dialog open={!!editingItem} onOpenChange={v => !v && setEditingItem(null)}>
        <DialogContent className="sm:max-w-[400px] border-slate-200 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Edit {editingItem?.label}</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div>
                <Label className="text-[10px] font-bold uppercase text-slate-500">Rate (₹)</Label>
                <Input
                  type="number"
                  value={editingItem.rate}
                  onChange={e => setEditingItem({ ...editingItem, rate: Number(e.target.value) })}
                  className="h-9 text-sm rounded-xl border-slate-200"
                />
              </div>
              <div>
                <Label className="text-[10px] font-bold uppercase text-slate-500">Quantity</Label>
                <Input
                  type="number"
                  value={editingItem.quantity}
                  onChange={e => setEditingItem({ ...editingItem, quantity: Number(e.target.value) })}
                  className="h-9 text-sm rounded-xl border-slate-200"
                />
              </div>
              <div className="bg-violet-50 rounded-xl px-4 py-3 text-center">
                <span className="text-xs font-medium text-slate-600">Total: </span>
                <span className="text-lg font-bold text-violet-700">₹{(editingItem.rate * editingItem.quantity).toLocaleString("en-IN")}</span>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setEditingItem(null)} className="rounded-xl text-xs font-bold">Cancel</Button>
                <Button onClick={() => { onEditItem(day.id, editingItem); setEditingItem(null); }} className="rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700">Update</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────

export default function PackageBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const admin = useAuthStore(s => s.admin);
  const isAdminOrSuper = admin?.role === "admin" || admin?.role === "superadmin";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [activeServiceTab, setActiveServiceTab] = useState("hotels");
  const [showQuotePreview, setShowQuotePreview] = useState(false);

  // Master data
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [transferRoutes, setTransferRoutes] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [mealPlans, setMealPlans] = useState<any[]>([]);

  // Package state
  const [pkg, setPkg] = useState<PackageState>({
    id: null,
    status: "draft",
    customer: { ...defaultCustomer },
    days: [createDay(1, "")],
    discountPercent: 0,
    gstPercent: 18,
    serviceCharge: 0,
    showInternalCost: false,
  });

  // Rate modals
  const [modalState, setModalState] = useState<{
    type: "hotel" | "vehicle" | "activity" | "transfer" | "meal" | "guide" | "train_flight" | "addon" | null;
    dayId: string | null;
    selected: any;
  }>({ type: null, dayId: null, selected: null });

  // ── Load master data ──
  const loadMasterData = useCallback(async () => {
    try {
      const [statesRes, citiesRes, hotelsRes, vehiclesRes, transfersRes, activitiesRes, mealsRes] = await Promise.all([
        packageBuilderService.getStates({ limit: 100, isActive: true }),
        packageBuilderService.getCities({ limit: 500 }),
        packageBuilderService.getHotels({ limit: 200, isActive: true }),
        packageBuilderService.getVehicles({ limit: 200 }),
        packageBuilderService.getTransferRoutes({ limit: 200 }),
        packageBuilderService.getActivities({ limit: 200, isActive: true }),
        packageBuilderService.getMealPlans({ limit: 100 }),
      ]);
      setStates(Array.isArray(statesRes.data) ? statesRes.data : []);
      setCities(Array.isArray(citiesRes.data) ? citiesRes.data : []);
      setHotels(Array.isArray(hotelsRes.data) ? hotelsRes.data : []);
      setVehicles(Array.isArray(vehiclesRes.data) ? vehiclesRes.data : []);
      setTransferRoutes(Array.isArray(transfersRes.data) ? transfersRes.data : []);
      setActivities(Array.isArray(activitiesRes.data) ? activitiesRes.data : []);
      setMealPlans(Array.isArray(mealsRes.data) ? mealsRes.data : []);
    } catch (err) {
      console.error("Failed to load master data", err);
      toast.error("Failed to load master data");
    }
  }, []);

  const loadDraft = useCallback(async (draftId: string) => {
    try {
      const res = await packageBuilderService.getPackageDraft(draftId);
      if (res?.data) {
        const d = res.data;
        setPkg({
          id: d._id || d.id,
          status: d.status || "draft",
          customer: {
            customerName: d.customerName || "",
            customerPhone: d.customerPhone || "",
            customerEmail: d.customerEmail || "",
            packageName: d.packageName || "",
            stateId: d.stateId || "",
            stateName: d.stateName || "",
            destinationCityIds: d.destinationCityIds || [],
            destinationCityNames: d.destinationCityNames || [],
            departureCity: d.departureCity || "",
            travelStartDate: d.travelStartDate ? d.travelStartDate.slice(0, 10) : "",
            travelEndDate: d.travelEndDate ? d.travelEndDate.slice(0, 10) : "",
            totalNights: d.totalNights || 0,
            totalDays: d.totalDays || 0,
            adults: d.adults || 2,
            children: d.children || 0,
            couples: d.couples || 0,
            rooms: d.rooms || 1,
            specialNotes: d.specialNotes || "",
          },
          days: (d.days || []).map((day: any) => ({
            id: day.id || uuidv4(),
            dayNumber: day.dayNumber,
            date: day.date ? day.date.slice(0, 10) : "",
            stayCity: day.stayCity || "",
            title: day.title || "",
            routeFrom: day.routeFrom || "",
            routeTo: day.routeTo || "",
            distance: day.distance || "",
            travelTime: day.travelTime || "",
            notes: day.notes || "",
            items: (day.items || []).map((item: any, idx: number) => ({
              id: item.id || uuidv4(),
              type: item.type,
              label: item.label || "",
              description: item.description || "",
              vendorId: item.vendorId,
              vendorName: item.vendorName || "",
              rate: item.rate || 0,
              quantity: item.quantity || 1,
              nights: item.nights,
              unit: item.unit || "pax",
              details: item.details || {},
              sortOrder: item.sortOrder ?? idx,
            })),
          })),
          discountPercent: d.discountPercent || 0,
          gstPercent: d.gstPercent ?? 18,
          serviceCharge: d.serviceCharge || 0,
          showInternalCost: false,
        });
      }
    } catch (err) {
      toast.error("Failed to load draft");
      navigate("/admin/package-builder");
    }
  }, [navigate]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadMasterData();
      if (id && id !== "new") {
        await loadDraft(id);
      }
      setLoading(false);
    };
    init();
  }, [id]);

  // ── Auto-calc ──
  useEffect(() => {
    setPkg(prev => {
      const nights = calcNights(prev.customer.travelStartDate, prev.customer.travelEndDate);
      const days = calcDays(prev.customer.travelStartDate, prev.customer.travelEndDate);
      const { couplesRooms, tripleRooms, total } = calcRooms(prev.customer.adults, prev.customer.children, prev.customer.couples);
      return {
        ...prev,
        customer: {
          ...prev.customer,
          totalNights: nights,
          totalDays: days,
          rooms: total,
          _couplesRooms: couplesRooms,
          _tripleRooms: tripleRooms,
        },
      };
    });
  }, [pkg.customer.travelStartDate, pkg.customer.travelEndDate, pkg.customer.adults, pkg.customer.children, pkg.customer.couples]);

  // ── Cost calculations ──
  const costSummary = useMemo(() => {
    const catTotals: Record<string, number> = { hotel: 0, vehicle: 0, transfer: 0, activity: 0, meal: 0, guide: 0, train_flight: 0, addon: 0 };
    let totalVendorCost = 0;
    for (const day of pkg.days) {
      for (const item of day.items) {
        const lineTotal = item.rate * item.quantity;
        catTotals[item.type] = (catTotals[item.type] || 0) + lineTotal;
        totalVendorCost += lineTotal;
      }
    }
    const subtotal = Object.values(catTotals).reduce((a, b) => a + b, 0);
    const discountAmt = subtotal * (pkg.discountPercent / 100);
    const afterDiscount = subtotal - discountAmt;
    const gstAmt = afterDiscount * (pkg.gstPercent / 100);
    const total = afterDiscount + gstAmt + pkg.serviceCharge;
    const perAdult = pkg.customer.adults > 0 ? total / pkg.customer.adults : 0;
    const perChild = pkg.customer.children > 0 ? total / pkg.customer.children : 0;
    const margin = subtotal - totalVendorCost;
    return { catTotals, subtotal, discountAmt, afterDiscount, gstAmt, total, perAdult, perChild, totalVendorCost, margin };
  }, [pkg.days, pkg.discountPercent, pkg.gstPercent, pkg.serviceCharge]);

  // ── Customer update ──
  const updateCustomer = (key: string, value: any) => {
    setPkg(prev => ({ ...prev, customer: { ...prev.customer, [key]: value } }));
  };

  // ── Day operations ──
  const addDay = () => {
    setPkg(prev => {
      const lastDay = prev.days[prev.days.length - 1];
      const lastDate = lastDay?.date || prev.customer.travelStartDate || "";
      let nextDate = "";
      if (lastDate) {
        const d = new Date(lastDate);
        d.setDate(d.getDate() + 1);
        nextDate = d.toISOString().slice(0, 10);
      }
      const newDay = createDay(prev.days.length + 1, nextDate);
      return { ...prev, days: [...prev.days, newDay] };
    });
  };

  const updateDay = (dayId: string, data: Partial<ItineraryDay>) => {
    setPkg(prev => ({
      ...prev,
      days: prev.days.map(d => d.id === dayId ? { ...d, ...data } : d),
    }));
  };

  const deleteDay = (dayId: string) => {
    setPkg(prev => ({
      ...prev,
      days: prev.days.filter(d => d.id !== dayId).map((d, i) => ({ ...d, dayNumber: i + 1 })),
    }));
  };

  const addItemToDay = (dayId: string, item: ItineraryItem) => {
    setPkg(prev => ({
      ...prev,
      days: prev.days.map(d => d.id === dayId ? { ...d, items: [...d.items, item] } : d),
    }));
  };

  const editItemInDay = (dayId: string, updated: ItineraryItem) => {
    setPkg(prev => ({
      ...prev,
      days: prev.days.map(d => d.id === dayId ? { ...d, items: d.items.map(i => i.id === updated.id ? updated : i) } : d),
    }));
  };

  const deleteItemFromDay = (dayId: string, itemId: string) => {
    setPkg(prev => ({
      ...prev,
      days: prev.days.map(d => d.id === dayId ? { ...d, items: d.items.filter(i => i.id !== itemId) } : d),
    }));
  };

  // ── Drag & Drop ──
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [activeDayId, setActiveDayId] = useState<string | null>(null);

  const handleDragStart = (event: any) => {
    setActiveDayId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    setActiveDayId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPkg(prev => {
      const oldIdx = prev.days.findIndex(d => d.id === active.id);
      const newIdx = prev.days.findIndex(d => d.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return prev;
      const reordered = arrayMove(prev.days, oldIdx, newIdx);
      return { ...prev, days: reordered.map((d, i) => ({ ...d, dayNumber: i + 1 })) };
    });
  };

  // ── Save Draft ──
  const saveDraft = async () => {
    setSaving(true);
    try {
      const payload = {
        ...pkg.customer,
        status: "draft",
        days: pkg.days,
        discountPercent: pkg.discountPercent,
        gstPercent: pkg.gstPercent,
        serviceCharge: pkg.serviceCharge,
      };
      if (pkg.id) {
        await packageBuilderService.updatePackageDraft(pkg.id, payload);
        toast.success("Draft saved");
      } else {
        const res = await packageBuilderService.createPackageDraft(payload);
        if (res?.data?._id || res?.data?.id) {
          setPkg(prev => ({ ...prev, id: res.data._id || res.data.id }));
          navigate(`/admin/package-builder/${res.data._id || res.data.id}`, { replace: true });
        }
        toast.success("Draft saved");
      }
    } catch (err) {
      toast.error("Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  // ── Generate Quote ──
  const generateQuote = async () => {
    if (!pkg.customer.customerName) { toast.error("Customer name is required"); return; }
    if (!pkg.customer.packageName) { toast.error("Package name is required"); return; }
    if (pkg.days.length === 0) { toast.error("Add at least one day"); return; }
    if (!pkg.id) {
      await saveDraft();
    }
    if (!pkg.id) return;
    setSaving(true);
    try {
      await packageBuilderService.generateQuote(pkg.id);
      setPkg(prev => ({ ...prev, status: "quoted" }));
      toast.success("Quote generated successfully");
    } catch (err) {
      toast.error("Failed to generate quote");
    } finally {
      setSaving(false);
    }
  };

  // ── Convert to Booking ──
  const convertToBooking = async () => {
    if (!pkg.id || pkg.status !== "quoted") return;
    if (!confirm("Convert this quoted package to a booking?")) return;
    setSaving(true);
    try {
      await packageBuilderService.convertToBooking(pkg.id);
      setPkg(prev => ({ ...prev, status: "converted" }));
      toast.success("Converted to booking");
    } catch (err) {
      toast.error("Failed to convert to booking");
    } finally {
      setSaving(false);
    }
  };

  // ── Duplicate ──
  const duplicateDraft = async () => {
    if (!pkg.id) return;
    try {
      const res = await packageBuilderService.duplicatePackageDraft(pkg.id);
      const newId = res?.data?._id || res?.data?.id;
      if (newId) navigate(`/admin/package-builder/${newId}`);
      toast.success("Duplicated");
    } catch (err) {
      toast.error("Failed to duplicate");
    }
  };

  // ── Master data filters ──
  const destinationCityIds = pkg.customer.destinationCityIds;
  const filteredHotels = useMemo(() => {
    if (destinationCityIds.length === 0) return hotels;
    return hotels.filter((h: any) => destinationCityIds.includes(h.cityId || h.city?._id || h.city?.id));
  }, [hotels, destinationCityIds]);
  const filteredVehicles = vehicles;
  const filteredActivities = useMemo(() => {
    if (destinationCityIds.length === 0) return activities;
    return activities.filter((a: any) => destinationCityIds.includes(a.cityId || a.city?._id || a.city?.id));
  }, [activities, destinationCityIds]);
  const filteredTransfers = useMemo(() => {
    if (destinationCityIds.length === 0) return transferRoutes;
    return transferRoutes.filter((t: any) =>
      destinationCityIds.includes(t.fromCityId || t.fromCity?._id || t.fromCity?.id) ||
      destinationCityIds.includes(t.toCityId || t.toCity?._id || t.toCity?.id)
    );
  }, [transferRoutes, destinationCityIds]);

  // ── Modal Handlers ──
  const openRateModal = (type: "hotel" | "vehicle" | "activity" | "transfer" | "meal" | "guide" | "train_flight" | "addon", dayId: string, item: any) => {
    setModalState({ type, dayId, selected: item });
  };
  const closeRateModal = () => setModalState({ type: null, dayId: null, selected: null });

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-500 hover:text-violet-600" onClick={() => navigate("/admin/package-builder")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-base font-bold text-slate-800 tracking-tight">Package Builder</h1>
              <p className="text-[10px] font-medium text-slate-400">{pkg.id ? "Editing draft" : "New package"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-[10px] font-bold rounded-xl border-slate-200 gap-1.5"
              onClick={() => setShowQuotePreview(true)}
            >
              <Eye className="w-3.5 h-3.5" /> Preview Quote
            </Button>
            <Button
              size="sm"
              onClick={generateQuote}
              disabled={saving}
              className="h-9 text-[10px] font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              {saving ? "Working..." : "Generate Quote"}
            </Button>
            <Button
              size="sm"
              onClick={saveDraft}
              disabled={saving}
              className="h-9 text-[10px] font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? "Saving..." : "Save Draft"}
            </Button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="h-[70vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading Package Builder...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex gap-6">
          {/* ── LEFT PANEL (~65%) ── */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Step 1: Customer & Trip Details */}
            <Card className="border-2 border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-600" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Customer & Trip Details</span>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Customer Name</Label>
                    <Input value={pkg.customer.customerName} onChange={e => updateCustomer("customerName", e.target.value)} placeholder="Full name" className="h-9 text-sm rounded-xl border-slate-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Phone</Label>
                    <Input value={pkg.customer.customerPhone} onChange={e => updateCustomer("customerPhone", e.target.value)} placeholder="Phone" className="h-9 text-sm rounded-xl border-slate-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Email</Label>
                    <Input value={pkg.customer.customerEmail} onChange={e => updateCustomer("customerEmail", e.target.value)} placeholder="Email" type="email" className="h-9 text-sm rounded-xl border-slate-200" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Package Name</Label>
                    <Input value={pkg.customer.packageName} onChange={e => updateCustomer("packageName", e.target.value)} placeholder="e.g. Himachal Explorer" className="h-9 text-sm rounded-xl border-slate-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">State / Region</Label>
                    <Select value={pkg.customer.stateId} onValueChange={v => {
                      const s = states.find((st: any) => st._id === v || st.id === v);
                      updateCustomer("stateId", v);
                      updateCustomer("stateName", s?.name || "");
                    }}>
                      <SelectTrigger className="h-9 text-sm rounded-xl border-slate-200">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200">
                        {states.map((s: any) => (
                          <SelectItem key={s._id || s.id} value={s._id || s.id} className="text-xs font-medium">{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Destination / Cities</Label>
                  <div className="flex flex-wrap gap-1.5 p-2 border-2 border-slate-200 rounded-xl min-h-[2.5rem] bg-white">
                    {pkg.customer.destinationCityNames.map((name, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px] font-semibold gap-1 bg-violet-50 text-violet-700 border border-violet-200 rounded-lg">
                        {name}
                        <button onClick={() => {
                          const ids = pkg.customer.destinationCityIds.filter((_, j) => j !== i);
                          const names = pkg.customer.destinationCityNames.filter((_, j) => j !== i);
                          updateCustomer("destinationCityIds", ids);
                          updateCustomer("destinationCityNames", names);
                        }}><X className="w-3 h-3" /></button>
                      </Badge>
                    ))}
                    <Select value="" onValueChange={v => {
                      const c = cities.find((ct: any) => (ct._id || ct.id) === v);
                      if (c && !pkg.customer.destinationCityIds.includes(v)) {
                        updateCustomer("destinationCityIds", [...pkg.customer.destinationCityIds, v]);
                        updateCustomer("destinationCityNames", [...pkg.customer.destinationCityNames, c.name]);
                      }
                    }}>
                      <SelectTrigger className="border-0 shadow-none h-7 text-xs font-medium text-slate-400 hover:text-slate-600 p-0 focus:ring-0">
                        <SelectValue placeholder="+ Add city" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200">
                        {cities
                          .filter((c: any) => !pkg.customer.destinationCityIds.includes(c._id || c.id))
                          .map((c: any) => (
                            <SelectItem key={c._id || c.id} value={c._id || c.id} className="text-xs font-medium">{c.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Departure City</Label>
                    <Input value={pkg.customer.departureCity} onChange={e => updateCustomer("departureCity", e.target.value)} placeholder="e.g. Delhi" className="h-9 text-sm rounded-xl border-slate-200" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-500">Travel Start</Label>
                      <Input type="date" value={pkg.customer.travelStartDate} onChange={e => updateCustomer("travelStartDate", e.target.value)} className="h-9 text-sm rounded-xl border-slate-200" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-500">Travel End</Label>
                      <Input type="date" value={pkg.customer.travelEndDate} onChange={e => updateCustomer("travelEndDate", e.target.value)} className="h-9 text-sm rounded-xl border-slate-200" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-200">
                    <p className="text-[9px] font-bold uppercase text-slate-400">Nights</p>
                    <p className="text-xl font-bold text-violet-700">{pkg.customer.totalNights}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-200">
                    <p className="text-[9px] font-bold uppercase text-slate-400">Days</p>
                    <p className="text-xl font-bold text-violet-700">{pkg.customer.totalDays}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-200">
                    <p className="text-[9px] font-bold uppercase text-slate-400">Rooms</p>
                    <p className="text-xl font-bold text-violet-700">{pkg.customer.rooms}</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Adults</Label>
                    <Input type="number" min="0" value={pkg.customer.adults} onChange={e => updateCustomer("adults", Math.max(0, Number(e.target.value)))} className="h-9 text-sm rounded-xl border-slate-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Children</Label>
                    <Input type="number" min="0" value={pkg.customer.children} onChange={e => updateCustomer("children", Math.max(0, Number(e.target.value)))} className="h-9 text-sm rounded-xl border-slate-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Couples</Label>
                    <Input type="number" min="0" value={pkg.customer.couples} onChange={e => updateCustomer("couples", Math.max(0, Number(e.target.value)))} className="h-9 text-sm rounded-xl border-slate-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Rooms (override)</Label>
                    <Input type="number" min="0" value={pkg.customer.rooms} onChange={e => updateCustomer("rooms", Math.max(0, Number(e.target.value)))} className="h-9 text-sm rounded-xl border-slate-200" />
                  </div>
                </div>

                {(pkg.customer as any)._couplesRooms !== undefined && (
                  <div className="text-[10px] font-medium text-slate-500 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
                    Room breakdown: {(pkg.customer as any)._couplesRooms} couple room{(pkg.customer as any)._couplesRooms !== 1 ? 's' : ''} + {(pkg.customer as any)._tripleRooms} triple-sharing room{(pkg.customer as any)._tripleRooms !== 1 ? 's' : ''} = {pkg.customer.rooms} total
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Special Notes</Label>
                  <Textarea value={pkg.customer.specialNotes} onChange={e => updateCustomer("specialNotes", e.target.value)} placeholder="Any special requirements..." className="h-16 text-sm rounded-xl border-slate-200 resize-none" />
                </div>
              </div>
            </Card>

            {/* Step 2: Service Selection Tabs */}
            <Card className="border-2 border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <Package className="w-4 h-4 text-violet-600" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Service Selection</span>
              </div>
              <Tabs value={activeServiceTab} onValueChange={setActiveServiceTab} className="p-0">
                <div className="px-4 pt-3 overflow-x-auto no-scrollbar">
                  <TabsList className="h-9 bg-slate-100 p-0.5 rounded-xl gap-0.5 inline-flex w-max">
                    {[
                      { id: "hotels", label: "Hotels", icon: Hotel },
                      { id: "vehicles", label: "Vehicles", icon: Car },
                      { id: "transfers", label: "Transfers", icon: Bus },
                      { id: "activities", label: "Activities", icon: Activity },
                      { id: "meals", label: "Meals", icon: Utensils },
                      { id: "guides", label: "Guides", icon: Users },
                      { id: "train", label: "Train/Flight", icon: Train },
                      { id: "addons", label: "Add-ons", icon: Package },
                    ].map(tab => (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="h-8 px-3 text-[10px] font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-sm gap-1.5"
                      >
                        <tab.icon className="w-3 h-3" /> {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <TabsContent value="hotels" className="p-4 m-0 space-y-3">
                  {filteredHotels.length === 0 ? (
                    <p className="text-xs text-slate-400 py-8 text-center font-medium">No hotels available for selected cities.</p>
                  ) : (
                    filteredHotels.map((hotel: any) => (
                      <button
                        key={hotel._id || hotel.id}
                        onClick={() => openRateModal("hotel", "", hotel)}
                        className="w-full text-left bg-white border-2 border-slate-100 hover:border-violet-300 rounded-xl p-3 transition-all hover:shadow-sm flex items-center gap-3 group"
                      >
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-violet-50 group-hover:text-violet-400 transition-colors shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{hotel.name}</p>
                          <p className="text-[10px] text-slate-500">{hotel.city?.name || hotel.cityName || ""}</p>
                        </div>
                        <Badge variant="secondary" className="text-[9px] font-bold rounded-md bg-amber-50 text-amber-700 border-amber-200">{hotel.category || "Standard"}</Badge>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-violet-700">₹{hotel.basePrice || hotel.baseRate || 0}</p>
                          <p className="text-[9px] text-slate-400">per room/night</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition-colors" />
                      </button>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="vehicles" className="p-4 m-0 space-y-3">
                  {filteredVehicles.length === 0 ? (
                    <p className="text-xs text-slate-400 py-8 text-center font-medium">No vehicles available.</p>
                  ) : (
                    filteredVehicles.map((v: any) => (
                      <button
                        key={v._id || v.id}
                        onClick={() => openRateModal("vehicle", "", v)}
                        className="w-full text-left bg-white border-2 border-slate-100 hover:border-violet-300 rounded-xl p-3 transition-all hover:shadow-sm flex items-center gap-3 group"
                      >
                        <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-400 shrink-0">
                          <Car className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{v.name}</p>
                          <p className="text-[10px] text-slate-500">{v.seats} seats {v.isAc ? "· AC" : "· Non-AC"}</p>
                        </div>
                        <p className="text-xs font-bold text-amber-700">₹{v.baseRate || v.basePrice || 0}/{v.rateType === "per_km" ? "km" : "day"}</p>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
                      </button>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="transfers" className="p-4 m-0 space-y-3">
                  {filteredTransfers.length === 0 ? (
                    <p className="text-xs text-slate-400 py-8 text-center font-medium">No transfer routes available.</p>
                  ) : (
                    filteredTransfers.map((t: any) => (
                      <button
                        key={t._id || t.id}
                        onClick={() => openRateModal("transfer", "", t)}
                        className="w-full text-left bg-white border-2 border-slate-100 hover:border-blue-300 rounded-xl p-3 transition-all hover:shadow-sm flex items-center gap-3 group"
                      >
                        <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-400 shrink-0">
                          <Bus className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800">{t.fromCity?.name || t.fromCityName || "?"} → {t.toCity?.name || t.toCityName || "?"}</p>
                          <p className="text-[10px] text-slate-500">{t.distance ? `${t.distance} km` : ""}{t.travelTime ? ` · ${t.travelTime}` : ""}</p>
                        </div>
                        <p className="text-xs font-bold text-blue-700">₹{t.rate || t.baseRate || 0}</p>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                      </button>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="activities" className="p-4 m-0 space-y-3">
                  {filteredActivities.length === 0 ? (
                    <p className="text-xs text-slate-400 py-8 text-center font-medium">No activities available for selected cities.</p>
                  ) : (
                    filteredActivities.map((a: any) => (
                      <button
                        key={a._id || a.id}
                        onClick={() => openRateModal("activity", "", a)}
                        className="w-full text-left bg-white border-2 border-slate-100 hover:border-emerald-300 rounded-xl p-3 transition-all hover:shadow-sm flex items-center gap-3 group"
                      >
                        <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-400 shrink-0">
                          <Activity className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{a.name}</p>
                          <p className="text-[10px] text-slate-500">{a.city?.name || a.cityName || ""}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-emerald-700">₹{a.adultRate || a.rate || 0}</p>
                          {a.childRate ? <p className="text-[9px] text-slate-400">Child: ₹{a.childRate}</p> : null}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                      </button>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="meals" className="p-4 m-0 space-y-3">
                  {mealPlans.length === 0 ? (
                    <p className="text-xs text-slate-400 py-8 text-center font-medium">No meal plans available.</p>
                  ) : (
                    mealPlans.map((m: any) => (
                      <button
                        key={m._id || m.id}
                        onClick={() => openRateModal("meal", "", m)}
                        className="w-full text-left bg-white border-2 border-slate-100 hover:border-orange-300 rounded-xl p-3 transition-all hover:shadow-sm flex items-center gap-3 group"
                      >
                        <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center text-orange-400 shrink-0">
                          <Coffee className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{m.name}</p>
                          <p className="text-[10px] text-slate-500">{m.description || m.type || ""}</p>
                        </div>
                        <p className="text-xs font-bold text-orange-700">₹{m.rate || m.price || 0}/pax</p>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-colors" />
                      </button>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="guides" className="p-4 m-0">
                  <div className="text-center py-8 space-y-4">
                    <Users className="w-8 h-8 text-cyan-400 mx-auto" />
                    <p className="text-xs text-slate-400 font-medium">Add a guide cost manually</p>
                    <Button
                      onClick={() => openRateModal("guide", "", null)}
                      variant="outline"
                      className="rounded-xl border-cyan-200 text-cyan-700 hover:bg-cyan-50 text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Guide Cost
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="train" className="p-4 m-0">
                  <div className="text-center py-8 space-y-4">
                    <Train className="w-8 h-8 text-rose-400 mx-auto" />
                    <p className="text-xs text-slate-400 font-medium">Add train or flight cost manually</p>
                    <Button
                      onClick={() => openRateModal("train_flight", "", null)}
                      variant="outline"
                      className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Train/Flight Cost
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="addons" className="p-4 m-0">
                  <div className="text-center py-8 space-y-4">
                    <Package className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-400 font-medium">Add miscellaneous costs</p>
                    <Button
                      onClick={() => openRateModal("addon", "", null)}
                      variant="outline"
                      className="rounded-xl border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Miscellaneous Cost
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Step 3: Day-Wise Itinerary Builder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-violet-600" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Itinerary Days</span>
                  <Badge variant="secondary" className="text-[9px] font-bold rounded-md bg-slate-100 text-slate-600">{pkg.days.length} day{pkg.days.length !== 1 ? 's' : ''}</Badge>
                </div>
                <Button onClick={addDay} size="sm" className="h-8 text-[10px] font-bold rounded-xl bg-violet-600 hover:bg-violet-700 gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Day
                </Button>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <SortableContext items={pkg.days.map(d => d.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {pkg.days.map((day, idx) => (
                      <SortableDayCard
                        key={day.id}
                        day={day}
                        dayIdx={idx}
                        onUpdate={updateDay}
                        onDelete={deleteDay}
                        onAddItem={(dayId) => {}}
                        onEditItem={editItemInDay}
                        onDeleteItem={deleteItemFromDay}
                        onItemSortEnd={() => {}}
                        openHotelModal={(dayId) => openRateModal("hotel", dayId, null)}
                        openVehicleModal={(dayId) => openRateModal("vehicle", dayId, null)}
                        openActivityModal={(dayId) => openRateModal("activity", dayId, null)}
                        openTransferModal={(dayId) => openRateModal("transfer", dayId, null)}
                        openMealModal={(dayId) => openRateModal("meal", dayId, null)}
                        openGuideModal={(dayId) => openRateModal("guide", dayId, null)}
                        openTrainModal={(dayId) => openRateModal("train_flight", dayId, null)}
                        openAddonModal={(dayId) => openRateModal("addon", dayId, null)}
                        states={states}
                        cities={cities}
                      />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {activeDayId ? <div className="bg-white rounded-2xl border-2 border-violet-400 shadow-2xl p-4 opacity-90"><p className="text-sm font-bold">Moving day...</p></div> : null}
                </DragOverlay>
              </DndContext>
            </div>
          </div>

          {/* ── RIGHT PANEL (~35%) - Package Summary ── */}
          <div className="w-[380px] shrink-0 hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <Card className="border-2 border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-violet-600" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Package Summary</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-400 hover:text-blue-600" onClick={duplicateDraft} title="Duplicate">
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-400 hover:text-emerald-600" onClick={saveDraft} title="Save Draft">
                      <Save className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <p className="text-sm font-bold text-slate-800 truncate">{pkg.customer.packageName || "Untitled Package"}</p>
                  <div className="text-[10px] text-slate-500 space-y-0.5">
                    <p className="flex items-center gap-1.5"><Users className="w-3 h-3" /> {pkg.customer.customerName || "No customer"}</p>
                    <p className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {pkg.customer.travelStartDate || "?"} → {pkg.customer.travelEndDate || "?"}</p>
                    <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {pkg.customer.destinationCityNames.join(", ") || "No destinations"}</p>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span>{pkg.customer.totalDays} days · {pkg.customer.totalNights} nights</span>
                    <span>{pkg.customer.adults + pkg.customer.children} travelers ({pkg.customer.adults}A + {pkg.customer.children}C) · {pkg.customer.rooms} rooms</span>
                  </div>
                </div>
              </Card>

              {/* Cost Breakdown */}
              <Card className="border-2 border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-violet-600" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Selling Price</span>
                  </div>
                  {isAdminOrSuper && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-medium text-slate-400">Internal</span>
                      <Switch checked={pkg.showInternalCost} onCheckedChange={v => setPkg(prev => ({ ...prev, showInternalCost: v }))} className="scale-75" />
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  {[
                    { label: "Hotel Cost", key: "hotel" as const },
                    { label: "Vehicle Cost", key: "vehicle" as const },
                    { label: "Transfer Cost", key: "transfer" as const },
                    { label: "Activity Cost", key: "activity" as const },
                    { label: "Meal Cost", key: "meal" as const },
                    { label: "Guide Cost", key: "guide" as const },
                    { label: "Train/Flight", key: "train_flight" as const },
                    { label: "Misc / Add-ons", key: "addon" as const },
                  ].map(row => (
                    <div key={row.key} className="flex items-center justify-between text-xs py-0.5">
                      <span className="text-slate-600">{row.label}</span>
                      <span className="font-bold text-slate-800">₹{costSummary.catTotals[row.key].toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">Subtotal</span>
                    <span className="text-slate-800">₹{costSummary.subtotal.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 flex items-center gap-1">Discount <span className="text-[9px] text-slate-400">({pkg.discountPercent}%)</span></span>
                    <span className="font-bold text-red-500">-₹{costSummary.discountAmt.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400">Discount %</span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={pkg.discountPercent}
                      onChange={e => setPkg(prev => ({ ...prev, discountPercent: Math.max(0, Math.min(100, Number(e.target.value))) }))}
                      className="h-6 w-16 text-xs font-bold rounded-lg border-slate-200 text-right"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 flex items-center gap-1">GST <span className="text-[9px] text-slate-400">({pkg.gstPercent}%)</span></span>
                    <span className="font-bold text-amber-600">+₹{costSummary.gstAmt.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400">GST %</span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={pkg.gstPercent}
                      onChange={e => setPkg(prev => ({ ...prev, gstPercent: Math.max(0, Math.min(100, Number(e.target.value))) }))}
                      className="h-6 w-16 text-xs font-bold rounded-lg border-slate-200 text-right"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Service Charge</span>
                    <span className="font-bold text-amber-600">+₹{pkg.serviceCharge.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400">Service Charge (₹)</span>
                    <Input
                      type="number"
                      min="0"
                      value={pkg.serviceCharge}
                      onChange={e => setPkg(prev => ({ ...prev, serviceCharge: Math.max(0, Number(e.target.value)) }))}
                      className="h-6 w-20 text-xs font-bold rounded-lg border-slate-200 text-right"
                    />
                  </div>

                  <Separator />
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span className="text-slate-800">Total</span>
                    <span className="text-violet-700 text-lg">₹{costSummary.total.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Per Adult</span>
                    <span className="font-bold">₹{costSummary.perAdult.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Per Child</span>
                    <span className="font-bold">₹{costSummary.perChild.toLocaleString("en-IN")}</span>
                  </div>

                  {/* Internal Cost View */}
                  {pkg.showInternalCost && isAdminOrSuper && (
                    <>
                      <Separator />
                      <div className="space-y-2 pt-1">
                        <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Internal Cost</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Total Vendor Cost</span>
                          <span className="font-bold text-slate-800">₹{costSummary.totalVendorCost.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Estimated Margin</span>
                          <span className={`font-bold ${costSummary.margin >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            ₹{costSummary.margin.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button onClick={saveDraft} disabled={saving} className="w-full h-10 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving..." : "Save Draft"}
                </Button>
                <Button onClick={() => setShowQuotePreview(true)} variant="outline" className="w-full h-10 text-xs font-bold rounded-xl border-slate-200 gap-2">
                  <Eye className="w-4 h-4" /> Preview Quote
                </Button>
                <Button onClick={generateQuote} disabled={saving} className="w-full h-10 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-700 gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Generate Quote
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={duplicateDraft} variant="outline" className="h-9 text-[10px] font-bold rounded-xl border-slate-200 gap-1.5">
                    <Copy className="w-3.5 h-3.5" /> Duplicate
                  </Button>
                  <Button
                    onClick={convertToBooking}
                    disabled={pkg.status !== "quoted"}
                    variant="outline"
                    className="h-9 text-[10px] font-bold rounded-xl border-slate-200 gap-1.5 disabled:opacity-40"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Convert to Booking
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RATE MODALS ── */}
      <HotelRateModal
        open={modalState.type === "hotel"}
        onClose={closeRateModal}
        hotel={modalState.selected}
        onAdd={(dayId, item) => {
          if (modalState.dayId) addItemToDay(modalState.dayId, item);
          closeRateModal();
        }}
        pkgDays={pkg.days}
        defaultDayId={modalState.dayId}
        adults={pkg.customer.adults}
        children={pkg.customer.children}
      />

      <VehicleRateModal
        open={modalState.type === "vehicle"}
        onClose={closeRateModal}
        vehicle={modalState.selected}
        onAdd={(dayId, item) => {
          if (modalState.dayId) addItemToDay(modalState.dayId, item);
          closeRateModal();
        }}
        pkgDays={pkg.days}
        defaultDayId={modalState.dayId}
      />

      <ActivityRateModal
        open={modalState.type === "activity"}
        onClose={closeRateModal}
        activity={modalState.selected}
        onAdd={(dayId, item) => {
          if (modalState.dayId) addItemToDay(modalState.dayId, item);
          closeRateModal();
        }}
        pkgDays={pkg.days}
        defaultDayId={modalState.dayId}
      />

      <TransferRateModal
        open={modalState.type === "transfer"}
        onClose={closeRateModal}
        transfer={modalState.selected}
        onAdd={(dayId, item) => {
          if (modalState.dayId) addItemToDay(modalState.dayId, item);
          closeRateModal();
        }}
        pkgDays={pkg.days}
        defaultDayId={modalState.dayId}
      />

      <MealRateModal
        open={modalState.type === "meal"}
        onClose={closeRateModal}
        meal={modalState.selected}
        onAdd={(dayId, item) => {
          if (modalState.dayId) addItemToDay(modalState.dayId, item);
          closeRateModal();
        }}
        pkgDays={pkg.days}
        defaultDayId={modalState.dayId}
      />

      <CustomRateModal
        open={modalState.type === "guide"}
        onClose={closeRateModal}
        title="Add Guide Cost"
        icon={<Users className="w-5 h-5 text-cyan-600" />}
        rateLabel="Guide Rate per day"
        quantityLabel="Number of days"
        defaultUnit="day"
        itemType="guide"
        onAdd={(dayId, item) => {
          if (modalState.dayId) addItemToDay(modalState.dayId, item);
          closeRateModal();
        }}
        pkgDays={pkg.days}
        defaultDayId={modalState.dayId}
      />

      <CustomRateModal
        open={modalState.type === "train_flight"}
        onClose={closeRateModal}
        title="Add Train / Flight Cost"
        icon={<Train className="w-5 h-5 text-rose-600" />}
        rateLabel="Total fare"
        quantityLabel="Number of tickets"
        defaultUnit="pax"
        showDescription
        descriptionLabel="Provider / PNR"
        itemType="train_flight"
        onAdd={(dayId, item) => {
          if (modalState.dayId) addItemToDay(modalState.dayId, item);
          closeRateModal();
        }}
        pkgDays={pkg.days}
        defaultDayId={modalState.dayId}
      />

      <CustomRateModal
        open={modalState.type === "addon"}
        onClose={closeRateModal}
        title="Add Miscellaneous Cost"
        icon={<Package className="w-5 h-5 text-slate-600" />}
        rateLabel="Rate"
        quantityLabel="Quantity"
        defaultUnit="pax"
        showDescription
        descriptionLabel="Description"
        itemType="addon"
        onAdd={(dayId, item) => {
          if (modalState.dayId) addItemToDay(modalState.dayId, item);
          closeRateModal();
        }}
        pkgDays={pkg.days}
        defaultDayId={modalState.dayId}
      />

      {/* ── QUOTE PREVIEW MODAL ── */}
      <QuotePreviewModal
        open={showQuotePreview}
        onClose={() => setShowQuotePreview(false)}
        pkg={pkg}
        costSummary={costSummary}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Rate Modals
// ══════════════════════════════════════════════════════════════

function DaySelector({ days, selectedDayId, onSelect }: { days: ItineraryDay[]; selectedDayId: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] font-bold uppercase text-slate-500">Assign to Day</Label>
      <Select value={selectedDayId || (days[0]?.id || "")} onValueChange={onSelect}>
        <SelectTrigger className="h-9 text-sm rounded-xl border-slate-200">
          <SelectValue placeholder="Select day" />
        </SelectTrigger>
        <SelectContent className="rounded-xl border-slate-200">
          {days.map((d, i) => (
            <SelectItem key={d.id} value={d.id} className="text-xs font-medium">
              Day {d.dayNumber} {d.date ? `- ${new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""} {d.stayCity ? `(${d.stayCity})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ── Hotel Rate Modal ──
function HotelRateModal({
  open, onClose, hotel, onAdd, pkgDays, defaultDayId, adults, children,
}: {
  open: boolean; onClose: () => void; hotel: any; onAdd: (dayId: string, item: ItineraryItem) => void;
  pkgDays: ItineraryDay[]; defaultDayId: string | null; adults: number; children: number;
}) {
  const [rooms, setRooms] = useState(1);
  const [nights, setNights] = useState(1);
  const [roomType, setRoomType] = useState("");
  const [mealPlan, setMealPlan] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [extraMattress, setExtraMattress] = useState(0);
  const [extraAdult, setExtraAdult] = useState(0);
  const [extraChild, setExtraChild] = useState(0);
  const [dayId, setDayId] = useState(defaultDayId || (pkgDays[0]?.id || ""));

  const ratePerRoom = hotel?.basePrice || hotel?.baseRate || 0;
  const totalRate = ratePerRoom * rooms * nights;
  const extraCost = (extraMattress + extraAdult + extraChild);
  const total = totalRate + extraCost;

  useEffect(() => {
    if (hotel?.roomTypes?.[0]) setRoomType(hotel.roomTypes[0]);
    if (hotel?.mealPlans?.[0]) setMealPlan(hotel.mealPlans[0]);
  }, [hotel]);

  const handleAdd = () => {
    if (!dayId) return;
    onAdd(dayId, {
      id: uuidv4(),
      type: "hotel",
      label: hotel?.name || "Hotel",
      vendorId: hotel?._id || hotel?.id,
      vendorName: hotel?.name,
      rate: total,
      quantity: 1,
      nights,
      unit: "stay",
      details: { roomType, mealPlan, rooms, nights, checkIn, ratePerRoom, extraMattress, extraAdult, extraChild },
    });
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px] border-slate-200 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600"><Building2 className="w-5 h-5" /></div>
            <div>
              <DialogTitle className="text-sm font-bold text-slate-800">{hotel?.name || "Hotel"}</DialogTitle>
              <p className="text-[10px] text-slate-500">{hotel?.city?.name || hotel?.cityName} · {hotel?.category || "Standard"}</p>
            </div>
          </div>
        </DialogHeader>
        {hotel && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Room Type</Label>
                <Select value={roomType} onValueChange={setRoomType}>
                  <SelectTrigger className="h-9 text-sm rounded-xl border-slate-200">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {(hotel.roomTypes || ["Standard", "Deluxe", "Suite"]).map((r: string) => (
                      <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Meal Plan</Label>
                <Select value={mealPlan} onValueChange={setMealPlan}>
                  <SelectTrigger className="h-9 text-sm rounded-xl border-slate-200">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {(hotel.mealPlans || ["CP", "MAP", "AP", "EP"]).map((m: string) => (
                      <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Rooms</Label>
                <Input type="number" min="1" value={rooms} onChange={e => setRooms(Math.max(1, Number(e.target.value)))} className="h-9 text-sm rounded-xl border-slate-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Nights</Label>
                <Input type="number" min="1" value={nights} onChange={e => setNights(Math.max(1, Number(e.target.value)))} className="h-9 text-sm rounded-xl border-slate-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Check-in</Label>
                <Input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="h-9 text-sm rounded-xl border-slate-200" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[9px] font-bold uppercase text-slate-400">Extra Mattress</Label>
                <Input type="number" min="0" value={extraMattress} onChange={e => setExtraMattress(Math.max(0, Number(e.target.value)))} className="h-8 text-xs rounded-lg border-slate-200" />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-bold uppercase text-slate-400">Extra Adult</Label>
                <Input type="number" min="0" value={extraAdult} onChange={e => setExtraAdult(Math.max(0, Number(e.target.value)))} className="h-8 text-xs rounded-lg border-slate-200" />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-bold uppercase text-slate-400">Extra Child</Label>
                <Input type="number" min="0" value={extraChild} onChange={e => setExtraChild(Math.max(0, Number(e.target.value)))} className="h-8 text-xs rounded-lg border-slate-200" />
              </div>
            </div>

            <div className="bg-violet-50 rounded-xl p-4">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-slate-600"><span>Room rate</span><span>₹{ratePerRoom} × {rooms} room{rooms > 1 ? 's' : ''} × {nights} night{nights > 1 ? 's' : ''}</span></div>
                <div className="flex justify-between font-bold text-slate-800"><span>Subtotal</span><span>₹{totalRate.toLocaleString("en-IN")}</span></div>
                {extraCost > 0 && <div className="flex justify-between text-slate-600"><span>Extras</span><span>₹{extraCost}</span></div>}
                <div className="flex justify-between text-lg font-bold text-violet-700 pt-1 border-t border-violet-200">
                  <span>Total</span>
                  <span>₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <DaySelector days={pkgDays} selectedDayId={dayId} onSelect={setDayId} />

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={onClose} className="rounded-xl text-xs font-bold">Cancel</Button>
              <Button onClick={handleAdd} className="rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add to Day {pkgDays.find(d => d.id === dayId)?.dayNumber || ""}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Vehicle Rate Modal ──
function VehicleRateModal({
  open, onClose, vehicle, onAdd, pkgDays, defaultDayId,
}: {
  open: boolean; onClose: () => void; vehicle: any; onAdd: (dayId: string, item: ItineraryItem) => void;
  pkgDays: ItineraryDay[]; defaultDayId: string | null;
}) {
  const [priceType, setPriceType] = useState("per_day");
  const [days, setDays] = useState(1);
  const [distance, setDistance] = useState(0);
  const [driverAllowance, setDriverAllowance] = useState(0);
  const [includeFuel, setIncludeFuel] = useState(true);
  const [includeToll, setIncludeToll] = useState(true);
  const [dayId, setDayId] = useState(defaultDayId || (pkgDays[0]?.id || ""));

  const baseRate = vehicle?.baseRate || vehicle?.basePrice || 0;
  const routeRate = vehicle?.routeRate || baseRate;
  const perKmRate = vehicle?.perKmRate || baseRate;

  let rate = 0;
  let unit = "day";
  if (priceType === "per_day") { rate = baseRate * days; unit = days > 1 ? `${days} days` : "1 day"; }
  else if (priceType === "per_km") { rate = perKmRate * distance; unit = `${distance} km`; }
  else if (priceType === "fixed_route") { rate = routeRate; unit = "route"; }

  const total = rate + driverAllowance;

  const handleAdd = () => {
    if (!dayId) return;
    onAdd(dayId, {
      id: uuidv4(),
      type: "vehicle",
      label: vehicle?.name || "Vehicle",
      vendorId: vehicle?._id || vehicle?.id,
      vendorName: vehicle?.name,
      rate: total,
      quantity: 1,
      unit,
      details: { priceType, days, distance, driverAllowance, includeFuel, includeToll, baseRate, routeRate, perKmRate },
    });
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px] border-slate-200 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600"><Car className="w-5 h-5" /></div>
            <div>
              <DialogTitle className="text-sm font-bold text-slate-800">{vehicle?.name || "Vehicle"}</DialogTitle>
              <p className="text-[10px] text-slate-500">{vehicle?.seats} seats {vehicle?.isAc ? "· AC" : "· Non-AC"}</p>
            </div>
          </div>
        </DialogHeader>
        {vehicle && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Price Type</Label>
              <div className="flex gap-2">
                {[
                  { id: "per_day", label: "Per Day" },
                  { id: "fixed_route", label: "Fixed Route" },
                  { id: "per_km", label: "Per Km" },
                ].map(pt => (
                  <Button
                    key={pt.id}
                    variant={priceType === pt.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPriceType(pt.id)}
                    className={`h-8 text-[10px] font-bold rounded-lg flex-1 ${priceType === pt.id ? 'bg-amber-600 hover:bg-amber-700' : 'border-slate-200'}`}
                  >
                    {pt.label}
                  </Button>
                ))}
              </div>
            </div>

            {priceType === "per_day" && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Number of Days</Label>
                <Input type="number" min="1" value={days} onChange={e => setDays(Math.max(1, Number(e.target.value)))} className="h-9 text-sm rounded-xl border-slate-200" />
              </div>
            )}

            {priceType === "per_km" && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Distance (km)</Label>
                <Input type="number" min="0" value={distance} onChange={e => setDistance(Math.max(0, Number(e.target.value)))} className="h-9 text-sm rounded-xl border-slate-200" />
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={includeFuel} onCheckedChange={setIncludeFuel} className="scale-75" />
                <span className="text-[10px] font-medium text-slate-600">Fuel Included</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={includeToll} onCheckedChange={setIncludeToll} className="scale-75" />
                <span className="text-[10px] font-medium text-slate-600">Toll Included</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Driver Allowance</Label>
              <Input type="number" min="0" value={driverAllowance} onChange={e => setDriverAllowance(Math.max(0, Number(e.target.value)))} className="h-9 text-sm rounded-xl border-slate-200" />
            </div>

            <div className="bg-amber-50 rounded-xl p-4">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Base rate</span>
                  <span>₹{priceType === "per_day" ? baseRate : priceType === "per_km" ? perKmRate : routeRate} / {priceType === "per_day" ? "day" : priceType === "per_km" ? "km" : "route"}</span>
                </div>
                {driverAllowance > 0 && <div className="flex justify-between text-slate-600"><span>Driver allowance</span><span>₹{driverAllowance}</span></div>}
                <div className="flex justify-between text-lg font-bold text-amber-700 pt-1 border-t border-amber-200">
                  <span>Total</span>
                  <span>₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <DaySelector days={pkgDays} selectedDayId={dayId} onSelect={setDayId} />

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={onClose} className="rounded-xl text-xs font-bold">Cancel</Button>
              <Button onClick={handleAdd} className="rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add to Day
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Activity Rate Modal ──
function ActivityRateModal({
  open, onClose, activity, onAdd, pkgDays, defaultDayId,
}: {
  open: boolean; onClose: () => void; activity: any; onAdd: (dayId: string, item: ItineraryItem) => void;
  pkgDays: ItineraryDay[]; defaultDayId: string | null;
}) {
  const [numAdults, setNumAdults] = useState(1);
  const [numChildren, setNumChildren] = useState(0);
  const [dayId, setDayId] = useState(defaultDayId || (pkgDays[0]?.id || ""));

  const adultRate = activity?.adultRate || activity?.rate || 0;
  const childRate = activity?.childRate || 0;
  const total = adultRate * numAdults + childRate * numChildren;

  const handleAdd = () => {
    if (!dayId) return;
    onAdd(dayId, {
      id: uuidv4(),
      type: "activity",
      label: activity?.name || "Activity",
      vendorId: activity?._id || activity?.id,
      vendorName: activity?.name,
      rate: total,
      quantity: 1,
      unit: "pax",
      details: { adultRate, childRate, numAdults, numChildren, city: activity?.city?.name || activity?.cityName },
    });
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[420px] border-slate-200 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><Activity className="w-5 h-5" /></div>
            <div>
              <DialogTitle className="text-sm font-bold text-slate-800">{activity?.name || "Activity"}</DialogTitle>
              <p className="text-[10px] text-slate-500">{activity?.city?.name || activity?.cityName || ""}</p>
            </div>
          </div>
        </DialogHeader>
        {activity && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-[9px] font-bold uppercase text-slate-400">Adult Rate</p>
                <p className="text-lg font-bold text-emerald-700">₹{adultRate}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold uppercase text-slate-400">Child Rate</p>
                <p className="text-lg font-bold text-emerald-700">₹{childRate}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Adults</Label>
                <Input type="number" min="0" value={numAdults} onChange={e => setNumAdults(Math.max(0, Number(e.target.value)))} className="h-9 text-sm rounded-xl border-slate-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Children</Label>
                <Input type="number" min="0" value={numChildren} onChange={e => setNumChildren(Math.max(0, Number(e.target.value)))} className="h-9 text-sm rounded-xl border-slate-200" />
              </div>
            </div>

            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <span className="text-sm font-medium text-slate-600">Total: </span>
              <span className="text-xl font-bold text-emerald-700">₹{total.toLocaleString("en-IN")}</span>
            </div>

            <DaySelector days={pkgDays} selectedDayId={dayId} onSelect={setDayId} />

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={onClose} className="rounded-xl text-xs font-bold">Cancel</Button>
              <Button onClick={handleAdd} className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add to Day
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Transfer Rate Modal ──
function TransferRateModal({
  open, onClose, transfer, onAdd, pkgDays, defaultDayId,
}: {
  open: boolean; onClose: () => void; transfer: any; onAdd: (dayId: string, item: ItineraryItem) => void;
  pkgDays: ItineraryDay[]; defaultDayId: string | null;
}) {
  const [isFixedRate, setIsFixedRate] = useState(true);
  const [distance, setDistance] = useState(transfer?.distance || 0);
  const [dayId, setDayId] = useState(defaultDayId || (pkgDays[0]?.id || ""));

  const fixedRate = transfer?.rate || transfer?.baseRate || 0;
  const perKmRate = transfer?.perKmRate || 0;
  const total = isFixedRate ? fixedRate : perKmRate * distance;

  const handleAdd = () => {
    if (!dayId) return;
    onAdd(dayId, {
      id: uuidv4(),
      type: "transfer",
      label: `${transfer?.fromCity?.name || transfer?.fromCityName || "?"} → ${transfer?.toCity?.name || transfer?.toCityName || "?"}`,
      vendorId: transfer?._id || transfer?.id,
      vendorName: "",
      rate: total,
      quantity: 1,
      unit: isFixedRate ? "trip" : "km",
      details: {
        from: transfer?.fromCity?.name || transfer?.fromCityName,
        to: transfer?.toCity?.name || transfer?.toCityName,
        distance: transfer?.distance,
        travelTime: transfer?.travelTime,
        isFixedRate,
        fixedRate,
        perKmRate,
        calcDistance: distance,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[420px] border-slate-200 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><Bus className="w-5 h-5" /></div>
            <div>
              <DialogTitle className="text-sm font-bold text-slate-800">
                {transfer?.fromCity?.name || transfer?.fromCityName || "?"} → {transfer?.toCity?.name || transfer?.toCityName || "?"}
              </DialogTitle>
              <p className="text-[10px] text-slate-500">{transfer?.distance ? `${transfer.distance} km` : ""}{transfer?.travelTime ? ` · ${transfer.travelTime}` : ""}</p>
            </div>
          </div>
        </DialogHeader>
        {transfer && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={isFixedRate ? "default" : "outline"}
                size="sm"
                onClick={() => setIsFixedRate(true)}
                className={`h-8 text-[10px] font-bold rounded-lg flex-1 ${isFixedRate ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-200'}`}
              >
                Fixed Rate: ₹{fixedRate}
              </Button>
              <Button
                variant={!isFixedRate ? "default" : "outline"}
                size="sm"
                onClick={() => setIsFixedRate(false)}
                className={`h-8 text-[10px] font-bold rounded-lg flex-1 ${!isFixedRate ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-200'}`}
              >
                Per Km: ₹{perKmRate}
              </Button>
            </div>

            {!isFixedRate && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Distance (km)</Label>
                <Input type="number" min="0" value={distance} onChange={e => setDistance(Math.max(0, Number(e.target.value)))} className="h-9 text-sm rounded-xl border-slate-200" />
              </div>
            )}

            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <span className="text-sm font-medium text-slate-600">Total: </span>
              <span className="text-xl font-bold text-blue-700">₹{total.toLocaleString("en-IN")}</span>
            </div>

            <DaySelector days={pkgDays} selectedDayId={dayId} onSelect={setDayId} />

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={onClose} className="rounded-xl text-xs font-bold">Cancel</Button>
              <Button onClick={handleAdd} className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add to Day
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Meal Rate Modal ──
function MealRateModal({
  open, onClose, meal, onAdd, pkgDays, defaultDayId,
}: {
  open: boolean; onClose: () => void; meal: any; onAdd: (dayId: string, item: ItineraryItem) => void;
  pkgDays: ItineraryDay[]; defaultDayId: string | null;
}) {
  const [pax, setPax] = useState(1);
  const [mealType, setMealType] = useState(meal?.type || "Breakfast");
  const [dayId, setDayId] = useState(defaultDayId || (pkgDays[0]?.id || ""));

  const rate = meal?.rate || meal?.price || 0;
  const total = rate * pax;

  const handleAdd = () => {
    if (!dayId) return;
    onAdd(dayId, {
      id: uuidv4(),
      type: "meal",
      label: meal?.name || `${mealType} Meal`,
      vendorId: meal?._id || meal?.id,
      vendorName: meal?.name,
      rate: total,
      quantity: 1,
      unit: "pax",
      details: { mealPlan: meal?.name || mealType, rate, pax },
    });
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[400px] border-slate-200 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600"><Coffee className="w-5 h-5" /></div>
            <div>
              <DialogTitle className="text-sm font-bold text-slate-800">{meal?.name || "Meal Plan"}</DialogTitle>
              <p className="text-[10px] text-slate-500">{meal?.description || ""}</p>
            </div>
          </div>
        </DialogHeader>
        {meal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Meal Type</Label>
                <Select value={mealType} onValueChange={setMealType}>
                  <SelectTrigger className="h-9 text-sm rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {["Breakfast", "Lunch", "Dinner", "Snacks", "All Meals"].map(m => (
                      <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Number of Pax</Label>
                <Input type="number" min="1" value={pax} onChange={e => setPax(Math.max(1, Number(e.target.value)))} className="h-9 text-sm rounded-xl border-slate-200" />
              </div>
            </div>

            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <span className="text-sm font-medium text-slate-600">Total: </span>
              <span className="text-xl font-bold text-orange-700">₹{total.toLocaleString("en-IN")}</span>
            </div>

            <DaySelector days={pkgDays} selectedDayId={dayId} onSelect={setDayId} />

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={onClose} className="rounded-xl text-xs font-bold">Cancel</Button>
              <Button onClick={handleAdd} className="rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add to Day
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Custom Rate Modal (Guide, Train/Flight, Addon) ──
function CustomRateModal({
  open, onClose, title, icon, rateLabel, quantityLabel, defaultUnit, itemType, showDescription, descriptionLabel,
  onAdd, pkgDays, defaultDayId,
}: {
  open: boolean; onClose: () => void; title: string; icon: React.ReactNode;
  rateLabel: string; quantityLabel: string; defaultUnit: string; itemType: ItineraryItem["type"];
  showDescription?: boolean; descriptionLabel?: string;
  onAdd: (dayId: string, item: ItineraryItem) => void;
  pkgDays: ItineraryDay[]; defaultDayId: string | null;
}) {
  const [rate, setRate] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState("");
  const [dayId, setDayId] = useState(defaultDayId || (pkgDays[0]?.id || ""));

  const total = rate * quantity;

  const handleAdd = () => {
    if (!dayId) return;
    onAdd(dayId, {
      id: uuidv4(),
      type: itemType,
      label: title,
      rate: total,
      quantity: 1,
      unit: defaultUnit,
      description: showDescription ? description : undefined,
      details: { rate, quantity, description },
    });
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[400px] border-slate-200 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <>{icon}</>
            <DialogTitle className="text-sm font-bold text-slate-800">{title}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500">{rateLabel}</Label>
              <Input type="number" min="0" value={rate} onChange={e => setRate(Math.max(0, Number(e.target.value)))} className="h-9 text-sm rounded-xl border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500">{quantityLabel}</Label>
              <Input type="number" min="1" value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))} className="h-9 text-sm rounded-xl border-slate-200" />
            </div>
          </div>

          {showDescription && (
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500">{descriptionLabel || "Description"}</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional notes" className="h-9 text-sm rounded-xl border-slate-200" />
            </div>
          )}

          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <span className="text-sm font-medium text-slate-600">Total: </span>
            <span className="text-xl font-bold text-slate-800">₹{total.toLocaleString("en-IN")}</span>
          </div>

          <DaySelector days={pkgDays} selectedDayId={dayId} onSelect={setDayId} />

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose} className="rounded-xl text-xs font-bold">Cancel</Button>
            <Button onClick={handleAdd} className="rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add to Day
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════
// Quote Preview Modal
// ══════════════════════════════════════════════════════════════

function QuotePreviewModal({
  open, onClose, pkg, costSummary,
}: {
  open: boolean; onClose: () => void; pkg: PackageState; costSummary: any;
}) {
  const sendWhatsApp = () => {
    const phone = pkg.customer.customerPhone.replace(/\D/g, "");
    if (!phone) { toast.error("No customer phone"); return; }
    const msg = encodeURIComponent(`Hello ${pkg.customer.customerName}, here is your quote for ${pkg.customer.packageName}. Total: ₹${costSummary.total.toLocaleString("en-IN")}.`);
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const sendEmail = () => {
    if (!pkg.customer.customerEmail) { toast.error("No customer email"); return; }
    const sub = encodeURIComponent(`Quote: ${pkg.customer.packageName}`);
    const body = encodeURIComponent(`Dear ${pkg.customer.customerName},\n\nPlease find your quote attached.\n\nTotal: ₹${costSummary.total.toLocaleString("en-IN")}\n\nRegards,\nYouthCamping Team`);
    window.open(`mailto:${pkg.customer.customerEmail}?subject=${sub}&body=${body}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] border-slate-200 rounded-2xl p-0 overflow-hidden">
        <ScrollArea className="max-h-[85vh]">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-violet-700 tracking-tight">YOUTHCAMPING</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Travel Quote</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-700">{pkg.customer.packageName}</p>
                <p className="text-[9px] text-slate-400">#{pkg.id?.slice(-6).toUpperCase() || "DRAFT"}</p>
              </div>
            </div>

            <Separator />

            {/* Customer & Trip */}
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="space-y-1">
                <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Customer</p>
                <p className="font-bold text-slate-800">{pkg.customer.customerName}</p>
                <p className="text-xs text-slate-500">{pkg.customer.customerPhone}{pkg.customer.customerEmail ? ` · ${pkg.customer.customerEmail}` : ""}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Trip Details</p>
                <p className="font-bold text-slate-800">{pkg.customer.totalDays} Days / {pkg.customer.totalNights} Nights</p>
                <p className="text-xs text-slate-500">{pkg.customer.travelStartDate} → {pkg.customer.travelEndDate}</p>
                <p className="text-xs text-slate-500">{pkg.customer.adults} Adults, {pkg.customer.children} Children, {pkg.customer.couples} Couples · {pkg.customer.rooms} Rooms</p>
              </div>
            </div>

            <Separator />

            {/* Day-wise Itinerary */}
            <div>
              <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider mb-3">Itinerary</p>
              <div className="space-y-3">
                {pkg.days.map(day => (
                  <div key={day.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-3 py-2 flex items-center gap-2 border-b border-slate-200">
                      <Calendar className="w-3.5 h-3.5 text-violet-600" />
                      <span className="text-xs font-bold text-slate-700">Day {day.dayNumber}</span>
                      {day.date && <span className="text-[10px] text-slate-500">{new Date(day.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>}
                      {day.stayCity && <Badge variant="secondary" className="text-[9px] rounded-md bg-slate-100">{day.stayCity}</Badge>}
                    </div>
                    {day.items.length > 0 && (
                      <div className="px-3 py-2 space-y-1">
                        {day.items.map(item => (
                          <div key={item.id} className="flex justify-between text-[11px]">
                            <span className="text-slate-600">
                              {item.type === "hotel" && `🏨 ${item.label}${item.details?.roomType ? ` (${item.details.roomType})` : ""}${item.nights ? ` - ${item.nights} night${item.nights > 1 ? 's' : ''}` : ""}`}
                              {item.type === "vehicle" && `🚗 ${item.label}${item.details?.days ? ` - ${item.details.days} day${item.details.days > 1 ? 's' : ''}` : ""}`}
                              {item.type === "transfer" && `🔄 ${item.label}`}
                              {item.type === "activity" && `🎯 ${item.label}`}
                              {item.type === "meal" && `🍽️ ${item.label}`}
                              {item.type === "guide" && `👤 ${item.label}`}
                              {item.type === "train_flight" && `🚄 ${item.description || item.label}`}
                              {item.type === "addon" && `📦 ${item.description || item.label}`}
                            </span>
                            <span className="font-bold text-slate-700">₹{item.rate.toLocaleString("en-IN")}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Pricing */}
            <div>
              <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider mb-3">Pricing Breakdown</p>
              <div className="space-y-1.5 text-sm">
                {[
                  { label: "Hotels", key: "hotel" },
                  { label: "Vehicles", key: "vehicle" },
                  { label: "Transfers", key: "transfer" },
                  { label: "Activities", key: "activity" },
                  { label: "Meals", key: "meal" },
                  { label: "Guides", key: "guide" },
                  { label: "Train/Flight", key: "train_flight" },
                  { label: "Add-ons", key: "addon" },
                ].filter(r => costSummary.catTotals[r.key] > 0).map(r => (
                  <div key={r.key} className="flex justify-between text-slate-600">
                    <span>{r.label}</span>
                    <span>₹{costSummary.catTotals[r.key].toLocaleString("en-IN")}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Subtotal</span>
                  <span>₹{costSummary.subtotal.toLocaleString("en-IN")}</span>
                </div>
                {pkg.discountPercent > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Discount ({pkg.discountPercent}%)</span>
                    <span>-₹{costSummary.discountAmt.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-amber-600">
                  <span>GST ({pkg.gstPercent}%)</span>
                  <span>+₹{costSummary.gstAmt.toLocaleString("en-IN")}</span>
                </div>
                {pkg.serviceCharge > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Service Charge</span>
                    <span>+₹{pkg.serviceCharge.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-black text-violet-700">
                  <span>Total</span>
                  <span>₹{costSummary.total.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Per Adult</span>
                  <span className="font-bold">₹{costSummary.perAdult.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Per Child</span>
                  <span className="font-bold">₹{costSummary.perChild.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Terms */}
            <div className="text-[10px] text-slate-500 space-y-1">
              <p className="font-bold text-slate-700 uppercase text-[9px] tracking-wider">Terms & Conditions</p>
              <p>• This quote is valid for 7 days from date of issue.</p>
              <p>• 50% advance required to confirm the booking.</p>
              <p>• Cancellation charges apply as per company policy.</p>
              <p>• Rates are subject to change based on availability.</p>
              {pkg.customer.specialNotes && <p className="mt-2">• Notes: {pkg.customer.specialNotes}</p>}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button onClick={sendWhatsApp} className="h-10 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 gap-2">
                <MessageSquare className="w-4 h-4" /> Send by WhatsApp
              </Button>
              <Button onClick={sendEmail} variant="outline" className="h-10 text-xs font-bold rounded-xl border-slate-200 gap-2">
                <Mail className="w-4 h-4" /> Send by Email
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
