import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { MapPin, CreditCard, Loader2, ArrowLeft, BookOpen, Shield, Truck, Check, Plus, Trash2 } from 'lucide-react';
import { EmptyState, PageLoader } from '../components/StateViews';
import { asArray, formatCurrency } from '../lib/format';
import { getErrorMessage } from '../services/api';

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', state: '', pincode: '', country: 'India', isDefault: false,
  });
  const [savingAddress, setSavingAddress] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/cart').catch(() => ({ data: null })),
      api.get('/addresses').catch(() => ({ data: [] })),
    ])
      .then(([c, a]) => {
        setCart(c.data);
        setAddresses(asArray<any>(a.data));
        const defaultAddr = asArray<any>(a.data).find((addr: any) => addr.isDefault);
        if (defaultAddr) setSelectedAddress(defaultAddr.id);
        else if (asArray<any>(a.data).length > 0) setSelectedAddress(asArray<any>(a.data)[0].id);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const { data } = await api.post('/addresses', addressForm);
      toast.success('Address added');
      setShowAddressForm(false);
      setAddressForm({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: 'India', isDefault: false });
      setAddresses((prev) => [...prev, data]);
      setSelectedAddress(data.id);
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to add address'));
    } finally {
      setSavingAddress(false);
    }
  };

  const deleteAddress = async (id: number) => {
    try {
      await api.delete(`/addresses/${id}`);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      if (selectedAddress === id) setSelectedAddress(null);
      toast.success('Address removed');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to remove address'));
    }
  };

  const placeOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }
        if (!cart || asArray<any>(cart?.items).length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/orders', { addressId: selectedAddress, paymentMethod: 'COD' });
      toast.success('Order placed successfully!');
      navigate('/my-orders');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to place order'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

    const items = asArray<any>(cart?.items);
  if (!cart || items.length === 0)
    return (
      <EmptyState
        icon={<BookOpen size={40} className="text-surface-300" />}
        title="Nothing to checkout"
        description="Add items to your cart first."
        action={<Link to="/catalogue" className="btn-primary">Browse Books</Link>}
      />
    );

  const subtotal = cart.subtotal ?? items.reduce((s: number, i: any) => s + (Number(i.totalPrice) || 0), 0);
  const discount = (Number(cart.discount) || 0) + (Number(cart.giftPointDiscount) || 0);
  const total = cart.total ?? subtotal;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-surface-500 hover:text-surface-900 mb-6 transition-colors">
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">Back to Cart</span>
      </button>

      <h1 className="font-display text-3xl sm:text-4xl font-bold text-surface-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Address Selection */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-surface-800">
                <MapPin size={20} className="text-primary-500" /> Delivery Address
              </h2>
              <button onClick={() => setShowAddressForm(!showAddressForm)} className="btn-ghost btn-sm text-primary-600">
                <Plus size={14} /> Add New
              </button>
            </div>

            {addresses.length === 0 && !showAddressForm && (
              <div className="bg-surface-50 rounded-xl p-6 text-center">
                <MapPin size={28} className="mx-auto text-surface-300 mb-2" />
                <p className="text-surface-500 text-sm mb-3">No saved addresses yet. Add one to continue.</p>
                <button onClick={() => setShowAddressForm(true)} className="btn-secondary btn-sm">Add Address</button>
              </div>
            )}

            {/* Address list */}
            <div className="space-y-3">
              {addresses.map((addr: any) => (
                <div
                  key={addr.id}
                  onClick={() => setSelectedAddress(addr.id)}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedAddress === addr.id
                      ? 'border-primary-400 bg-primary-50/50 shadow-glow-primary'
                      : 'border-surface-200 hover:border-surface-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      selectedAddress === addr.id ? 'border-primary-500 bg-primary-500' : 'border-surface-300'
                    }`}
                  >
                    {selectedAddress === addr.id && <Check size={12} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-surface-800 text-sm">{addr.fullName}</p>
                      {addr.isDefault && <span className="badge-primary">Default</span>}
                    </div>
                    <p className="text-sm text-surface-600 mt-0.5">
                      {addr.addressLine1}
                      {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                    </p>
                    <p className="text-sm text-surface-600">
                      {addr.city}, {addr.state} — {addr.pincode}
                    </p>
                    <p className="text-xs text-surface-400 mt-0.5">{addr.phone}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteAddress(addr.id); }}
                    className="text-surface-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    aria-label="Delete address"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add address form */}
            {showAddressForm && (
              <form onSubmit={saveAddress} className="border border-primary-200 rounded-xl p-4 space-y-3 bg-primary-50/30 mt-4 animate-slide-down">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Full Name" required value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} className="input" />
                  <input placeholder="Phone" required value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} className="input" />
                </div>
                <input placeholder="Address Line 1" required value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })} className="input" />
                <input placeholder="Address Line 2 (optional)" value={addressForm.addressLine2}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })} className="input" />
                <div className="grid grid-cols-3 gap-3">
                  <input placeholder="City" required value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className="input" />
                  <input placeholder="State" required value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} className="input" />
                  <input placeholder="Pincode" required value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} className="input" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={savingAddress} className="btn-primary btn-sm">
                    {savingAddress ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save Address
                  </button>
                  <button type="button" onClick={() => setShowAddressForm(false)} className="btn-secondary btn-sm">Cancel</button>
                </div>
              </form>
            )}

            {/* Payment */}
            <div className="card p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-surface-800 mb-4">
                <CreditCard size={20} className="text-primary-500" /> Payment Method
              </h2>
              <div className="border-2 border-emerald-300 bg-emerald-50/60 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CreditCard size={18} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-surface-800">Cash on Delivery</p>
                  <p className="text-sm text-surface-500">Pay when you receive your order</p>
                </div>
                <Check size={18} className="text-emerald-600 ml-auto" />
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 lg:sticky lg:top-24">
              <h3 className="font-bold text-surface-800 text-lg mb-4">Order Summary</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4 pr-1">
                {items.map((item: any) => (
                  <div key={item.id} className="flex gap-3 py-2 border-b border-surface-50 last:border-0">
                    <div className="w-12 h-16 bg-surface-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                      {item.productImage ? (
                        <img src={item.productImage} className="w-full h-full object-cover" alt={item.productName} />
                      ) : (
                        <BookOpen size={16} className="text-surface-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-800 truncate">{item.productName}</p>
                      <p className="text-xs text-surface-400">Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</p>
                    </div>
                    <span className="text-sm font-semibold text-surface-800">{formatCurrency(item.totalPrice)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm border-t border-surface-100 pt-4">
                <div className="flex justify-between text-surface-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discounts</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-surface-600">
                  <span>Shipping</span>
                  <span className="text-emerald-500 font-medium">Free</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-surface-100">
                  <span className="font-bold text-surface-900">Total</span>
                  <span className="font-bold text-primary-600 text-lg">{formatCurrency(total)}</span>
                </div>
              </div>
              <button
                onClick={placeOrder}
                disabled={submitting || !selectedAddress}
                className="btn-primary w-full mt-6 py-3.5 text-base"
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Shield size={18} /> Place Order
                  </>
                )}
              </button>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-surface-400">
                <span className="flex items-center gap-1"><Shield size={12} /> Secure</span>
                <span className="flex items-center gap-1"><Truck size={12} /> Fast Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}