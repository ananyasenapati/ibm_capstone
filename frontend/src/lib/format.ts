/** Currency formatting (Indian Rupee, en-IN locale). */
export const formatCurrency = (value: number | string | null | undefined): string => {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

/** Date formatting helper. */
export const formatDate = (value: string | null | undefined, withTime = false): string => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
};

/** Initials from a name, e.g. "John Doe" -> "JD". */
export const getInitials = (name: string | null | undefined): string => {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/** Safely extract an array from a paginated or plain API response. */
export const asArray = <T,>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
};

/** Discount percentage between price and discountPrice. */
export const discountPercent = (price?: number | null, discountPrice?: number | null): number | null => {
  if (!price || !discountPrice || discountPrice >= price) return null;
  return Math.round(((price - discountPrice) / price) * 100);
};
