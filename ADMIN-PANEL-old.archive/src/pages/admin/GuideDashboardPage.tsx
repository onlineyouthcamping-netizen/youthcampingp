import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { guideService, Assignment } from "@/services/guide.service";
import { useAuthStore, ensureGuideToken } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { 
  Loader2, 
  MapPin, 
  Calendar, 
  User, 
  Compass, 
  ArrowRight,
  RefreshCw,
  LogOut
} from "lucide-react";

export default function GuideDashboardPage() {
  const navigate = useNavigate();
  const { admin, logout } = useAuthStore();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyAssignments = async () => {
    setLoading(true);
    try {
      const data = await guideService.getMyAssignments();
      setAssignments(data);
    } catch (error) {
      console.error("Failed to load guide assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await ensureGuideToken("9999999999", "admin");
      fetchMyAssignments();
    };
    init();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  // Group assignments
  const ongoing = assignments.filter(a => a.status === "ongoing");
  const upcoming = assignments.filter(a => a.status === "assigned");
  const completed = assignments.filter(a => a.status === "completed" || a.status === "cancelled");

  const renderTripCard = (assignment: Assignment) => (
    <div 
      key={assignment.id} 
      className="bg-white rounded-md border border-slate-200 shadow-sm p-4 hover:border-primary/30 hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <StatusBadge 
            variant={
              assignment.status === "ongoing" ? "primary" : 
              assignment.status === "completed" ? "success" : 
              assignment.status === "cancelled" ? "destructive" : "secondary"
            }
            className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded"
          >
            {assignment.status}
          </StatusBadge>
          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
            {assignment.role.replace("_", " ")}
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="font-bold text-slate-800 text-sm tracking-tight leading-tight line-clamp-2">
            {assignment.tripName}
          </h3>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
            ID: {assignment.mainBackendTripId || "Local Excursion"}
          </p>
        </div>

        <div className="space-y-2 pt-1.5 border-t border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Departure: <span className="font-semibold text-slate-650">{assignment.departureDate}</span></span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Compass className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Pay Rate: <span className="font-bold text-slate-700">₹{assignment.perDayAmount.toLocaleString()}/day</span></span>
          </div>
        </div>
      </div>

      <Button
        onClick={() => navigate(`/admin/guide-portal/trip/${assignment.id}`)}
        className="w-full mt-2 bg-slate-900 hover:bg-primary text-white hover:text-white transition-all text-xs font-semibold h-8.5 rounded-[4px] flex items-center justify-center gap-1.5 shadow-sm"
      >
        Manage Excursion <ArrowRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-[#F4F7FB] min-h-screen -mx-6 -my-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Compass className="w-5 h-5 text-[#F97316]" />
          <div>
            <span className="text-[10px] font-black uppercase text-primary tracking-widest bg-orange-50 px-2 py-0.5 rounded">Guide Portal</span>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight mt-1">Welcome, {admin?.name || "Guide"}!</h1>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Access assignments, travelers lists, log milestone checks, and verify billing bills.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={fetchMyAssignments}
            variant="outline"
            className="rounded-[4px] h-8.5 px-3 flex items-center gap-1.5 border-slate-200 text-xs font-semibold text-slate-650"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload
          </Button>
          <Button 
            onClick={handleLogout}
            variant="ghost"
            className="rounded-[4px] h-8.5 px-3 flex items-center gap-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 transition-all text-xs font-semibold"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white rounded-md border border-slate-200 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Loading your assignments...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-12 text-center max-w-xl mx-auto space-y-4 flex flex-col items-center">
          <Compass className="w-5 h-5 text-slate-400" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">No Assignments Found</h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              You are currently not assigned to any upcoming trip departures. Contact your operations manager.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {/* Ongoing Excursions Section */}
          {ongoing.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Ongoing Excursion</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {ongoing.map(renderTripCard)}
              </div>
            </div>
          )}

          {/* Upcoming Section */}
          {upcoming.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Upcoming Excursions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcoming.map(renderTripCard)}
              </div>
            </div>
          )}

          {/* Completed/Legacy Section */}
          {completed.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider text-slate-400">History / Completed</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                {completed.map(renderTripCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
