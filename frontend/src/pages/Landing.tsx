import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { BookOpen, ArrowRight, Sparkles, TrendingUp, Shield, Truck, BadgePercent } from 'lucide-react';
import { CardSkeleton, EmptyState } from '../components/StateViews';
import { Stars } from '../components/Ui';
import { asArray, discountPercent, formatCurrency } from '../lib/format';

export default function Landing() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/products?size=8').catch(() => ({ data: { content: [] } })),
      api.get('/categories').catch(() => ({ data: [] })),
    ]).then(([p, c]) => {
      setFeatured(asArray<any>(p.data).slice(0, 8));
      setCategories(asArray<any>(c.data));
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-16 animate-fade-in">
      {/* Hero */}
      <section className="relative bg-gradient-hero rounded-[2rem] overflow-hidden shadow-glass-lg">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 right-10 w-96 h-96 bg-accent-400 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/2 w-80 h-80 bg-primary-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 px-6 sm:px-12 py-16 sm:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-white/10">
              <Sparkles size={14} className="text-accent-300" />
              <span>New arrivals every week</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1]">
              Discover Your Next
              <span className="block text-accent-300 italic">Favourite Book</span>
            </h1>
            <p className="text-lg text-primary-100 mb-8 max-w-lg leading-relaxed">
              Browse thousands of titles from verified sellers. Fast delivery, secure payments, and an experience made for book lovers.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/catalogue"
                className="bg-white text-primary-700 px-8 py-3.5 rounded-xl font-bold hover:bg-accent-50 transition-all duration-200 inline-flex items-center gap-2 shadow-glass hover:shadow-glow-accent hover:-translate-y-0.5"
              >
                Browse Catalogue <ArrowRight size={18} />
              </Link>
              <Link
                to="/register"
                className="bg-white/10 backdrop-blur-sm text-white px-8 py-3.5 rounded-xl font-bold hover:bg-white/20 transition-all duration-200 border border-white/20"
              >
                Join as Seller
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { icon: Truck, title: 'Free Shipping', desc: 'On eligible orders', color: 'from-emerald-400 to-teal-500' },
          { icon: Shield, title: 'Secure Payment', desc: '100% protected checkout', color: 'from-sky-400 to-blue-500' },
          { icon: BadgePercent, title: 'Great Discounts', desc: 'Deals from trusted sellers', color: 'from-rose-400 to-red-500' },
          { icon: TrendingUp, title: 'Best Prices', desc: 'Competitive pricing always', color: 'from-amber-400 to-orange-500' },
        ].map((f, i) => (
          <div key={i} className="card-hover p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shrink-0 shadow-md`}>
              <f.icon size={22} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-surface-800">{f.title}</h3>
              <p className="text-sm text-surface-400">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section>
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-1">Collections</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-surface-900 mb-6">Shop by Category</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat: any) => (
              <Link
                key={cat.id}
                to={`/catalogue?category=${cat.id}`}
                className="group px-5 py-2.5 bg-white border border-surface-200 rounded-full text-sm font-semibold text-surface-600 hover:border-primary-300 hover:text-primary-600 hover:shadow-glow-primary hover:-translate-y-0.5 transition-all duration-200"
              >
                {cat.name}
                <span className="inline-block ml-2 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                  <ArrowRight size={13} className="inline" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Books */}
      <section>
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-1">Handpicked</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-surface-900">Featured Books</h2>
          </div>
          <Link to="/catalogue" className="text-primary-600 text-sm font-semibold hover:text-primary-700 flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <CardSkeleton count={4} />
        ) : featured.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={40} className="text-surface-300" />}
            title="No books yet"
            description="Be the first to list a book on the marketplace."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((p: any) => {
              const off = discountPercent(p.price, p.discountPrice);
              return (
                <Link key={p.id} to={`/products/${p.id}`} className="card-hover overflow-hidden group">
                  <div className="h-52 bg-gradient-to-br from-surface-100 to-surface-200 flex items-center justify-center overflow-hidden relative">
                    {p.imageUrls ? (
                      <img
                        src={p.imageUrls}
                        alt={p.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <BookOpen size={48} className="text-surface-300 group-hover:text-primary-400 transition-colors" />
                    )}
                    {off && (
                      <span className="absolute top-3 left-3 badge bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-md">
                        -{off}%
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-surface-400 mb-1">{p.categoryName || 'General'}</p>
                    <h3 className="font-semibold text-surface-800 truncate group-hover:text-primary-600 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-sm text-surface-500 truncate">{p.author}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-primary-600">
                          {formatCurrency(p.discountPrice ?? p.price)}
                        </span>
                        {p.discountPrice && (
                          <span className="text-sm text-surface-400 line-through">{formatCurrency(p.price)}</span>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-sm text-amber-500 font-medium">
                        <Stars value={Number(p.ratingAvg) || 0} size={12} />
                        {p.ratingAvg ? Number(p.ratingAvg).toFixed(1) : 'New'}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="relative bg-gradient-to-r from-accent-500 to-accent-600 rounded-[2rem] p-10 sm:p-14 text-center text-white overflow-hidden shadow-glow-accent">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <h2 className="font-display text-3xl font-bold mb-3">Ready to start selling?</h2>
          <p className="text-accent-100 text-lg mb-8 max-w-md mx-auto">
            Join hundreds of sellers on our platform and reach book lovers across the country.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-accent-600 px-8 py-3.5 rounded-xl font-bold hover:bg-accent-50 transition-all duration-200 shadow-glass hover:-translate-y-0.5"
          >
            Become a Seller <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
