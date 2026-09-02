import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { BookOpen, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data);
      toast.success('Welcome back!');
      if (data.role === 'ADMIN') navigate('/admin');
      else if (data.role === 'SELLER') navigate('/seller');
      else navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-mesh">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-400 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-8 shadow-glass">
            <BookOpen size={40} />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-center">Welcome to Kitaabwala</h1>
          <p className="text-primary-100 text-lg text-center max-w-md">
            Discover thousands of books, manage your inventory, or grow your business — all in one place.
          </p>
          <div className="flex gap-8 mt-12">
            {[
              { num: '10K+', label: 'Books' },
              { num: '500+', label: 'Sellers' },
              { num: '50K+', label: 'Readers' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold">{stat.num}</p>
                <p className="text-primary-200 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Kitaabwala</span>
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-surface-900 mb-2">Sign in</h2>
            <p className="text-surface-500">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input pl-11" required />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input pl-11" required />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-surface-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
              Create one now
            </Link>
          </p>

          <div className="mt-8 p-4 bg-surface-50 rounded-xl border border-surface-100">
            <p className="text-xs font-semibold text-surface-500 mb-2 uppercase tracking-wider">Demo Credentials</p>
            <div className="space-y-1 text-sm">
              <p className="text-surface-600"><span className="font-medium">Admin:</span> admin@ebookstore.com</p>
              <p className="text-surface-600"><span className="font-medium">Password:</span> password</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
