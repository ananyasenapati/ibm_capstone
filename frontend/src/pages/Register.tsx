import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { BookOpen, Mail, Lock, User, Phone, Building, MapPin, FileText, ArrowRight, Loader2 } from 'lucide-react';

export default function Register() {
  const [mode, setMode] = useState<'customer' | 'seller'>('customer');
  const [form, setForm] = useState({
    email: '', password: '', name: '', phone: '',
    businessName: '', businessAddress: '', gstNumber: '', description: ''
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = mode === 'seller' ? '/auth/register/seller' : '/auth/register';
      const { data } = await api.post(url, form);
      login(data);
      toast.success(mode === 'seller' ? 'Registration submitted! Awaiting admin approval.' : 'Welcome aboard!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-mesh">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-accent-500 via-accent-600 to-primary-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-32 right-20 w-80 h-80 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-primary-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-8 shadow-glass">
            <BookOpen size={40} />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-center">Start Your Journey</h1>
          <p className="text-white/80 text-lg text-center max-w-md">
            {mode === 'seller'
              ? 'Join our marketplace and reach thousands of readers. Manage your books with ease.'
              : 'Create your account and explore a world of books at your fingertips.'}
          </p>
          <div className="flex flex-col gap-4 mt-12 w-full max-w-xs">
            {['Browse thousands of titles', 'Fast & secure checkout', 'Track your orders'].map((feat, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                <div className="w-2 h-2 bg-white rounded-full shrink-0" />
                <span className="text-sm">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in">
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Kitaabwala</span>
          </Link>

          <div className="mb-6">
            <h2 className="text-3xl font-bold text-surface-900 mb-2">Create account</h2>
            <p className="text-surface-500">Fill in the details to get started</p>
          </div>

          {/* Role Toggle */}
          <div className="flex bg-surface-100 rounded-xl p-1 mb-6">
            <button onClick={() => setMode('customer')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                ${mode === 'customer' ? 'bg-white text-primary-600 shadow-sm' : 'text-surface-500 hover:text-surface-700'}`}>
              Customer
            </button>
            <button onClick={() => setMode('seller')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                ${mode === 'seller' ? 'bg-white text-primary-600 shadow-sm' : 'text-surface-500 hover:text-surface-700'}`}>
              Seller
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe" className="input pl-11" required />
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com" className="input pl-11" required />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 6 characters" className="input pl-11" required minLength={6} />
              </div>
            </div>

            <div>
              <label className="label">Phone</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210" className="input pl-11" />
              </div>
            </div>

            {mode === 'seller' && (
              <div className="space-y-4 p-4 bg-surface-50 rounded-xl border border-surface-100">
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Business Details</p>
                <div>
                  <label className="label">Business Name</label>
                  <div className="relative">
                    <Building size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input type="text" value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })}
                      placeholder="Your Shop Name" className="input pl-11" required />
                  </div>
                </div>
                <div>
                  <label className="label">Business Address</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                    <textarea value={form.businessAddress} onChange={e => setForm({ ...form, businessAddress: e.target.value })}
                      placeholder="Full business address" className="input pl-11" rows={2} />
                  </div>
                </div>
                <div>
                  <label className="label">GST Number</label>
                  <div className="relative">
                    <FileText size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input type="text" value={form.gstNumber} onChange={e => setForm({ ...form, gstNumber: e.target.value })}
                      placeholder="Optional" className="input pl-11" />
                  </div>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {mode === 'seller' ? 'Submit Application' : 'Create Account'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-surface-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
