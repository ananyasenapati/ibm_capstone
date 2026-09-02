import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { BookOpen, ShoppingCart, Minus, Plus, ArrowLeft, Check, Loader2, Star, ShieldCheck, Truck, Building, Hash, CalendarDays } from 'lucide-react';
import { ErrorState, PageLoader } from '../components/StateViews';
import { Stars } from '../components/Ui';
import { discountPercent, formatCurrency, formatDate } from '../lib/format';
import { getErrorMessage } from '../services/api';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [product, setProduct] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    setFailed(false);
    Promise.all([
      api.get(`/products/${id}`),
      api.get(`/products/${id}/ratings`).catch(() => ({ data: [] })),
    ])
      .then(([p, r]) => {
        setProduct(p.data);
        setReviews(Array.isArray(r.data) ? r.data : []);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const addToCart = async () => {
    setCartLoading(true);
    try {
      await api.post('/cart/items', { productId: Number(id), quantity: qty });
      toast.success('Added to cart!');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to add to cart'));
    } finally {
      setCartLoading(false);
    }
  };

  const submitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/products/${id}/ratings`, { rating, comment });
      toast.success('Review submitted!');
      const r = await api.get(`/products/${id}/ratings`);
      setReviews(Array.isArray(r.data) ? r.data : []);
      setComment('');
      setRating(5);
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to submit review'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  if (failed || !product)
    return (
      <ErrorState
        message="We could not find this book. It may have been removed by the seller."
        onRetry={load}
      />
    );

  const off = discountPercent(product.price, product.discountPrice);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-surface-500 hover:text-surface-900 mb-6 transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Image */}
        <div className="bg-gradient-to-br from-surface-100 to-surface-200 rounded-3xl aspect-[4/3] flex items-center justify-center overflow-hidden border border-surface-100 relative">
          {product.imageUrls ? (
            <img src={product.imageUrls} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <BookOpen size={80} className="text-surface-300" />
          )}
          {off && (
            <span className="absolute top-4 left-4 badge bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-md px-3 py-1.5 text-sm">
              -{off}% OFF
            </span>
          )}
        </div>
        {/* Details */}
        <div className="flex flex-col">
          <p className="text-sm text-primary-600 font-semibold uppercase tracking-wider mb-2">
            {product.categoryName || 'General'}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-surface-900 mb-2">{product.name}</h1>
          <p className="text-surface-500 mb-4">
            by <span className="font-semibold text-surface-700">{product.author || 'Unknown Author'}</span>
            {product.sellerName && <span className="text-surface-400"> · Sold by {product.sellerName}</span>}
          </p>

          {Number(product.ratingCount) > 0 && (
            <div className="flex items-center gap-2 mb-5">
              <Stars value={Number(product.ratingAvg) || 0} size={16} />
              <span className="text-sm font-semibold text-surface-700">{Number(product.ratingAvg).toFixed(1)}</span>
              <span className="text-sm text-surface-400">({product.ratingCount} review{product.ratingCount !== 1 ? 's' : ''})</span>
            </div>
          )}

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-4xl font-bold text-primary-600">
              {formatCurrency(product.discountPrice ?? product.price)}
            </span>
            {product.discountPrice && (
              <span className="text-lg text-surface-400 line-through">{formatCurrency(product.price)}</span>
            )}
          </div>

          {/* Stock status */}
          <div className="mb-6">
            {product.stockQuantity > 0 ? (
              <span className="badge-success px-3 py-1.5">
                <Check size={13} /> In stock — {product.stockQuantity} available
              </span>
            ) : (
              <span className="badge-danger px-3 py-1.5">Out of stock</span>
            )}
          </div>

          {product.description && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-surface-800 uppercase tracking-wider mb-2">About this book</h3>
              <p className="text-surface-600 leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}
          {/* Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {product.isbn && (
              <div className="flex items-center gap-2.5 bg-surface-50 rounded-xl px-3.5 py-3">
                <Hash size={16} className="text-primary-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-surface-400 font-medium uppercase">ISBN</p>
                  <p className="text-xs font-semibold text-surface-700 truncate">{product.isbn}</p>
                </div>
              </div>
            )}
            {product.publisher && (
              <div className="flex items-center gap-2.5 bg-surface-50 rounded-xl px-3.5 py-3">
                <Building size={16} className="text-primary-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-surface-400 font-medium uppercase">Publisher</p>
                  <p className="text-xs font-semibold text-surface-700 truncate">{product.publisher}</p>
                </div>
              </div>
            )}
            {product.publicationYear && (
              <div className="flex items-center gap-2.5 bg-surface-50 rounded-xl px-3.5 py-3">
                <CalendarDays size={16} className="text-primary-500 shrink-0" />
                <div>
                  <p className="text-[11px] text-surface-400 font-medium uppercase">Published</p>
                  <p className="text-xs font-semibold text-surface-700">{product.publicationYear}</p>
                </div>
              </div>
            )}
          </div>

          {/* Quantity + Add to cart */}
          {product.stockQuantity > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-surface-100 rounded-xl border border-surface-200">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  className="p-3 hover:bg-surface-200 rounded-l-xl transition-colors disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span className="px-5 py-2 font-bold min-w-[44px] text-center">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stockQuantity, q + 1))}
                  disabled={qty >= product.stockQuantity}
                  className="p-3 hover:bg-surface-200 rounded-r-xl transition-colors disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>
              <button onClick={addToCart} disabled={cartLoading} className="btn-primary flex-1 py-3.5 text-base">
                {cartLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <ShoppingCart size={18} /> Add to Cart
                  </>
                )}
              </button>
            </div>
          )}

          <div className="flex items-center gap-5 mt-5 text-xs text-surface-400">
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-500" /> Secure checkout</span>
            <span className="flex items-center gap-1.5"><Truck size={14} className="text-sky-500" /> Fast delivery</span>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-16">
        <h2 className="font-display text-2xl font-bold text-surface-900 mb-6">Customer Reviews</h2>

        {user?.role === 'CUSTOMER' && (
          <form onSubmit={submitRating} className="card p-5 mb-6">
            <h3 className="font-semibold text-surface-800 mb-3">Write a Review</h3>
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => setRating(s)} className="p-0.5" aria-label={`${s} stars`}>
                  <Star
                    size={24}
                    className={s <= rating ? 'text-amber-400' : 'text-surface-200'}
                    fill={s <= rating ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this book..."
              className="input mb-3"
              rows={3}
            />
            <button type="submit" disabled={submitting} className="btn-primary btn-sm">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Submit Review
            </button>
          </form>
        )}

        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-surface-50 rounded-2xl">
            <Star size={32} className="mx-auto text-surface-300 mb-2" />
            <p className="text-surface-500 text-sm">No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r: any, i: number) => (
              <div key={i} className="card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {r.userName?.[0] || 'A'}
                  </div>
                  <div>
                    <p className="font-semibold text-surface-800 text-sm">{r.userName || 'Anonymous'}</p>
                    <div className="flex items-center gap-1.5">
                      <Stars value={r.rating} size={11} />
                      <span className="text-xs text-surface-400">{formatDate(r.createdAt)}</span>
                    </div>
                  </div>
                </div>
                {r.comment && <p className="text-sm text-surface-600 mt-2 leading-relaxed">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}