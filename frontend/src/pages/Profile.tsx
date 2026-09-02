import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { asArray } from '../lib/format';
import toast from 'react-hot-toast';
import { MapPin, Trash2, Plus, Mail, Phone, Shield, Edit2, Check, X, Camera, Loader2, User } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fullName: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', state: '', pincode: '', country: 'India', isDefault: false
  });
  const [loading, setLoading] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAddresses = () => {
        api.get('/addresses').then(r => setAddresses(asArray<any>(r.data))).catch(() => {});
  };
  useEffect(() => { loadAddresses(); }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await api.put('/auth/profile', { profileImageUrl: data });
      updateUser({ profileImageUrl: data });
      toast.success('Profile photo updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveProfile = async () => {
    if (!profileName.trim()) { toast.error('Name is required'); return; }
    try {
      await api.put('/auth/profile', { name: profileName.trim(), phone: profilePhone.trim() || undefined });
      toast.success('Profile updated');
      setEditingProfile(false);
      updateUser({ name: profileName.trim(), phone: profilePhone.trim() || undefined });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/addresses', form);
      toast.success('Address added');
      setShowForm(false);
      setForm({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: 'India', isDefault: false });
      loadAddresses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (id: number) => {
    if (!confirm('Delete this address?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      toast.success('Address deleted');
      loadAddresses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-gradient-to-r from-red-500 to-rose-500',
      SELLER: 'bg-gradient-to-r from-amber-500 to-orange-500',
      CUSTOMER: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    };
    return colors[role] || 'bg-surface-500';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <h1 className="page-title">My Profile</h1>

      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="relative group">
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt={user.name}
                className="w-24 h-24 rounded-2xl object-cover ring-4 ring-primary-100 shadow-lg" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {getInitials(user?.name || 'U')}
              </div>
            )}
            <button onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploading ? (
                <Loader2 size={24} className="text-white animate-spin" />
              ) : (
                <Camera size={24} className="text-white" />
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>

          {/* Info */}
          <div className="flex-1">
            {editingProfile ? (
              <div className="space-y-3">
                <input value={profileName} onChange={e => setProfileName(e.target.value)}
                  className="input text-lg font-bold" placeholder="Your name" />
                <input value={profilePhone} onChange={e => setProfilePhone(e.target.value)}
                  className="input" placeholder="Phone number" />
                <div className="flex gap-2">
                  <button onClick={saveProfile} className="btn-primary btn-sm flex items-center gap-1">
                    <Check size={14} /> Save
                  </button>
                  <button onClick={() => { setEditingProfile(false); setProfileName(user?.name || ''); setProfilePhone(user?.phone || ''); }}
                    className="btn-secondary btn-sm flex items-center gap-1">
                    <X size={14} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-surface-900">{user?.name}</h2>
                  <button onClick={() => setEditingProfile(true)}
                    className="text-surface-400 hover:text-primary-500 transition-colors p-1 rounded-lg hover:bg-primary-50">
                    <Edit2 size={16} />
                  </button>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white ${roleBadge(user?.role || '')}`}>
                  {user?.role}
                </span>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-surface-500">
                    <Mail size={14} className="text-surface-400" />
                    {user?.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-surface-500">
                    <Phone size={14} className="text-surface-400" />
                    {user?.phone || 'Not set'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-surface-500">
                    <Shield size={14} className="text-surface-400" />
                    ID: {user?.userId}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title flex items-center gap-2 mb-0">
            <MapPin size={20} className="text-primary-500" />
            Saved Addresses
          </h2>
          <button onClick={() => setShowForm(!showForm)}
            className="btn-primary btn-sm flex items-center gap-1">
            <Plus size={14} /> Add
          </button>
        </div>

        {addresses.length === 0 && !showForm && (
          <div className="text-center py-8 bg-surface-50 rounded-xl">
            <MapPin size={32} className="mx-auto text-surface-300 mb-2" />
            <p className="text-surface-500 text-sm">No addresses saved yet</p>
          </div>
        )}

        {addresses.length > 0 && (
          <div className="space-y-3">
            {addresses.map((addr: any) => (
              <div key={addr.id} className="border border-surface-100 rounded-xl p-4 flex justify-between items-start hover:border-primary-100 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-surface-800">{addr.fullName}</span>
                    <span className="text-surface-400 text-sm">{addr.phone}</span>
                    {addr.isDefault && (
                      <span className="badge-primary">Default</span>
                    )}
                  </div>
                  <p className="text-sm text-surface-600">
                    {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                  </p>
                  <p className="text-sm text-surface-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                  <p className="text-xs text-surface-400 mt-1">{addr.country}</p>
                </div>
                <button onClick={() => deleteAddress(addr.id)}
                  className="text-surface-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <form onSubmit={addAddress} className="border border-primary-200 rounded-xl p-5 space-y-4 bg-primary-50/30 mt-4 animate-slide-down">
            <h3 className="font-semibold text-surface-800">New Address</h3>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Full Name" required value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                className="input" />
              <input placeholder="Phone" required value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="input" />
            </div>
            <input placeholder="Address Line 1" required value={form.addressLine1}
              onChange={e => setForm({ ...form, addressLine1: e.target.value })}
              className="input" />
            <input placeholder="Address Line 2 (optional)" value={form.addressLine2}
              onChange={e => setForm({ ...form, addressLine2: e.target.value })}
              className="input" />
            <div className="grid grid-cols-3 gap-3">
              <input placeholder="City" required value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                className="input" />
              <input placeholder="State" required value={form.state}
                onChange={e => setForm({ ...form, state: e.target.value })}
                className="input" />
              <input placeholder="Pincode" required value={form.pincode}
                onChange={e => setForm({ ...form, pincode: e.target.value })}
                className="input" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isDefault}
                onChange={e => setForm({ ...form, isDefault: e.target.checked })}
                className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500" />
              <span className="text-sm text-surface-600">Set as default address</span>
            </label>
            <div className="flex gap-2">
              <button type="submit" disabled={loading}
                className="btn-primary btn-sm flex items-center gap-1">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Save Address
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="btn-secondary btn-sm">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
