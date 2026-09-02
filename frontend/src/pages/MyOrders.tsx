import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Package, BookOpen, XCircle, Loader2 } from 'lucide-react';
import { EmptyState, ErrorState, PageLoader } from '../components/StateViews';
import { OrderStatusBadge, Pagination } from '../components/Ui';
import { asArray, formatCurrency, formatDate } from '../lib/format';
import { getErrorMessage } from '../services/api';

export default function MyOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    setFailed(false);
    api
      .get(`/orders?page=${page}&size=10`)
      .then((r) => {
        setOrders(asArray<any>(r.data));
        setTotalPages(r.data.totalPages || 0);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page]);

  const cancelOrder = async (id: number) => {
    if (!confirm('Cancel this order?')) return;
    setCancellingId(id);
    try {
      await api.post(`/orders/${id}/cancel`);
      toast.success('Order cancelled');
      load();
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to cancel order'));
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return <PageLoader />;

  if (failed)
    return <ErrorState message="We could not load your orders. Please try again." onRetry={load} />;

  if (orders.length === 0)
    return (
      <EmptyState
        icon={<Package size={40} className="text-surface-300" />}
        title="No orders yet"
        description="Start shopping to see your orders here."
        action={<Link to="/catalogue" className="btn-primary">Browse Books</Link>}
      />
    );

  const canCancel = (order: any) =>
    ['PLACED', 'CONFIRMED'].includes(order.status);

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-surface-900 mb-8">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order: any) => (
          <div key={order.id} className="card p-6 hover:border-primary-200 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs text-surface-400 uppercase tracking-wide">Order</p>
                <p className="font-bold text-surface-800">{order.orderNumber || `#${order.id}`}</p>
                <p className="text-xs text-surface-400 mt-0.5">Placed on {formatDate(order.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <OrderStatusBadge status={order.status} />
                {canCancel(order) && (
                  <button
                    onClick={() => cancelOrder(order.id)}
                    disabled={cancellingId === order.id}
                    className="btn-secondary btn-sm text-red-500 border-red-200 hover:bg-red-50"
                  >
                    {cancellingId === order.id ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {asArray<any>(order.items).length > 0 && (
              <div className="space-y-3">
                {asArray<any>(order.items).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-surface-50 rounded-xl">
                    <div className="w-14 h-20 bg-white rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-surface-100">
                      {item.productImage ? (
                        <img src={item.productImage} className="w-full h-full object-cover rounded-lg" alt={item.productName} />
                      ) : (
                        <BookOpen size={20} className="text-surface-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/products/${item.productId}`} className="font-semibold text-surface-800 truncate block hover:text-primary-600 transition-colors">
                        {item.productName || 'Product'}
                      </Link>
                      <p className="text-sm text-surface-400">
                        Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                        {item.sellerName ? ` · Sold by ${item.sellerName}` : ''}
                      </p>
                    </div>
                    <span className="font-semibold text-surface-800">{formatCurrency(item.totalPrice)}</span>
                  </div>
                ))}
              </div>
            )}

            {order.address && (
              <div className="mt-4 pt-3 border-t border-surface-100 text-sm text-surface-500">
                <span className="font-medium text-surface-600">Deliver to: </span>
                {order.address}
              </div>
            )}

            <div className="flex flex-wrap justify-end items-center gap-x-6 gap-y-1 mt-4 pt-3 border-t border-surface-100 text-sm">
              {Number(order.giftPointsUsed) > 0 && (
                <span className="text-surface-400">Gift points used: {order.giftPointsUsed}</span>
              )}
              {Number(order.discountAmount) > 0 && (
                <span className="text-emerald-600">Discount: -{formatCurrency(order.discountAmount)}</span>
              )}
              <span className="text-surface-400">
                Total: <span className="line-through">{formatCurrency(order.totalAmount)}</span>
              </span>
              <span className="text-lg font-bold text-primary-600">
                {formatCurrency(order.finalAmount ?? order.totalAmount)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}