import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Users, Search, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';
import { EmptyState, ErrorState, PageLoader } from '../../components/StateViews';
import { Pagination } from '../../components/Ui';
import { asArray, getInitials } from '../../lib/format';
import { getErrorMessage } from '../../services/api';

const roleBadgeCls = (role: string) => {
  switch (role) {
    case 'ADMIN': return 'bg-gradient-to-r from-red-500 to-rose-500 text-white';
    case 'SELLER': return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white';
    case 'CUSTOMER': return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white';
    default: return 'bg-surface-200 text-surface-700';
  }
};

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const loadUsers = () => {
    setLoading(true);
    setFailed(false);
    api
      .get(`/admin/users?page=${page}&size=10`)
      .then((r) => {
        setUsers(asArray<any>(r.data));
        setTotalPages(r.data.totalPages || 0);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, [page]);

  const toggleStatus = async (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setActingId(userId);
    try {
      await api.put(`/admin/users/${userId}/status`, { status: newStatus });
      toast.success(`User ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`);
      loadUsers();
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to update user'));
    } finally {
      setActingId(null);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  if (loading) return <PageLoader />;

  if (failed)
    return <ErrorState message="We could not load users. Please try again." onRetry={loadUsers} />;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-surface-900 mb-1">Manage Users</h1>
        <p className="text-surface-400">All registered accounts on the platform.</p>
      </div>

      <div className="relative mb-5 max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="input pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={40} className="text-surface-300" />}
          title={search ? 'No matching users' : 'No users found'}
          description={search ? 'Try a different search term.' : 'No users have registered yet.'}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-100">
                  <th className="text-left px-5 py-3.5 font-semibold text-surface-600">User</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-surface-600">Contact</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-surface-600">Role</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-surface-600">Status</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-surface-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u: any) => (
                  <tr key={u.id} className="border-b border-surface-50 last:border-0 hover:bg-surface-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {getInitials(u.name)}
                        </div>
                        <span className="font-semibold text-surface-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-surface-500">
                      <p>{u.email}</p>
                      {u.phone && <p className="text-xs text-surface-400">{u.phone}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadgeCls(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {u.status === 'ACTIVE' ? (
                        <span className="badge-success">Active</span>
                      ) : u.status === 'PENDING_APPROVAL' ? (
                        <span className="badge-warning">Pending</span>
                      ) : (
                        <span className="badge-danger">Inactive</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => toggleStatus(u.id, u.status)}
                        disabled={actingId === u.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 ${
                          u.status === 'ACTIVE'
                            ? 'text-red-500 hover:bg-red-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {actingId === u.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : u.status === 'ACTIVE' ? (
                          <ShieldOff size={14} />
                        ) : (
                          <ShieldCheck size={14} />
                        )}
                        {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}