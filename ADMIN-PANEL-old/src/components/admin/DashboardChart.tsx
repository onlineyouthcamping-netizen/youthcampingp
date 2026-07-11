import { memo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

const DashboardChart = memo(function DashboardChart({ data }: { data: MonthlyRevenue[] }) {
  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g. "2026-07"

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <defs>
          <pattern id="colorInProgress" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y="0" x2="0" y2="8" stroke="#FF5400" strokeWidth="2.5" opacity="0.4" />
          </pattern>
        </defs>
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
        <Bar dataKey="revenue" fill="#FF5400" radius={[12, 12, 0, 0]} barSize={40} minPointSize={8}>
          {data.map((entry, index) => {
            const isCurrentMonth = entry.month === currentMonthStr || index === data.length - 1;
            return (
              <Cell 
                key={`cell-${index}`} 
                fill={isCurrentMonth ? "url(#colorInProgress)" : "#FF5400"}
                stroke={isCurrentMonth ? "#FF5400" : "none"}
                strokeDasharray={isCurrentMonth ? "3 3" : undefined}
                strokeWidth={isCurrentMonth ? 1.5 : 0}
              />
            );
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

export default DashboardChart;
