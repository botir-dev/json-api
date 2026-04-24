const variants = {
  default: { background: '#f1f5f9', color: '#475569' },
  primary: { background: '#dbeafe', color: '#1d4ed8' },
  success: { background: '#dcfce7', color: '#15803d' },
  warning: { background: '#fef9c3', color: '#a16207' },
  danger: { background: '#fee2e2', color: '#b91c1c' },
  info: { background: '#e0f2fe', color: '#0369a1' },
  purple: { background: '#f3e8ff', color: '#7e22ce' },
};

export default function Badge({ children, variant = 'default', style }) {
  const v = variants[variant] || variants.default;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        ...v,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function statusBadge(status) {
  const map = {
    PENDING: 'warning',
    PROCESSING: 'primary',
    SHIPPED: 'info',
    DELIVERED: 'success',
    CANCELLED: 'danger',
    REFUNDED: 'purple',
    ADMIN: 'danger',
    USER: 'default',
    MODERATOR: 'info',
    active: 'success',
    inactive: 'danger',
  };
  return map[status] || 'default';
}
