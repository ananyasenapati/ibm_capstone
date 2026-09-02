import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, BookOpen, Loader2, ShoppingBag, BadgePercent } from 'lucide-react';
import { EmptyState, PageLoader } from '../components/StateViews';
import { asArray, formatCurrency } from '../lib/format';
import { getErrorMessage } from '../services/api';

export default function Cart() {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const navigate = useNavigate();

  const loadCart = () => {
    api
      .get('/cart')
      .then((r) => setCart(r.data))
      .catch(() => setCart(null))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    loadCart();
  }, []);

  const updateQty = async (productId: number, qty: number) => {
    if (qty < 1) return;
    setUpdating(productId);
    try {
      await api.put(`/cart/items/${productId}?quantity=${qty}`);
      loadCart();
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to update quantity'));
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (productId: number) => {
    setUpdating(productId);
    try {
      await api.delete(`/cart/items/${productId}`);
      toast.success('Removed from cart');
      loadCart();
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to remove item'));
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <PageLoader />;

    const items = asArray<any>(cart?.items);
  if (!cart || items.length === 0)
    return (
      <EmptyState
        icon={<ShoppingCart size={40} className="text-surface-300" />}
        title="Your cart is empty"
        description="Add some books to get started!"
        action={
          <Link to="/catalogue" className="btn-primary">
            <ShoppingBag size={18} /> Browse Catalogue
          </Link>
        }
      />
    );

  const subtotal = cart.subtotal ?? items.reduce((s: number, i: any) => s + (Number(i.totalPrice) || 0), 0);
  const discount = Number(cart.discount) || 0;
  const giftDiscount = Number(cart.giftPointDiscount) || 0;
  const total = cart.total ?? subtotal;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-surface-900 mb-8">
        Shopping Cart <span className="text-lg font-sans font-medium text-surface-400">({items.length} item{items.length !== 1 ? 's' : ''})</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item: any) => (
            <div key={item.id} className="card p-5 flex gap-5 hover:border-primary-200 transition-colors">
              <Link to={`/products/${item.productId}`} className="w-20 h-28 bg-gradient-to-br from-surface-100 to-surface-200 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                {item.productImage ? (
                  <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen size={28} className="text-surface-300" />
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/products/${item.productId}`}
                  className="font-semibold text-surface-800 hover:text-primary-600 transition-colors truncate block"
                >
                  {item.productName}
                </Link>
                <p className="text-sm text-surface-400 mt-0.5">{formatCurrency(item.unitPrice)} each</p>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center bg-surface-100 rounded-lg border border-surface-200">
                    <button
                      onClick={() => updateQty(item.productId, item.quantity - 1)}
                      disabled={updating === item.productId || item.quantity <= 1}
                      className="p-1.5 hover:bg-surface-200 rounded-l-lg transition-colors disabled:opacity-50"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-3 py-1 text-sm font-semibold min-w-[36px] text-center">
                      {updating === item.productId ? <Loader2 size={12} className="animate-spin inline" /> : item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.productId, item.quantity + 1)}
                      disabled={updating === item.productId}
                      className="p-1.5 hover:bg-surface-200 rounded-r-lg transition-colors disabled:opacity-50"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    disabled={updating === item.productId}
                    className="text-surface-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    aria-label="Remove item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-surface-800">{formatCurrency(item.totalPrice)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 lg:sticky lg:top-24">
            <h3 className="font-bold text-surface-800 text-lg mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-surface-600">
                <span>Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {(discount > 0 || giftDiscount > 0) && (
                <div className="flex justify-between text-emerald-600">
                  <span className="flex items-center gap-1"><BadgePercent size={14} /> Discounts</span>
                  <span className="font-medium">-{formatCurrency(discount + giftDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-surface-600">
                <span>Shipping</span>
                <span className="text-emerald-500 font-medium">Free</span>
              </div>
              <div className="border-t border-surface-100 pt-3 flex justify-between">
                <span className="font-bold text-surface-900 text-base">Total</span>
                <span className="font-bold text-primary-600 text-lg">{formatCurrency(total)}</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="btn-primary w-full mt-6 py-3.5 text-base"
            >
              Proceed to Checkout <ArrowRight size={18} />
            </button>
            <Link
              to="/catalogue"
              className="block text-center text-sm text-primary-600 mt-3 hover:text-primary-700 font-medium"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}