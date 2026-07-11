import { useEffect, useState } from "react";
import { guideService, PayrollItem } from "@/services/guide.service";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/admin/KPICard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { toast } from "sonner";
import { 
  Banknote, 
  ChevronDown, 
  ChevronUp, 
  CalendarCheck, 
  DollarSign, 
  Loader2,
  ListFilter
} from "lucide-react";

export default function PayrollPage() {
  const [payroll, setPayroll] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGuideId, setExpandedGuideId] = useState<number | null>(null);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const data = await guideService.getPayroll();
      setPayroll(data);
    } catch (error) {
      toast.error("Failed to load payroll report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, []);

  const totalPayrollAmount = payroll.reduce((sum, item) => sum + item.payableAmount, 0);
  const totalApprovedDays = payroll.reduce((sum, item) => sum + item.approvedDays, 0);

  const toggleExpand = (guideId: number) => {
    if (expandedGuideId === guideId) {
      setExpandedGuideId(null);
    } else {
      setExpandedGuideId(guideId);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="admin-title">Payroll & Payouts</h1>
        <p className="admin-body">Calculate guide disbursements and review earnings grouped by trip</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <KPICard 
          title="Total Payouts" 
          value={`₹${totalPayrollAmount.toLocaleString()}`} 
          icon={<Banknote className="h-5 w-5" />} 
          change="Accumulated" 
          loading={loading} 
        />
        <KPICard 
          title="Approved Days" 
          value={totalApprovedDays} 
          icon={<CalendarCheck className="h-5 w-5" />} 
          change="Payable Days" 
          loading={loading} 
        />
        <KPICard 
          title="Active Excursions" 
          value={payroll.length} 
          icon={<ListFilter className="h-5 w-5" />} 
          change="Guides On Payroll" 
          loading={loading} 
        />
      </div>

      {/* Payroll Table */}
      <div className="admin-card overflow-hidden !p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Compiling payroll summaries...</p>
          </div>
        ) : (
          <div className="responsive-table">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 w-10"></th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Guide Name</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Daily Wage Rate</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Approved Days</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Payable</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Payment Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payroll.map((item) => {
                  const isExpanded = expandedGuideId === item.guideId;
                  return (
                    <>
                      {/* Parent Row */}
                      <tr 
                        key={item.guideId} 
                        className="hover:bg-slate-50/80 transition-colors group align-middle cursor-pointer"
                        onClick={() => toggleExpand(item.guideId)}
                      >
                        <td className="px-4 py-3 text-center">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold text-slate-800">{item.guideName}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 font-semibold">
                          ₹{item.dailyRate.toLocaleString()}/day
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-650 font-bold">
                          {item.approvedDays} days
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-900">
                          ₹{item.payableAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge 
                            variant={item.payableAmount > 0 ? "success" : "secondary"}
                            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                          >
                            {item.payableAmount > 0 ? "Approved" : "No Payout"}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-[10px] font-bold uppercase tracking-wider text-slate-450 hover:text-primary h-8 px-2"
                          >
                            {isExpanded ? "Hide Breakdown" : "View Breakdown"}
                          </Button>
                        </td>
                      </tr>

                      {/* Expandable Breakdown Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50 border-t border-b border-slate-200">
                          <td colSpan={7} className="px-8 py-4">
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Trip Breakdown</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {item.tripBreakdown.map((t, idx) => (
                                  <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                                    <div className="space-y-0.5">
                                      <p className="text-xs font-semibold text-slate-800">{t.tripName}</p>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase">{t.approvedDays} days approved</p>
                                    </div>
                                    <span className="text-xs font-black text-slate-900">₹{t.amount.toLocaleString()}</span>
                                  </div>
                                ))}
                                {item.tripBreakdown.length === 0 && (
                                  <p className="text-xs text-slate-400 italic">No trip payments calculated for this period</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
                {payroll.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="space-y-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mx-auto text-slate-300">
                          <Banknote className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-medium text-slate-400 italic">No payroll records compiled</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
