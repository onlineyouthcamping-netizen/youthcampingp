import { useEffect, useState } from "react";
import { ensureGuideToken } from "@/store/auth.store";
import { useNavigate } from "react-router-dom";
import { KPICard } from "@/components/admin/KPICard";
import { Button } from "@/components/ui/button";
import { guideService } from "@/services/guide.service";
import { 
  Users, 
  MapPin, 
  CalendarCheck, 
  AlertTriangle, 
  FileText,
  Plus,
  Loader2,
  Clock,
  ArrowRight,
  DollarSign
} from "lucide-react";

export default function GuidesDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<{
    activeTrips: number;
    totalGuides: number;
    todayCheckIns: number;
    missingCheckIns: number;
    locationMismatchFlags: number;
  } | null>(null);
  
  const [pendingExpenses, setPendingExpenses] = useState(0);
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardStats, pendingExpensesData, recentStatusData] = await Promise.all([
        guideService.getDashboard(),
        guideService.getExpenses({ status: "pending" }),
        guideService.getRecentTripStatus()
      ]);
      setStats(dashboardStats);
      setPendingExpenses(pendingExpensesData.length);
      setRecentUpdates(recentStatusData);
    } catch (err) {
      console.error("Failed to load guide dashboard stats:", err);
      setError("Guide API server is offline or returned an error. Please verify the API server status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await ensureGuideToken("9999999999", "admin");
      fetchStats();
    };
    init();
  }, []);

  const formatRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(isoString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "trip_started": return "text-blue-600 bg-blue-50 border-blue-100";
      case "hotel_checkin_complete": return "text-purple-600 bg-purple-50 border-purple-100";
      case "destination_reached": return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "missing_delayed": return "text-rose-600 bg-rose-50 border-rose-100";
      default: return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-[#F4F7FB] min-h-screen -mx-6 -my-6">
      {/* Page Title */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Users className="w-5 h-5 text-[#F97316]" />
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Guides Dashboard</h1>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Real-time attendance tracking and guide coordination</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => navigate("/admin/assignments")}
            disabled={!!error}
            className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Assign Guide
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white rounded-md border border-slate-200 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Loading dashboard stats...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-12 text-center max-w-xl mx-auto space-y-5 flex flex-col items-center">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">Guide API Offline</h3>
            <p className="text-xs text-slate-450 leading-relaxed">{error}</p>
          </div>
          <Button 
            onClick={fetchStats} 
            className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white shadow-sm transition-all"
          >
            Retry Connection
          </Button>
        </div>
      ) : (
        <>
          {/* KPI Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <KPICard 
              title="Active Trips" 
              value={stats?.activeTrips ?? 0} 
              icon={<MapPin className="h-5 w-5" />} 
              change="On Trail" 
              loading={loading} 
            />
            <KPICard 
              title="Active Guides" 
              value={stats?.totalGuides ?? 0} 
              icon={<Users className="h-5 w-5" />} 
              change="Registered" 
              loading={loading} 
            />
            <KPICard 
              title="Checked-In Today" 
              value={stats?.todayCheckIns ?? 0} 
              icon={<CalendarCheck className="h-5 w-5" />} 
              change="Completed" 
              loading={loading} 
            />
            <KPICard 
              title="Missing Check-ins" 
              value={stats?.missingCheckIns ?? 0} 
              icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} 
              change="Pending Today" 
              loading={loading} 
            />
            <KPICard 
              title="Flagged Logs" 
              value={stats?.locationMismatchFlags ?? 0} 
              icon={<AlertTriangle className="h-5 w-5 text-destructive" />} 
              change="Mismatches" 
              loading={loading} 
            />
            <KPICard 
              title="Pending Expenses" 
              value={pendingExpenses} 
              icon={<DollarSign className="h-5 w-5 text-emerald-500" />} 
              change="Verification Req." 
              loading={loading} 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Trip Status Timeline Feed */}
            <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6 lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <h2 className="text-sm font-bold text-slate-800">Live Trip Status Updates</h2>
                </div>
                <Button 
                  onClick={() => navigate("/admin/assignments")}
                  variant="ghost" 
                  size="sm"
                  className="text-xs font-semibold text-primary flex items-center gap-1 hover:bg-slate-50"
                >
                  Assignments Registry <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              {recentUpdates.length === 0 ? (
                <div className="text-center py-12 text-slate-400 italic text-xs">
                  No status updates recorded by guides today.
                </div>
              ) : (
                <div className="relative border-l border-slate-150 pl-6 space-y-6 ml-2 py-1">
                  {recentUpdates.map((item) => (
                    <div key={item.id} className="relative">
                      {/* Timeline node dot */}
                      <div className="absolute -left-[31px] mt-1 h-3.5 w-3.5 rounded-full border-2 border-primary bg-white flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-850 text-xs capitalize">{item.guideName}</span>
                            <span className="text-[10px] font-medium text-slate-400">on</span>
                            <span className="font-semibold text-slate-700 text-xs">{item.tripName}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                            {formatRelativeTime(item.updatedAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-block px-2 py-0.5 border text-[9px] font-bold rounded uppercase tracking-wide ${getStatusColor(item.status)}`}>
                            {item.status.replace("_", " ")}
                          </span>
                          {item.location && (
                            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-0.5">
                              • @ {item.location}
                            </span>
                          )}
                        </div>

                        {item.notes && (
                          <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 p-2 rounded-lg italic mt-1.5">
                            "{item.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions Panel */}
            <div className="space-y-6">
              <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 flex flex-col justify-between h-[180px] space-y-4">
                <div className="space-y-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-800">Expense Approvals</h3>
                  <p className="text-xs text-slate-450 leading-relaxed">
                    Verify hotel bills, toll receipts, fuel payouts, and other misc expenses uploaded by guides.
                  </p>
                </div>
                <Button 
                  onClick={() => navigate("/admin/expenses")}
                  variant="outline" 
                  className="w-full text-xs font-semibold h-8.5 rounded-[4px]"
                >
                  Verify Receipts ({pendingExpenses})
                </Button>
              </div>

              <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 flex flex-col justify-between h-[180px] space-y-4">
                <div className="space-y-2">
                  <CalendarCheck className="w-5 h-5 text-[#F97316]" />
                  <h3 className="text-sm font-bold text-slate-800">Attendance Logs</h3>
                  <p className="text-xs text-slate-450 leading-relaxed">
                    Review and approve daily guide logs, verify selfie photos, verify geofence distance logs, and flag mismatches.
                  </p>
                </div>
                <Button 
                  onClick={() => navigate("/admin/attendance-logs")}
                  variant="outline" 
                  className="w-full text-xs font-semibold h-8.5 rounded-[4px]"
                >
                  View Logs
                </Button>
              </div>

              <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 flex flex-col justify-between h-[180px] space-y-4">
                <div className="space-y-2">
                  <Users className="w-5 h-5 text-[#F97316]" />
                  <h3 className="text-sm font-bold text-slate-800">Guide Directory</h3>
                  <p className="text-xs text-slate-450 leading-relaxed">
                    Add new guides to the team, update their base daily wage rates, emergency contacts, and active status.
                  </p>
                </div>
                <Button 
                  onClick={() => navigate("/admin/guides")}
                  variant="outline" 
                  className="w-full text-xs font-semibold h-8.5 rounded-[4px]"
                >
                  Manage Guides
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
