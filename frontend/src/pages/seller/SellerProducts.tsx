import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Package, Plus, Pencil, Trash2, Image as ImageIcon, Loader2, X, Search } from 'lucide-react';
import { EmptyState, ErrorState, PageLoader } from '../../components/StateViews';
import { Pagination } from '../../components/Ui';
import { asArray, discountPercent, formatCurrency } from '../../lib/format';
import { getErrorMessage } from '../../services/api';
import SellerApprovalBanner from '../../components/SellerApprovalBanner';

const EMPTY_FORM = {
  name: '', author: '', description: '', price: '', discountPrice: '',
  stockQuantity: '', isbn: '', publisher: '', publicationYear: '', categoryId: '',
};

export default function SellerProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const load = () => {
    setLoading(true);
    setFailed(false);
    api
      .get(`/seller/products?page=${page}&size=10`)
      .then((r) => {
        setProducts(asArray<any>(r.data));
        setTotalPages(r.data.totalPages || 0);
        setTotalElements(r.data.totalElements || 0);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page]);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(asArray<any>(r.data))).catch(() => {});
  }, []);

  const openNew = () => {
    setEditProduct(null);
    setForm({ ...EMPTY_FORM });
    setImageFile(null);
    setImagePreview('');
    setShowForm(true);
  };

  const openEdit = (p: any) => {
    setEditProduct(p);
    setForm({
      name: p.name || '',
      author: p.author || '',
      description: p.description || '',
      price: p.price?.toString() || '',
      discountPrice: p.discountPrice?.toString() || '',
      stockQuantity: p.stockQuantity?.toString() || '',
      isbn: p.isbn || '',
      publisher: p.publisher || '',
      publicationYear: p.publicationYear?.toString() || '',
      categoryId: p.categoryId?.toString() || '',
    });
    setImagePreview(p.imageUrls || '');
    setImageFile(null);
    setShowForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setUploading(!!imageFile);
    try {
      let imageUrl = editProduct?.imageUrls || null;
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const { data } = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = data;
      }
      setUploading(false);
      const payload: any = {
        name: form.name,
        author: form.author || null,
        description: form.description || null,
        price: parseFloat(form.price),
        discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : null,
        stockQuantity: parseInt(form.stockQuantity, 10),
        categoryId: form.categoryId ? parseInt(form.categoryId, 10) : null,
        isbn: form.isbn || null,
        publisher: form.publisher || null,
        publicationYear: form.publicationYear ? parseInt(form.publicationYear, 10) : null,
        imageUrls: imageUrl,
      };
      if (editProduct) {
        await api.put(`/seller/products/${editProduct.id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/seller/products', payload);
        toast.success('Product created');
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to save product'));
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/seller/products/${id}`);
      toast.success('Product deleted');
      load();
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to delete product'));
    }
  };

  const filtered = products.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return p.name?.toLowerCase().includes(q) || p.author?.toLowerCase().includes(q) || p.isbn?.toLowerCase().includes(q);
  });

  return (
    <div className="animate-fade-in">
      <SellerApprovalBanner />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-surface-900 mb-1">My Products</h1>
          <p className="text-surface-400">{totalElements} product{totalElements !== 1 ? 's' : ''} listed</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {products.length > 0 && (
        <div className="relative mb-5 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by title, author or ISBN..." className="input pl-10" />
        </div>
      )}

      {loading ? (
        <PageLoader />
      ) : failed ? (
        <ErrorState message="We could not load your products. Please try again." onRetry={load} />
      ) : filtered.length === 0 && !showForm ? (
        <EmptyState
          icon={<Package size={40} className="text-surface-300" />}
          title={search ? 'No matching products' : 'No products yet'}
          description={search ? 'Try a different search term.' : 'Add your first book to start selling!'}
          action={!search ? <button onClick={openNew} className="btn-primary"><Plus size={16} /> Add Product</button> : undefined}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-100">
                  <th className="text-left px-5 py-3.5 font-semibold text-surface-600">Book</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-surface-600">Price</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-surface-600">Stock</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-surface-600">Rating</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-surface-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: any) => {
                  const off = discountPercent(p.price, p.discountPrice);
                  return (
                    <tr key={p.id} className="border-b border-surface-50 last:border-0 hover:bg-surface-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-16 bg-gradient-to-br from-surface-100 to-surface-200 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                            {p.imageUrls ? (
                              <img src={p.imageUrls} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package size={18} className="text-surface-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-surface-800 truncate max-w-[220px]">{p.name}</p>
                            <p className="text-xs text-surface-400 truncate max-w-[220px]">{p.author}</p>
                            {p.categoryName && <span className="badge-primary mt-1">{p.categoryName}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-semibold text-primary-600">{formatCurrency(p.discountPrice ?? p.price)}</span>
                        {off && <span className="ml-1.5 text-xs text-emerald-600 font-medium">-{off}%</span>}
                        {p.discountPrice && <p className="text-xs text-surface-400 line-through">{formatCurrency(p.price)}</p>}
                      </td>
                      <td className="px-5 py-4">
                        {p.stockQuantity > 0 ? (
                          p.stockQuantity <= 5 ? (
                            <span className="badge-warning">Only {p.stockQuantity} left</span>
                          ) : (
                            <span className="badge-success">{p.stockQuantity} in stock</span>
                          )
                        ) : (
                          <span className="badge-danger">Out of stock</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-surface-500 whitespace-nowrap">
                        ★ {p.ratingAvg ? Number(p.ratingAvg).toFixed(1) : '0'} ({p.ratingCount || 0})
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(p)}
                            className="p-2 text-surface-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Edit">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => deleteProduct(p.id)}
                            className="p-2 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {/* Product Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <form
            onSubmit={saveProduct}
            onClick={(e) => e.stopPropagation()}
            className="modal-panel"
          >
            <div className="sticky top-0 bg-white border-b border-surface-100 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="font-display text-xl font-bold text-surface-900">
                {editProduct ? 'Edit Product' : 'New Product'}
              </h3>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-lg p-1.5 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Book Title *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter book title" className="input" required />
                </div>
                <div>
                  <label className="label">Author *</label>
                  <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Author name" className="input" required />
                </div>
              </div>

              <div>
                <label className="label">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the book condition, edition, etc." className="input" rows={3} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Price (₹) *</label>
                  <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} type="number" step="0.01" min="0.01" placeholder="499.00" className="input" required />
                </div>
                <div>
                  <label className="label">Discount Price (₹)</label>
                  <input value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} type="number" step="0.01" min="0" placeholder="Optional" className="input" />
                </div>
                <div>
                  <label className="label">Stock Quantity *</label>
                  <input value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} type="number" min="0" placeholder="10" className="input" required />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input">
                    <option value="">Select...</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">ISBN</label>
                  <input value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} placeholder="978-..." className="input" />
                </div>
                <div>
                  <label className="label">Publisher</label>
                  <input value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} placeholder="Publisher" className="input" />
                </div>
                <div>
                  <label className="label">Publish Year</label>
                  <input value={form.publicationYear} onChange={(e) => setForm({ ...form, publicationYear: e.target.value })} type="number" placeholder="2024" className="input" />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="label">Cover Image</label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-surface-200 rounded-xl py-6 cursor-pointer hover:border-primary-300 hover:bg-primary-50/40 transition-all">
                    <ImageIcon size={22} className="text-surface-400" />
                    <span className="text-sm text-surface-500 font-medium">
                      {imageFile ? imageFile.name : 'Click to upload a cover image'}
                    </span>
                    <span className="text-xs text-surface-400">PNG or JPG, up to 5MB</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                  {imagePreview && (
                    <div className="relative shrink-0">
                      <img src={imagePreview} alt="Cover preview" className="w-20 h-28 object-cover rounded-xl border border-surface-200" />
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(''); }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-surface-100 px-6 py-4 flex justify-end gap-2 z-10">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving || uploading} className="btn-primary">
                {(saving || uploading) && <Loader2 size={15} className="animate-spin" />}
                {uploading ? 'Uploading...' : editProduct ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}