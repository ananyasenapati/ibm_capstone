import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useState, useRef, useEffect } from 'react';
import {
  BookOpen, ShoppingCart, LogOut, LayoutDashboard, Package, Star, Users, Tags,
  UserCircle, ChevronDown, Menu, X, Search, ShoppingBag, Sparkles,
} from 'lucide-react';
import { getInitials } from '../lib/format';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDropdownOpen(false);
  };

  const navLink = (path: string, label: string, icon: React.ReactNode) => (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-primary-50 text-primary-700'
            : 'text-surface-500 hover:text-surface-900 hover:bg-surface-100'
        }`
      }
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </NavLink>
  );

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-gradient-to-r from-red-500 to-rose-500',
      SELLER: 'bg-gradient-to-r from-amber-500 to-orange-500',
      CUSTOMER: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    };
    return colors[role] || 'bg-surface-500';
  };

  const mobileLinks: Array<{ to: string; label: string; icon: React.ReactNode }> = [
    { to: '/catalogue', label: 'Catalogue', icon: <Search size={18} /> },
    ...(user?.role === 'CUSTOMER'
      ? [
          { to: '/cart', label: 'Cart', icon: <ShoppingCart size={18} /> },
          { to: '/my-orders', label: 'My Orders', icon: <Package size={18} /> },
        ]
      : []),
    ...(user?.role === 'ADMIN'
      ? [
          { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
          { to: '/admin/sellers', label: 'Sellers', icon: <Users size={18} /> },
          { to: '/admin/users', label: 'Users', icon: <UserCircle size={18} /> },
          { to: '/admin/categories', label: 'Categories', icon: <Tags size={18} /> },
        ]
      : []),
    ...(user?.role === 'SELLER'
      ? [
          { to: '/seller', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
          { to: '/seller/products', label: 'Products', icon: <Package size={18} /> },
          { to: '/seller/orders', label: 'Orders', icon: <ShoppingBag size={18} /> },
          { to: '/seller/ratings', label: 'Ratings', icon: <Star size={18} /> },
        ]
      : []),
    ...(user ? [{ to: '/profile', label: 'Profile', icon: <UserCircle size={18} /> }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-mesh">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-glow-primary transition-shadow">
                <BookOpen size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold font-display gradient-text hidden sm:block">
                Kitaabwala
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLink('/catalogue', 'Catalogue', <Search size={16} />)}

              {user?.role === 'CUSTOMER' && (
                <>
                  {navLink('/cart', 'Cart', <ShoppingCart size={16} />)}
                  {navLink('/my-orders', 'Orders', <Package size={16} />)}
                </>
              )}

              {user?.role === 'ADMIN' && (
                <>
                  {navLink('/admin', 'Dashboard', <LayoutDashboard size={16} />)}
                  {navLink('/admin/sellers', 'Sellers', <Users size={16} />)}
                  {navLink('/admin/users', 'Users', <UserCircle size={16} />)}
                  {navLink('/admin/categories', 'Categories', <Tags size={16} />)}
                </>
              )}

              {user?.role === 'SELLER' && (
                <>
                  {navLink('/seller', 'Dashboard', <LayoutDashboard size={16} />)}
                  {navLink('/seller/products', 'Products', <Package size={16} />)}
                  {navLink('/seller/orders', 'Orders', <ShoppingBag size={16} />)}
                  {navLink('/seller/ratings', 'Ratings', <Star size={16} />)}
                </>
              )}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-100 transition-colors"
                  >
                    {user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt={user.name}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-primary-200"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white text-xs font-bold">
                        {getInitials(user.name)}
                      </div>
                    )}
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-semibold text-surface-800 leading-tight">{user.name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full text-white font-semibold ${roleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-surface-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-glass-lg border border-surface-100 py-2 animate-scale-in z-50">
                      <div className="px-4 py-3 border-b border-surface-100">
                        <p className="font-semibold text-surface-800">{user.name}</p>
                        <p className="text-xs text-surface-400 truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-surface-600 hover:bg-surface-50 hover:text-surface-900 transition-colors"
                      >
                        <UserCircle size={16} /> My Profile
                      </Link>
                      {user.role === 'CUSTOMER' && (
                        <Link
                          to="/my-orders"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-surface-600 hover:bg-surface-50 hover:text-surface-900 transition-colors"
                        >
                          <Package size={16} /> My Orders
                        </Link>
                      )}
                      <div className="border-t border-surface-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full transition-colors"
                        >
                          <LogOut size={16} /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="text-surface-600 hover:text-surface-900 px-4 py-2 text-sm font-semibold rounded-xl hover:bg-surface-100 transition-all"
                  >
                    Sign In
                  </Link>
                  <Link to="/register" className="btn-primary btn-sm">
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl hover:bg-surface-100 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>


        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-surface-100 bg-white animate-slide-down">
            <div className="px-4 py-3 space-y-1">
              {mobileLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive ? 'bg-primary-50 text-primary-700' : 'text-surface-600 hover:bg-surface-50'
                    }`
                  }
                >
                  {l.icon}
                  {l.label}
                </NavLink>
              ))}
              {user && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full"
                >
                  <LogOut size={18} /> Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-100 bg-white/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                  <BookOpen size={16} className="text-white" />
                </div>
                <span className="font-bold font-display text-lg gradient-text">Kitaabwala</span>
              </div>
              <p className="text-sm text-surface-400 max-w-xs">
                Discover thousands of titles from verified sellers — built with care for book lovers everywhere.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">Explore</p>
              <div className="flex flex-col gap-2">
                <Link to="/catalogue" className="text-sm text-surface-500 hover:text-primary-600 transition-colors w-fit">
                  Browse Catalogue
                </Link>
                <Link to="/register" className="text-sm text-surface-500 hover:text-primary-600 transition-colors w-fit">
                  Become a Seller
                </Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">Why Kitaabwala</p>
              <div className="flex flex-col gap-2 text-sm text-surface-500">
                <span className="flex items-center gap-2"><Sparkles size={14} className="text-accent-500" /> Handpicked collections</span>
                <span className="flex items-center gap-2"><Package size={14} className="text-primary-500" /> Delivered with care</span>
              </div>
            </div>
          </div>
          <div className="border-t border-surface-100 mt-8 pt-6 text-center text-xs text-surface-400">
            © {new Date().getFullYear()} Kitaabwala. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
