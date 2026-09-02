import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Star, Package } from 'lucide-react';
import { EmptyState, ErrorState, PageLoader } from '../../components/StateViews';
import { Stars } from '../../components/Ui';
import { asArray, formatDate } from '../../lib/format';

export default function SellerRatings() {
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = () => {
    setLoading(true);
    setFailed(false);
    api
      .get('/seller/ratings')
      .then((r) => setRatings(asArray<any>(r.data)))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <PageLoader label="Loading reviews..." />;

  if (failed)
    return <ErrorState message="We could not load your reviews. Please try again." onRetry={load} />;

  const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: ratings.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="animate-fade-in max-w-4xl">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-surface-900 mb-6">Ratings & Reviews</h1>

      {ratings.length > 0 && (
        <div className="card p-6 mb-6 flex flex-col sm:flex-row items-center gap-8">
          <div className="text-center shrink-0">
            <p className="font-display text-5xl font-bold text-primary-600">{avgRating.toFixed(1)}</p>
            <div className="flex items-center justify-center mt-2">
              <Stars value={avgRating} size={16} />
            </div>
            <p className="text-sm text-surface-400 mt-2">
              {ratings.length} review{ratings.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex-1 w-full space-y-2">
            {distribution.map((d) => (
              <div key={d.star} className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-surface-500 w-10 shrink-0">
                  {d.star} <Star size={12} className="text-amber-400" fill="currentColor" />
                </span>
                <div className="flex-1 h-2.5 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-accent-500 rounded-full transition-all duration-500"
                    style={{ width: `${ratings.length ? (d.count / ratings.length) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-surface-400 w-6 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {ratings.length === 0 ? (
        <EmptyState
          icon={<Star size={40} className="text-surface-300" />}
          title="No reviews yet"
          description="Reviews for your products will appear here."
        />
      ) : (
        <div className="space-y-4">
          {ratings.map((r: any, i: number) => (
            <div key={i} className="card p-5 hover:border-primary-200 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-700 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {r.customerName?.[0] || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                    <span className="font-semibold text-surface-800">{r.customerName || 'Anonymous'}</span>
                    <Stars value={r.rating} size={12} />
                    <span className="text-xs text-surface-400">{formatDate(r.createdAt)}</span>
                  </div>
                  {r.productName && (
                    <p className="text-xs text-surface-400 flex items-center gap-1.5 mb-1.5">
                      <Package size={11} /> {r.productName}
                    </p>
                  )}
                  {r.comment && <p className="text-sm text-surface-600 leading-relaxed">{r.comment}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}