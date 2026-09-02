import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { BookOpen, Search, SlidersHorizontal, X } from 'lucide-react';
import { CardSkeleton, EmptyState } from '../components/StateViews';
import { Pagination } from '../components/Ui';
import { asArray, discountPercent, formatCurrency } from '../lib/format';

export default function Catalogue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(asArray<any>(r.data))).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedCategory) params.set('categoryId', selectedCategory);
    params.set('page', page.toString());
    params.set('size', '12');
    api
      .get(`/products?${params}`)
      .then((r) => {
        setProducts(asArray<any>(r.data));
        setTotalPages(r.data.totalPages || 0);
        setTotalElements(r.data.totalElements || 0);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [query, selectedCategory, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    const next = new URLSearchParams();
    if (query) next.set('q', query);
    if (selectedCategory) next.set('category', selectedCategory);
    setSearchParams(next);
  };

  const clearSearch = () => {
    setQuery('');
    setPage(0);
  };

  const pickCategory = (id: string) => {
    setSelectedCategory(id);
    setPage(0);
  };

  const activeCategoryName = categories.find((c: any) => c.id.toString() === selectedCategory)?.name;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-surface-900 mb-2">Catalogue</h1>
        <p className="text-surface-400">
          {loading ? 'Finding books...' : `${totalElements} book${totalElements !== 1 ? 's' : ''} available`}
          {activeCategoryName ? ` in ${activeCategoryName}` : ''}
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or author..."
              className="input pl-11 pr-10 py-3 text-base"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-300 hover:text-surface-500"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button type="submit" className="btn-primary px-6">Search</button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary px-4 lg:hidden ${showFilters ? 'bg-primary-50 border-primary-300 text-primary-600' : ''}`}
          >
            <SlidersHorizontal size={16} />
          </button>
        </form>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className={`lg:w-60 shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="card p-5 lg:sticky lg:top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-surface-800">Categories</h3>
              {selectedCategory && (
                <button onClick={() => pickCategory('')} className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
                  <X size={12} /> Clear
                </button>
              )}
            </div>
            <div className="space-y-1">
              <button
                onClick={() => pickCategory('')}
                className={`block w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  !selectedCategory ? 'bg-primary-50 text-primary-700' : 'text-surface-600 hover:bg-surface-50'
                }`}
              >
                All Books
              </button>
              {categories.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => pickCategory(cat.id.toString())}
                  className={`block w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    selectedCategory === cat.id.toString()
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-surface-600 hover:bg-surface-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
              {categories.length === 0 && <p className="text-xs text-surface-400 px-3 py-2">No categories yet</p>}
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <CardSkeleton count={8} />
          ) : products.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={40} className="text-surface-300" />}
              title="No books found"
              description="Try adjusting your search or explore a different category."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {products.map((p: any) => {
                const off = discountPercent(p.price, p.discountPrice);
                return (
                  <Link key={p.id} to={`/products/${p.id}`} className="card-hover overflow-hidden group flex flex-col">
                    <div className="h-48 bg-gradient-to-br from-surface-100 to-surface-200 flex items-center justify-center overflow-hidden relative">
                      {p.imageUrls ? (
                        <img src={p.imageUrls} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <BookOpen size={40} className="text-surface-300 group-hover:text-primary-400 transition-colors" />
                      )}
                      {off && (
                        <span className="absolute top-3 left-3 badge bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-md">
                          -{off}%
                        </span>
                      )}
                      {p.stockQuantity === 0 && (
                        <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="badge bg-white text-surface-700 shadow-md">Out of stock</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <p className="text-xs text-surface-400 mb-1">{p.categoryName || 'General'}</p>
                      <h3 className="font-semibold text-surface-800 truncate group-hover:text-primary-600 transition-colors">{p.name}</h3>
                      <p className="text-sm text-surface-500 truncate">{p.author}</p>
                      <div className="flex items-center justify-between mt-auto pt-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-primary-600">{formatCurrency(p.discountPrice ?? p.price)}</span>
                          {p.discountPrice && <span className="text-xs text-surface-400 line-through">{formatCurrency(p.price)}</span>}
                        </div>
                        {p.stockQuantity > 0 && p.stockQuantity <= 5 && (
                          <span className="badge-warning">Only {p.stockQuantity} left</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
