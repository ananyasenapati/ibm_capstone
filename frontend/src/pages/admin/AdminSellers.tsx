import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Store, Check, X, Trash2, Loader2, Mail, MapPin } from 'lucide-react';
import { EmptyState, ErrorState, PageLoader } from '../../components/StateViews';
import { Pagination } from '../../components/Ui';
import { asArray, getInitials } from '../../lib/format';
import { getErrorMessage } from '../../services/api';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

const statusBadge = (status: string) => {
  switch (status) {
    case 'APPROVED': return 'badge-success';
    case 'PENDING': return 'badge-warning';
    case 'REJECTED': return 'badge-danger';
    default: return 'badge';
  }
};

export default function AdminSellers() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || '';

  const loadSellers = () => {
    setLoading(true);
    setFailed(false);
    const q = statusFilter ? `&status=${statusFilter}` : '';
    api
      .get(`/admin/sellers?page=${page}&size=10${q}`)
      .then((r) => {
        setSellers(asArray<any>(r.data));
        setTotalPages(r.data.totalPages || 0);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSellers();
  }, [page, statusFilter]);

  const pickStatus = (status: string) => {
    setPage(0);
    const next = new URLSearchParams();
    if (status) next.set('status', status);
    setSearchParams(next);
  };

  const approve = async (id: number) => {
    setActingId(id);
    try {
      await api.put(`/admin/sellers/${id}/approve`);
      toast.success('Seller approved');
      loadSellers();
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to approve seller'));
    } finally {
      setActingId(null);
    }
  };

  const reject = async (id: number) => {
    setActingId(id);
    try {
      await api.put(`/admin/sellers/${id}/reject`);
      toast.success('Seller application rejected');
      loadSellers();
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to reject seller'));
    } finally {
      setActingId(null);
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Remove this seller and all their products? This cannot be undone.')) return;
    setActingId(id);
    try {
      await api.delete(`/admin/sellers/${id}`);
      toast.success('Seller removed');
      loadSellers();
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to remove seller'));
    } finally {
      setActingId(null);
    }
  };

  if (loading) return <PageLoader />;

  if (failed)
    return <ErrorState message="We could not load sellers. Please try again." onRetry={loadSellers} />;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-surface-900 mb-1">Manage Sellers</h1>
        <p className="text-surface-400">Review applications and manage seller accounts.</p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => pickStatus(tab.value)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              statusFilter === tab.value
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-white text-surface-500 border border-surface-200 hover:border-primary-300 hover:text-primary-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {sellers.length === 0 ? (
        <EmptyState
          icon={<Store size={40} className="text-surface-300" />}
          title="No sellers found"
          description={statusFilter ? `No sellers with status ${statusFilter}.` : 'No sellers have registered yet.'}
        />
      ) : (
        <div className="space-y-4">
          {sellers.map((s: any) => (
            <div key={s.id} className="card p-5 hover:border-primary-200 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {getInitials(s.businessName)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-surface-800">{s.businessName}</p>
                      <span className={statusBadge(s.approvalStatus)}>{s.approvalStatus}</span>
                    </div>
                    <p className="text-xs text-surface-400 flex items-center gap-1 mt-0.5">
                      <Mail size={11} /> {s.email}
                      <span className="mx-1">·</span> {s.customerName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm lg:border-l lg:border-surface-100 lg:pl-6">
                  <div>
                    <p className="text-[11px] text-surface-400 uppercase font-medium">Products</p>
                    <p className="font-bold text-surface-700">{s.productCount ?? 0}</p>
                  </div>
                  {s.businessAddress && (
                    <div className="hidden md:block max-w-[180px]">
                      <p className="text-[11px] text-surface-400 uppercase font-medium">Address</p>
                      <p className="text-xs text-surface-500 flex items-center gap-1 truncate">
                        <MapPin size={11} className="shrink-0" /> {s.businessAddress}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    {s.approvalStatus === 'PENDING' && (
                      <>
                        <button onClick={() => approve(s.id)} disabled={actingId === s.id}
                          className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors disabled:opacity-50" title="Approve">
                          {actingId === s.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        </button>
                        <button onClick={() => reject(s.id)} disabled={actingId === s.id}
                          className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50" title="Reject">
                          <X size={16} />
                        </button>
                      </>
                    )}
                    <button onClick={() => remove(s.id)} disabled={actingId === s.id}
                      className="p-2.5 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50" title="Remove seller">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}