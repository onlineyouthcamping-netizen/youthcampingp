import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchKey?: keyof T;
  filters?: { key: string; label: string; options: { label: string; value: string }[] }[];
  onFilterChange?: (key: string, value: string) => void;
  pageSize?: number;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  rowKey?: keyof T;
  serverSide?: boolean;
  totalCount?: number;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSearchChange?: (search: string) => void;
}

export function DataTable<T extends Record<string, any>>({
  columns, data = [], loading, searchPlaceholder = "Search records...", searchKey,
  filters, onFilterChange, pageSize = 10, emptyMessage = "No records found", emptyIcon,
  rowKey = "id" as keyof T,
  serverSide = false,
  totalCount = 0,
  page = 1,
  totalPages = 0,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
}: DataTableProps<T>) {
  const [localSearch, setLocalSearch] = useState("");
  const [localPage, setLocalPage] = useState(0);

  const activePage = serverSide ? page : localPage;
  const activePageSize = pageSize;

  const filtered = useMemo(() => {
    return serverSide
      ? data
      : (data || []).filter((item) => {
          if (!searchKey || !localSearch) return true;
          const value = item[searchKey];
          return String(value || "").toLowerCase().includes(localSearch.toLowerCase());
        });
  }, [serverSide, data, searchKey, localSearch]);

  const computedTotalPages = serverSide ? totalPages : Math.ceil(filtered.length / activePageSize);
  
  const paged = useMemo(() => {
    return serverSide ? data : filtered.slice(activePage * activePageSize, (activePage + 1) * activePageSize);
  }, [serverSide, data, filtered, activePage, activePageSize]);

  const totalItemsCount = serverSide ? totalCount : filtered.length;

  const handlePageChange = (newPage: number) => {
    if (serverSide) {
      onPageChange?.(newPage);
    } else {
      setLocalPage(newPage);
    }
  };

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    if (!serverSide) {
      setLocalPage(0);
    }
  };

  // Reusable optional server-side debounce
  useEffect(() => {
    if (!serverSide) return;
    const handler = setTimeout(() => {
      onSearchChange?.(localSearch);
    }, 400);
    return () => clearTimeout(handler);
  }, [localSearch, serverSide, onSearchChange]);

  const renderCellValue = (item: T, col: Column<T>) => {
    if (col.render) return col.render(item);
    const value = item[col.key];
    if (value === null || value === undefined) return "";
    return String(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {searchKey && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input 
              placeholder={searchPlaceholder} 
              value={localSearch} 
              onChange={(e) => handleSearchChange(e.target.value)} 
              className="pl-9 h-8 rounded-[4px] bg-white border-slate-200 focus-visible:ring-primary font-medium text-xs" 
            />
          </div>
        )}
        {filters?.map((f) => (
          <Select key={f.key} defaultValue="all" onValueChange={(v) => onFilterChange?.(f.key, v)}>
            <SelectTrigger className="w-full sm:w-[150px] h-8 rounded-[4px] bg-white border-slate-200 font-semibold text-xs text-slate-650">
              <SelectValue placeholder={f.label} />
            </SelectTrigger>
            <SelectContent className="rounded-[4px] border-slate-200">
              <SelectItem value="all" className="font-semibold text-xs">All {f.label}</SelectItem>
              {f.options.map((o) => (
                <SelectItem key={o.value} value={o.value} className="font-semibold text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-[4px] shadow-sm overflow-hidden">
        <div className="responsive-table">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-slate-50/70">
                {columns.map((col) => (
                  <th key={col.key} className={cn("px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider", col.className)}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-slate-700">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div className="h-3.5 bg-slate-50 animate-pulse rounded w-full max-w-[120px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-[4px] bg-slate-50 flex items-center justify-center text-slate-350 border border-slate-100">
                        {emptyIcon || <Search className="w-5 h-5" />}
                      </div>
                      <p className="text-xs font-semibold text-slate-400 italic">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((item, i) => (
                  <tr key={String(item[rowKey] || i)} className="hover:bg-slate-50/50 transition-colors group">
                    {columns.map((col) => (
                      <td key={col.key} className={cn("px-4 py-2.5 text-slate-650 font-semibold", col.className)}>
                        {renderCellValue(item, col)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(serverSide ? totalItemsCount > 0 : computedTotalPages > 1) && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-2">
          <p className="text-[11px] font-bold text-[#74839A] uppercase tracking-wider">
            Showing {serverSide ? (totalItemsCount === 0 ? 0 : (activePage - 1) * activePageSize + 1) : (filtered.length === 0 ? 0 : activePage * activePageSize + 1)}–{serverSide ? Math.min(activePage * activePageSize, totalItemsCount) : Math.min((activePage + 1) * activePageSize, filtered.length)} of {totalItemsCount}
          </p>
          <div className="flex items-center gap-3">
            {serverSide && onPageSizeChange && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500">Rows per page:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => onPageSizeChange(Number(val))}
                >
                  <SelectTrigger className="w-[64px] h-7 rounded-[4px] bg-white border-slate-200 font-semibold text-xs text-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-[4px] border-slate-200">
                    <SelectItem value="25" className="font-semibold text-xs">25</SelectItem>
                    <SelectItem value="50" className="font-semibold text-xs">50</SelectItem>
                    <SelectItem value="100" className="font-semibold text-xs">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-1.5">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => handlePageChange(activePage - 1)} 
                disabled={serverSide ? activePage <= 1 : activePage === 0}
                className="h-7 w-7 rounded-[4px] border-slate-200 hover:bg-slate-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => handlePageChange(activePage + 1)} 
                disabled={serverSide ? activePage >= computedTotalPages : activePage >= computedTotalPages - 1}
                className="h-7 w-7 rounded-[4px] border-slate-200 hover:bg-slate-50"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
