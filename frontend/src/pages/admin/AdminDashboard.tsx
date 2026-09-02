import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Users, Package, ShoppingBag, Store, Clock } from 'lucide-react';
import { ErrorState, PageLoader } from '../../components/StateViews';
import { StatCard } from '../../components/Ui';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = () => {
    setLoading(true);
    setFailed(false);
    api
      .get('/admin/dashboard')
      .then((r) => setStats(r.data))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <PageLoader label="Loading platform stats..." />;

  if (failed)
    return <ErrorState message="We could not load the dashboard. Please try again." onRetry={load} />;

  const cards = [
    { label: 'Total Customers', value: stats?.totalCustomers ?? 0, icon: <Users size={22} />, gradient: 'from-blue-500 to-indigo-500' },
    { label: 'Sellers', value: stats?.totalSellers ?? 0, icon: <Store size={22} />, gradient: 'from-amber-500 to-orange-500' },
    { label: 'Pending Approvals', value: stats?.pendingApprovals ?? 0, icon: <Clock size={22} />, gradient: 'from-rose-500 to-red-500' },
    { label: 'Products', value: stats?.totalProducts ?? 0, icon: <Package size={22} />, gradient: 'from-emerald-500 to-teal-500' },
    { label: 'Orders', value: stats?.totalOrders ?? 0, icon: <ShoppingBag size={22} />, gradient: 'from-primary-500 to-primary-700' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-surface-900 mb-1">Admin Dashboard</h1>
        <p className="text-surface-400">Platform overview at a glance.</p>
      </div>

      {(stats?.pendingApprovals ?? 0) > 0 && (
        <Link
          to="/admin/sellers?status=PENDING"
          className="mb-6 flex items-center gap-3 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-2xl p-4 px-6 shadow-glow-accent hover:-translate-y-0.5 transition-transform"
        >
          <Clock size={20} />
          <p className="font-semibold text-sm">
            {stats.pendingApprovals} seller application{stats.pendingApprovals !== 1 ? 's' : ''} awaiting your approval
          </p>
          <span className="ml-auto text-sm font-bold">Review →</span>
        </Link>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} gradient={c.gradient} />
        ))}
      </div>
    </div>
  );
}