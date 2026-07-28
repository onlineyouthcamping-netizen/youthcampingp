import { useEffect, useState } from "react";
import { guideService, Assignment, TravelerInfo, TravelerAttendance } from "@/services/guide.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminModal } from "@/components/admin/AdminModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Loader2, 
  Search, 
  Download, 
  Phone, 
  MessageSquare,
  Users,
  CheckCircle2,
  Train,
  MapPin,
  AlertCircle
} from "lucide-react";

interface Props {
  assignment: Assignment;
  open: boolean;
  onClose: () => void;
}

export default function AssignmentTravelersModal({ assignment, open, onClose }: Props) {
  const [travelers, setTravelers] = useState<TravelerInfo[]>([]);
  const [attendance, setAttendance] = useState<TravelerAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [travelersData, attendanceData] = await Promise.all([
        guideService.getAssignmentTravelers(assignment.id),
        guideService.getTravelerAttendance(assignment.id)
      ]);
      setTravelers(travelersData);
      setAttendance(attendanceData);
    } catch (error) {
      console.error("Failed to load traveler details:", error);
      toast.error("Failed to load traveler details and live attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, assignment.id]);

  // Combine traveler information with live attendance logs
  const combinedTravelers = travelers.map(t => {
    const log = attendance.find(
      a => a.bookingId === t.bookingId && a.travelerName.toLowerCase().trim() === t.name.toLowerCase().trim()
    );
    return {
      ...t,
      attendanceStatus: log ? log.status : "pending_checkin",
      attendanceNotes: log ? log.notes : "",
      markedAt: log ? log.updatedAt : null,
      markedBy: log ? log.markedByGuideName : ""
    };
  });

  // Filters
  const filteredTravelers = combinedTravelers.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.phone.includes(searchQuery) ||
      t.bookingId.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && t.attendanceStatus === statusFilter;
  });

  // Calculate live counts
  const arrivedCount = combinedTravelers.filter(t => t.attendanceStatus === "arrived_pickup").length;
  const boardedCount = combinedTravelers.filter(t => t.attendanceStatus === "boarded_train").length;
  const reachedCount = combinedTravelers.filter(t => t.attendanceStatus === "reached_destination").length;
  const missingCount = combinedTravelers.filter(t => t.attendanceStatus === "missing_delayed").length;
  const pendingCount = combinedTravelers.filter(t => t.attendanceStatus === "pending_checkin").length;

  // CSV Export helper
  const exportToCSV = () => {
    if (combinedTravelers.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Booking ID", "Name", "Phone", "Email", "Age", "Gender", 
      "Pickup City", "Departure Date", "Payment Status", 
      "Amount Paid", "Total Amount", "Primary Booker?", 
      "Attendance Status", "Attendance Notes", "Marked Time"
    ];

    const rows = combinedTravelers.map(t => [
      t.bookingId,
      t.name,
      t.phone,
      t.email,
      t.age || "",
      t.gender || "",
      t.pickupCity,
      t.departureDate,
      t.paymentStatus,
      t.advancePaid,
      t.totalAmount,
      t.isPrimaryBooker ? "Yes" : "No",
      t.attendanceStatus.replace("_", " ").toUpperCase(),
      t.attendanceNotes || "",
      t.markedAt ? new Date(t.markedAt).toLocaleString() : ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Travelers_${assignment.mainBackendTripName || 'Trip'}_${assignment.departureDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Traveler list exported successfully");
  };

  const getAttendanceBadgeVariant = (status: string) => {
    switch (status) {
      case "arrived_pickup": return "primary";
      case "boarded_train": return "warning";
      case "reached_destination": return "success";
      case "missing_delayed": return "destructive";
      default: return "secondary";
    }
  };

  const formatAttendanceStatus = (status: string) => {
    return status.replace("_", " ");
  };

  return (
    <AdminModal
      open={open}
      onOpenChange={(op) => !op && onClose()}
      title={`${assignment.mainBackendTripName || "Trip"} — Traveler Registry`}
      description={`Departure: ${assignment.departureDate} | Assigned Guide: ${assignment.guideName}`}
      className="max-w-5xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button 
            onClick={exportToCSV}
            variant="outline"
            className="rounded-xl h-11 px-5 text-xs font-semibold flex items-center gap-1.5 border-slate-200"
          >
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button onClick={onClose} className="rounded-xl h-11 px-6 font-bold text-xs bg-primary hover:bg-primary/90">
            Close Registry
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Loading traveler data...</p>
        </div>
      ) : travelers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-400 italic font-medium">No confirmed traveler bookings found for this trip.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Attendance Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Travelers</span>
              <span className="text-2xl font-black text-slate-700 mt-1">{combinedTravelers.length}</span>
            </div>
            <div className="bg-blue-50/45 p-3 rounded-xl border border-blue-100/50 flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-500">
                <span className="text-[10px] font-bold uppercase tracking-wider">Arrived Pickup</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-2xl font-black text-blue-600 mt-1">{arrivedCount}</span>
            </div>
            <div className="bg-amber-50/45 p-3 rounded-xl border border-amber-100/50 flex flex-col justify-between">
              <div className="flex items-center justify-between text-amber-500">
                <span className="text-[10px] font-bold uppercase tracking-wider">Boarded Train</span>
                <Train className="w-3.5 h-3.5" />
              </div>
              <span className="text-2xl font-black text-amber-600 mt-1">{boardedCount}</span>
            </div>
            <div className="bg-emerald-50/45 p-3 rounded-xl border border-emerald-100/50 flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-500">
                <span className="text-[10px] font-bold uppercase tracking-wider">Reached Dest</span>
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <span className="text-2xl font-black text-emerald-600 mt-1">{reachedCount}</span>
            </div>
            <div className="bg-rose-50/45 p-3 rounded-xl border border-rose-100/50 flex flex-col justify-between">
              <div className="flex items-center justify-between text-rose-500">
                <span className="text-[10px] font-bold uppercase tracking-wider">Missing/Delayed</span>
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
              <span className="text-2xl font-black text-rose-600 mt-1">{missingCount}</span>
            </div>
          </div>

          <Tabs defaultValue="travelers" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
              <TabsList className="bg-slate-100 rounded-lg p-0.5">
                <TabsTrigger value="travelers" className="text-xs font-semibold px-4 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Confirmed Travelers ({travelers.length})
                </TabsTrigger>
                <TabsTrigger value="attendance" className="text-xs font-semibold px-4 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Live Attendance Log
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Search name or booking..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="h-9.5 pl-9 pr-4 text-xs rounded-lg border-slate-200"
                  />
                </div>
                {/* Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9.5 w-36 text-xs rounded-lg border-slate-200">
                    <SelectValue placeholder="Status Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Attendance</SelectItem>
                    <SelectItem value="pending_checkin">Pending Check-in</SelectItem>
                    <SelectItem value="arrived_pickup">Arrived Pickup</SelectItem>
                    <SelectItem value="boarded_train">Boarded Train</SelectItem>
                    <SelectItem value="reached_destination">Reached Destination</SelectItem>
                    <SelectItem value="missing_delayed">Missing/Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tab 1: Confirmed Travelers */}
            <TabsContent value="travelers" className="pt-4 mt-0">
              <div className="border border-slate-150 rounded-xl overflow-hidden max-h-[45vh] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150">
                      <th className="px-4 py-2.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-500">Booking ID</th>
                      <th className="px-4 py-2.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-500">Passenger Name</th>
                      <th className="px-4 py-2.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-500">Phone</th>
                      <th className="px-4 py-2.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-500">Demographics</th>
                      <th className="px-4 py-2.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-500">Boarding Point</th>
                      <th className="px-4 py-2.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-500">Payment Status</th>
                      <th className="px-4 py-2.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-500">Paid / Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTravelers.map((t, idx) => (
                      <tr key={`${t.bookingId}_${t.name}_${idx}`} className="hover:bg-slate-50/50 transition-all text-xs">
                        <td className="px-4 py-3 font-semibold text-slate-700">{t.bookingId}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{t.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{t.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-500">
                          <div className="flex items-center gap-1">
                            <span>{t.phone}</span>
                            <a href={`tel:+91${t.phone}`} className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-primary transition-all">
                              <Phone className="w-3 h-3" />
                            </a>
                            <a href={`https://wa.me/91${t.phone}`} target="_blank" rel="noreferrer" className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-emerald-500 transition-all">
                              <MessageSquare className="w-3 h-3" />
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 capitalize">
                          {t.age ? `${t.age} yrs` : "-"} {t.gender ? `• ${t.gender}` : ""}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-600">{t.pickupCity || "Default"}</td>
                        <td className="px-4 py-3">
                          <StatusBadge 
                            variant={
                              t.paymentStatus.toLowerCase() === "paid" ? "success" : 
                              t.paymentStatus.toLowerCase() === "partial" ? "warning" : "secondary"
                            }
                            className="text-[9px] font-bold px-2 py-0.5 rounded uppercase"
                          >
                            {t.paymentStatus}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-700">
                          {t.isPrimaryBooker ? (
                            <span>₹{t.advancePaid.toLocaleString()} / <span className="text-slate-450 font-normal">₹{t.totalAmount.toLocaleString()}</span></span>
                          ) : (
                            <span className="text-slate-350 italic font-normal text-[10px]">Included in Booker</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Tab 2: Live Attendance Log */}
            <TabsContent value="attendance" className="pt-4 mt-0">
              <div className="border border-slate-150 rounded-xl overflow-hidden max-h-[45vh] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150">
                      <th className="px-4 py-2.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-500">Passenger</th>
                      <th className="px-4 py-2.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-500">Booking ID</th>
                      <th className="px-4 py-2.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-500">Live Status</th>
                      <th className="px-4 py-2.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-500">Remarks / Notes</th>
                      <th className="px-4 py-2.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-500">Marked At</th>
                      <th className="px-4 py-2.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-500">Marked By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTravelers.map((t, idx) => (
                      <tr key={`att_${t.bookingId}_${t.name}_${idx}`} className="hover:bg-slate-50/50 transition-all text-xs">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{t.name}</span>
                            <span className="text-[10px] text-slate-500 font-medium">{t.phone}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-500">{t.bookingId}</td>
                        <td className="px-4 py-3">
                          <StatusBadge 
                            variant={getAttendanceBadgeVariant(t.attendanceStatus)}
                            className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                          >
                            {formatAttendanceStatus(t.attendanceStatus)}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3">
                          {t.attendanceNotes ? (
                            <span className="text-slate-650 bg-slate-50 border border-slate-100 p-1.5 rounded block text-[11px]">
                              {t.attendanceNotes}
                            </span>
                          ) : (
                            <span className="text-slate-350 italic text-[11px]">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {t.markedAt ? new Date(t.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " " + new Date(t.markedAt).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-medium capitalize">
                          {t.markedBy || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </AdminModal>
  );
}
