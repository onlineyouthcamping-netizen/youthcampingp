import { useEffect, useState, useCallback } from "react";
import { inquiriesService } from "@/services/inquiries.service";
import type { Inquiry } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { MessageSquare, Eye, Mail, Phone, Calendar, Search, User, ChevronDown, MoreHorizontal, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STATUS_TABS = [
  { key: "all", label: "New & Active" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Active" },
  { key: "converted", label: "Won" },
  { key: "closed", label: "Lost" },
  { key: "archived", label: "Archived" },
  { key: "spam", label: "Spam" },
];

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    }
    try {
      const data = await inquiriesService.getAll();
      setInquiries(data || []);
    } catch (error) {
      toast.error("Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(true); }, [load]);

  const filtered = (inquiries || []).filter(inq => {
    const matchesTab = activeTab === "all" 
      ? (inq.status === "new" || inq.status === "contacted")
      : inq.status === activeTab;
    const matchesSearch = !searchQuery || 
      (inq.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inq.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inq.tripTitle || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getTabCount = (key: string) => {
    if (key === "all") return (inquiries || []).filter(i => i.status === "new" || i.status === "contacted").length;
    return (inquiries || []).filter(i => i.status === key).length;
  };

  const updateInquiry = async (data: Partial<Inquiry>) => {
    if (!selected) return;
    try {
      const updated = await inquiriesService.update(selected.id, data);
      setSelected(updated);
      toast.success("CRM updated");
      load();
    } catch (error) {
      toast.error("Failed to update inquiry");
    }
  };

  const updateStatus = async (inq: Inquiry, status: string) => {
    try {
      await inquiriesService.update(inq.id, { status } as any);
      toast.success(`Status updated to ${status}`);
      load();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleView = async (inq: Inquiry) => {
    setSelected(inq);
    if (!inq.read) {
      await inquiriesService.markAsRead(inq.id);
      load();
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading && (inquiries || []).length === 0) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h1 className="text-xl font-bold text-foreground">Inquiries</h1>
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-premium">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div className="space-y-1">
          <h1 className="admin-title">Inquiries</h1>
          <p className="admin-body">Track, assign and manage customer tour inquiries</p>
        </div>
      </div>

      {/* Info Banners */}
      <div className="space-y-3">
        <div className="bg-[#FFF8E6] border border-[#FFE0B2] rounded-2xl px-5 py-4 text-sm text-[#E65100] flex items-start gap-3 shadow-sm">
          <span className="bg-[#FF5400] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Update</span>
          <div>
            You can now configure the tour inquiry form to <strong className="font-semibold">pop up automatically</strong> for your website visitors.
          </div>
        </div>
        <div className="bg-[#FFF8E6] border border-[#FFE0B2] rounded-2xl px-5 py-4 text-sm text-[#E65100] flex items-start gap-3 shadow-sm">
          <span className="bg-[#FF5400] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Update</span>
          <div>
            You can now <strong className="font-semibold">track the status of inquiries</strong> to help you focus on only those which need attention or follow up.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-250">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {STATUS_TABS.map(tab => {
            const count = getTabCount(tab.key);
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-350"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[280px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, email, or tour title..."
            className="admin-input"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="admin-button-outline">
              Any Source/Type <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>All Sources</DropdownMenuItem>
            <DropdownMenuItem>Website</DropdownMenuItem>
            <DropdownMenuItem>Phone</DropdownMenuItem>
            <DropdownMenuItem>Email</DropdownMenuItem>
            <DropdownMenuItem>Referral</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button className="h-10 w-10 flex items-center justify-center border border-slate-300 rounded-xl hover:bg-slate-50 transition-all bg-white">
          <User className="w-4 h-4 text-slate-500" />
        </button>
        <Button onClick={load} className="admin-button-primary">
          <Search className="w-4 h-4" /> Search
        </Button>
      </div>

      {/* Inquiry Table */}
      <div className="admin-card !p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mb-3 text-slate-300" />
            <p className="text-sm text-slate-400">No inquiries found</p>
          </div>
        ) : (
          <div className="responsive-table">
            <table className="w-full text-left table-striped">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 tracking-tight w-[30%]">Source</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 tracking-tight w-[25%]">Customer</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 tracking-tight w-[25%]">Details</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 tracking-tight w-[20%] text-right">Assignee & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((inq) => (
                  <tr key={inq.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => handleView(inq)}>
                    {/* Source Column */}
                    <td className="px-5 py-3.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${!inq.read ? 'bg-primary' : 'bg-emerald-500'}`} />
                          <span className="text-xs font-semibold text-primary hover:underline truncate">
                            {inq.tripTitle || 'General Inquiry'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 pl-3.5">
                          {formatDateTime(inq.createdAt)}
                        </p>
                        {inq.isDuplicate && (
                          <span className="text-[9px] font-bold bg-orange-100 text-orange-650 px-1.5 py-0.5 rounded-full ml-3.5 inline-block">DUPLICATE</span>
                        )}
                      </div>
                    </td>
                    {/* Customer Column */}
                    <td className="px-5 py-3.5">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-slate-800">{inq.name}</p>
                        {inq.email && (
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            {inq.email} <span className="text-slate-350">▼</span>
                          </p>
                        )}
                        {inq.phone && (
                          <p className="text-[11px] text-slate-550">{inq.phone}</p>
                        )}
                      </div>
                    </td>
                    {/* Details Column */}
                    <td className="px-5 py-3.5">
                      <div className="space-y-1">
                        {inq.date && (
                          <p className="text-[10px] font-semibold text-slate-400">
                            Preferred travel date
                          </p>
                        )}
                        {inq.date && (
                          <p className="text-xs font-medium text-slate-700">{formatDate(inq.date)}</p>
                        )}
                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1">
                          <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                          {inq.message ? (
                            <span className="truncate max-w-[180px]">{inq.message}</span>
                          ) : (
                            <span className="italic text-slate-400">(no comments)</span>
                          )}
                        </p>
                      </div>
                    </td>
                    {/* Assignee & Actions Column */}
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="admin-button-outline !h-8 px-2">
                              Actions <ChevronDown className="w-3 h-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => handleView(inq)}>
                              <Eye className="w-3.5 h-3.5 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(inq, 'contacted')}>
                              Mark as Active
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(inq, 'converted')}>
                              Mark as Won
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(inq, 'closed')}>
                              Mark as Lost
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(inq, 'archived')}>
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(inq, 'spam')} className="text-red-650">
                              Mark as Spam
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-end mt-4 text-xs text-slate-500 font-medium">
          Page 1 of {Math.ceil(filtered.length / 20)}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent aria-describedby="inquiry-details" className="max-w-lg w-[95%] max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="admin-heading">Inquiry from {selected?.name}</DialogTitle>
            <p id="inquiry-details" className="admin-label mt-1">Detailed view of lead information and sales history.</p>
          </DialogHeader>
          {selected && (
            <div className="space-y-5 pt-3">
              <div className="flex flex-col gap-2.5 text-sm">
                <div className="flex items-center gap-2 text-slate-600"><Mail className="h-4 w-4 text-slate-400" />{selected.email || 'No Email Provided'}</div>
                <div className="flex items-center gap-2 text-slate-600"><Phone className="h-4 w-4 text-slate-400" />{selected.phone}</div>
                <div className="flex items-center gap-2 text-slate-600"><Calendar className="h-4 w-4 text-slate-400" />{formatDateTime(selected.createdAt)}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <p className="admin-label">Travel Date</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{selected.date || 'Not specified'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <p className="admin-label">Travellers</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{selected.count || '1'}</p>
                </div>
              </div>
              {selected.tripTitle && (
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <p className="admin-label">Related Trip</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{selected.tripTitle}</p>
                </div>
              )}
              <div className="bg-[#FFF8E6] rounded-2xl p-5 border border-[#FFE0B2] space-y-4">
                <h4 className="text-xs font-semibold text-[#E65100] uppercase tracking-wide">CRM Action Panel</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-600">Status</label>
                    <select 
                      value={selected.status}
                      onChange={(e) => updateInquiry({ status: e.target.value as any })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-900"
                    >
                      <option value="new">New Lead</option>
                      <option value="contacted">In Discussion</option>
                      <option value="converted">Booking Done</option>
                      <option value="closed">Lost/Closed</option>
                    </select>
                  </div>
                  {selected.status === 'converted' && (
                    <div className="space-y-1.5">
                       <label className="text-[11px] font-medium text-slate-600">Revenue (₹)</label>
                       <input 
                         type="number"
                         placeholder="Enter Amount"
                         defaultValue={selected.convertedAmount}
                         onBlur={(e) => updateInquiry({ convertedAmount: Number(e.target.value) })}
                         className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-850"
                       />
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                   <label className="text-[11px] font-medium text-slate-600">Admin Notes</label>
                   <textarea 
                     className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 min-h-[80px]"
                     defaultValue={selected.adminNotes}
                     placeholder="Notes from call: customer budget, group dates..."
                     onBlur={(e) => updateInquiry({ adminNotes: e.target.value })}
                   />
                </div>
              </div>

              <div className="flex gap-3">
                 <Button className="flex-1 admin-button-primary h-11" onClick={() => { window.open(`tel:${selected.phone}`); updateInquiry({ status: 'contacted' }); }}>
                   <Phone className="h-4 w-4" /> Call Now
                 </Button>
                 <Button variant="outline" className="flex-1 admin-button-outline h-11" onClick={() => { window.open(`mailto:${selected.email}`); }}>
                   <Mail className="h-4 w-4" /> Email
                 </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
