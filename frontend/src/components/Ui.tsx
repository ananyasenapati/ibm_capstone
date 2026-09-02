import { ChevronLeft, ChevronRight } from 'lucide-react';

/* ---------- Pagination ---------- */
export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-2 mt-10">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        className="btn-secondary btn-sm flex items-center gap-1 disabled:opacity-40"
      >
        <ChevronLeft size={14} /> Prev
      </button>
      <div className="flex items-center gap-1 px-2">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all duration-200 ${
              i === page
                ? 'bg-primary-500 text-white shadow-md'
                : 'text-surface-500 hover:bg-surface-100'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        className="btn-secondary btn-sm flex items-center gap-1 disabled:opacity-40"
      >
        Next <ChevronRight size={14} />
      </button>
    </div>
  );
}

/* ---------- Stat card ---------- */
export function StatCard({
  label,
  value,
  icon,
  gradient,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  gradient: string;
  hint?: string;
}) {
  return (
    <div className="card-hover p-5 relative overflow-hidden group">
      <div
        className={`absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity`}
      />
      <div
        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md mb-4 text-white`}
      >
        {icon}
      </div>
      <p className="text-sm text-surface-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-surface-900 tracking-tight">{value}</p>
      {hint && <p className="text-xs text-surface-400 mt-1">{hint}</p>}
    </div>
  );
}

/* ---------- Status badge for orders ---------- */
export function OrderStatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    PLACED: 'bg-sky-50 text-sky-700 border-sky-200',
    CONFIRMED: 'bg-amber-50 text-amber-700 border-amber-200',
    PROCESSING: 'bg-violet-50 text-violet-700 border-violet-200',
    SHIPPED: 'bg-blue-50 text-blue-700 border-blue-200',
    DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  };
  const cls = config[status] || 'bg-surface-50 text-surface-700 border-surface-200';
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {status}
    </span>
  );
}

/* ---------- Star rating display ---------- */
export function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          className={s <= Math.round(value) ? 'text-amber-400' : 'text-surface-200'}
          fill={s <= Math.round(value) ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}
