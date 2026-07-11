import { useEffect, useState, useCallback } from "react";
import { quotationsService } from "@/services/quotations.service";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, FileText, Calendar, User, MapPin, Share2, Clock, Copy } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await quotationsService.getAll({ page, limit: pageSize, search });
      const currentTotalPages = res.pagination?.totalPages || 0;
      
      // Safety Clamp: If filters reduce available results and current page is greater than totalPages
      if (currentTotalPages > 0 && page > currentTotalPages) {
        setPage(1);
        return;
      }
      
      setQuotations(Array.isArray(res.data) ? res.data : []);
      setTotalCount(res.pagination?.totalCount || 0);
      setTotalPages(currentTotalPages);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load quotations");
      setQuotations([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this quotation?")) return;
    try {
      await quotationsService.remove(id);
      toast.success("Quotation deleted");
      load();
    } catch (err) {
      toast.error("Failed to delete quotation");
    }
  };

  const handleExtend = async (id: string) => {
    try {
      await quotationsService.extend(id, 48);
      toast.success("Validity extended by 48 hours");
      load();
    } catch (err) {
      toast.error("Failed to extend validity");
    }
  };

  const handleCopy = (q: any) => {
    const baseUrl = import.meta.env.VITE_FRONTEND_URL || 'https://youthcamping.online';
    const tokenPart = q.shareToken ? `?token=${q.shareToken}` : '';
    const url = `${baseUrl}/quote/${q.slug || q.id}${tokenPart}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const columns = [
    { key: "customerName", header: "Client", render: (q: any) => (
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase">
          {q.customerName?.charAt(0) || <User className="h-5 w-5" />}
        </div>
        <div>
          <p className="font-medium text-card-foreground">{q.customerName || "No Name"}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
             <Calendar className="h-3 w-3" /> {new Date(q.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    )},
    { key: "destination", header: "Destination", render: (q: any) => (
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        {q.destination}
      </div>
    )},
    { key: "price", header: "Total Price", render: (q: any) => (
      <div className="flex flex-col">
        <span className="font-bold">₹{q.finalPrice?.toLocaleString() || "0"}</span>
        {q.discount > 0 && <span className="text-[10px] text-emerald-600 font-bold">Saved ₹{q.discount.toLocaleString()}</span>}
      </div>
    )},
    { key: "validity", header: "Validity", render: (q: any) => {
      if (!q.expiresAt) return <StatusBadge variant="secondary">No Expiry</StatusBadge>;
      const isExpired = new Date() > new Date(q.expiresAt);
      const isUrgent = !isExpired && (new Date(q.expiresAt).getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000;
      
      if (isExpired) return <StatusBadge variant="destructive">Expired</StatusBadge>;
      if (isUrgent) return <StatusBadge className="bg-orange-100 text-orange-600 hover:bg-orange-100 border-none">Urgent</StatusBadge>;
      return <StatusBadge className="bg-emerald-100 text-emerald-600 hover:bg-emerald-100 border-none">Active</StatusBadge>;
    }},
    { key: "status", header: "Status", render: (q: any) => (
      <StatusBadge variant={q.status === 'Draft' ? 'secondary' : 'default'}>{q.status}</StatusBadge>
    )},
    { key: "actions", header: "", render: (q: any) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => handleCopy(q)} title="Copy Public Link">
          <Copy className="h-4 w-4 text-emerald-600" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => {
          const baseUrl = import.meta.env.VITE_FRONTEND_URL || 'https://youthcamping.online';
          const tokenPart = q.shareToken ? `?token=${q.shareToken}` : '';
          window.open(`${baseUrl}/quote/${q.slug || q.id}${tokenPart}`, '_blank');
        }} title="Preview Quote">
          <Share2 className="h-4 w-4 text-primary" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => handleExtend(q.id)} title="Extend Validity (48h)">
          <Clock className="h-4 w-4 text-orange-500" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/quotations/${q.id}`)} title="Edit Quote">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => handleDelete(q.id)} className="text-destructive" title="Delete Quote">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-[#F4F7FB] min-h-screen -mx-6 -my-6">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-[#F97316]" />
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Quotations</h1>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Dynamic Proposal Maker</p>
          </div>
        </div>
        <Button 
          onClick={() => navigate("/admin/quotations/new")} 
          className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Create Proposal
        </Button>
      </div>

      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4">
        <DataTable
          columns={columns} data={quotations} loading={loading}
          searchKey="clientName" searchPlaceholder="Search by client name..."
          emptyMessage="No quotations generated yet" 
          emptyIcon={<FileText className="h-8 w-8 text-slate-400" />}
          serverSide={true}
          totalCount={totalCount}
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          onSearchChange={handleSearchChange}
        />
      </div>
    </div>
  );
}
