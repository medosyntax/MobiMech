import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import {
  CalendarCheck, Users, DollarSign, Clock, TrendingUp, AlertCircle, Car, Wrench,
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }) {
  const colors = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-700',
  };
  return (
    <div className="card flex items-start gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-navy-700">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!stats) return <p className="text-red-500">Failed to load dashboard data.</p>;

  const { overview, statusBreakdown, recentBookings, popularServices } = stats;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-700 mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={CalendarCheck} label="Total Bookings" value={overview.totalBookings} color="brand" />
        <StatCard icon={Clock} label="Today's Bookings" value={overview.todayBookings} sub={`${overview.upcomingBookings} upcoming`} color="blue" />
        <StatCard icon={Users} label="Customers" value={overview.totalCustomers} sub={`${overview.totalVehicles} vehicles`} color="purple" />
        <StatCard icon={DollarSign} label="Revenue" value={`$${overview.totalRevenue.toFixed(2)}`} sub={`${overview.unpaidInvoices} unpaid ($${overview.unpaidAmount.toFixed(2)})`} color="green" />
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {statusBreakdown.map((s) => (
          <Link
            key={s.status}
            to={`/admin/bookings?status=${s.status}`}
            className="card text-center hover:shadow-md transition-shadow py-4"
          >
            <StatusBadge status={s.status} />
            <p className="text-2xl font-bold text-navy-700 mt-2">{s.count}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent bookings */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-navy-700">Recent Bookings</h2>
            <Link to="/admin/bookings" className="text-sm text-brand-500 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {recentBookings.map((b) => (
              <Link
                key={b.id}
                to={`/admin/bookings/${b.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-navy-700">{b.reference_number}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{b.customer_name} · {b.vehicle_year} {b.vehicle_make} {b.vehicle_model}</p>
                </div>
                <div className="text-right text-sm shrink-0">
                  <p className="text-gray-500">{b.scheduled_date}</p>
                  {b.estimated_cost && <p className="font-medium text-brand-600">${b.estimated_cost.toFixed(2)}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Popular services */}
        <div className="card">
          <h2 className="text-lg font-semibold text-navy-700 mb-4">Popular Services</h2>
          <div className="space-y-3">
            {popularServices.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-sm text-navy-700">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.category}</p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">{s.booking_count} bookings</p>
                  <p className="text-gray-400">${s.total_revenue?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
