import { useEffect, useState } from 'react';
import { Clock, XCircle, ShieldAlert } from 'lucide-react';
import api from '../services/api';

/**
 * Shows a banner when the logged-in seller's account is not approved yet.
 * The backend blocks write operations (create/edit products, update orders)
 * until an admin approves the seller profile.
 */
export default function SellerApprovalBanner() {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/seller/profile')
      .then((r) => setStatus(r.data?.approvalStatus ?? null))
      .catch(() => setStatus(null));
  }, []);

  if (!status || status === 'APPROVED') return null;

  if (status === 'PENDING') {
    return (
      <div className="mb-6 flex items-center gap-3 bg-gradient-to-r from-amber-400 to-accent-500 text-white rounded-2xl p-4 px-5 shadow-glow-accent animate-fade-in">
        <Clock size={20} className="shrink-0" />
        <div>
          <p className="font-semibold text-sm">Your seller account is awaiting admin approval</p>
          <p className="text-xs text-accent-50/90 mt-0.5">
            You can browse your dashboard, but creating products and updating orders will be enabled once an admin approves your application.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-center gap-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl p-4 px-5 shadow-glow-accent animate-fade-in">
      {status === 'REJECTED' ? <XCircle size={20} className="shrink-0" /> : <ShieldAlert size={20} className="shrink-0" />}
      <div>
        <p className="font-semibold text-sm">
          {status === 'REJECTED' ? 'Your seller application was rejected' : `Seller account status: ${status}`}
        </p>
        <p className="text-xs text-red-100 mt-0.5">
          Please contact the platform administrator for assistance.
        </p>
      </div>
    </div>
  );
}