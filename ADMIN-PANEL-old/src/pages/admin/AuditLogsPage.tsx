import { useState, useEffect } from "react";
import { adminUsersService } from "@/services/adminUsers.service";
import { AuditLog } from "@/types";
import { 
  FileText, 
  Loader2, 
  Search, 
  User, 
  Globe, 
  Clock, 
  Database,
  ArrowRight,
  Eye
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Detail Modal State
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const data = await adminUsersService.listAuditLogs();
      setLogs(data);
    } catch (error: any) {
      console.error("Failed to fetch audit logs:", error);
      toast.error(error.response?.data?.message || "Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      (log.actorUserId && log.actorUserId.toLowerCase().includes(term)) ||
      (log.entityType && log.entityType.toLowerCase().includes(term)) ||
      (log.entityId && log.entityId.toLowerCase().includes(term)) ||
      (log.ipAddress && log.ipAddress.toLowerCase().includes(term))
    );
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes("failed")) return "bg-rose-500 hover:bg-rose-600";
    if (action.includes("created") || action.includes("publish")) return "bg-emerald-500 hover:bg-emerald-600";
    if (action.includes("delete") || action.includes("deactivated")) return "bg-red-500 hover:bg-red-600";
    if (action.includes("change") || action.includes("reset") || action.includes("update")) return "bg-amber-500 hover:bg-amber-600";
    return "bg-slate-500 hover:bg-slate-600";
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-[#F4F7FB] min-h-screen -mx-6 -my-6">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-[#F97316]" />
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Audit Trail</h1>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Real-time recording of admin actions, security alterations and mutations</p>
          </div>
        </div>
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit trail..."
            className="rounded-[4px] pl-8 border-[#E2E8F0] h-8.5 text-xs font-medium placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-[4px] overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 border-b border-[#E2E8F0]">
              <TableRow>
                <TableHead className="font-bold uppercase tracking-wider text-[9px] text-slate-400 py-3 pl-6">Timestamp</TableHead>
                <TableHead className="font-bold uppercase tracking-wider text-[9px] text-slate-400 py-3">Actor</TableHead>
                <TableHead className="font-bold uppercase tracking-wider text-[9px] text-slate-400 py-3">Action performed</TableHead>
                <TableHead className="font-bold uppercase tracking-wider text-[9px] text-slate-400 py-3">Target Entity</TableHead>
                <TableHead className="font-bold uppercase tracking-wider text-[9px] text-slate-400 py-3">IP Address</TableHead>
                <TableHead className="font-bold uppercase tracking-wider text-[9px] text-slate-400 py-3 pr-6 text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors border-b border-[#E2E8F0]">
                  <TableCell className="font-semibold text-xs py-3 pl-6 text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="font-bold text-xs text-slate-700 py-3">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {log.actorUserId || 'System'}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge className={`${getActionBadgeColor(log.action)} text-white font-bold uppercase text-[8px] tracking-wider px-2 py-0.5 rounded-[4px]`}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-slate-600 py-3">
                    {log.entityType ? (
                      <span className="flex items-center gap-1">
                        <Database className="w-3.5 h-3.5 text-slate-450" />
                        <span className="capitalize">{log.entityType}</span>
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-500 py-3">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      {log.ipAddress || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-3 pr-6">
                    <Button 
                      onClick={() => {
                        setSelectedLog(log);
                        setDetailsOpen(true);
                      }}
                      variant="ghost" 
                      size="icon" 
                      className="rounded-[4px] h-8 w-8 hover:bg-slate-50 border border-slate-100"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-400 text-xs font-semibold">
                    No matching audit records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Details View Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[4px] border border-[#E2E8F0] p-5 bg-white max-h-[85vh] overflow-y-auto shadow-sm">
          <DialogHeader className="border-b border-[#E2E8F0] pb-3">
            <DialogTitle className="font-bold uppercase tracking-tight text-sm flex items-center gap-2 text-slate-800">
              <FileText className="w-4 h-4 text-primary-orange" /> Audit Record Details
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-semibold mt-1">
              Action performed: <span className="font-bold text-slate-800">{selectedLog?.action}</span>
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 py-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-2 gap-4 border-b border-[#E2E8F0] pb-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Log ID</p>
                  <p className="font-mono text-[11px] text-slate-800">{selectedLog.id}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Timestamp</p>
                  <p className="text-[11px] text-slate-800">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Actor ID</p>
                  <p className="font-mono text-[11px] text-slate-800">{selectedLog.actorUserId || 'System'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">IP Address</p>
                  <p className="font-mono text-[11px] text-slate-800">{selectedLog.ipAddress || 'N/A'}</p>
                </div>
              </div>

              {selectedLog.entityType && (
                <div className="border-b border-[#E2E8F0] pb-4">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Target Resource</p>
                  <p className="text-[11px] text-slate-800 flex items-center gap-1.5">
                    <span className="font-bold capitalize">{selectedLog.entityType}</span>
                    <span className="text-slate-450 font-medium">({selectedLog.entityId})</span>
                  </p>
                </div>
              )}

              {selectedLog.beforeData && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">State Before Mutation</p>
                  <pre className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] p-3 font-mono text-[10px] overflow-x-auto text-slate-700 max-h-48">
                    {JSON.stringify(selectedLog.beforeData, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.afterData && (
                <div className="pt-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">State After Mutation</p>
                  <pre className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] p-3 font-mono text-[10px] overflow-x-auto text-slate-700 max-h-48">
                    {JSON.stringify(selectedLog.afterData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button 
              onClick={() => {
                setDetailsOpen(false);
                setSelectedLog(null);
              }} 
              className="rounded-[4px] font-semibold text-xs h-8.5 w-full bg-primary-orange hover:bg-primary-orange/90 text-white"
            >
              Close Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
