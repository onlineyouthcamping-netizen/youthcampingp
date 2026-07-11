import { useEffect, useState } from "react";
import { ensureGuideToken } from "@/store/auth.store";
import { useParams, useNavigate } from "react-router-dom";
import { guideService, Assignment, TravelerInfo, TravelerAttendance, Expense } from "@/services/guide.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminModal } from "@/components/admin/AdminModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Loader2, 
  ChevronLeft, 
  Users, 
  DollarSign, 
  MapPin, 
  Phone, 
  MessageSquare,
  CheckCircle,
  Plus,
  Image,
  Clock,
  Navigation
} from "lucide-react";

export default function GuideTripDetailPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const id = parseInt(assignmentId || "", 10);

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [travelers, setTravelers] = useState<TravelerInfo[]>([]);
  const [attendance, setAttendance] = useState<TravelerAttendance[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    category: "misc_expense" as any,
    description: "",
    receiptUrl: ""
  });
  const [loggingExpense, setLoggingExpense] = useState(false);

  // Milestone notes modal state
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [milestoneNotes, setMilestoneNotes] = useState("");
  const [milestoneLocation, setMilestoneLocation] = useState("");
  const [updatingMilestone, setUpdatingMilestone] = useState(false);

  const fetchAllData = async () => {
    if (isNaN(id)) return;
    setLoading(true);
    try {
      const allAssignments = await guideService.getMyAssignments();
      const currentAssign = allAssignments.find(a => a.id === id);
      if (!currentAssign) {
        toast.error("Assignment not found or unauthorized access");
        navigate("/admin/guide-portal");
        return;
      }
      setAssignment(currentAssign);

      const [travelersData, attendanceData, expensesData] = await Promise.all([
        guideService.getMyTravelers(id),
        guideService.getMyTravelerAttendance(id),
        guideService.getMyExpenses(id)
      ]);
      setTravelers(travelersData);
      setAttendance(attendanceData);
      setExpenses(expensesData);
    } catch (error) {
      console.error("Failed to load details:", error);
      toast.error("Failed to load excursion details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await ensureGuideToken("9999999999", "admin");
      fetchAllData();
    };
    init();
  }, [id]);

  // Merge traveler metadata with marked attendance status
  const combinedTravelers = travelers.map(t => {
    const log = attendance.find(
      a => a.bookingId === t.bookingId && a.travelerName.toLowerCase().trim() === t.name.toLowerCase().trim()
    );
    return {
      ...t,
      attendanceStatus: log ? log.status : "pending_checkin",
      attendanceNotes: log ? log.notes : ""
    };
  });

  const handleMarkAttendance = async (
    bookingId: string, 
    travelerName: string, 
    travelerPhone: string | null, 
    status: 'arrived_pickup' | 'boarded_train' | 'reached_destination' | 'missing_delayed',
    notes: string = ""
  ) => {
    try {
      await guideService.markTravelerAttendance({
        assignmentId: id,
        bookingId,
        travelerName,
        travelerPhone,
        status,
        notes: notes || undefined
      });
      toast.success(`Marked ${travelerName} as ${status.replace("_", " ")}`);
      
      // Quiet reload attendance list
      const attendanceData = await guideService.getMyTravelerAttendance(id);
      setAttendance(attendanceData);
    } catch (error) {
      toast.error("Failed to update traveler check-in status");
    }
  };

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.description || !expenseForm.receiptUrl) {
      toast.error("Amount, Description, and Receipt Image URL are required");
      return;
    }

    setLoggingExpense(true);
    try {
      await guideService.uploadExpense({
        assignmentId: id,
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        description: expenseForm.description,
        receiptUrl: expenseForm.receiptUrl
      });
      toast.success("Expense receipt uploaded successfully for verification");
      setExpenseForm({ amount: "", category: "misc_expense", description: "", receiptUrl: "" });
      
      const expensesData = await guideService.getMyExpenses(id);
      setExpenses(expensesData);
    } catch (error) {
      toast.error("Failed to log expense receipt");
    } finally {
      setLoggingExpense(false);
    }
  };

  const handleOpenMilestone = (milestoneCode: string) => {
    setSelectedMilestone(milestoneCode);
    setMilestoneNotes("");
    setMilestoneLocation("");
  };

  const handleConfirmMilestone = async () => {
    if (!selectedMilestone) return;
    setUpdatingMilestone(true);
    try {
      await guideService.updateTripStatus({
        assignmentId: id,
        status: selectedMilestone as any,
        notes: milestoneNotes || undefined,
        location: milestoneLocation || undefined
      });
      toast.success("Trip status milestone updated!");
      setSelectedMilestone(null);
      fetchAllData(); // reload
    } catch (error) {
      toast.error("Failed to log milestone update");
    } finally {
      setUpdatingMilestone(false);
    }
  };

  const getMilestoneLabel = (code: string) => {
    switch (code) {
      case "trip_started": return "Trip Started";
      case "train_boarded": return "Train Boarded";
      case "destination_reached": return "Destination Reached";
      case "hotel_checkin_complete": return "Hotel Check-in Complete";
      case "sightseeing_started": return "Sightseeing Started";
      case "return_journey_started": return "Return Journey Started";
      default: return code;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "hotel_payment": return "Hotel Payment";
      case "toll_receipt": return "Toll Receipt";
      case "fuel_bill": return "Fuel Bill";
      case "entry_ticket": return "Entry Ticket";
      default: return "Misc Expense";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Loading excursion details...</p>
      </div>
    );
  }

  if (!assignment) return null;

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-[#F4F7FB] min-h-screen -mx-6 -my-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-sm">
        <button 
          onClick={() => navigate("/admin/guide-portal")}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors font-semibold"
        >
          <ChevronLeft className="w-4 h-4" /> Back to assignments
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Navigation className="w-5 h-5 text-[#F97316]" />
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">{assignment.tripName}</h1>
                <span className="text-[10px] font-bold uppercase text-[#F97316] tracking-widest bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                  {assignment.role.replace("_", " ")}
                </span>
                <StatusBadge 
                  variant={
                    assignment.status === "ongoing" ? "primary" : 
                    assignment.status === "completed" ? "success" : "secondary"
                  }
                >
                  {assignment.status}
                </StatusBadge>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Excursion date: {assignment.departureDate}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="travelers" className="w-full">
        <TabsList className="flex gap-1 bg-white rounded-md border border-slate-200 p-1 shadow-sm w-full justify-start overflow-x-auto h-auto scrollbar-hide">
          <TabsTrigger value="travelers" className="px-4 py-2 rounded text-xs font-semibold transition-all flex items-center gap-1.5 data-[state=active]:bg-[#F97316] data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 hover:bg-slate-100">
            <Users className="w-3.5 h-3.5" /> Traveler Tracker
          </TabsTrigger>
          <TabsTrigger value="expenses" className="px-4 py-2 rounded text-xs font-semibold transition-all flex items-center gap-1.5 data-[state=active]:bg-[#F97316] data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 hover:bg-slate-100">
            <DollarSign className="w-3.5 h-3.5" /> Expense Manager
          </TabsTrigger>
          <TabsTrigger value="milestones" className="px-4 py-2 rounded text-xs font-semibold transition-all flex items-center gap-1.5 data-[state=active]:bg-[#F97316] data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 hover:bg-slate-100">
            <Navigation className="w-3.5 h-3.5" /> Milestones Updates
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Traveler Tracker */}
        <TabsContent value="travelers" className="pt-4 mt-0 space-y-4">
          <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">How to Mark Traveler Attendance:</h3>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Find each passenger in the list. Change their status in real-time as they arrive, board, or reach milestones. Add notes for late arrivals or issues.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {combinedTravelers.map((traveler, idx) => (
              <div 
                key={`${traveler.bookingId}_${idx}`} 
                className={`bg-white rounded-md border shadow-sm p-4 transition-all space-y-4 flex flex-col justify-between ${
                  traveler.attendanceStatus === "missing_delayed" ? "border-rose-200 bg-rose-50/30" : 
                  traveler.attendanceStatus !== "pending_checkin" ? "border-emerald-200 bg-emerald-50/20" : "border-slate-200"
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-slate-800 text-xs">{traveler.name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Booking: {traveler.bookingId}</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-450 bg-slate-50 px-2 py-0.5 rounded border border-slate-150 capitalize">
                      {traveler.pickupCity || "Default Pickup"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-500 text-[11px] font-medium pt-1">
                    <div className="flex items-center gap-1">
                      <span>{traveler.phone}</span>
                      <a href={`tel:+91${traveler.phone}`} className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-primary transition-all">
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <a href={`https://wa.me/91${traveler.phone}`} target="_blank" rel="noreferrer" className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-emerald-500 transition-all">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    {traveler.age && <span>• {traveler.age} yrs {traveler.gender ? `(${traveler.gender[0].toUpperCase()})` : ""}</span>}
                  </div>

                  {/* Attendance status indicators */}
                  <div className="pt-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-0.5">Check-in Status</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => handleMarkAttendance(traveler.bookingId, traveler.name, traveler.phone, "arrived_pickup", traveler.attendanceNotes)}
                        variant={traveler.attendanceStatus === "arrived_pickup" ? "default" : "outline"}
                        className={`h-7 px-2 text-[10px] font-bold rounded-[4px] border-slate-200 ${traveler.attendanceStatus === "arrived_pickup" ? "bg-primary hover:bg-primary" : "text-slate-600 hover:bg-slate-50"}`}
                      >
                        Arrived Pickup
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleMarkAttendance(traveler.bookingId, traveler.name, traveler.phone, "boarded_train", traveler.attendanceNotes)}
                        variant={traveler.attendanceStatus === "boarded_train" ? "default" : "outline"}
                        className={`h-7 px-2 text-[10px] font-bold rounded-[4px] border-slate-200 ${traveler.attendanceStatus === "boarded_train" ? "bg-amber-550 hover:bg-amber-550 border-amber-200" : "text-slate-600 hover:bg-slate-50"}`}
                      >
                        Boarded Train
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleMarkAttendance(traveler.bookingId, traveler.name, traveler.phone, "reached_destination", traveler.attendanceNotes)}
                        variant={traveler.attendanceStatus === "reached_destination" ? "default" : "outline"}
                        className={`h-7 px-2 text-[10px] font-bold rounded-[4px] border-slate-200 ${traveler.attendanceStatus === "reached_destination" ? "bg-emerald-500 hover:bg-emerald-500 border-emerald-200" : "text-slate-600 hover:bg-slate-50"}`}
                      >
                        Reached Dest
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleMarkAttendance(traveler.bookingId, traveler.name, traveler.phone, "missing_delayed", traveler.attendanceNotes)}
                        variant={traveler.attendanceStatus === "missing_delayed" ? "destructive" : "outline"}
                        className={`h-7 px-2 text-[10px] font-bold rounded-[4px] border-slate-200 ${traveler.attendanceStatus === "missing_delayed" ? "bg-rose-500 hover:bg-rose-500" : "text-slate-600 hover:bg-slate-50"}`}
                      >
                        Missing/Delayed
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Notes Input */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5">
                  <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">Notes / Delay details</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="e.g. Arriving late by auto..." 
                      defaultValue={traveler.attendanceNotes}
                      onBlur={(e) => {
                        if (e.target.value !== traveler.attendanceNotes) {
                          handleMarkAttendance(
                            traveler.bookingId, 
                            traveler.name, 
                            traveler.phone, 
                            traveler.attendanceStatus as any, 
                            e.target.value
                          );
                        }
                      }}
                      className="h-8 text-xs rounded-md border-slate-200"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Tab 2: Expense Manager */}
        <TabsContent value="expenses" className="pt-4 mt-0 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Expense Form */}
          <div className="lg:col-span-1">
            <form onSubmit={handleLogExpense} className="bg-white rounded-md border border-slate-200 shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">Log New Bill / Expense</h3>
              
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Expense Amount (₹) *</Label>
                <Input 
                  type="number"
                  placeholder="e.g. 2500"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Category *</Label>
                <Select 
                  value={expenseForm.category} 
                  onValueChange={(v) => setExpenseForm({ ...expenseForm, category: v })}
                >
                  <SelectTrigger className="h-10 rounded-md border-slate-200 text-xs">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hotel_payment">Hotel Payments</SelectItem>
                    <SelectItem value="toll_receipt">Toll Receipts</SelectItem>
                    <SelectItem value="fuel_bill">Fuel Bills</SelectItem>
                    <SelectItem value="entry_ticket">Entry Tickets</SelectItem>
                    <SelectItem value="misc_expense">Misc Expenses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Receipt Attachment URL *</Label>
                <Input 
                  placeholder="https://example.com/receipt.jpg"
                  value={expenseForm.receiptUrl}
                  onChange={e => setExpenseForm({ ...expenseForm, receiptUrl: e.target.value })}
                />
                <p className="text-[10px] text-slate-400 italic mt-1 ml-0.5">Please provide a URL link to the uploaded receipt photo.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Short Description *</Label>
                <Textarea 
                  placeholder="e.g. Fuel payout for local pickup traveler shuttle..."
                  value={expenseForm.description}
                  onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="rounded-md border-slate-200"
                />
              </div>

              <Button
                type="submit"
                disabled={loggingExpense}
                className="w-full h-8.5 rounded-[4px] bg-primary-orange hover:bg-primary-orange/90 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                {loggingExpense && <Loader2 className="w-4 h-4 animate-spin" />}
                Log Expenditure Request
              </Button>
            </form>
          </div>

          {/* Logged Expenses List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 ml-1">Logged Expenses History</h3>

            {expenses.length === 0 ? (
              <div className="bg-white rounded-md border border-dashed border-slate-200 shadow-sm p-12 text-center text-slate-400 italic text-xs">
                No bills logged yet for this excursion.
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((exp) => (
                  <div key={exp.id} className="bg-white rounded-md border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-150">
                          {getCategoryLabel(exp.category)}
                        </span>
                        <StatusBadge 
                          variant={
                            exp.status === "approved" ? "success" : 
                            exp.status === "rejected" ? "destructive" : "warning"
                          }
                          className="text-[9.5px] font-black uppercase tracking-wider"
                        >
                          {exp.status}
                        </StatusBadge>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs text-slate-650 font-medium">"{exp.description}"</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{new Date(exp.createdAt).toLocaleString()}</p>
                      </div>

                      {exp.adminRemarks && (
                        <p className="text-[10.5px] text-slate-500 bg-red-50/50 border border-red-100/50 p-2 rounded-md italic">
                          Remarks: "{exp.adminRemarks}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center sm:flex-col justify-between sm:items-end gap-3 shrink-0">
                      <span className="text-base font-black text-slate-800">
                        ₹{exp.amount.toLocaleString()}
                      </span>
                      {exp.receiptUrl && (
                        <a 
                          href={exp.receiptUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-1 text-[11px] text-primary font-bold hover:underline"
                        >
                          <Image className="w-3.5 h-3.5" /> View Receipt
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Milestones Updates */}
        <TabsContent value="milestones" className="pt-4 mt-0 max-w-xl mx-auto space-y-6">
          <div className="bg-white rounded-md border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#F97316]" /> Update Trip Milestone Status
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mark checkpoints during the expedition to inform the operational control desk in real-time.
            </p>

            <div className="grid grid-cols-1 gap-2 pt-2">
              {[
                { code: "trip_started", label: "Start Trip Milestone", desc: "Guide and group starting travel check-in" },
                { code: "train_boarded", label: "Train Boarded", desc: "Boarded train departure slots" },
                { code: "destination_reached", label: "Reached Destination", desc: "Excursion reached travel location safely" },
                { code: "hotel_checkin_complete", label: "Hotel Check-in Complete", desc: "Checked in guide & travelers rooms" },
                { code: "sightseeing_started", label: "Sightseeing Started", desc: "Initiated outdoor excursion itinerary checklist" },
                { code: "return_journey_started", label: "Return Journey Started", desc: "Excursion heading back to basecamp location" },
              ].map((m) => (
                <div 
                  key={m.code}
                  className="flex items-center justify-between p-3 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100/50 hover:border-[#F97316]/20 transition-all gap-4"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 text-xs">{m.label}</span>
                    <p className="text-[10px] text-slate-400 font-medium">{m.desc}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleOpenMilestone(m.code)}
                    className="h-8.5 rounded-[4px] text-xs font-semibold px-4 bg-primary-orange hover:bg-primary-orange/90 text-white shadow-sm"
                  >
                    Mark checkpoint
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Milestone Notes Modal */}
      <AdminModal
        open={!!selectedMilestone}
        onOpenChange={(op) => !op && setSelectedMilestone(null)}
        title={`Log Checkpoint: ${selectedMilestone ? getMilestoneLabel(selectedMilestone) : ''}`}
        description="Provide optional coordinates, location, or additional status remarks"
        footer={
          <div className="flex w-full items-center justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setSelectedMilestone(null)} 
              className="rounded-[4px] h-9 px-4 text-xs font-semibold text-slate-600 border border-slate-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmMilestone} 
              disabled={updatingMilestone}
              className="bg-primary-orange hover:bg-primary-orange/90 text-white font-semibold text-xs h-9 px-5 rounded-[4px] shadow-sm transition-all flex items-center gap-1.5"
            >
              {updatingMilestone && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Checkpoint
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-widest ml-1">Current Location / Station Name</Label>
            <Input 
              value={milestoneLocation} 
              onChange={e => setMilestoneLocation(e.target.value)}
              placeholder="e.g. Manali Bus Depot, Hotel Mountview Room check-in" 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-widest ml-1">Add Status Notes / Remarks</Label>
            <Textarea 
              value={milestoneNotes} 
              onChange={e => setMilestoneNotes(e.target.value)}
              placeholder="e.g. Group checked in, luggage settled safely, bus leaving depot..." 
              className="rounded-md border-slate-200"
            />
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
