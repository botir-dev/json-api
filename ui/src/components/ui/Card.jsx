export default function Card({ children, className, style, ...props }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, style }) {
  return (
    <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', ...style }}>
      {children}
    </div>
  );
}

export function CardBody({ children, style }) {
  return (
    <div style={{ padding: '24px', ...style }}>
      {children}
    </div>
  );
}
