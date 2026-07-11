import { useEffect, useState } from "react";
import { ensureGuideToken } from "@/store/auth.store";
import { guideService, AttendanceLog } from "@/services/guide.service";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminModal } from "@/components/admin/AdminModal";
import { toast } from "sonner";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Check, 
  X, 
  AlertTriangle,
  Loader2,
  ExternalLink,
  Eye
} from "lucide-react";

export default function AttendanceLogsPage() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSelfie, setSelectedSelfie] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await guideService.getAttendanceLogs();
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch attendance logs:", err);
      setError("Guide API server is offline or returned an error. Please verify the API server status.");
      toast.error("Failed to fetch attendance logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await ensureGuideToken("9999999999", "admin");
      fetchLogs();
    };
    init();
  }, []);

  const handleVerify = async (logId: number, status: 'approved' | 'rejected') => {
    try {
      await guideService.verifyAttendance(logId, status);
      toast.success(`Log ${status === "approved" ? "Approved" : "Rejected"} successfully`);
      fetchLogs();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Verification failed");
    }
  };

  const getSelfieUrl = (path: string | null) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const baseUrl = (import.meta.env.VITE_GUIDE_API_URL || "http://localhost:5000/api").replace("/api", "");
    return baseUrl + (path.startsWith("/") ? "" : "/") + path;
  };

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-[#F4F7FB] min-h-screen -mx-6 -my-6">
      {/* Page Title */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-5 h-5 text-[#F97316]" />
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Attendance Tracking Logs</h1>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Verify check-in photos, locations, and GPS distances</p>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Loading attendance logs...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4 max-w-md mx-auto">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Guide API Offline</h3>
              <p className="text-xs text-slate-450 leading-relaxed">{error}</p>
            </div>
            <Button 
              onClick={fetchLogs} 
              className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white flex items-center gap-1.5 shadow-sm"
            >
              Retry Connection
            </Button>
          </div>
        ) : (
          <div className="responsive-table">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Guide / Trip</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Date</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Check-in Details</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Check-out Details</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Notes</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group align-top">
                    {/* Guide & Trip */}
                    <td className="px-4 py-4 space-y-1">
                      <p className="text-xs font-bold text-slate-800">{log.guideName}</p>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">{log.tripName}</p>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 text-xs text-slate-650 font-medium whitespace-nowrap">
                      {log.date}
                    </td>

                    {/* Check In Details */}
                    <td className="px-4 py-4 space-y-2">
                      {log.checkInTime ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                            <Clock className="w-3.5 h-3.5 opacity-60" />
                            <span>{new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-450 font-semibold">
                            <MapPin className="w-3.5 h-3.5 opacity-60" />
                            <span className="truncate max-w-[150px]">{log.checkInLocationName || "Unknown Location"}</span>
                          </div>
                          {log.checkInDistance !== null && (
                            <div className="text-[10px] font-bold">
                              {log.checkInDistance > 3000 ? (
                                <span className="text-destructive">Mismatch: {(log.checkInDistance / 1000).toFixed(1)} km</span>
                              ) : (
                                <span className="text-emerald-500">Within geofence ({log.checkInDistance}m)</span>
                              )}
                            </div>
                          )}
                          {log.checkInSelfieUrl && (
                            <button 
                              onClick={() => setSelectedSelfie(getSelfieUrl(log.checkInSelfieUrl))}
                              className="flex items-center gap-1 text-[10px] text-primary hover:underline font-bold mt-1"
                            >
                              <Eye className="w-3 h-3" /> View Selfie
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-350 text-xs italic font-medium">No check-in</span>
                      )}
                    </td>

                    {/* Check Out Details */}
                    <td className="px-4 py-4 space-y-2">
                      {log.checkOutTime ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                            <Clock className="w-3.5 h-3.5 opacity-60" />
                            <span>{new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-450 font-semibold">
                            <MapPin className="w-3.5 h-3.5 opacity-60" />
                            <span className="truncate max-w-[150px]">{log.checkOutLocationName || "Unknown Location"}</span>
                          </div>
                          {log.checkOutDistance !== null && (
                            <div className="text-[10px] font-bold">
                              {log.checkOutDistance > 3000 ? (
                                <span className="text-destructive">Mismatch: {(log.checkOutDistance / 1000).toFixed(1)} km</span>
                              ) : (
                                <span className="text-emerald-500">Within geofence ({log.checkOutDistance}m)</span>
                              )}
                            </div>
                          )}
                          {log.checkOutSelfieUrl && (
                            <button 
                              onClick={() => setSelectedSelfie(getSelfieUrl(log.checkOutSelfieUrl))}
                              className="flex items-center gap-1 text-[10px] text-primary hover:underline font-bold mt-1"
                            >
                              <Eye className="w-3 h-3" /> View Selfie
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-350 text-xs italic font-medium">No check-out</span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-4 text-xs text-slate-500 max-w-[200px] leading-relaxed">
                      {log.notes || <span className="text-slate-300 italic font-medium">No notes</span>}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <StatusBadge 
                        variant={
                          log.status === "approved" ? "success" : 
                          log.status === "rejected" ? "destructive" : 
                          log.status === "location_mismatch" ? "destructive" : 
                          log.status === "incomplete" ? "secondary" : "warning"
                        }
                        className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                      >
                        {log.status.replace("_", " ")}
                      </StatusBadge>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-right">
                      {log.status === "pending" || log.status === "location_mismatch" || log.status === "incomplete" ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            onClick={() => handleVerify(log.id, "approved")}
                            size="icon" 
                            className="bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-600 rounded-[4px] h-7.5 w-7.5 shadow-none transition-all"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button 
                            onClick={() => handleVerify(log.id, "rejected")}
                            size="icon" 
                            className="bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-600 rounded-[4px] h-7.5 w-7.5 shadow-none transition-all"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-350 font-bold uppercase select-none mr-2">Verified</span>
                      )}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="space-y-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mx-auto text-slate-300">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-medium text-slate-400 italic">No attendance tracking records found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selfie Preview Modal */}
      <AdminModal
        open={!!selectedSelfie}
        onOpenChange={(open) => !open && setSelectedSelfie(null)}
        title="Check-In Selfie Verification"
        description="Verify guide selfie and facial credentials"
      >
        {selectedSelfie && (
          <div className="flex items-center justify-center p-2">
            <img 
              src={selectedSelfie} 
              alt="Guide Selfie Preview" 
              className="max-h-[70vh] rounded-md border border-slate-200 shadow-sm object-contain max-w-full"
              onError={(e) => {
                // If it fails to load due to broken server URL, show generic placeholder
                console.warn("Failed to load selfie url:", selectedSelfie);
                e.currentTarget.src = "/login_bg.png";
              }}
            />
          </div>
        )}
      </AdminModal>
    </div>
  );
}
