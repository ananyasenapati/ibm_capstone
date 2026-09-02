import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react';

/* ---------- Full page loading ---------- */
export function PageLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <Loader2 size={32} className="animate-spin text-primary-500" />
      <p className="text-sm text-surface-400 font-medium">{label}</p>
    </div>
  );
}

/* ---------- Card grid skeleton ---------- */
export function CardSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="skeleton h-44 rounded-none" />
          <div className="p-4 space-y-2.5">
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
            <div className="skeleton h-5 w-1/3 mt-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Error state with retry ---------- */
export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-5">
        <AlertTriangle size={32} className="text-red-400" />
      </div>
      <h2 className="text-lg font-semibold text-surface-800 mb-1">Something went wrong</h2>
      <p className="text-surface-400 text-sm mb-6 max-w-sm">
        {message || 'We could not load this content. Please check your connection and try again.'}
      </p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary btn-sm">
          <RefreshCw size={14} /> Try Again
        </button>
      )}
    </div>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="w-24 h-24 bg-gradient-to-br from-surface-100 to-surface-200 rounded-3xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h2 className="text-xl font-semibold text-surface-700 mb-2">{title}</h2>
      {description && <p className="text-surface-400 mb-6 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

export { Inbox };
