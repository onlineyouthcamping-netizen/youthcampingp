import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, Users, Building, Briefcase, BarChart2, Plus, 
  ChevronDown, HelpCircle, Wallet, Compass, AlertCircle, CheckCircle2, 
  ShieldAlert, Clock, ArrowUpRight, MessageSquare, UserCheck, Milestone,
  TrendingUp, Landmark, Check, X, Bookmark, Ticket, Info, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { dashboardService } from "@/services/dashboard.service";
import type { DashboardStats } from "@/types";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState("03 July 2026");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dashboardService.getStats()
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch((err: any) => {
        console.error("Failed to load dashboard stats:", err);
        toast.error("Failed to load dashboard stats");
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-4 pb-12 select-none px-4 py-3 bg-[#F4F7FB] min-h-screen text-[#162B45] font-sans antialiased">
      
      {/* ─── PAGE HEADER ─── */}
      <div className="flex items-center justify-between pb-1.5">
        <div className="space-y-1">
          <h1 className="text-[19px] font-[600] text-[#162B45] tracking-tight leading-none">
            Good Afternoon, Hemal
          </h1>
          <p className="text-[#74839A] text-[11px] font-[500] leading-none">Wednesday, 03 July 2026</p>
        </div>
        
        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-white border border-[#E3EAF2] rounded-lg px-2.5 py-1.5 text-[11px] font-[600] text-[#162B45] shadow-[0_1px_2px_rgba(15,23,42,0.04)] cursor-pointer hover:bg-slate-50 transition-all">
          <Calendar className="w-3.5 h-3.5 text-[#74839A]" />
          <span>{selectedDate}</span>
          <ChevronDown className="w-3 h-3 text-[#74839A]" />
        </div>
      </div>

      {/* ─── ROW 1: 6 KPI CARDS ─── */}
      <div className="grid grid-cols-6 gap-4">
        
        {/* Card 1: Gross Revenue */}
        <div className="bg-white border border-[#E3EAF2] rounded-[10px] p-3.5 h-[108px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-[#74839A] uppercase tracking-[0.4px]">Total Revenue</span>
            <div className="w-[26px] h-[26px] rounded bg-emerald-50 flex items-center justify-center text-emerald-600">
              <span className="font-bold text-xs">₹</span>
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-[18px] font-bold text-[#162B45] leading-none">
              {loading ? "Loading..." : `₹ ${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`}
            </h3>
            <p className="text-[9.5px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-1">
              ▲ Gross <span className="text-[#74839A] font-medium">all-time</span>
            </p>
          </div>
        </div>

        {/* Card 2: Revenue This Month */}
        <div className="bg-white border border-[#E3EAF2] rounded-[10px] p-3.5 h-[108px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-[#74839A] uppercase tracking-[0.4px]">Monthly Revenue</span>
            <div className="w-[26px] h-[26px] rounded bg-blue-50 flex items-center justify-center text-blue-600">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-[18px] font-bold text-[#162B45] leading-none">
              {loading ? "Loading..." : `₹ ${(stats?.monthlyRevenue?.[stats.monthlyRevenue.length - 1]?.revenue || stats?.totalRevenue || 0).toLocaleString('en-IN')}`}
            </h3>
            <p className="text-[9.5px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-1">
              ▲ Active <span className="text-[#74839A] font-medium">this month</span>
            </p>
          </div>
        </div>

        {/* Card 3: Pending Payments */}
        <div className="bg-white border border-[#E3EAF2] rounded-[10px] p-3.5 h-[108px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-[#74839A] uppercase tracking-[0.4px]">Pending Customers</span>
            <div className="w-[26px] h-[26px] rounded bg-amber-50 flex items-center justify-center text-amber-600">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-[18px] font-bold text-[#162B45] leading-none">
              {loading ? "Loading..." : `₹ ${(stats?.pendingPayments || 0).toLocaleString('en-IN')}`}
            </h3>
            <p className="text-[9.5px] font-semibold text-[#74839A] flex items-center gap-0.5 mt-1">
              {loading ? "..." : stats?.totalBookings || 0} <span className="text-[#74839A] font-medium">bookings</span>
            </p>
          </div>
        </div>

        {/* Card 4: Pending Vendors */}
        <div className="bg-white border border-[#E3EAF2] rounded-[10px] p-3.5 h-[108px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-[#74839A] uppercase tracking-[0.4px]">Pending Vendors</span>
            <div className="w-[26px] h-[26px] rounded bg-rose-50 flex items-center justify-center text-rose-600">
              <Building className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-[18px] font-bold text-[#162B45] leading-none">₹ 6,35,000</h3>
            <p className="text-[9.5px] font-semibold text-[#74839A] flex items-center gap-0.5 mt-1">
              14 <span className="text-[#74839A] font-medium">vendors</span>
            </p>
          </div>
        </div>

        {/* Card 5: Trips Running Now */}
        <div className="bg-white border border-[#E3EAF2] rounded-[10px] p-3.5 h-[108px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-[#74839A] uppercase tracking-[0.4px]">Trips Running</span>
            <div className="w-[26px] h-[26px] rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-[18px] font-bold text-[#162B45] leading-none">
              {loading ? "..." : stats?.totalTrips || 0}
            </h3>
            <p className="text-[9.5px] font-semibold text-[#74839A] flex items-center gap-0.5 mt-1">
              Active <span className="text-[#74839A] font-medium">itineraries</span>
            </p>
          </div>
        </div>

        {/* Card 6: Bookings This Month */}
        <div className="bg-white border border-[#E3EAF2] rounded-[10px] p-3.5 h-[108px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-[#74839A] uppercase tracking-[0.4px]">Bookings Month</span>
            <div className="w-[26px] h-[26px] rounded bg-teal-50 flex items-center justify-center text-teal-600">
              <BarChart2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-[18px] font-bold text-[#162B45] leading-none">
              {loading ? "..." : stats?.totalBookings || 0}
            </h3>
            <p className="text-[9.5px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-1">
              ▲ Overall <span className="text-[#74839A] font-medium">reservations</span>
            </p>
          </div>
        </div>

      </div>

      {/* ─── ROW 2: MAIN OPERATIONAL AREA (4 + 4 + 4 COLUMNS) ─── */}
      <div className="grid grid-cols-12 gap-4">
        
        {/* Card 1: Needs Your Attention (4 cols) */}
        <div className="col-span-4 bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden">
          <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
            <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">Needs Your Attention</span>
            <span onClick={() => navigate("/admin/approvals-hub")} className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer">View All</span>
          </div>
          <div className="p-3.5 flex-1 space-y-2">
            {[
              { label: "Payments waiting verification", count: 8, color: "bg-[#E23D4D]", urgent: true, path: "/admin/approvals-hub" },
              { label: "Aadhaar pending", count: 16, color: "bg-[#D97706]", path: "/admin/approvals-hub" },
              { label: "Hotels pending confirmation", count: 5, color: "bg-[#D97706]", path: "/admin/departure-workspace" },
              { label: "Vendors with payments due today", count: 3, color: "bg-[#E23D4D]", urgent: true, path: "/admin/accounting-workspace" },
              { label: "Rooming pending", count: 12, color: "bg-[#D97706]", path: "/admin/departure-workspace" },
              { label: "Customer complaints", count: 2, color: "bg-[#E23D4D]", urgent: true, path: "/admin/departure-workspace" },
              { label: "Tasks pending > 24 hours", count: 14, color: "bg-[#E23D4D]", urgent: true, path: "/admin/departure-workspace" },
              { label: "Missing train tickets", count: 6, color: "bg-[#E23D4D]", urgent: true, path: "/admin/approvals-hub" },
              { label: "Missing tempo confirmation", count: 4, color: "bg-[#D97706]", path: "/admin/departure-workspace" }
            ].map((item, idx) => (
              <div key={idx} onClick={() => navigate(item.path)} className="flex items-center justify-between min-h-[22px] text-[12px] hover:bg-[#F8FAFD] px-1 rounded transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full", item.color)} />
                  <span className="font-semibold text-[#162B45]">{item.label}</span>
                </div>
                <span className={cn("font-bold text-[11px]", item.urgent ? "text-[#E23D4D]" : "text-[#74839A]")}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Trips Running Now (4 cols) */}
        <div className="col-span-4 bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden">
          <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
            <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">Trips Running Now</span>
            <span onClick={() => navigate("/admin/departure-workspace")} className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer">View All</span>
          </div>
          <div className="p-3.5 flex-1 space-y-3.5">
            {[
              { code: "MKA - 01 July", name: "Manali, Kasol, Amritsar", size: 28, stay: "Kasol" },
              { code: "Spiti Valley - 29 June", name: "Spiti Valley Circuit", size: 16, stay: "Kaza" },
              { code: "Kashmir - 30 June", name: "Srinagar, Pahalgam, Gulmarg", size: 24, stay: "Pahalgam" },
              { code: "Kerala Family Trip - 28 June", name: "Cochin, Munnar, Alleppey", size: 32, stay: "Munnar" },
              { code: "Goa Trip - 01 July", name: "Goa, Dudhsagar", size: 18, stay: "North Goa" }
            ].map((trip, idx) => (
              <div key={idx} onClick={() => navigate("/admin/departure-workspace")} className="flex items-center justify-between min-h-[34px] hover:bg-[#F8FAFD] p-1 rounded transition-colors cursor-pointer">
                <div className="space-y-0.5">
                  <p className="text-[12px] font-bold text-[#162B45]">{trip.code}</p>
                  <p className="text-[10px] text-[#74839A] font-medium leading-none">{trip.name}</p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-[10.5px] font-semibold text-[#162B45] flex items-center justify-end gap-1">👤 {trip.size}</p>
                  <p className="text-[9.5px] text-emerald-600 font-bold leading-none">📍 {trip.stay}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Trips Departing Next 7 Days (4 cols) */}
        <div className="col-span-4 bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden">
          <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
            <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">Trips Departing Next 7 Days</span>
            <span onClick={() => navigate("/admin/operations")} className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer">View All</span>
          </div>
          <div className="p-3.5 flex-1 space-y-3.5">
            {[
              { name: "MKA", date: "05 July 2024", count: "35/40", status: "full" },
              { name: "Spiti Valley", date: "07 July 2024", count: "18/25", status: "normal" },
              { name: "Kashmir", date: "08 July 2024", count: "22/30", status: "normal" },
              { name: "Leh Ladakh Bike Trip", date: "10 July 2024", count: "12/15", status: "full" },
              { name: "Kerala Family Trip", date: "12 July 2024", count: "28/30", status: "full" }
            ].map((trip, idx) => (
              <div key={idx} onClick={() => navigate("/admin/operations")} className="flex items-center justify-between min-h-[34px] hover:bg-[#F8FAFD] p-1 rounded transition-colors cursor-pointer">
                <div className="space-y-0.5">
                  <p className="text-[12px] font-bold text-[#162B45]">{trip.name}</p>
                  <p className="text-[10px] text-[#74839A] font-semibold leading-none">{trip.date}</p>
                </div>
                <span className={cn(
                  "text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-sm border",
                  trip.status === "full" 
                    ? "bg-[#ECFDF3] text-[#16A34A] border-emerald-200" 
                    : "bg-[#EFF6FF] text-[#2563EB] border-blue-200"
                )}>
                  {trip.count} Booked
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ─── ROW 3: METRICS & WORKFLOWS (3 + 3 + 3 + 3 COLUMNS) ─── */}
      <div className="grid grid-cols-12 gap-4">
        
        {/* Card 1: Today's Schedule (3 cols) */}
        <div className="col-span-3 bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden">
          <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
            <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">Today's Schedule</span>
            <span onClick={() => navigate("/admin/departure-workspace")} className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer">View Full</span>
          </div>
          <div className="p-3.5 flex-1 space-y-3">
            {[
              { time: "09:00 AM", label: "MKA Departure - Ahmedabad", color: "bg-[#2563EB]" },
              { time: "10:30 AM", label: "Hotel Payment Due - Barpa", color: "bg-[#F97316]" },
              { time: "11:00 AM", label: "Train Chart Preparation", color: "bg-[#2563EB]" },
              { time: "02:00 PM", label: "Vendor Meeting - Tempo", color: "bg-teal-500" },
              { time: "05:00 PM", label: "Guide Briefing - Spiti Valley", color: "bg-[#16A34A]" }
            ].map((sched, idx) => (
              <div key={idx} onClick={() => navigate("/admin/departure-workspace")} className="flex gap-2 items-start min-h-[30px] cursor-pointer hover:bg-slate-50/50 p-0.5 rounded transition-colors">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#74839A] w-[54px] shrink-0 mt-0.5">{sched.time}</span>
                <div className="flex items-start gap-1.5">
                  <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", sched.color)} />
                  <span className="text-[12px] font-semibold text-[#162B45] leading-tight truncate max-w-[130px]">{sched.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: My Approval Queue (3 cols) */}
        <div className="col-span-3 bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden">
          <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
            <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">My Approval Queue</span>
            <span onClick={() => navigate("/admin/approvals-hub")} className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer">Go to Center</span>
          </div>
          <div className="p-3.5 flex-1 space-y-3">
            {[
              { label: "Payment Approvals", count: 5, color: "text-[#D97706] bg-[#FFF7E6] border-[#FFD580]", urgent: true },
              { label: "Vendor Bills", count: 2, color: "text-[#E23D4D] bg-[#FFF1F3] border-[#FFCCD3]", urgent: true },
              { label: "Refund Requests", count: 1, color: "text-[#2563EB] bg-[#EFF6FF] border-[#B8D4FF]" },
              { label: "Expense Claims", count: 3, color: "text-teal-600 bg-teal-50 border-teal-200" }
            ].map((appr, idx) => (
              <div key={idx} onClick={() => navigate("/admin/approvals-hub")} className="flex items-center justify-between min-h-[30px] text-[12px] cursor-pointer hover:bg-slate-50/50 p-0.5 rounded transition-colors">
                <span className="font-semibold text-[#162B45]">{appr.label}</span>
                <span className={cn("font-bold text-[10px] px-2 py-0.5 rounded border", appr.color)}>
                  {appr.count} Pending
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Cash Flow Overview (3 cols) */}
        <div className="col-span-3 bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden">
          <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
            <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">Cash Flow Overview</span>
            <span onClick={() => navigate("/admin/accounting-workspace")} className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer">Details</span>
          </div>
          <div className="p-3.5 flex-1 flex flex-col justify-between">
            
            <div onClick={() => navigate("/admin/accounting-workspace")} className="bg-[#ECFDF3] p-2 rounded border border-emerald-100 flex items-center justify-between cursor-pointer hover:bg-emerald-50/80 transition-colors">
              <div>
                <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider">Collection Today</p>
                <p className="text-[13px] font-bold text-[#16A34A]">₹ 1,82,000</p>
              </div>
              <span className="text-[#16A34A] text-xs">📈</span>
            </div>

            <div onClick={() => navigate("/admin/accounting-workspace")} className="bg-[#FFF1F3] p-2 rounded border border-rose-100 flex items-center justify-between mt-1 cursor-pointer hover:bg-rose-50/80 transition-colors">
              <div>
                <p className="text-[9px] font-bold text-[#74839A] uppercase tracking-wider">Payments Today</p>
                <p className="text-[13px] font-bold text-[#E23D4D]">₹ 95,000</p>
              </div>
              <span className="text-[#E23D4D] text-xs">📉</span>
            </div>

            <div className="border-t border-[#E3EAF2] pt-2 mt-2 flex items-center justify-between text-[11px] font-bold">
              <span className="text-[#74839A] uppercase tracking-wider">Net Cash Inflow:</span>
              <span className="text-[#16A34A] font-extrabold text-[12px]">₹ 87,000</span>
            </div>

          </div>
        </div>

        {/* Card 4: Announcements (3 cols) */}
        <div className="col-span-3 bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden">
          <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
            <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">Announcements</span>
            <span onClick={() => navigate("/admin/website")} className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer">View All</span>
          </div>
          <div className="p-3.5 flex-1 space-y-3 text-[12px]">
            {[
              { label: "Office closed tomorrow (4 July)", sub: "By Hemal Patel • 2 hours ago" },
              { label: "New SOP Published - Payments", sub: "By Operations • 1 day ago" },
              { label: "New Itinerary Launched - Vietnam", sub: "By Sales • 2 days ago" }
            ].map((ann, idx) => (
              <div key={idx} className="space-y-0.5 pb-1">
                <p onClick={() => navigate("/admin/website")} className="font-bold text-[#162B45] leading-tight hover:underline cursor-pointer">{ann.label}</p>
                <p className="text-[9px] text-[#74839A] font-semibold leading-none">{ann.sub}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ─── ROW 4: DATA & TEAM METRICS (3 + 3 + 3 + 3 COLUMNS) ─── */}
      <div className="grid grid-cols-12 gap-4">
        
        {/* Card 1: Today's Tasks (3 cols) */}
        <div className="col-span-3 bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden">
          <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
            <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">Today's Tasks</span>
            <span onClick={() => navigate("/admin/departure-workspace")} className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer">View All</span>
          </div>
          
          <div className="p-3.5 flex-1 flex items-center gap-4">
            {/* Minimal Radial Progress */}
            <div className="relative w-[60px] h-[60px] flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="30" cy="30" r="26" className="stroke-slate-100" strokeWidth="4" fill="transparent" />
                <circle cx="30" cy="30" r="26" className="stroke-emerald-500" strokeWidth="4" fill="transparent"
                  strokeDasharray="163.2" strokeDashoffset="81.6" />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-[12px] font-extrabold text-[#162B45]">32</span>
                <span className="text-[8px] text-[#74839A] font-bold uppercase mt-0.5">Tasks</span>
              </div>
            </div>
            
            {/* Stats legend */}
            <div className="space-y-1 text-[11px] flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[#74839A] font-medium">Completed</span>
                <span className="font-bold text-[#16A34A]">16</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#74839A] font-medium">Pending</span>
                <span className="font-bold text-[#D97706]">10</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#74839A] font-medium">Overdue</span>
                <span className="font-bold text-[#E23D4D]">6</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Employee Status (3 cols) */}
        <div className="col-span-3 bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden">
          <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
            <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">Employee Status</span>
            <span onClick={() => navigate("/admin/hr")} className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer">View All</span>
          </div>
          
          <div className="p-3.5 flex-1 grid grid-cols-2 gap-3 text-[11px]">
            <div className="space-y-1.5">
              <p className="text-[8px] font-bold text-[#16A34A] uppercase tracking-wider">Online Now (6)</p>
              <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto no-scrollbar">
                {['Suresh', 'Vidhi', 'Zeel', 'Parth', 'Neeki', 'Vibhuti'].map((name, i) => (
                  <span key={i} onClick={() => navigate("/admin/hr")} className="text-[9px] font-bold px-1 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition-colors">
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[8px] font-bold text-[#D97706] uppercase tracking-wider">On Leave (2)</p>
              <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto no-scrollbar">
                {['Sachin', 'Jatin'].map((name, i) => (
                  <span key={i} onClick={() => navigate("/admin/hr")} className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Employee Workload (3 cols) */}
        <div className="col-span-3 bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden">
          <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
            <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">Employee Workload</span>
            <span onClick={() => navigate("/admin/hr")} className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer">View All</span>
          </div>
          
          <div className="p-3.5 flex-1 space-y-2 text-[11px]">
            {[
              { name: "Suresh Bhai", state: "Normal", pct: 70, color: "bg-[#16A34A]" },
              { name: "Vidhi", state: "High", pct: 78, color: "bg-[#D97706]" },
              { name: "Zeel", state: "High", pct: 75, color: "bg-[#D97706]" },
              { name: "Parth", state: "Available", pct: 50, color: "bg-[#2563EB]" },
              { name: "Neeki", state: "Normal", pct: 60, color: "bg-[#16A34A]" }
            ].map((emp, i) => (
              <div key={i} onClick={() => navigate("/admin/hr")} className="space-y-0.5 cursor-pointer hover:bg-slate-50/50 p-0.5 rounded transition-colors">
                <div className="flex items-center justify-between font-semibold leading-none">
                  <span className="text-[#162B45] text-[11px]">{emp.name}</span>
                  <span className="text-[#74839A] text-[9.5px] uppercase tracking-wider font-extrabold">{emp.state} ({emp.pct}%)</span>
                </div>
                <div className="w-full h-1 bg-[#E3EAF2] rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", emp.color)} style={{ width: `${emp.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Recent Activity (3 cols) */}
        <div className="col-span-3 bg-white border border-[#E3EAF2] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden">
          <div className="h-9 px-3.5 flex items-center justify-between border-b border-[#E3EAF2] shrink-0">
            <span className="text-[10px] font-bold text-[#162B45] uppercase tracking-[0.4px]">Recent Bookings</span>
            <span onClick={() => navigate("/admin/booking-workspace")} className="text-[11px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline cursor-pointer">View All</span>
          </div>
          
          <div className="p-3.5 flex-1 space-y-2.5 overflow-y-auto max-h-[160px] no-scrollbar text-[12px]">
            {loading ? (
              <p className="text-[11px] text-[#74839A] italic">Loading transactions...</p>
            ) : (!stats?.recentBookings || stats.recentBookings.length === 0) ? (
              <p className="text-[11px] text-[#74839A] italic">No recent transactions found.</p>
            ) : (
              stats.recentBookings.map((b) => (
                <div key={b.id} onClick={() => navigate("/admin/booking-workspace")} className="flex gap-2 items-start leading-tight cursor-pointer hover:bg-slate-50/50 p-1 rounded transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-blue-500" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-[#162B45] leading-none">
                      {b.userName} – {b.tripTitle}
                    </p>
                    <p className="text-[9px] text-[#74839A] font-semibold leading-none mt-0.5">
                      ₹{Number(b.amount || 0).toLocaleString('en-IN')} · <span className="uppercase text-[8px] font-extrabold text-slate-500">{b.status}</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
