import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import Layout from './layouts/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import Catalogue from './pages/Catalogue';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSellers from './pages/admin/AdminSellers';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCategories from './pages/admin/AdminCategories';
import SellerDashboard from './pages/seller/SellerDashboard';
import SellerProducts from './pages/seller/SellerProducts';
import SellerOrders from './pages/seller/SellerOrders';
import SellerRatings from './pages/seller/SellerRatings';
import Profile from './pages/Profile';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '12px',
            background: '#1c1917',
            color: '#fafaf9',
            fontSize: '14px',
            fontWeight: 500,
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fafaf9' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fafaf9' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="catalogue" element={<Catalogue />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
          <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          <Route path="admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="admin/sellers" element={<ProtectedRoute roles={['ADMIN']}><AdminSellers /></ProtectedRoute>} />
          <Route path="admin/users" element={<ProtectedRoute roles={['ADMIN']}><AdminUsers /></ProtectedRoute>} />
          <Route path="admin/categories" element={<ProtectedRoute roles={['ADMIN']}><AdminCategories /></ProtectedRoute>} />

          <Route path="seller" element={<ProtectedRoute roles={['SELLER']}><SellerDashboard /></ProtectedRoute>} />
          <Route path="seller/products" element={<ProtectedRoute roles={['SELLER']}><SellerProducts /></ProtectedRoute>} />
          <Route path="seller/orders" element={<ProtectedRoute roles={['SELLER']}><SellerOrders /></ProtectedRoute>} />
          <Route path="seller/ratings" element={<ProtectedRoute roles={['SELLER']}><SellerRatings /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
