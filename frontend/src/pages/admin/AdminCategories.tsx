import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Tags, Pencil, Trash2, Plus, Check, X, Loader2 } from 'lucide-react';
import { EmptyState, ErrorState, PageLoader } from '../../components/StateViews';
import { asArray } from '../../lib/format';
import { getErrorMessage } from '../../services/api';

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setFailed(false);
    api
      .get('/admin/categories')
      .then((r) => setCategories(asArray<any>(r.data)))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (cat: any) => {
    setEditId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
    setIsActive(cat.isActive ?? true);
    setShowForm(true);
  };

  const startNew = () => {
    setEditId(null);
    setName('');
    setDescription('');
    setIsActive(true);
    setShowForm(!showForm);
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = { name: name.trim(), description: description.trim() || undefined, isActive };
      if (editId) {
        await api.put(`/admin/categories/${editId}`, payload);
        toast.success('Category updated');
      } else {
        await api.post('/admin/categories', payload);
        toast.success('Category created');
      }
      setShowForm(false);
      setEditId(null);
      setName('');
      setDescription('');
      load();
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to save category'));
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm('Delete this category? Products in it may become uncategorised.')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      toast.success('Category deleted');
      load();
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to delete category'));
    }
  };

  if (loading) return <PageLoader />;

  if (failed)
    return <ErrorState message="We could not load categories. Please try again." onRetry={load} />;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-surface-900 mb-1">Manage Categories</h1>
          <p className="text-surface-400">{categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} total</p>
        </div>
        <button onClick={startNew} className="btn-primary">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {showForm && (
        <form onSubmit={saveCategory} className="card p-5 mb-6 animate-slide-down">
          <h3 className="font-semibold text-surface-800 mb-3">{editId ? 'Edit Category' : 'New Category'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" className="input" required />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="input" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer mt-3">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500" />
            <span className="text-sm text-surface-600">Visible to customers (active)</span>
          </label>
          <div className="flex gap-2 mt-4">
            <button type="submit" disabled={saving} className="btn-primary btn-sm">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {editId ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="btn-secondary btn-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat: any) => (
          <div key={cat.id} className="card p-5 hover:border-primary-200 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center shrink-0">
                  <Tags size={18} className="text-primary-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-surface-800 truncate">{cat.name}</h3>
                  {cat.description && <p className="text-xs text-surface-400 mt-0.5 truncate">{cat.description}</p>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => startEdit(cat)}
                  className="p-1.5 text-surface-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Edit">
                  <Pencil size={14} />
                </button>
                <button onClick={() => deleteCategory(cat.id)}
                  className="p-1.5 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {cat.isActive ? <span className="badge-success">Active</span> : <span className="badge-danger">Hidden</span>}
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <EmptyState
          icon={<Tags size={40} className="text-surface-300" />}
          title="No categories yet"
          description="Create categories so sellers can organise their books."
          action={<button onClick={startNew} className="btn-primary"><Plus size={16} /> Add Category</button>}
        />
      )}
    </div>
  );
}