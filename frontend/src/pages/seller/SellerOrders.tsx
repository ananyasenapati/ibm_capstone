import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Package, Truck, CheckCircle, Clock, XCircle, BookOpen, Loader2, RefreshCw } from 'lucide-react';
import { EmptyState, ErrorState, PageLoader } from '../../components/StateViews';
import { OrderStatusBadge, Pagination } from '../../components/Ui';
import { asArray, formatCurrency, formatDate } from '../../lib/format';
import { getErrorMessage } from '../../services/api';
import SellerApprovalBanner from '../../components/SellerApprovalBanner';

const STATUS_FLOW: Record<string, { label: string; next: string; icon: React.ReactNode } | undefined> = {
  PLACED: { label: 'Confirm', next: 'CONFIRMED', icon: <CheckCircle size={13} /> },
  CONFIRMED: { label: 'Ship', next: 'SHIPPED', icon: <Truck size={13} /> },
  PROCESSING: { label: 'Ship', next: 'SHIPPED', icon: <Truck size={13} /> },
  SHIPPED: { label: 'Mark Delivered', next: 'DELIVERED', icon: <CheckCircle size={13} /> },
};

const TERMINAL_ICONS: Record<string, React.ReactNode> = {
  PLACED: <Clock size={14} className="text-sky-500" />,
  CONFIRMED: <Clock size={14} className="text-amber-500" />,
  SHIPPED: <Truck size={14} className="text-blue-500" />,
  DELIVERED: <CheckCircle size={14} className="text-emerald-500" />,
  CANCELLED: <XCircle size={14} className="text-red-500" />,
};

export default function SellerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    setFailed(false);
    api
      .get(`/seller/orders?page=${page}&size=10`)
      .then((r) => {
        setOrders(asArray<any>(r.data));
        setTotalPages(r.data.totalPages || 0);
        setTotalElements(r.data.totalElements || 0);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page]);

  const updateStatus = async (orderId: number, status: string) => {
    setUpdatingId(orderId);
    try {
      await api.put(`/seller/orders/${orderId}/status`, { status });
      toast.success(`Order marked as ${status.toLowerCase()}`);
      load();
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to update order'));
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <PageLoader label="Loading orders..." />;

  if (failed)
    return <ErrorState message="We could not load your orders. Please try again." onRetry={load} />;

  return (
    <div className="animate-fade-in">
      <SellerApprovalBanner />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-surface-900 mb-1">Orders</h1>
          <p className="text-surface-400">{totalElements} order{totalElements !== 1 ? 's' : ''} containing your products</p>
        </div>
        <button onClick={load} className="btn-secondary btn-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<Package size={40} className="text-surface-300" />}
          title="No orders yet"
          description="Orders for your products will appear here."
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => {
            const next = STATUS_FLOW[order.status];
            return (
              <div key={`${order.orderId}-${order.productName}`} className="card p-5 hover:border-primary-200 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs text-surface-400 uppercase tracking-wide">Order</p>
                    <p className="font-bold text-surface-800">{order.orderNumber || `#${order.orderId}`}</p>
                    <p className="text-xs text-surface-400 mt-0.5">{formatDate(order.createdAt, true)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    {next && (
                      <button
                        onClick={() => updateStatus(order.orderId, next.next)}
                        disabled={updatingId === order.orderId}
                        className="btn-primary btn-sm"
                      >
                        {updatingId === order.orderId ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          next.icon
                        )}
                        {next.label}
                      </button>
                    )}
                    {['PLACED', 'CONFIRMED', 'PROCESSING'].includes(order.status) && (
                      <button
                        onClick={() => updateStatus(order.orderId, 'CANCELLED')}
                        disabled={updatingId === order.orderId}
                        className="btn-secondary btn-sm text-red-500 border-red-200 hover:bg-red-50"
                      >
                        <XCircle size={13} /> Cancel
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 bg-surface-50 rounded-xl">
                  <div className="w-11 h-11 bg-white rounded-lg flex items-center justify-center shrink-0 border border-surface-100">
                    <BookOpen size={18} className="text-surface-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-surface-800 truncate">{order.productName || 'Product'}</p>
                    <p className="text-sm text-surface-400">
                      Customer: <span className="text-surface-600 font-medium">{order.customerName}</span>
                      {' · '}Qty: {order.quantity}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-surface-400">Item total</p>
                    <p className="font-bold text-surface-800">{formatCurrency(order.totalPrice)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}