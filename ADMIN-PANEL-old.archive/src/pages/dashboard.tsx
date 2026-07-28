import React, { useEffect, useState } from 'react';
import { dashboardService } from '@/services/dashboard.service';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, MapPin, CreditCard, CheckCircle } from 'lucide-react';

interface StatsData {
  overview: {
    trips: number;
    inquiries: number;
    bookings: number;
    travelers: number;
    users: number;
    revenue: number;
  };
  recentInquiries: any[];
  topTrips: any[];
  bookingStatusBreakdown: Record<string, number>;
  inquiryStatusBreakdown: Record<string, number>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  const analyticsData = Object.entries(stats.bookingStatusBreakdown).map(([status, count]) => ({
    name: status,
    value: count
  }));

  const inquiryData = Object.entries(stats.inquiryStatusBreakdown).map(([status, count]) => ({
    name: status,
    value: count
  }));

  return (
    <div className="p-8 background-white">
      <h1 className="text-4xl font-bold mb-8 text-gray-900">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Trips"
          value={stats.overview.trips}
          icon={<MapPin className="w-8 h-8" />}
          color="blue"
        />
        <StatCard
          title="Inquiries"
          value={stats.overview.inquiries}
          icon={<Users className="w-8 h-8" />}
          color="green"
        />
        <StatCard
          title="Bookings"
          value={stats.overview.bookings}
          icon={<CheckCircle className="w-8 h-8" />}
          color="purple"
        />
        <StatCard
          title="Travelers"
          value={stats.overview.travelers}
          icon={<Users className="w-8 h-8" />}
          color="orange"
        />
        <StatCard
          title="Revenue"
          value={`₹${(stats.overview.revenue / 100000).toFixed(1)}L`}
          icon={<CreditCard className="w-8 h-8" />}
          color="red"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Booking Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4 text-gray-900">Booking Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analyticsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Inquiry Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4 text-gray-900">Inquiry Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={inquiryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Trips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4 text-gray-900">Top Trips by Inquiries</h2>
          <div className="space-y-3">
            {stats.topTrips.slice(0, 5).map((trip, index) => (
              <div key={trip.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <span className="font-semibold text-gray-800">{trip.title}</span>
                </div>
                <div className="text-sm font-bold text-primary">{trip.inquiriesCount} inquiries</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Inquiries */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4 text-gray-900">Recent Inquiries</h2>
          <div className="space-y-3">
            {stats.recentInquiries.slice(0, 5).map((inquiry) => (
              <div key={inquiry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{inquiry.name}</p>
                  <p className="text-xs text-gray-500">{inquiry.trip.title}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  inquiry.status === 'BOOKED' ? 'bg-green-100 text-green-800' :
                  inquiry.status === 'CONTACTED' ? 'bg-blue-100 text-blue-800' :
                  inquiry.status === 'NEGOTIATING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {inquiry.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className={`p-6 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} border border-gray-100`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="opacity-20">{icon}</div>
      </div>
    </div>
  );
}
