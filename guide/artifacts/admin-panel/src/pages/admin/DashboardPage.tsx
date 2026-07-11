import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/admin/KPICard";
import { StatusBadge, getBookingBadgeVariant } from "@/components/admin/StatusBadge";
import { dashboardService } from "@/services/dashboard.service";
import type { DashboardStats } from "@/types";
import { CalendarCheck, DollarSign, TrendingUp, AlertTriangle, Star } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getStats().then((data) => {
      setStats(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const profit = stats?.totalProfit ?? 0;
  const profitMargin = stats?.totalRevenue && stats.totalRevenue > 0
    ? Math.round((profit / stats.totalRevenue) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Page Title ─── */}
      <div className="space-y-1">
        <h1 className="admin-title">Dashboard Overview</h1>
        <p className="admin-body">Business insights and real-time analytics</p>
      </div>

      {/* ─── Primary KPIs ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Revenue" value={`₹${(Number(stats?.totalRevenue) || 0).toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} change="Total" loading={loading} />
        <KPICard title="Pending Payments" value={`₹${(Number(stats?.pendingPayments) || 0).toLocaleString()}`} icon={<AlertTriangle className="h-5 w-5" />} change="Alert" loading={loading} />
        <KPICard title="Total Profit" value={`₹${profit.toLocaleString()}`} icon={<TrendingUp className="h-5 w-5" />} change={`${profitMargin}% margin`} loading={loading} />
        <KPICard title="Bookings" value={stats?.totalBookings ?? 0} icon={<CalendarCheck className="h-5 w-5" />} change="Completed" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-2 admin-card">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <p className="admin-label">Revenue Stream</p>
              <h3 className="admin-card-title">Monthly Performance</h3>
            </div>
            <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center text-primary">
               <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={stats?.monthlyRevenue ?? []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                fontSize={10} 
                fontWeight="500" 
                tick={{fill: '#94A3B8'}} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                fontSize={10} 
                fontWeight="500" 
                tick={{fill: '#94A3B8'}}
                dx={-10}
              />
              <Tooltip 
                cursor={{fill: '#F8FAFC'}} 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: '1px solid #E2E8F0', 
                  boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                  padding: '12px 16px'
                }} 
              />
              <Bar dataKey="revenue" fill="#FF5400" radius={[12, 12, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sales Leaderboard */}
        <div className="admin-card flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <p className="admin-label">Leaderboard</p>
              <h3 className="admin-card-title">Top Agents</h3>
            </div>
            <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center text-primary">
               <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 no-scrollbar">
            {stats?.leaderboard?.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between group cursor-default">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-orange-50 flex items-center justify-center text-[11px] font-bold text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    0{i + 1}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[13px] font-semibold text-slate-900">{s.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{s.conversion}% Conversion</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-semibold text-slate-900">₹{s.revenue.toLocaleString()}</p>
                  <p className="text-[9px] text-slate-400 font-medium">{s.accepted}/{s.total} Trx</p>
                </div>
              </div>
            ))}
            {(!stats?.leaderboard || stats.leaderboard.length === 0) && (
              <div className="text-center py-20 text-slate-300 text-xs font-medium italic">No sales activity yet</div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Profit Summary ─── */}
      <div className="admin-card">
        <div className="flex items-center gap-2 mb-6">
           <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
           <h3 className="admin-card-title">Financial Performance</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-50 rounded-xl space-y-3 border border-transparent hover:border-slate-100 transition-all">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Gross Revenue</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">₹{(Number(stats?.totalRevenue) || 0).toLocaleString()}</span>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">+12%</span>
            </div>
          </div>
          <div className="p-6 bg-slate-50 rounded-xl space-y-3 border border-transparent hover:border-slate-100 transition-all">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Operating Costs</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">₹{(Number(stats?.totalVendorCost) || 0).toLocaleString()}</span>
            </div>
          </div>
          <div className="p-6 bg-primary rounded-xl space-y-3 shadow-luxury relative overflow-hidden group">
            <div className="absolute right-0 top-0 opacity-10 -mr-8 -mt-8 w-32 h-32 bg-white rounded-full group-hover:scale-150 transition-transform duration-1000" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Net Profit</p>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="text-2xl font-bold text-white">₹{profit.toLocaleString()}</span>
              <span className="text-[10px] font-bold text-white bg-white/20 px-2 py-0.5 rounded-full">{profitMargin}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Recent Activity Table ─── */}
      <div className="admin-card overflow-hidden !p-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-slate-900">Recent Bookings</p>
          </div>
          <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-primary h-8 px-3">View All</Button>
        </div>
        <div className="responsive-table">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Guest Name</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Expedition</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Value</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Payment</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recentBookings?.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded bg-orange-50 flex items-center justify-center text-[10px] font-bold text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                        {b.userName.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold text-slate-800">{b.userName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{b.tripTitle}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900 text-xs">₹{b.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                       <div className={`w-1.5 h-1.5 rounded-full ${(b.paidAmount || 0) >= b.amount ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                       <span className="text-xs font-semibold text-slate-900">₹{(b.paidAmount || 0).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={getBookingBadgeVariant(b.status)} className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">{b.status}</StatusBadge>
                  </td>
                </tr>
              ))}
              {(!stats?.recentBookings || stats.recentBookings.length === 0) && (
                <tr>
                   <td colSpan={5} className="px-4 py-12 text-center">
                     <div className="space-y-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mx-auto text-slate-300">
                           <CalendarCheck className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-medium text-slate-400 italic">No recent transactions found</p>
                     </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
