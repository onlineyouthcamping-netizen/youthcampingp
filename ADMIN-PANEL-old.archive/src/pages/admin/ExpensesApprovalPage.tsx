import { useEffect, useState } from "react";
import { ensureGuideToken } from "@/store/auth.store";
import { guideService, Expense, Guide } from "@/services/guide.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminModal } from "@/components/admin/AdminModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Loader2, 
  Check, 
  X, 
  Image, 
  FileText,
  AlertTriangle,
  RefreshCw,
  Search,
  MessageSquare
} from "lucide-react";

export default function ExpensesApprovalPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [guideFilter, setGuideFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("pending"); // default to pending
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  // Reject modal state
  const [rejectingExpense, setRejectingExpense] = useState<Expense | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);

  // Photo viewer state
  const [activeReceiptUrl, setActiveReceiptUrl] = useState<string | null>(null);

  const fetchExpensesAndGuides = async () => {
    setLoading(true);
    try {
      const gId = guideFilter === "all" ? undefined : Number(guideFilter);
      const stat = statusFilter === "all" ? undefined : statusFilter;
      const [expensesData, guidesData] = await Promise.all([
        guideService.getExpenses({ guideId: gId, status: stat }),
        guideService.getGuides()
      ]);
      setExpenses(expensesData);
      setGuides(guidesData);
    } catch (error) {
      console.error("Failed to load expenses:", error);
      toast.error("Failed to load guide expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await ensureGuideToken("9999999999", "admin");
      fetchExpensesAndGuides();
    };
    init();
  }, [guideFilter, statusFilter]);

  const handleApprove = async (expenseId: number) => {
    if (!confirm("Are you sure you want to approve this expense?")) return;
    try {
      await guideService.approveExpense(expenseId, "approved", "Approved by Admin");
      toast.success("Expense approved successfully");
      fetchExpensesAndGuides();
    } catch (error) {
      toast.error("Failed to approve expense");
    }
  };

  const handleOpenReject = (expense: Expense) => {
    setRejectingExpense(expense);
    setRejectRemarks("");
    setSubmittingReject(false);
  };

  const handleConfirmReject = async () => {
    if (!rejectRemarks.trim()) {
      toast.error("Please provide a reason for rejecting this expense");
      return;
    }
    if (!rejectingExpense) return;

    setSubmittingReject(true);
    try {
      await guideService.approveExpense(rejectingExpense.id, "rejected", rejectRemarks);
      toast.success("Expense rejected successfully");
      setRejectingExpense(null);
      fetchExpensesAndGuides();
    } catch (error) {
      toast.error("Failed to reject expense");
    } finally {
      setSubmittingReject(false);
    }
  };

  // Filter client-side by category
  const filteredExpenses = expenses.filter(e => {
    if (categoryFilter === "all") return true;
    return e.category === categoryFilter;
  });

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "hotel_payment": return "Hotel Payment";
      case "toll_receipt": return "Toll Receipt";
      case "fuel_bill": return "Fuel Bill";
      case "entry_ticket": return "Entry Ticket";
      default: return "Misc Expense";
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "hotel_payment": return "bg-purple-50 text-purple-600 border-purple-100";
      case "toll_receipt": return "bg-indigo-50 text-indigo-600 border-indigo-100";
      case "fuel_bill": return "bg-amber-50 text-amber-700 border-amber-100";
      case "entry_ticket": return "bg-sky-50 text-sky-600 border-sky-100";
      default: return "bg-slate-50 text-slate-600 border-slate-250";
    }
  };

  const rejectModalFooter = (
    <div className="flex w-full items-center justify-end gap-3">
      <Button 
        variant="outline" 
        onClick={() => setRejectingExpense(null)} 
        className="rounded-[4px] h-8.5 px-4 text-xs font-semibold text-slate-650 border-slate-200"
      >
        Cancel
      </Button>
      <Button 
        onClick={handleConfirmReject} 
        disabled={submittingReject}
        className="bg-destructive hover:bg-destructive/90 text-white font-semibold text-xs h-8.5 px-4 rounded-[4px] shadow-sm transition-all flex items-center gap-1.5"
      >
        {submittingReject && <Loader2 className="w-4 h-4 animate-spin" />}
        Confirm Rejection
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-[#F4F7FB] min-h-screen -mx-6 -my-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-[#F97316]" />
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Expense Verification</h1>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Verify, settle, or reject guide expenditures and receipt attachments</p>
          </div>
        </div>
        <Button 
          onClick={fetchExpensesAndGuides}
          variant="outline"
          className="rounded-[4px] h-8.5 px-4 font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all border-slate-200"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Filter by Guide</Label>
          <Select value={guideFilter} onValueChange={setGuideFilter}>
            <SelectTrigger className="h-9 rounded-md border-slate-200 text-xs">
              <SelectValue placeholder="All Guides" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Guides</SelectItem>
              {guides.map(g => (
                <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Expense Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 rounded-md border-slate-200 text-xs">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Category</Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 rounded-md border-slate-200 text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="hotel_payment">Hotel Payments</SelectItem>
              <SelectItem value="toll_receipt">Toll Receipts</SelectItem>
              <SelectItem value="fuel_bill">Fuel Bills</SelectItem>
              <SelectItem value="entry_ticket">Entry Tickets</SelectItem>
              <SelectItem value="misc_expense">Misc Expenses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Loading guide expenses...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="w-10 h-10 rounded-md bg-slate-50 flex items-center justify-center text-slate-350">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-400 italic font-medium">No expenses match the selected filters</p>
          </div>
        ) : (
          <div className="responsive-table">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Guide</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Trip Name</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Category</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Amount</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">Receipt</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Description</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status & Remarks</th>
                  {statusFilter === "pending" && (
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors text-xs align-middle">
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-800">{exp.guideName}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{exp.tripName || "Trip Excursion"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 border text-[9px] font-bold rounded uppercase tracking-wide ${getCategoryColor(exp.category)}`}>
                        {getCategoryLabel(exp.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-black text-slate-800 text-sm">
                      ₹{exp.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {exp.receiptUrl ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="View Receipt Image"
                          onClick={() => setActiveReceiptUrl(exp.receiptUrl)}
                          className="h-8 w-8 hover:bg-primary/5 hover:text-primary transition-all text-slate-450 border border-slate-100 rounded-lg shadow-sm"
                        >
                          <Image className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <span className="text-slate-300 italic text-[11px]">No Receipt</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-650 max-w-xs truncate" title={exp.description}>
                      {exp.description}
                    </td>
                    <td className="px-4 py-3 space-y-1">
                      <StatusBadge 
                        variant={
                          exp.status === "approved" ? "success" : 
                          exp.status === "rejected" ? "destructive" : "warning"
                        }
                        className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded"
                      >
                        {exp.status}
                      </StatusBadge>
                      {exp.adminRemarks && (
                        <p className="text-[10px] text-slate-450 italic bg-slate-50 border border-slate-100 p-1 rounded max-w-[180px]">
                          "{exp.adminRemarks}"
                        </p>
                      )}
                    </td>
                    {statusFilter === "pending" && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            onClick={() => handleApprove(exp.id)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-7.5 w-7.5 p-0 rounded-[4px] shadow-sm"
                            title="Approve Settlement"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleOpenReject(exp)}
                            className="bg-rose-500 hover:bg-rose-600 text-white font-bold h-7.5 w-7.5 p-0 rounded-[4px] shadow-sm"
                            title="Reject Expense"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <AdminModal
        open={!!rejectingExpense}
        onOpenChange={(op) => !op && setRejectingExpense(null)}
        title="Reject Expense Request"
        description={`Guide ${rejectingExpense?.guideName || ''} uploaded ₹${rejectingExpense?.amount.toLocaleString() || 0} under ${rejectingExpense ? getCategoryLabel(rejectingExpense.category) : ''}`}
        footer={rejectModalFooter}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Provide Reason for Rejection *</Label>
            <Input 
              value={rejectRemarks} 
              onChange={e => setRejectRemarks(e.target.value)}
              placeholder="e.g. Receipt image blurry, amount mismatch, etc." 
            />
          </div>
        </div>
      </AdminModal>

      {/* Receipt Image Viewer Modal */}
      <AdminModal
        open={!!activeReceiptUrl}
        onOpenChange={(op) => !op && setActiveReceiptUrl(null)}
        title="Expense Receipt Attachment"
        description="Verify this invoice/bill file details before approval"
        footer={
          <div className="flex w-full justify-between items-center">
            <a 
              href={activeReceiptUrl || '#'} 
              target="_blank" 
              rel="noreferrer" 
              className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
            >
              Open in New Tab
            </a>
            <Button onClick={() => setActiveReceiptUrl(null)} className="rounded-[4px] px-4 h-8.5 font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white shadow-sm">
              Close Preview
            </Button>
          </div>
        }
      >
        <div className="flex items-center justify-center bg-slate-50 border border-slate-200 rounded-md p-4 overflow-hidden max-h-[60vh]">
          {activeReceiptUrl?.startsWith("data:") || activeReceiptUrl?.startsWith("http") ? (
            <img 
              src={activeReceiptUrl} 
              alt="Receipt Attachment" 
              className="max-h-[50vh] max-w-full object-contain rounded border border-slate-200 shadow" 
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-2">
              <FileText className="w-12 h-12 text-slate-300" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">PDF or Text Bill File</p>
              <p className="text-[10px] text-slate-400 italic">Click "Open in New Tab" below to download and view</p>
            </div>
          )}
        </div>
      </AdminModal>
    </div>
  );
}
