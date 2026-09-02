import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Package, ShoppingBag, Star, TrendingUp, Clock, CheckCircle, Plus, ArrowRight } from 'lucide-react';
import { ErrorState, PageLoader } from '../../components/StateViews';
import { StatCard } from '../../components/Ui';
import SellerApprovalBanner from '../../components/SellerApprovalBanner';
import { formatCurrency } from '../../lib/format';

export default function SellerDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = () => {
    setLoading(true);
    setFailed(false);
    api
      .get('/seller/dashboard')
      .then((r) => setStats(r.data))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <PageLoader label="Loading your dashboard..." />;

  if (failed)
    return (
      <ErrorState
        message="We could not load your seller dashboard. Your seller account may still be awaiting approval — or your session may have expired. Please re-login if the issue persists."
        onRetry={load}
      />
    );

  const cards = [
    { label: 'Total Products', value: stats?.totalProducts ?? 0, icon: <Package size={22} />, gradient: 'from-emerald-500 to-teal-500', hint: 'Listed on the marketplace' },
    { label: 'Total Orders', value: stats?.totalOrders ?? 0, icon: <ShoppingBag size={22} />, gradient: 'from-blue-500 to-indigo-500', hint: 'Items ordered from you' },
    { label: 'Pending Orders', value: stats?.pendingOrders ?? 0, icon: <Clock size={22} />, gradient: 'from-amber-500 to-orange-500', hint: 'Awaiting fulfilment' },
    { label: 'Delivered', value: stats?.deliveredOrders ?? 0, icon: <CheckCircle size={22} />, gradient: 'from-teal-500 to-emerald-600', hint: 'Completed deliveries' },
    { label: 'Revenue', value: formatCurrency(stats?.totalRevenue), icon: <TrendingUp size={22} />, gradient: 'from-violet-500 to-purple-600', hint: 'From completed payments' },
    {
      label: 'Avg Rating',
      value: stats?.averageRating != null ? Number(stats.averageRating).toFixed(1) : '0.0',
      icon: <Star size={22} />,
      gradient: 'from-primary-500 to-primary-700',
      hint: 'Across all your books',
    },
  ];

  return (
    <div className="animate-fade-in">
      <SellerApprovalBanner />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-surface-900 mb-1">Seller Dashboard</h1>
          <p className="text-surface-400">Here is how your store is performing.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/seller/products" className="btn-primary btn-sm">
            <Plus size={14} /> Add Product
          </Link>
          <Link to="/seller/orders" className="btn-secondary btn-sm">
            View Orders <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} gradient={c.gradient} hint={c.hint} />
        ))}
      </div>
    </div>
  );
}