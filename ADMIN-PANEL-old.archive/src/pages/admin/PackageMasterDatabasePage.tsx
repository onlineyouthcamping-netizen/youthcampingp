import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Search, Filter, Building2, Hotel, Bus,
  Route, Activity, UtensilsCrossed, Store, LayoutDashboard, Loader2,
  ChevronLeft, ChevronRight, MapPin, Star, Clock, Users, Phone, Mail,
  Map as MapIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import {
  Pagination, PaginationContent, PaginationItem, PaginationPrevious,
  PaginationNext, PaginationLink, PaginationEllipsis,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { packageBuilderService } from "@/services/packageBuilder.service";

/* ── Types ── */
interface StateType {
  id: string;
  name: string;
  isActive: boolean;
  _count?: { cities: number };
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

interface CityType {
  id: string;
  name: string;
  stateId: string;
  state?: { id: string; name: string };
  isActive: boolean;
  _count?: { hotels: number; vehicles: number; activities: number };
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

interface HotelType {
  id: string;
  name: string;
  cityId: string;
  city?: { id: string; name: string; state?: { id: string; name: string } };
  category: string;
  roomType: string;
  maxPeoplePerRoom: number;
  mealPlan: string;
  basePrice: number;
  weekendPrice: number;
  peakSeasonPrice?: number;
  extraMattressPrice?: number;
  extraAdultPrice?: number;
  childWithBedPrice?: number;
  childWithoutBedPrice?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  tariffs?: HotelTariffType[];
}

interface HotelTariffType {
  id: string;
  hotelId: string;
  startDate: string;
  endDate: string;
  roomRate: number;
  label?: string;
}

interface VehicleType {
  id: string;
  name: string;
  cityId: string;
  city?: { id: string; name: string };
  seatingCapacity: number;
  isAc: boolean;
  image?: string;
  vendorId?: string;
  vendor?: { id: string; name: string };
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  tariffs?: VehicleTariffType[];
}

interface VehicleTariffType {
  id: string;
  vehicleId: string;
  priceType: string;
  perDayRate?: number;
  perKmRate?: number;
  fixedRouteRate?: number;
  minKmPerDay?: number;
  driverAllowance?: number;
  fuelIncluded?: boolean;
  tollParkingIncluded?: boolean;
}

interface TransferRouteType {
  id: string;
  fromCityId: string;
  toCityId: string;
  fromCity?: { id: string; name: string };
  toCity?: { id: string; name: string };
  distanceKm: number;
  travelTimeMins: number;
  suggestedVehicle?: string;
  fixedRate: number;
  perKmRate: number;
  pickupDropNotes?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

interface ActivityType {
  id: string;
  name: string;
  cityId: string;
  city?: { id: string; name: string };
  adultRate: number;
  childRate: number;
  isShared: boolean;
  duration: string;
  description?: string;
  includedItems?: string;
  excludedItems?: string;
  image?: string;
  vendorId?: string;
  vendor?: { id: string; name: string };
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

interface MealPlanType {
  id: string;
  name: string;
  breakfastCost: number;
  lunchCost: number;
  dinnerCost: number;
  perPersonPerDay: number;
  vendorId?: string;
  vendor?: { id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

interface VendorType {
  id: string;
  name: string;
  type: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  location?: string;
  gstNumber?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

interface DashboardStats {
  totalStates: number;
  totalCities: number;
  totalHotels: number;
  totalVehicles: number;
  totalActivities: number;
  totalTransfers: number;
  totalVendors: number;
}

/* ── Constants ── */
const HOTEL_CATEGORIES = ["Budget", "Standard", "Deluxe", "Premium", "Luxury"];
const ROOM_TYPES = ["Standard", "Deluxe", "Super Deluxe", "Premium", "Suite"];
const MEAL_PLANS = ["EP", "CP", "MAP", "AP"];
const VENDOR_TYPES = ["HOTEL", "VEHICLE", "ACTIVITY", "MEALS", "GUIDE", "OTHER"];
const LIMIT = 10;

/* ── Helpers ── */
function formatDate(d?: string) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(n: number) {
  return "\u20B9" + n.toLocaleString("en-IN");
}

/* ── Component ── */
export default function PackageMasterDatabasePage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStates: 0, totalCities: 0, totalHotels: 0,
    totalVehicles: 0, totalActivities: 0, totalTransfers: 0, totalVendors: 0,
  });
  const [activeTab, setActiveTab] = useState("states");

  /* ── Sub-component: States ── */
  const [states, setStates] = useState<StateType[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [statesPage, setStatesPage] = useState(1);
  const [statesTotal, setStatesTotal] = useState(0);
  const [statesSearch, setStatesSearch] = useState("");
  const [stateModal, setStateModal] = useState(false);
  const [stateEdit, setStateEdit] = useState<StateType | null>(null);
  const [stateForm, setStateForm] = useState({ name: "", isActive: true });
  const [stateSubmitting, setStateSubmitting] = useState(false);

  /* ── Sub-component: Cities ── */
  const [cities, setCities] = useState<CityType[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesPage, setCitiesPage] = useState(1);
  const [citiesTotal, setCitiesTotal] = useState(0);
  const [citiesSearch, setCitiesSearch] = useState("");
  const [citiesStateFilter, setCitiesStateFilter] = useState("");
  const [cityModal, setCityModal] = useState(false);
  const [cityEdit, setCityEdit] = useState<CityType | null>(null);
  const [cityForm, setCityForm] = useState({ name: "", stateId: "", isActive: true });
  const [citySubmitting, setCitySubmitting] = useState(false);

  /* ── Sub-component: Hotels ── */
  const [hotels, setHotels] = useState<HotelType[]>([]);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  const [hotelsPage, setHotelsPage] = useState(1);
  const [hotelsTotal, setHotelsTotal] = useState(0);
  const [hotelsSearch, setHotelsSearch] = useState("");
  const [hotelsStateFilter, setHotelsStateFilter] = useState("");
  const [hotelsCityFilter, setHotelsCityFilter] = useState("");
  const [hotelsCategoryFilter, setHotelsCategoryFilter] = useState("");
  const [hotelsStatusFilter, setHotelsStatusFilter] = useState("");
  const [hotelModal, setHotelModal] = useState(false);
  const [hotelEdit, setHotelEdit] = useState<HotelType | null>(null);
  const [hotelForm, setHotelForm] = useState({
    name: "", cityId: "", category: "Standard", roomType: "Standard",
    maxPeoplePerRoom: 2, mealPlan: "EP", basePrice: 0, weekendPrice: 0,
    peakSeasonPrice: 0, extraMattressPrice: 0, extraAdultPrice: 0,
    childWithBedPrice: 0, childWithoutBedPrice: 0, isActive: true,
  });
  const [hotelSubmitting, setHotelSubmitting] = useState(false);

  /* ── Hotel Tariffs ── */
  const [tariffModal, setTariffModal] = useState(false);
  const [tariffHotelId, setTariffHotelId] = useState("");
  const [tariffHotelName, setTariffHotelName] = useState("");
  const [tariffs, setTariffs] = useState<HotelTariffType[]>([]);
  const [tariffForm, setTariffForm] = useState({ startDate: "", endDate: "", roomRate: 0, label: "" });
  const [tariffSubmitting, setTariffSubmitting] = useState(false);
  const [tariffLoading, setTariffLoading] = useState(false);

  /* ── Sub-component: Vehicles ── */
  const [vehicles, setVehicles] = useState<VehicleType[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [vehiclesPage, setVehiclesPage] = useState(1);
  const [vehiclesTotal, setVehiclesTotal] = useState(0);
  const [vehiclesSearch, setVehiclesSearch] = useState("");
  const [vehiclesCityFilter, setVehiclesCityFilter] = useState("");
  const [vehiclesAcFilter, setVehiclesAcFilter] = useState("");
  const [vehicleModal, setVehicleModal] = useState(false);
  const [vehicleEdit, setVehicleEdit] = useState<VehicleType | null>(null);
  const [vehicleForm, setVehicleForm] = useState({
    name: "", cityId: "", seatingCapacity: 4, isAc: true, image: "",
    vendorId: "", isActive: true,
  });
  const [vehicleSubmitting, setVehicleSubmitting] = useState(false);

  /* ── Vehicle Tariffs ── */
  const [vehicleTariffModal, setVehicleTariffModal] = useState(false);
  const [vehicleTariffVehicleId, setVehicleTariffVehicleId] = useState("");
  const [vehicleTariffVehicleName, setVehicleTariffVehicleName] = useState("");
  const [vehicleTariffs, setVehicleTariffs] = useState<VehicleTariffType[]>([]);
  const [vehicleTariffForm, setVehicleTariffForm] = useState({
    priceType: "PER_DAY", perDayRate: 0, perKmRate: 0, fixedRouteRate: 0,
    minKmPerDay: 0, driverAllowance: 0, fuelIncluded: true, tollParkingIncluded: true,
  });
  const [vehicleTariffSubmitting, setVehicleTariffSubmitting] = useState(false);
  const [vehicleTariffLoading, setVehicleTariffLoading] = useState(false);

  /* ── Sub-component: Transfer Routes ── */
  const [transferRoutes, setTransferRoutes] = useState<TransferRouteType[]>([]);
  const [transferRoutesLoading, setTransferRoutesLoading] = useState(false);
  const [transferRoutesPage, setTransferRoutesPage] = useState(1);
  const [transferRoutesTotal, setTransferRoutesTotal] = useState(0);
  const [transferRoutesSearch, setTransferRoutesSearch] = useState("");
  const [transferFromFilter, setTransferFromFilter] = useState("");
  const [transferToFilter, setTransferToFilter] = useState("");
  const [transferModal, setTransferModal] = useState(false);
  const [transferEdit, setTransferEdit] = useState<TransferRouteType | null>(null);
  const [transferForm, setTransferForm] = useState({
    fromCityId: "", toCityId: "", distanceKm: 0, travelTimeMins: 60,
    suggestedVehicle: "", fixedRate: 0, perKmRate: 0, pickupDropNotes: "", isActive: true,
  });
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  /* ── Sub-component: Activities ── */
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [activitiesTotal, setActivitiesTotal] = useState(0);
  const [activitiesSearch, setActivitiesSearch] = useState("");
  const [activitiesCityFilter, setActivitiesCityFilter] = useState("");
  const [activitiesStatusFilter, setActivitiesStatusFilter] = useState("");
  const [activityModal, setActivityModal] = useState(false);
  const [activityEdit, setActivityEdit] = useState<ActivityType | null>(null);
  const [activityForm, setActivityForm] = useState({
    name: "", cityId: "", adultRate: 0, childRate: 0, isShared: true,
    duration: "", description: "", includedItems: "", excludedItems: "",
    image: "", vendorId: "", isActive: true,
  });
  const [activitySubmitting, setActivitySubmitting] = useState(false);

  /* ── Sub-component: Meal Plans ── */
  const [mealPlans, setMealPlans] = useState<MealPlanType[]>([]);
  const [mealPlansLoading, setMealPlansLoading] = useState(false);
  const [mealPlansPage, setMealPlansPage] = useState(1);
  const [mealPlansTotal, setMealPlansTotal] = useState(0);
  const [mealPlansSearch, setMealPlansSearch] = useState("");
  const [mealPlanModal, setMealPlanModal] = useState(false);
  const [mealPlanEdit, setMealPlanEdit] = useState<MealPlanType | null>(null);
  const [mealPlanForm, setMealPlanForm] = useState({
    name: "", breakfastCost: 0, lunchCost: 0, dinnerCost: 0, perPersonPerDay: 0, vendorId: "",
  });
  const [mealPlanSubmitting, setMealPlanSubmitting] = useState(false);

  /* ── Sub-component: Vendors ── */
  const [vendors, setVendors] = useState<VendorType[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorsPage, setVendorsPage] = useState(1);
  const [vendorsTotal, setVendorsTotal] = useState(0);
  const [vendorsSearch, setVendorsSearch] = useState("");
  const [vendorsTypeFilter, setVendorsTypeFilter] = useState("");
  const [vendorModal, setVendorModal] = useState(false);
  const [vendorEdit, setVendorEdit] = useState<VendorType | null>(null);
  const [vendorForm, setVendorForm] = useState({
    name: "", type: "HOTEL", contactPerson: "", email: "", phone: "",
    location: "", gstNumber: "", isActive: true,
  });
  const [vendorSubmitting, setVendorSubmitting] = useState(false);

  /* ── Load dashboard stats ── */
  const loadStats = useCallback(async () => {
    try {
      const res = await packageBuilderService.getMasterDashboardStats();
      if (res?.success && res?.data) {
        setStats(res.data);
      }
    } catch {
      // non-critical
    }
  }, []);

  /* ── Load functions ── */
  const loadStates = useCallback(async (page = statesPage, search = statesSearch) => {
    setStatesLoading(true);
    try {
      const res = await packageBuilderService.getStates({ page, limit: LIMIT, search: search || undefined });
      if (res?.success) {
        setStates(res.data || []);
        setStatesTotal(res.total || 0);
      }
    } catch { toast.error("Failed to load states"); } finally { setStatesLoading(false); }
  }, [statesPage, statesSearch]);

  const loadCities = useCallback(async (page = citiesPage, search = citiesSearch, stateId = citiesStateFilter) => {
    setCitiesLoading(true);
    try {
      const res = await packageBuilderService.getCities({
        page, limit: LIMIT, search: search || undefined, stateId: stateId || undefined,
      });
      if (res?.success) {
        setCities(res.data || []);
        setCitiesTotal(res.total || 0);
      }
    } catch { toast.error("Failed to load cities"); } finally { setCitiesLoading(false); }
  }, [citiesPage, citiesSearch, citiesStateFilter]);
  const loadHotels = useCallback(async () => {
    setHotelsLoading(true);
    try {
      const res = await packageBuilderService.getHotels({
        page: hotelsPage, limit: LIMIT, search: hotelsSearch || undefined,
        stateId: hotelsStateFilter || undefined, cityId: hotelsCityFilter || undefined,
        category: hotelsCategoryFilter || undefined, isActive: hotelsStatusFilter === "active" ? true : hotelsStatusFilter === "inactive" ? false : undefined,
      });
      if (res?.success) {
        setHotels(res.data || []);
        setHotelsTotal(res.total || 0);
      }
    } catch { toast.error("Failed to load hotels"); } finally { setHotelsLoading(false); }
  }, [hotelsPage, hotelsSearch, hotelsStateFilter, hotelsCityFilter, hotelsCategoryFilter, hotelsStatusFilter]);

  const loadVehicles = useCallback(async () => {
    setVehiclesLoading(true);
    try {
      const res = await packageBuilderService.getVehicles({
        page: vehiclesPage, limit: LIMIT, search: vehiclesSearch || undefined,
        cityId: vehiclesCityFilter || undefined, isAc: vehiclesAcFilter === "ac" ? true : vehiclesAcFilter === "non-ac" ? false : undefined,
      });
      if (res?.success) {
        setVehicles(res.data || []);
        setVehiclesTotal(res.total || 0);
      }
    } catch { toast.error("Failed to load vehicles"); } finally { setVehiclesLoading(false); }
  }, [vehiclesPage, vehiclesSearch, vehiclesCityFilter, vehiclesAcFilter]);

  const loadTransferRoutes = useCallback(async () => {
    setTransferRoutesLoading(true);
    try {
      const res = await packageBuilderService.getTransferRoutes({
        page: transferRoutesPage, limit: LIMIT, search: transferRoutesSearch || undefined,
        fromCityId: transferFromFilter || undefined, toCityId: transferToFilter || undefined,
      });
      if (res?.success) {
        setTransferRoutes(res.data || []);
        setTransferRoutesTotal(res.total || 0);
      }
    } catch { toast.error("Failed to load transfer routes"); } finally { setTransferRoutesLoading(false); }
  }, [transferRoutesPage, transferRoutesSearch, transferFromFilter, transferToFilter]);

  const loadActivities = useCallback(async () => {
    setActivitiesLoading(true);
    try {
      const res = await packageBuilderService.getActivities({
        page: activitiesPage, limit: LIMIT, search: activitiesSearch || undefined,
        cityId: activitiesCityFilter || undefined, isActive: activitiesStatusFilter === "active" ? true : activitiesStatusFilter === "inactive" ? false : undefined,
      });
      if (res?.success) {
        setActivities(res.data || []);
        setActivitiesTotal(res.total || 0);
      }
    } catch { toast.error("Failed to load activities"); } finally { setActivitiesLoading(false); }
  }, [activitiesPage, activitiesSearch, activitiesCityFilter, activitiesStatusFilter]);

  const loadMealPlans = useCallback(async () => {
    setMealPlansLoading(true);
    try {
      const res = await packageBuilderService.getMealPlans({
        page: mealPlansPage, limit: LIMIT, search: mealPlansSearch || undefined,
      });
      if (res?.success) {
        setMealPlans(res.data || []);
        setMealPlansTotal(res.total || 0);
      }
    } catch { toast.error("Failed to load meal plans"); } finally { setMealPlansLoading(false); }
  }, [mealPlansPage, mealPlansSearch]);

  const loadVendors = useCallback(async () => {
    setVendorsLoading(true);
    try {
      const res = await packageBuilderService.getPackageVendors({
        page: vendorsPage, limit: LIMIT, search: vendorsSearch || undefined,
        type: vendorsTypeFilter || undefined,
      });
      if (res?.success) {
        setVendors(res.data || []);
        setVendorsTotal(res.total || 0);
      }
    } catch { toast.error("Failed to load vendors"); } finally { setVendorsLoading(false); }
  }, [vendorsPage, vendorsSearch, vendorsTypeFilter]);

  const loadTariffs = useCallback(async (hotelId: string) => {
    setTariffLoading(true);
    try {
      const res = await packageBuilderService.getHotelTariffs(hotelId);
      if (res?.success) {
        setTariffs(res.data || []);
      }
    } catch { toast.error("Failed to load tariffs"); } finally { setTariffLoading(false); }
  }, []);

  const loadVehicleTariffs = useCallback(async (vehicleId: string) => {
    setVehicleTariffLoading(true);
    try {
      const res = await packageBuilderService.getVehicleTariffs(vehicleId);
      if (res?.success) {
        setVehicleTariffs(res.data || []);
      }
    } catch { toast.error("Failed to load tariffs"); } finally { setVehicleTariffLoading(false); }
  }, []);

  /* ── Initial load ── */
  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadStats();
      await loadStates(1, "");
      setLoading(false);
    })();
  }, []);

  /* ── Pagination helper ── */
  function PaginationBar({ page, total, setPage }: { page: number; total: number; setPage: (p: number) => void }) {
    const totalPages = Math.ceil(total / LIMIT) || 1;
    if (totalPages <= 1) return null;
    const pages: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return (
      <div className="flex items-center justify-between pt-4">
        <p className="text-xs text-slate-500">
          Showing {((page - 1) * LIMIT) + 1}-{Math.min(page * LIMIT, total)} of {total}
        </p>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => setPage(Math.max(1, page - 1))} className={page <= 1 ? "pointer-events-none opacity-50" : ""} />
            </PaginationItem>
            {pages.map((p, i) => (
              <PaginationItem key={i}>
                {p === "..." ? <PaginationEllipsis /> : (
                  <PaginationLink isActive={p === page} onClick={() => setPage(p as number)}>
                    {p}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext onClick={() => setPage(Math.min(totalPages, page + 1))} className={page >= totalPages ? "pointer-events-none opacity-50" : ""} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  }

  /* ── KPI Cards ── */
  const kpiCards = [
    { label: "Total States", value: stats.totalStates, icon: Building2, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Total Cities", value: stats.totalCities, icon: MapPin, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Total Hotels", value: stats.totalHotels, icon: Hotel, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Total Vehicles", value: stats.totalVehicles, icon: Bus, color: "text-purple-600", bg: "bg-purple-100" },
    { label: "Total Activities", value: stats.totalActivities, icon: Activity, color: "text-rose-600", bg: "bg-rose-100" },
    { label: "Total Transfers", value: stats.totalTransfers, icon: Route, color: "text-cyan-600", bg: "bg-cyan-100" },
    { label: "Total Vendors", value: stats.totalVendors, icon: Store, color: "text-orange-600", bg: "bg-orange-100" },
  ];

  /* ── Render ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-[#F4F7FB] min-h-screen -mx-6 -my-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <LayoutDashboard className="w-5 h-5 text-[#F97316]" />
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Package Master Database</h1>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
              Manage states, cities, hotels, vehicles, transfers, activities, meal plans & vendors
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {kpiCards.map((kpi, i) => (
          <Card key={i} className="border border-slate-200 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={"w-9 h-9 rounded-md " + kpi.bg + " flex items-center justify-center"}>
                <kpi.icon className={"h-4.5 w-4.5 " + kpi.color} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{kpi.label}</p>
                <p className="text-xl font-bold text-slate-800">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-1 overflow-x-auto">
          <TabsList className="w-full h-auto bg-transparent p-0 gap-0">
            {[
              { value: "states", label: "States", icon: Building2 },
              { value: "cities", label: "Cities", icon: MapPin },
              { value: "hotels", label: "Hotels", icon: Hotel },
              { value: "vehicles", label: "Vehicles", icon: Bus },
              { value: "transfers", label: "Transfers", icon: Route },
              { value: "activities", label: "Activities", icon: Activity },
              { value: "mealplans", label: "Meal Plans", icon: UtensilsCrossed },
              { value: "vendors", label: "Vendors", icon: Store },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-1 rounded-[4px] py-2.5 text-xs font-semibold data-[state=active]:bg-[#F97316] data-[state=active]:text-white data-[state=active]:shadow-sm gap-1.5"
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {/* ══ TAB 1: STATES ══ */}
        <TabsContent value="states" className="mt-4">
          <div className="bg-white rounded-md border border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <Search className="h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search states..."
                  value={statesSearch}
                  onChange={(e) => { setStatesSearch(e.target.value); setStatesPage(1); }}
                  className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs"
                  onKeyDown={(e) => { if (e.key === "Enter") loadStates(1, statesSearch); }}
                />
              </div>
              <Button onClick={() => { setStateEdit(null); setStateForm({ name: "", isActive: true }); setStateModal(true); }}
                className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white flex items-center gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" /> Add State
              </Button>
            </div>
            <div className="p-4">
              {statesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : states.length === 0 ? (
                <div className="text-center py-16">
                  <Building2 className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">No states found</p>
                  <p className="text-xs text-slate-400 mt-1">Add your first state to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px] font-bold uppercase">Name</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Cities</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Status</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Created</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Updated At</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {states.map((s) => (
                        <TableRow key={s.id} className="hover:bg-slate-50">
                          <TableCell className="text-xs font-semibold text-slate-800">{s.name}</TableCell>
                          <TableCell className="text-xs">{s._count?.cities ?? 0}</TableCell>
                          <TableCell>
                            <Badge variant={s.isActive ? "default" : "secondary"} className="text-[10px] px-2 py-0.5">
                              {s.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">{formatDate(s.createdAt)}</TableCell>
                          <TableCell className="text-xs text-slate-500">{formatDate(s.updatedAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[4px] hover:bg-slate-100"
                                onClick={() => { setStateEdit(s); setStateForm({ name: s.name, isActive: s.isActive }); setStateModal(true); }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[4px] text-destructive hover:bg-rose-50"
                                onClick={async () => {
                                  if (!confirm("Delete state \"" + s.name + "\"?")) return;
                                  try { await packageBuilderService.deleteState(s.id); toast.success("State deleted"); loadStates(); loadStats(); }
                                  catch { toast.error("Failed to delete state"); }
                                }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <PaginationBar page={statesPage} total={statesTotal} setPage={(p) => { setStatesPage(p); loadStates(p, statesSearch); }} />
            </div>
          </div>

          {/* State Modal */}
          <Dialog open={stateModal} onOpenChange={setStateModal}>
            <DialogContent className="sm:max-w-[450px] rounded-[4px] border border-slate-200 p-5 bg-white shadow-sm">
              <DialogHeader className="border-b border-[#E2E8F0] pb-3">
                <DialogTitle className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#F97316]" />
                  {stateEdit ? "Edit State" : "Add New State"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">State Name *</Label>
                  <Input value={stateForm.name} onChange={(e) => setStateForm({ ...stateForm, name: e.target.value })}
                    placeholder="e.g. Himachal Pradesh" className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs font-medium" />
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={stateForm.isActive} onCheckedChange={(v) => setStateForm({ ...stateForm, isActive: v })} />
                  <Label className="text-xs font-medium text-slate-600">Active</Label>
                </div>
              </div>
              <DialogFooter className="pt-3 border-t border-[#E2E8F0] gap-2">
                <Button variant="outline" onClick={() => setStateModal(false)} className="rounded-[4px] text-xs font-semibold h-8.5">Cancel</Button>
                <Button onClick={async () => {
                  if (!stateForm.name.trim()) { toast.error("State name is required"); return; }
                  setStateSubmitting(true);
                  try {
                    if (stateEdit) {
                      await packageBuilderService.updateState(stateEdit.id, stateForm);
                      toast.success("State updated");
                    } else {
                      await packageBuilderService.createState(stateForm);
                      toast.success("State created");
                    }
                    setStateModal(false); loadStates(); loadStats();
                  } catch (err: any) { toast.error(err?.response?.data?.message || "Failed to save state"); }
                  finally { setStateSubmitting(false); }
                }} disabled={stateSubmitting}
                  className="rounded-[4px] font-semibold text-xs h-8.5 bg-primary-orange hover:bg-primary-orange/90 text-white">
                  {stateSubmitting ? "Saving..." : stateEdit ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        {/* ══ TAB 2: CITIES ══ */}
        <TabsContent value="cities" className="mt-4">
          <div className="bg-white rounded-md border border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search className="h-4 w-4 text-slate-400" />
                <Input placeholder="Search cities..." value={citiesSearch}
                  onChange={(e) => { setCitiesSearch(e.target.value); setCitiesPage(1); }}
                  className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs flex-1"
                  onKeyDown={(e) => { if (e.key === "Enter") loadCities(1, citiesSearch, citiesStateFilter); }} />
                <Select value={citiesStateFilter} onValueChange={(v) => { setCitiesStateFilter(v); setCitiesPage(1); }}>
                  <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs w-[140px]">
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {states.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => { setCityEdit(null); setCityForm({ name: "", stateId: states[0]?.id || "", isActive: true }); setCityModal(true); }}
                className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white flex items-center gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" /> Add City
              </Button>
            </div>
            <div className="p-4">
              {citiesLoading ? (
                <div className="space-y-3">{ [1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />) }</div>
              ) : cities.length === 0 ? (
                <div className="text-center py-16">
                  <MapPin className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">No cities found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px] font-bold uppercase">Name</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">State</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Status</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Hotels</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Vehicles</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Activities</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Updated At</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cities.map((c) => (
                        <TableRow key={c.id} className="hover:bg-slate-50">
                          <TableCell className="text-xs font-semibold text-slate-800">{c.name}</TableCell>
                          <TableCell className="text-xs text-slate-500">{c.state?.name || "-"}</TableCell>
                          <TableCell><Badge variant={c.isActive ? "default" : "secondary"} className="text-[10px] px-2 py-0.5">{c.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                          <TableCell className="text-xs">{c._count?.hotels ?? 0}</TableCell>
                          <TableCell className="text-xs">{c._count?.vehicles ?? 0}</TableCell>
                          <TableCell className="text-xs">{c._count?.activities ?? 0}</TableCell>
                          <TableCell className="text-xs text-slate-500">{formatDate(c.updatedAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[4px] hover:bg-slate-100"
                                onClick={() => { setCityEdit(c); setCityForm({ name: c.name, stateId: c.stateId, isActive: c.isActive }); setCityModal(true); }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[4px] text-destructive hover:bg-rose-50"
                                onClick={async () => {
                                  if (!confirm("Delete city \"" + c.name + "\"?")) return;
                                  try { await packageBuilderService.deleteCity(c.id); toast.success("City deleted"); loadCities(); loadStats(); }
                                  catch { toast.error("Failed to delete city"); }
                                }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <PaginationBar page={citiesPage} total={citiesTotal} setPage={(p) => { setCitiesPage(p); loadCities(p, citiesSearch, citiesStateFilter); }} />
            </div>
          </div>

          {/* City Modal */}
          <Dialog open={cityModal} onOpenChange={setCityModal}>
            <DialogContent className="sm:max-w-[450px] rounded-[4px] border border-slate-200 p-5 bg-white shadow-sm">
              <DialogHeader className="border-b border-[#E2E8F0] pb-3">
                <DialogTitle className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#F97316]" />
                  {cityEdit ? "Edit City" : "Add New City"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">City Name *</Label>
                  <Input value={cityForm.name} onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                    placeholder="e.g. Manali" className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs font-medium" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">State *</Label>
                  <Select value={cityForm.stateId} onValueChange={(v) => setCityForm({ ...cityForm, stateId: v })}>
                    <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {states.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={cityForm.isActive} onCheckedChange={(v) => setCityForm({ ...cityForm, isActive: v })} />
                  <Label className="text-xs font-medium text-slate-600">Active</Label>
                </div>
              </div>
              <DialogFooter className="pt-3 border-t border-[#E2E8F0] gap-2">
                <Button variant="outline" onClick={() => setCityModal(false)} className="rounded-[4px] text-xs font-semibold h-8.5">Cancel</Button>
                <Button onClick={async () => {
                  if (!cityForm.name.trim() || !cityForm.stateId) { toast.error("Name and state are required"); return; }
                  setCitySubmitting(true);
                  try {
                    if (cityEdit) {
                      await packageBuilderService.updateCity(cityEdit.id, cityForm);
                      toast.success("City updated");
                    } else {
                      await packageBuilderService.createCity(cityForm);
                      toast.success("City created");
                    }
                    setCityModal(false); loadCities(); loadStats();
                  } catch (err: any) { toast.error(err?.response?.data?.message || "Failed to save city"); }
                  finally { setCitySubmitting(false); }
                }} disabled={citySubmitting}
                  className="rounded-[4px] font-semibold text-xs h-8.5 bg-primary-orange hover:bg-primary-orange/90 text-white">
                  {citySubmitting ? "Saving..." : cityEdit ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        {/* ══ TAB 3: HOTELS ══ */}
        <TabsContent value="hotels" className="mt-4">
          <div className="bg-white rounded-md border border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs">
                  <Search className="h-4 w-4 text-slate-400" />
                  <Input placeholder="Search hotels..." value={hotelsSearch}
                    onChange={(e) => { setHotelsSearch(e.target.value); setHotelsPage(1); }}
                    className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs flex-1"
                    onKeyDown={(e) => { if (e.key === "Enter") loadHotels(); }} />
                </div>
                <Select value={hotelsStateFilter} onValueChange={(v) => { setHotelsStateFilter(v); setHotelsPage(1); }}>
                  <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs w-[130px]"><SelectValue placeholder="State" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {states.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={hotelsCityFilter} onValueChange={(v) => { setHotelsCityFilter(v); setHotelsPage(1); }}>
                  <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs w-[130px]"><SelectValue placeholder="City" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={hotelsCategoryFilter} onValueChange={(v) => { setHotelsCategoryFilter(v); setHotelsPage(1); }}>
                  <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs w-[120px]"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {HOTEL_CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={hotelsStatusFilter} onValueChange={(v) => { setHotelsStatusFilter(v); setHotelsPage(1); }}>
                  <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs w-[110px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => {
                setHotelEdit(null);
                setHotelForm({ name: "", cityId: cities[0]?.id || "", category: "Standard", roomType: "Standard",
                  maxPeoplePerRoom: 2, mealPlan: "EP", basePrice: 0, weekendPrice: 0, peakSeasonPrice: 0,
                  extraMattressPrice: 0, extraAdultPrice: 0, childWithBedPrice: 0, childWithoutBedPrice: 0, isActive: true });
                setHotelModal(true);
              }} className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white flex items-center gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" /> Add Hotel
              </Button>
            </div>
            <div className="p-4">
              {hotelsLoading ? (
                <div className="space-y-3">{ [1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />) }</div>
              ) : hotels.length === 0 ? (
                <div className="text-center py-16">
                  <Hotel className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">No hotels found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px] font-bold uppercase">Name</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">City</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Category</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Room Type</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Meal Plan</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Base Price</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Weekend</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Status</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Updated At</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hotels.map((h) => (
                        <TableRow key={h.id} className="hover:bg-slate-50">
                          <TableCell className="text-xs font-semibold text-slate-800">{h.name}</TableCell>
                          <TableCell className="text-xs text-slate-500">{h.city?.name || "-"}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{h.category}</Badge></TableCell>
                          <TableCell className="text-xs">{h.roomType}</TableCell>
                          <TableCell className="text-xs">{h.mealPlan}</TableCell>
                          <TableCell className="text-xs font-semibold">{formatCurrency(h.basePrice)}</TableCell>
                          <TableCell className="text-xs font-semibold">{formatCurrency(h.weekendPrice)}</TableCell>
                          <TableCell><Badge variant={h.isActive ? "default" : "secondary"} className="text-[10px] px-2 py-0.5">{h.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                          <TableCell className="text-xs text-slate-500">{formatDate(h.updatedAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[4px] hover:bg-slate-100"
                                onClick={async () => {
                                  setHotelEdit(h);
                                  setHotelForm({
                                    name: h.name, cityId: h.cityId, category: h.category, roomType: h.roomType,
                                    maxPeoplePerRoom: h.maxPeoplePerRoom, mealPlan: h.mealPlan,
                                    basePrice: h.basePrice, weekendPrice: h.weekendPrice,
                                    peakSeasonPrice: h.peakSeasonPrice ?? 0, extraMattressPrice: h.extraMattressPrice ?? 0,
                                    extraAdultPrice: h.extraAdultPrice ?? 0, childWithBedPrice: h.childWithBedPrice ?? 0,
                                    childWithoutBedPrice: h.childWithoutBedPrice ?? 0, isActive: h.isActive,
                                  });
                                  setHotelModal(true);
                                }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[4px] hover:bg-blue-50 text-blue-600"
                                onClick={() => {
                                  setTariffHotelId(h.id);
                                  setTariffHotelName(h.name);
                                  loadTariffs(h.id);
                                  setTariffModal(true);
                                }}>
                                <Star className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[4px] text-destructive hover:bg-rose-50"
                                onClick={async () => {
                                  if (!confirm("Delete hotel \"" + h.name + "\"?")) return;
                                  try { await packageBuilderService.deleteHotel(h.id); toast.success("Hotel deleted"); loadHotels(); loadStats(); }
                                  catch { toast.error("Failed to delete hotel"); }
                                }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <PaginationBar page={hotelsPage} total={hotelsTotal} setPage={(p) => { setHotelsPage(p); loadHotels(); }} />
            </div>
          </div>
          {/* Hotel Modal */}
          <Dialog open={hotelModal} onOpenChange={setHotelModal}>
            <DialogContent className="sm:max-w-[600px] rounded-[4px] border border-slate-200 p-5 bg-white shadow-sm max-h-[90vh] overflow-y-auto">
              <DialogHeader className="border-b border-[#E2E8F0] pb-3">
                <DialogTitle className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Hotel className="w-4 h-4 text-[#F97316]" />
                  {hotelEdit ? "Edit Hotel" : "Add New Hotel"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Hotel Name *</Label>
                    <Input value={hotelForm.name} onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })}
                      placeholder="e.g. Snow Valley Resort" className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">City *</Label>
                    <Select value={hotelForm.cityId} onValueChange={(v) => setHotelForm({ ...hotelForm, cityId: v })}>
                      <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Category *</Label>
                    <Select value={hotelForm.category} onValueChange={(v) => setHotelForm({ ...hotelForm, category: v })}>
                      <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{HOTEL_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Room Type *</Label>
                    <Select value={hotelForm.roomType} onValueChange={(v) => setHotelForm({ ...hotelForm, roomType: v })}>
                      <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{ROOM_TYPES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Max People / Room</Label>
                    <Input type="number" min={1} value={hotelForm.maxPeoplePerRoom}
                      onChange={(e) => setHotelForm({ ...hotelForm, maxPeoplePerRoom: Number(e.target.value) })}
                      className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Meal Plan *</Label>
                    <Select value={hotelForm.mealPlan} onValueChange={(v) => setHotelForm({ ...hotelForm, mealPlan: v })}>
                      <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{MEAL_PLANS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Base Price *</Label>
                    <Input type="number" min={0} value={hotelForm.basePrice}
                      onChange={(e) => setHotelForm({ ...hotelForm, basePrice: Number(e.target.value) })}
                      className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Weekend Price *</Label>
                    <Input type="number" min={0} value={hotelForm.weekendPrice}
                      onChange={(e) => setHotelForm({ ...hotelForm, weekendPrice: Number(e.target.value) })}
                      className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Peak Season Price</Label>
                    <Input type="number" min={0} value={hotelForm.peakSeasonPrice}
                      onChange={(e) => setHotelForm({ ...hotelForm, peakSeasonPrice: Number(e.target.value) })}
                      className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Extra Mattress Price</Label>
                    <Input type="number" min={0} value={hotelForm.extraMattressPrice}
                      onChange={(e) => setHotelForm({ ...hotelForm, extraMattressPrice: Number(e.target.value) })}
                      className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Extra Adult Price</Label>
                    <Input type="number" min={0} value={hotelForm.extraAdultPrice}
                      onChange={(e) => setHotelForm({ ...hotelForm, extraAdultPrice: Number(e.target.value) })}
                      className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Child With Bed Price</Label>
                    <Input type="number" min={0} value={hotelForm.childWithBedPrice}
                      onChange={(e) => setHotelForm({ ...hotelForm, childWithBedPrice: Number(e.target.value) })}
                      className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Child Without Bed Price</Label>
                    <Input type="number" min={0} value={hotelForm.childWithoutBedPrice}
                      onChange={(e) => setHotelForm({ ...hotelForm, childWithoutBedPrice: Number(e.target.value) })}
                      className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Switch checked={hotelForm.isActive} onCheckedChange={(v) => setHotelForm({ ...hotelForm, isActive: v })} />
                  <Label className="text-xs font-medium text-slate-600">Active</Label>
                </div>
              </div>
              <DialogFooter className="pt-3 border-t border-[#E2E8F0] gap-2">
                <Button variant="outline" onClick={() => setHotelModal(false)} className="rounded-[4px] text-xs font-semibold h-8.5">Cancel</Button>
                <Button onClick={async () => {
                  if (!hotelForm.name.trim() || !hotelForm.cityId) { toast.error("Name and city are required"); return; }
                  if (hotelForm.basePrice < 0 || hotelForm.weekendPrice < 0) { toast.error("Prices must be non-negative"); return; }
                  setHotelSubmitting(true);
                  try {
                    if (hotelEdit) {
                      await packageBuilderService.updateHotel(hotelEdit.id, hotelForm);
                      toast.success("Hotel updated");
                    } else {
                      await packageBuilderService.createHotel(hotelForm);
                      toast.success("Hotel created");
                    }
                    setHotelModal(false); loadHotels(); loadStats();
                  } catch (err: any) { toast.error(err?.response?.data?.message || "Failed to save hotel"); }
                  finally { setHotelSubmitting(false); }
                }} disabled={hotelSubmitting}
                  className="rounded-[4px] font-semibold text-xs h-8.5 bg-primary-orange hover:bg-primary-orange/90 text-white">
                  {hotelSubmitting ? "Saving..." : hotelEdit ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Hotel Tariff Modal */}
          <Dialog open={tariffModal} onOpenChange={setTariffModal}>
            <DialogContent className="sm:max-w-[550px] rounded-[4px] border border-slate-200 p-5 bg-white shadow-sm">
              <DialogHeader className="border-b border-[#E2E8F0] pb-3">
                <DialogTitle className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#F97316]" />
                  Seasonal Tariffs - {tariffHotelName}
                </DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                {tariffLoading ? (
                  <div className="space-y-2">{ [1,2].map(i => <Skeleton key={i} className="h-8 w-full" />) }</div>
                ) : tariffs.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No tariff periods added yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px] font-bold uppercase">Label</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase">Start</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase">End</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase">Room Rate</TableHead>
                          <TableHead className="text-right"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tariffs.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell className="text-xs">{t.label || "-"}</TableCell>
                            <TableCell className="text-xs">{t.startDate}</TableCell>
                            <TableCell className="text-xs">{t.endDate}</TableCell>
                            <TableCell className="text-xs font-semibold">{formatCurrency(t.roomRate)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[4px] text-destructive hover:bg-rose-50"
                                onClick={async () => {
                                  if (!confirm("Delete this tariff?")) return;
                                  try { await packageBuilderService.deleteHotelTariff(tariffHotelId, t.id); toast.success("Tariff deleted"); loadTariffs(tariffHotelId); }
                                  catch { toast.error("Failed to delete tariff"); }
                                }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Add New Tariff Period</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Start Date *</Label>
                      <Input type="date" value={tariffForm.startDate}
                        onChange={(e) => setTariffForm({ ...tariffForm, startDate: e.target.value })}
                        className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">End Date *</Label>
                      <Input type="date" value={tariffForm.endDate}
                        onChange={(e) => setTariffForm({ ...tariffForm, endDate: e.target.value })}
                        className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Room Rate *</Label>
                      <Input type="number" min={0} value={tariffForm.roomRate}
                        onChange={(e) => setTariffForm({ ...tariffForm, roomRate: Number(e.target.value) })}
                        className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Label</Label>
                      <Input value={tariffForm.label}
                        onChange={(e) => setTariffForm({ ...tariffForm, label: e.target.value })}
                        placeholder="e.g. Summer 2026" className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                    </div>
                  </div>
                  <Button onClick={async () => {
                    if (!tariffForm.startDate || !tariffForm.endDate || tariffForm.roomRate <= 0) {
                      toast.error("Start date, end date, and room rate are required"); return;
                    }
                    setTariffSubmitting(true);
                    try {
                      await packageBuilderService.createHotelTariff(tariffHotelId, tariffForm);
                      toast.success("Tariff added");
                      setTariffForm({ startDate: "", endDate: "", roomRate: 0, label: "" });
                      loadTariffs(tariffHotelId);
                    } catch (err: any) { toast.error(err?.response?.data?.message || "Failed to add tariff"); }
                    finally { setTariffSubmitting(false); }
                  }} disabled={tariffSubmitting}
                    className="rounded-[4px] font-semibold text-xs h-8.5 bg-primary-orange hover:bg-primary-orange/90 text-white flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Add Tariff
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
        {/* ══ TAB 4: VEHICLES ══ */}
        <TabsContent value="vehicles" className="mt-4">
          <div className="bg-white rounded-md border border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <div className="flex items-center gap-2 flex-1 min-w-[180px] max-w-xs">
                  <Search className="h-4 w-4 text-slate-400" />
                  <Input placeholder="Search vehicles..." value={vehiclesSearch}
                    onChange={(e) => { setVehiclesSearch(e.target.value); setVehiclesPage(1); }}
                    className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs flex-1"
                    onKeyDown={(e) => { if (e.key === "Enter") loadVehicles(); }} />
                </div>
                <Select value={vehiclesCityFilter} onValueChange={(v) => { setVehiclesCityFilter(v); setVehiclesPage(1); }}>
                  <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs w-[130px]"><SelectValue placeholder="City" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={vehiclesAcFilter} onValueChange={(v) => { setVehiclesAcFilter(v); setVehiclesPage(1); }}>
                  <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs w-[120px]"><SelectValue placeholder="AC/Non-AC" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="ac">AC</SelectItem>
                    <SelectItem value="non-ac">Non-AC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => {
                setVehicleEdit(null);
                setVehicleForm({ name: "", cityId: cities[0]?.id || "", seatingCapacity: 4, isAc: true, image: "", vendorId: "", isActive: true });
                setVehicleModal(true);
              }} className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white flex items-center gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" /> Add Vehicle
              </Button>
            </div>
            <div className="p-4">
              {vehiclesLoading ? (
                <div className="space-y-3">{ [1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />) }</div>
              ) : vehicles.length === 0 ? (
                <div className="text-center py-16">
                  <Bus className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">No vehicles found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px] font-bold uppercase">Name</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">City</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Seats</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">AC</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Vendor</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Status</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Updated At</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicles.map((v) => (
                        <TableRow key={v.id} className="hover:bg-slate-50">
                          <TableCell className="text-xs font-semibold text-slate-800">{v.name}</TableCell>
                          <TableCell className="text-xs text-slate-500">{v.city?.name || "-"}</TableCell>
                          <TableCell className="text-xs">{v.seatingCapacity}</TableCell>
                          <TableCell><Badge variant={v.isAc ? "default" : "secondary"} className="text-[10px] px-2 py-0.5">{v.isAc ? "AC" : "Non-AC"}</Badge></TableCell>
                          <TableCell className="text-xs text-slate-500">{v.vendor?.name || "-"}</TableCell>
                          <TableCell><Badge variant={v.isActive ? "default" : "secondary"} className="text-[10px] px-2 py-0.5">{v.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                          <TableCell className="text-xs text-slate-500">{formatDate(v.updatedAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[4px] hover:bg-slate-100"
                                onClick={() => {
                                  setVehicleEdit(v);
                                  setVehicleForm({ name: v.name, cityId: v.cityId, seatingCapacity: v.seatingCapacity, isAc: v.isAc, image: v.image || "", vendorId: v.vendorId || "", isActive: v.isActive });
                                  setVehicleModal(true);
                                }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[4px] hover:bg-blue-50 text-blue-600"
                                onClick={() => {
                                  setVehicleTariffVehicleId(v.id);
                                  setVehicleTariffVehicleName(v.name);
                                  loadVehicleTariffs(v.id);
                                  setVehicleTariffModal(true);
                                }}>
                                <Star className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[4px] text-destructive hover:bg-rose-50"
                                onClick={async () => {
                                  if (!confirm("Delete vehicle \"" + v.name + "\"?")) return;
                                  try { await packageBuilderService.deleteVehicle(v.id); toast.success("Vehicle deleted"); loadVehicles(); loadStats(); }
                                  catch { toast.error("Failed to delete vehicle"); }
                                }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <PaginationBar page={vehiclesPage} total={vehiclesTotal} setPage={(p) => { setVehiclesPage(p); loadVehicles(); }} />
            </div>
          </div>
          {/* Vehicle Modal */}
          <Dialog open={vehicleModal} onOpenChange={setVehicleModal}>
            <DialogContent className="sm:max-w-[550px] rounded-[4px] border border-slate-200 p-5 bg-white shadow-sm">
              <DialogHeader className="border-b border-[#E2E8F0] pb-3">
                <DialogTitle className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Bus className="w-4 h-4 text-[#F97316]" />
                  {vehicleEdit ? "Edit Vehicle" : "Add New Vehicle"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Vehicle Name *</Label>
                    <Input value={vehicleForm.name} onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })}
                      placeholder="e.g. Toyota Innova" className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">City *</Label>
                    <Select value={vehicleForm.cityId} onValueChange={(v) => setVehicleForm({ ...vehicleForm, cityId: v })}>
                      <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Seating Capacity *</Label>
                    <Input type="number" min={1} value={vehicleForm.seatingCapacity}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, seatingCapacity: Number(e.target.value) })}
                      className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Vendor</Label>
                    <Select value={vehicleForm.vendorId || "none"} onValueChange={(v) => setVehicleForm({ ...vehicleForm, vendorId: v === "none" ? "" : v })}>
                      <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {vendors.filter((v) => v.type === "VEHICLE").map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Image URL</Label>
                    <Input value={vehicleForm.image} onChange={(e) => setVehicleForm({ ...vehicleForm, image: e.target.value })}
                      placeholder="https://..." className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch checked={vehicleForm.isAc} onCheckedChange={(v) => setVehicleForm({ ...vehicleForm, isAc: v })} />
                    <Label className="text-xs font-medium text-slate-600">AC</Label>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={vehicleForm.isActive} onCheckedChange={(v) => setVehicleForm({ ...vehicleForm, isActive: v })} />
                  <Label className="text-xs font-medium text-slate-600">Active</Label>
                </div>
              </div>
              <DialogFooter className="pt-3 border-t border-[#E2E8F0] gap-2">
                <Button variant="outline" onClick={() => setVehicleModal(false)} className="rounded-[4px] text-xs font-semibold h-8.5">Cancel</Button>
                <Button onClick={async () => {
                  if (!vehicleForm.name.trim() || !vehicleForm.cityId) { toast.error("Name and city are required"); return; }
                  if (vehicleForm.seatingCapacity < 1) { toast.error("Seating capacity must be at least 1"); return; }
                  setVehicleSubmitting(true);
                  try {
                    if (vehicleEdit) {
                      await packageBuilderService.updateVehicle(vehicleEdit.id, vehicleForm);
                      toast.success("Vehicle updated");
                    } else {
                      await packageBuilderService.createVehicle(vehicleForm);
                      toast.success("Vehicle created");
                    }
                    setVehicleModal(false); loadVehicles(); loadStats();
                  } catch (err: any) { toast.error(err?.response?.data?.message || "Failed to save vehicle"); }
                  finally { setVehicleSubmitting(false); }
                }} disabled={vehicleSubmitting}
                  className="rounded-[4px] font-semibold text-xs h-8.5 bg-primary-orange hover:bg-primary-orange/90 text-white">
                  {vehicleSubmitting ? "Saving..." : vehicleEdit ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Vehicle Tariff Modal */}
          <Dialog open={vehicleTariffModal} onOpenChange={setVehicleTariffModal}>
            <DialogContent className="sm:max-w-[550px] rounded-[4px] border border-slate-200 p-5 bg-white shadow-sm">
              <DialogHeader className="border-b border-[#E2E8F0] pb-3">
                <DialogTitle className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#F97316]" />
                  Vehicle Tariffs - {vehicleTariffVehicleName}
                </DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                {vehicleTariffLoading ? (
                  <div className="space-y-2">{ [1,2].map(i => <Skeleton key={i} className="h-8 w-full" />) }</div>
                ) : vehicleTariffs.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No tariff added yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px] font-bold uppercase">Price Type</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase">Per Day</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase">Per Km</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase">Fixed Route</TableHead>
                          <TableHead className="text-right"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vehicleTariffs.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell className="text-xs font-semibold">{t.priceType}</TableCell>
                            <TableCell className="text-xs">{t.perDayRate ? formatCurrency(t.perDayRate) : "-"}</TableCell>
                            <TableCell className="text-xs">{t.perKmRate ? formatCurrency(t.perKmRate) : "-"}</TableCell>
                            <TableCell className="text-xs">{t.fixedRouteRate ? formatCurrency(t.fixedRouteRate) : "-"}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[4px] text-destructive hover:bg-rose-50"
                                onClick={async () => {
                                  if (!confirm("Delete this tariff?")) return;
                                  try { await packageBuilderService.deleteVehicleTariff(vehicleTariffVehicleId, t.id); toast.success("Tariff deleted"); loadVehicleTariffs(vehicleTariffVehicleId); }
                                  catch { toast.error("Failed to delete tariff"); }
                                }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Add New Pricing</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Price Type *</Label>
                      <Select value={vehicleTariffForm.priceType}
                        onValueChange={(v) => setVehicleTariffForm({ ...vehicleTariffForm, priceType: v })}>
                        <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PER_DAY">Per Day</SelectItem>
                          <SelectItem value="PER_KM">Per Km</SelectItem>
                          <SelectItem value="FIXED_ROUTE">Fixed Route</SelectItem>
                          <SelectItem value="ALL">All</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Per Day Rate</Label>
                      <Input type="number" min={0} value={vehicleTariffForm.perDayRate}
                        onChange={(e) => setVehicleTariffForm({ ...vehicleTariffForm, perDayRate: Number(e.target.value) })}
                        className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Per Km Rate</Label>
                      <Input type="number" min={0} value={vehicleTariffForm.perKmRate}
                        onChange={(e) => setVehicleTariffForm({ ...vehicleTariffForm, perKmRate: Number(e.target.value) })}
                        className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fixed Route Rate</Label>
                      <Input type="number" min={0} value={vehicleTariffForm.fixedRouteRate}
                        onChange={(e) => setVehicleTariffForm({ ...vehicleTariffForm, fixedRouteRate: Number(e.target.value) })}
                        className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Min Km / Day</Label>
                      <Input type="number" min={0} value={vehicleTariffForm.minKmPerDay}
                        onChange={(e) => setVehicleTariffForm({ ...vehicleTariffForm, minKmPerDay: Number(e.target.value) })}
                        className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Driver Allowance</Label>
                      <Input type="number" min={0} value={vehicleTariffForm.driverAllowance}
                        onChange={(e) => setVehicleTariffForm({ ...vehicleTariffForm, driverAllowance: Number(e.target.value) })}
                        className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox checked={vehicleTariffForm.fuelIncluded}
                        onCheckedChange={(v) => setVehicleTariffForm({ ...vehicleTariffForm, fuelIncluded: v === true })} />
                      <Label className="text-xs font-medium text-slate-600">Fuel Included</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox checked={vehicleTariffForm.tollParkingIncluded}
                        onCheckedChange={(v) => setVehicleTariffForm({ ...vehicleTariffForm, tollParkingIncluded: v === true })} />
                      <Label className="text-xs font-medium text-slate-600">Toll/Parking Included</Label>
                    </div>
                  </div>
                  <Button onClick={async () => {
                    if (!vehicleTariffForm.priceType) { toast.error("Price type is required"); return; }
                    setVehicleTariffSubmitting(true);
                    try {
                      await packageBuilderService.createVehicleTariff(vehicleTariffVehicleId, vehicleTariffForm);
                      toast.success("Tariff added");
                      setVehicleTariffForm({ priceType: "PER_DAY", perDayRate: 0, perKmRate: 0, fixedRouteRate: 0, minKmPerDay: 0, driverAllowance: 0, fuelIncluded: true, tollParkingIncluded: true });
                      loadVehicleTariffs(vehicleTariffVehicleId);
                    } catch (err: any) { toast.error(err?.response?.data?.message || "Failed to add tariff"); }
                    finally { setVehicleTariffSubmitting(false); }
                  }} disabled={vehicleTariffSubmitting}
                    className="rounded-[4px] font-semibold text-xs h-8.5 bg-primary-orange hover:bg-primary-orange/90 text-white flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Add Pricing
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
        {/* ══ TAB 5: TRANSFER ROUTES ══ */}
        <TabsContent value="transfers" className="mt-4">
          <div className="bg-white rounded-md border border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <div className="flex items-center gap-2 flex-1 min-w-[180px] max-w-xs">
                  <Search className="h-4 w-4 text-slate-400" />
                  <Input placeholder="Search routes..." value={transferRoutesSearch}
                    onChange={(e) => { setTransferRoutesSearch(e.target.value); setTransferRoutesPage(1); }}
                    className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs flex-1"
                    onKeyDown={(e) => { if (e.key === "Enter") loadTransferRoutes(); }} />
                </div>
                <Select value={transferFromFilter} onValueChange={(v) => { setTransferFromFilter(v); setTransferRoutesPage(1); }}>
                  <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs w-[140px]"><SelectValue placeholder="From City" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={transferToFilter} onValueChange={(v) => { setTransferToFilter(v); setTransferRoutesPage(1); }}>
                  <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs w-[140px]"><SelectValue placeholder="To City" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => {
                setTransferEdit(null);
                setTransferForm({ fromCityId: "", toCityId: "", distanceKm: 0, travelTimeMins: 60, suggestedVehicle: "", fixedRate: 0, perKmRate: 0, pickupDropNotes: "", isActive: true });
                setTransferModal(true);
              }} className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white flex items-center gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" /> Add Route
              </Button>
            </div>
            <div className="p-4">
              {transferRoutesLoading ? (
                <div className="space-y-3">{ [1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />) }</div>
              ) : transferRoutes.length === 0 ? (
                <div className="text-center py-16">
                  <Route className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">No transfer routes found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px] font-bold uppercase">From</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">To</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Distance</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Travel Time</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Fixed Rate</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Per Km Rate</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Status</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Updated At</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transferRoutes.map((r) => (
                        <TableRow key={r.id} className="hover:bg-slate-50">
                          <TableCell className="text-xs font-semibold text-slate-800">{r.fromCity?.name || "-"}</TableCell>
                          <TableCell className="text-xs font-semibold text-slate-800">{r.toCity?.name || "-"}</TableCell>
                          <TableCell className="text-xs">{r.distanceKm} km</TableCell>
                          <TableCell className="text-xs">{r.travelTimeMins} min</TableCell>
                          <TableCell className="text-xs font-semibold">{formatCurrency(r.fixedRate)}</TableCell>
                          <TableCell className="text-xs">{formatCurrency(r.perKmRate)}</TableCell>
                          <TableCell><Badge variant={r.isActive ? "default" : "secondary"} className="text-[10px] px-2 py-0.5">{r.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                          <TableCell className="text-xs text-slate-500">{formatDate(r.updatedAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[4px] hover:bg-slate-100"
                                onClick={() => {
                                  setTransferEdit(r);
                                  setTransferForm({ fromCityId: r.fromCityId, toCityId: r.toCityId, distanceKm: r.distanceKm, travelTimeMins: r.travelTimeMins, suggestedVehicle: r.suggestedVehicle || "", fixedRate: r.fixedRate, perKmRate: r.perKmRate, pickupDropNotes: r.pickupDropNotes || "", isActive: r.isActive });
                                  setTransferModal(true);
                                }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[4px] text-destructive hover:bg-rose-50"
                                onClick={async () => {
                                  if (!confirm("Delete route from \"" + r.fromCity?.name + "\" to \"" + r.toCity?.name + "\"?")) return;
                                  try { await packageBuilderService.deleteTransferRoute(r.id); toast.success("Route deleted"); loadTransferRoutes(); loadStats(); }
                                  catch { toast.error("Failed to delete route"); }
                                }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <PaginationBar page={transferRoutesPage} total={transferRoutesTotal} setPage={(p) => { setTransferRoutesPage(p); loadTransferRoutes(); }} />
            </div>
          </div>
          {/* Transfer Route Modal */}
          <Dialog open={transferModal} onOpenChange={setTransferModal}>
            <DialogContent className="sm:max-w-[550px] rounded-[4px] border border-slate-200 p-5 bg-white shadow-sm">
              <DialogHeader className="border-b border-[#E2E8F0] pb-3">
                <DialogTitle className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Route className="w-4 h-4 text-[#F97316]" />
                  {transferEdit ? "Edit Transfer Route" : "Add New Transfer Route"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">From City *</Label>
                    <Select value={transferForm.fromCityId} onValueChange={(v) => setTransferForm({ ...transferForm, fromCityId: v })}>
                      <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">To City *</Label>
                    <Select value={transferForm.toCityId} onValueChange={(v) => setTransferForm({ ...transferForm, toCityId: v })}>
                      <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Distance (km) *</Label>
                    <Input type="number" min={0} value={transferForm.distanceKm}
                      onChange={(e) => setTransferForm({ ...transferForm, distanceKm: Number(e.target.value) })}
                      className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Travel Time (min) *</Label>
                    <Input type="number" min={0} value={transferForm.travelTimeMins}
                      onChange={(e) => setTransferForm({ ...transferForm, travelTimeMins: Number(e.target.value) })}
                      className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fixed Rate *</Label>
                    <Input type="number" min={0} value={transferForm.fixedRate}
                      onChange={(e) => setTransferForm({ ...transferForm, fixedRate: Number(e.target.value) })}
                      className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Per Km Rate *</Label>
                    <Input type="number" min={0} value={transferForm.perKmRate}
                      onChange={(e) => setTransferForm({ ...transferForm, perKmRate: Number(e.target.value) })}
                      className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Suggested Vehicle</Label>
                    <Input value={transferForm.suggestedVehicle}
                      onChange={(e) => setTransferForm({ ...transferForm, suggestedVehicle: e.target.value })}
                      placeholder="e.g. Sedan, SUV" className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pickup/Drop Notes</Label>
                  <textarea value={transferForm.pickupDropNotes}
                    onChange={(e) => setTransferForm({ ...transferForm, pickupDropNotes: e.target.value })}
                    className="w-full h-16 rounded-[4px] border border-[#E2E8F0] text-xs p-2 resize-none"
                    placeholder="e.g. Pickup from hotel lobby, drop at airport..." />
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={transferForm.isActive} onCheckedChange={(v) => setTransferForm({ ...transferForm, isActive: v })} />
                  <Label className="text-xs font-medium text-slate-600">Active</Label>
                </div>
              </div>
              <DialogFooter className="pt-3 border-t border-[#E2E8F0] gap-2">
                <Button variant="outline" onClick={() => setTransferModal(false)} className="rounded-[4px] text-xs font-semibold h-8.5">Cancel</Button>
                <Button onClick={async () => {
                  if (!transferForm.fromCityId || !transferForm.toCityId) { toast.error("From and To cities are required"); return; }
                  if (transferForm.distanceKm <= 0 || transferForm.travelTimeMins <= 0) { toast.error("Distance and travel time must be positive"); return; }
                  if (transferForm.fixedRate < 0 || transferForm.perKmRate < 0) { toast.error("Rates must be non-negative"); return; }
                  setTransferSubmitting(true);
                  try {
                    if (transferEdit) {
                      await packageBuilderService.updateTransferRoute(transferEdit.id, transferForm);
                      toast.success("Route updated");
                    } else {
                      await packageBuilderService.createTransferRoute(transferForm);
                      toast.success("Route created");
                    }
                    setTransferModal(false); loadTransferRoutes(); loadStats();
                  } catch (err: any) { toast.error(err?.response?.data?.message || "Failed to save route"); }
                  finally { setTransferSubmitting(false); }
                }} disabled={transferSubmitting}
                  className="rounded-[4px] font-semibold text-xs h-8.5 bg-primary-orange hover:bg-primary-orange/90 text-white">
                  {transferSubmitting ? "Saving..." : transferEdit ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        {/* ══ TAB 6: ACTIVITIES ══ */}
        <TabsContent value="activities" className="mt-4">
          <div className="bg-white rounded-md border border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <div className="flex items-center gap-2 flex-1 min-w-[180px] max-w-xs">
                  <Search className="h-4 w-4 text-slate-400" />
                  <Input placeholder="Search activities..." value={activitiesSearch}
                    onChange={(e) => { setActivitiesSearch(e.target.value); setActivitiesPage(1); }}
                    className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs flex-1"
                    onKeyDown={(e) => { if (e.key === "Enter") loadActivities(); }} />
                </div>
                <Select value={activitiesCityFilter} onValueChange={(v) => { setActivitiesCityFilter(v); setActivitiesPage(1); }}>
                  <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs w-[130px]"><SelectValue placeholder="City" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={activitiesStatusFilter} onValueChange={(v) => { setActivitiesStatusFilter(v); setActivitiesPage(1); }}>
                  <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs w-[110px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => {
                setActivityEdit(null);
                setActivityForm({ name: "", cityId: cities[0]?.id || "", adultRate: 0, childRate: 0, isShared: true, duration: "", description: "", includedItems: "", excludedItems: "", image: "", vendorId: "", isActive: true });
                setActivityModal(true);
              }} className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white flex items-center gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" /> Add Activity
              </Button>
            </div>
            <div className="p-4">
              {activitiesLoading ? (
                <div className="space-y-3">{ [1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />) }</div>
              ) : activities.length === 0 ? (
                <div className="text-center py-16">
                  <Activity className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">No activities found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px] font-bold uppercase">Name</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">City</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Adult Rate</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Child Rate</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Type</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Duration</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Status</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Updated At</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activities.map((a) => (
                        <TableRow key={a.id} className="hover:bg-slate-50">
                          <TableCell className="text-xs font-semibold text-slate-800">{a.name}</TableCell>
                          <TableCell className="text-xs text-slate-500">{a.city?.name || "-"}</TableCell>
                          <TableCell className="text-xs font-semibold">{formatCurrency(a.adultRate)}</TableCell>
                          <TableCell className="text-xs">{formatCurrency(a.childRate)}</TableCell>
                          <TableCell><Badge variant={a.isShared ? "default" : "secondary"} className="text-[10px] px-2 py-0.5">{a.isShared ? "Shared" : "Private"}</Badge></TableCell>
                          <TableCell className="text-xs">{a.duration || "-"}</TableCell>
                          <TableCell><Badge variant={a.isActive ? "default" : "secondary"} className="text-[10px] px-2 py-0.5">{a.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                          <TableCell className="text-xs text-slate-500">{formatDate(a.updatedAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[4px] hover:bg-slate-100"
                                onClick={() => {
                                  setActivityEdit(a);
                                  setActivityForm({ name: a.name, cityId: a.cityId, adultRate: a.adultRate, childRate: a.childRate, isShared: a.isShared, duration: a.duration, description: a.description || "", includedItems: a.includedItems || "", excludedItems: a.excludedItems || "", image: a.image || "", vendorId: a.vendorId || "", isActive: a.isActive });
                                  setActivityModal(true);
                                }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[4px] text-destructive hover:bg-rose-50"
                                onClick={async () => {
                                  if (!confirm("Delete activity \"" + a.name + "\"?")) return;
                                  try { await packageBuilderService.deleteActivity(a.id); toast.success("Activity deleted"); loadActivities(); loadStats(); }
                                  catch { toast.error("Failed to delete activity"); }
                                }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <PaginationBar page={activitiesPage} total={activitiesTotal} setPage={(p) => { setActivitiesPage(p); loadActivities(); }} />
            </div>
          </div>
          {/* Activity Modal */}
          <Dialog open={activityModal} onOpenChange={setActivityModal}>
            <DialogContent className="sm:max-w-[600px] rounded-[4px] border border-slate-200 p-5 bg-white shadow-sm max-h-[90vh] overflow-y-auto">
              <DialogHeader className="border-b border-[#E2E8F0] pb-3">
                <DialogTitle className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#F97316]" />
                  {activityEdit ? "Edit Activity" : "Add New Activity"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Activity Name *</Label>
                    <Input value={activityForm.name} onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })}
                      placeholder="e.g. River Rafting" className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">City *</Label>
                    <Select value={activityForm.cityId} onValueChange={(v) => setActivityForm({ ...activityForm, cityId: v })}>
                      <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Adult Rate *</Label>
                    <Input type="number" min={0} value={activityForm.adultRate}
                      onChange={(e) => setActivityForm({ ...activityForm, adultRate: Number(e.target.value) })}
                      className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Child Rate *</Label>
                    <Input type="number" min={0} value={activityForm.childRate}
                      onChange={(e) => setActivityForm({ ...activityForm, childRate: Number(e.target.value) })}
                      className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Duration *</Label>
                    <Input value={activityForm.duration} onChange={(e) => setActivityForm({ ...activityForm, duration: e.target.value })}
                      placeholder="e.g. 4 hours, Full day" className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Vendor</Label>
                    <Select value={activityForm.vendorId || "none"} onValueChange={(v) => setActivityForm({ ...activityForm, vendorId: v === "none" ? "" : v })}>
                      <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {vendors.filter((v) => v.type === "ACTIVITY").map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Image URL</Label>
                    <Input value={activityForm.image} onChange={(e) => setActivityForm({ ...activityForm, image: e.target.value })}
                      placeholder="https://..." className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch checked={activityForm.isShared} onCheckedChange={(v) => setActivityForm({ ...activityForm, isShared: v })} />
                    <Label className="text-xs font-medium text-slate-600">Shared Activity</Label>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Description</Label>
                  <textarea value={activityForm.description}
                    onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                    className="w-full h-16 rounded-[4px] border border-[#E2E8F0] text-xs p-2 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Included Items</Label>
                    <textarea value={activityForm.includedItems}
                      onChange={(e) => setActivityForm({ ...activityForm, includedItems: e.target.value })}
                      className="w-full h-16 rounded-[4px] border border-[#E2E8F0] text-xs p-2 resize-none"
                      placeholder="e.g. Guide, equipment, snacks" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Excluded Items</Label>
                    <textarea value={activityForm.excludedItems}
                      onChange={(e) => setActivityForm({ ...activityForm, excludedItems: e.target.value })}
                      className="w-full h-16 rounded-[4px] border border-[#E2E8F0] text-xs p-2 resize-none"
                      placeholder="e.g. Hotel pickup, meals" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={activityForm.isActive} onCheckedChange={(v) => setActivityForm({ ...activityForm, isActive: v })} />
                  <Label className="text-xs font-medium text-slate-600">Active</Label>
                </div>
              </div>
              <DialogFooter className="pt-3 border-t border-[#E2E8F0] gap-2">
                <Button variant="outline" onClick={() => setActivityModal(false)} className="rounded-[4px] text-xs font-semibold h-8.5">Cancel</Button>
                <Button onClick={async () => {
                  if (!activityForm.name.trim() || !activityForm.cityId) { toast.error("Name and city are required"); return; }
                  if (activityForm.adultRate < 0 || activityForm.childRate < 0) { toast.error("Rates must be non-negative"); return; }
                  setActivitySubmitting(true);
                  try {
                    if (activityEdit) {
                      await packageBuilderService.updateActivity(activityEdit.id, activityForm);
                      toast.success("Activity updated");
                    } else {
                      await packageBuilderService.createActivity(activityForm);
                      toast.success("Activity created");
                    }
                    setActivityModal(false); loadActivities(); loadStats();
                  } catch (err: any) { toast.error(err?.response?.data?.message || "Failed to save activity"); }
                  finally { setActivitySubmitting(false); }
                }} disabled={activitySubmitting}
                  className="rounded-[4px] font-semibold text-xs h-8.5 bg-primary-orange hover:bg-primary-orange/90 text-white">
                  {activitySubmitting ? "Saving..." : activityEdit ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        {/* ══ TAB 7: MEAL PLANS ══ */}
        <TabsContent value="mealplans" className="mt-4">
          <div className="bg-white rounded-md border border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <Search className="h-4 w-4 text-slate-400" />
                <Input placeholder="Search meal plans..." value={mealPlansSearch}
                  onChange={(e) => { setMealPlansSearch(e.target.value); setMealPlansPage(1); }}
                  className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs"
                  onKeyDown={(e) => { if (e.key === "Enter") loadMealPlans(); }} />
              </div>
              <Button onClick={() => {
                setMealPlanEdit(null);
                setMealPlanForm({ name: "", breakfastCost: 0, lunchCost: 0, dinnerCost: 0, perPersonPerDay: 0, vendorId: "" });
                setMealPlanModal(true);
              }} className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white flex items-center gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" /> Add Meal Plan
              </Button>
            </div>
            <div className="p-4">
              {mealPlansLoading ? (
                <div className="space-y-3">{ [1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />) }</div>
              ) : mealPlans.length === 0 ? (
                <div className="text-center py-16">
                  <UtensilsCrossed className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">No meal plans found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px] font-bold uppercase">Name</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Breakfast</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Lunch</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Dinner</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Per Person/Day</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Vendor</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Updated At</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mealPlans.map((m) => (
                        <TableRow key={m.id} className="hover:bg-slate-50">
                          <TableCell className="text-xs font-semibold text-slate-800">{m.name}</TableCell>
                          <TableCell className="text-xs">{formatCurrency(m.breakfastCost)}</TableCell>
                          <TableCell className="text-xs">{formatCurrency(m.lunchCost)}</TableCell>
                          <TableCell className="text-xs">{formatCurrency(m.dinnerCost)}</TableCell>
                          <TableCell className="text-xs font-semibold">{formatCurrency(m.perPersonPerDay)}</TableCell>
                          <TableCell className="text-xs text-slate-500">{m.vendor?.name || "-"}</TableCell>
                          <TableCell className="text-xs text-slate-500">{formatDate(m.updatedAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[4px] hover:bg-slate-100"
                                onClick={() => {
                                  setMealPlanEdit(m);
                                  setMealPlanForm({ name: m.name, breakfastCost: m.breakfastCost, lunchCost: m.lunchCost, dinnerCost: m.dinnerCost, perPersonPerDay: m.perPersonPerDay, vendorId: m.vendorId || "" });
                                  setMealPlanModal(true);
                                }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[4px] text-destructive hover:bg-rose-50"
                                onClick={async () => {
                                  if (!confirm("Delete meal plan \"" + m.name + "\"?")) return;
                                  try { await packageBuilderService.deleteMealPlan(m.id); toast.success("Meal plan deleted"); loadMealPlans(); loadStats(); }
                                  catch { toast.error("Failed to delete meal plan"); }
                                }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <PaginationBar page={mealPlansPage} total={mealPlansTotal} setPage={(p) => { setMealPlansPage(p); loadMealPlans(); }} />
            </div>
          </div>

          {/* Meal Plan Modal */}
          <Dialog open={mealPlanModal} onOpenChange={setMealPlanModal}>
            <DialogContent className="sm:max-w-[500px] rounded-[4px] border border-slate-200 p-5 bg-white shadow-sm">
              <DialogHeader className="border-b border-[#E2E8F0] pb-3">
                <DialogTitle className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-[#F97316]" />
                  {mealPlanEdit ? "Edit Meal Plan" : "Add New Meal Plan"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Plan Name *</Label>
                  <Input value={mealPlanForm.name} onChange={(e) => setMealPlanForm({ ...mealPlanForm, name: e.target.value })}
                    placeholder="e.g. Standard Meals" className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Breakfast Cost *</Label>
                    <Input type="number" min={0} value={mealPlanForm.breakfastCost}
                      onChange={(e) => setMealPlanForm({ ...mealPlanForm, breakfastCost: Number(e.target.value) })}
                      className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Lunch Cost *</Label>
                    <Input type="number" min={0} value={mealPlanForm.lunchCost}
                      onChange={(e) => setMealPlanForm({ ...mealPlanForm, lunchCost: Number(e.target.value) })}
                      className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dinner Cost *</Label>
                    <Input type="number" min={0} value={mealPlanForm.dinnerCost}
                      onChange={(e) => setMealPlanForm({ ...mealPlanForm, dinnerCost: Number(e.target.value) })}
                      className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Per Person / Day *</Label>
                    <Input type="number" min={0} value={mealPlanForm.perPersonPerDay}
                      onChange={(e) => setMealPlanForm({ ...mealPlanForm, perPersonPerDay: Number(e.target.value) })}
                      className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Vendor</Label>
                  <Select value={mealPlanForm.vendorId || "none"} onValueChange={(v) => setMealPlanForm({ ...mealPlanForm, vendorId: v === "none" ? "" : v })}>
                    <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {vendors.filter((v) => v.type === "MEALS").map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="pt-3 border-t border-[#E2E8F0] gap-2">
                <Button variant="outline" onClick={() => setMealPlanModal(false)} className="rounded-[4px] text-xs font-semibold h-8.5">Cancel</Button>
                <Button onClick={async () => {
                  if (!mealPlanForm.name.trim()) { toast.error("Plan name is required"); return; }
                  if (mealPlanForm.breakfastCost < 0 || mealPlanForm.lunchCost < 0 || mealPlanForm.dinnerCost < 0 || mealPlanForm.perPersonPerDay < 0) {
                    toast.error("Costs must be non-negative"); return;
                  }
                  setMealPlanSubmitting(true);
                  try {
                    if (mealPlanEdit) {
                      await packageBuilderService.updateMealPlan(mealPlanEdit.id, mealPlanForm);
                      toast.success("Meal plan updated");
                    } else {
                      await packageBuilderService.createMealPlan(mealPlanForm);
                      toast.success("Meal plan created");
                    }
                    setMealPlanModal(false); loadMealPlans(); loadStats();
                  } catch (err: any) { toast.error(err?.response?.data?.message || "Failed to save meal plan"); }
                  finally { setMealPlanSubmitting(false); }
                }} disabled={mealPlanSubmitting}
                  className="rounded-[4px] font-semibold text-xs h-8.5 bg-primary-orange hover:bg-primary-orange/90 text-white">
                  {mealPlanSubmitting ? "Saving..." : mealPlanEdit ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        {/* ══ TAB 8: VENDORS ══ */}
        <TabsContent value="vendors" className="mt-4">
          <div className="bg-white rounded-md border border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <div className="flex items-center gap-2 flex-1 min-w-[180px] max-w-xs">
                  <Search className="h-4 w-4 text-slate-400" />
                  <Input placeholder="Search vendors..." value={vendorsSearch}
                    onChange={(e) => { setVendorsSearch(e.target.value); setVendorsPage(1); }}
                    className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs flex-1"
                    onKeyDown={(e) => { if (e.key === "Enter") loadVendors(); }} />
                </div>
                <Select value={vendorsTypeFilter} onValueChange={(v) => { setVendorsTypeFilter(v); setVendorsPage(1); }}>
                  <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs w-[130px]"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {VENDOR_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => {
                setVendorEdit(null);
                setVendorForm({ name: "", type: "HOTEL", contactPerson: "", email: "", phone: "", location: "", gstNumber: "", isActive: true });
                setVendorModal(true);
              }} className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white flex items-center gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" /> Add Vendor
              </Button>
            </div>
            <div className="p-4">
              {vendorsLoading ? (
                <div className="space-y-3">{ [1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />) }</div>
              ) : vendors.length === 0 ? (
                <div className="text-center py-16">
                  <Store className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">No vendors found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px] font-bold uppercase">Name</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Type</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Contact</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Phone</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Email</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Status</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Updated At</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendors.map((v) => (
                        <TableRow key={v.id} className="hover:bg-slate-50">
                          <TableCell className="text-xs font-semibold text-slate-800">{v.name}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{v.type}</Badge></TableCell>
                          <TableCell className="text-xs text-slate-500">{v.contactPerson || "-"}</TableCell>
                          <TableCell className="text-xs text-slate-500">{v.phone || "-"}</TableCell>
                          <TableCell className="text-xs text-slate-500">{v.email || "-"}</TableCell>
                          <TableCell><Badge variant={v.isActive ? "default" : "secondary"} className="text-[10px] px-2 py-0.5">{v.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                          <TableCell className="text-xs text-slate-500">{formatDate(v.updatedAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[4px] hover:bg-slate-100"
                                onClick={() => {
                                  setVendorEdit(v);
                                  setVendorForm({ name: v.name, type: v.type, contactPerson: v.contactPerson || "", email: v.email || "", phone: v.phone || "", location: v.location || "", gstNumber: v.gstNumber || "", isActive: v.isActive });
                                  setVendorModal(true);
                                }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[4px] text-destructive hover:bg-rose-50"
                                onClick={async () => {
                                  if (!confirm("Delete vendor \"" + v.name + "\"?")) return;
                                  try { await packageBuilderService.deletePackageVendor(v.id); toast.success("Vendor deleted"); loadVendors(); loadStats(); }
                                  catch { toast.error("Failed to delete vendor"); }
                                }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <PaginationBar page={vendorsPage} total={vendorsTotal} setPage={(p) => { setVendorsPage(p); loadVendors(); }} />
            </div>
          </div>
          {/* Vendor Modal */}
          <Dialog open={vendorModal} onOpenChange={setVendorModal}>
            <DialogContent className="sm:max-w-[500px] rounded-[4px] border border-slate-200 p-5 bg-white shadow-sm">
              <DialogHeader className="border-b border-[#E2E8F0] pb-3">
                <DialogTitle className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#F97316]" />
                  {vendorEdit ? "Edit Vendor" : "Add New Vendor"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Vendor Name *</Label>
                  <Input value={vendorForm.name} onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                    placeholder="e.g. Himalayan Hotels" className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Type *</Label>
                  <Select value={vendorForm.type} onValueChange={(v) => setVendorForm({ ...vendorForm, type: v })}>
                    <SelectTrigger className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VENDOR_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Contact Person</Label>
                    <Input value={vendorForm.contactPerson} onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                      placeholder="e.g. Rajesh Kumar" className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone</Label>
                    <Input value={vendorForm.phone} onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                      placeholder="+91-9876543210" className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email</Label>
                    <Input value={vendorForm.email} onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                      placeholder="vendor@example.com" className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Location</Label>
                    <Input value={vendorForm.location} onChange={(e) => setVendorForm({ ...vendorForm, location: e.target.value })}
                      placeholder="e.g. Manali" className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">GST Number</Label>
                  <Input value={vendorForm.gstNumber} onChange={(e) => setVendorForm({ ...vendorForm, gstNumber: e.target.value })}
                    placeholder="e.g. 22AAAAA0000A1Z5" className="h-8.5 rounded-[4px] border-[#E2E8F0] text-xs" />
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={vendorForm.isActive} onCheckedChange={(v) => setVendorForm({ ...vendorForm, isActive: v })} />
                  <Label className="text-xs font-medium text-slate-600">Active</Label>
                </div>
              </div>
              <DialogFooter className="pt-3 border-t border-[#E2E8F0] gap-2">
                <Button variant="outline" onClick={() => setVendorModal(false)} className="rounded-[4px] text-xs font-semibold h-8.5">Cancel</Button>
                <Button onClick={async () => {
                  if (!vendorForm.name.trim()) { toast.error("Vendor name is required"); return; }
                  setVendorSubmitting(true);
                  try {
                    if (vendorEdit) {
                      await packageBuilderService.updatePackageVendor(vendorEdit.id, vendorForm);
                      toast.success("Vendor updated");
                    } else {
                      await packageBuilderService.createPackageVendor(vendorForm);
                      toast.success("Vendor created");
                    }
                    setVendorModal(false); loadVendors(); loadStats();
                  } catch (err: any) { toast.error(err?.response?.data?.message || "Failed to save vendor"); }
                  finally { setVendorSubmitting(false); }
                }} disabled={vendorSubmitting}
                  className="rounded-[4px] font-semibold text-xs h-8.5 bg-primary-orange hover:bg-primary-orange/90 text-white">
                  {vendorSubmitting ? "Saving..." : vendorEdit ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

      </Tabs>
    </div>
  );
}
