import { clsx } from 'clsx';

export default function Input({ label, error, className, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>
          {label}
        </label>
      )}
      <input
        className={clsx(className)}
        style={{
          padding: '8px 12px',
          borderRadius: '8px',
          border: `1px solid ${error ? '#ef4444' : '#e2e8f0'}`,
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          background: '#fff',
          color: '#1e293b',
          width: '100%',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#3b82f6';
          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? '#ef4444' : '#e2e8f0';
          e.target.style.boxShadow = 'none';
        }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '12px', color: '#ef4444' }}>{error}</span>
      )}
    </div>
  );
}

export function Select({ label, error, children, className, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>
          {label}
        </label>
      )}
      <select
        style={{
          padding: '8px 12px',
          borderRadius: '8px',
          border: `1px solid ${error ? '#ef4444' : '#e2e8f0'}`,
          fontSize: '14px',
          outline: 'none',
          background: '#fff',
          color: '#1e293b',
          width: '100%',
          cursor: 'pointer',
        }}
        {...props}
      >
        {children}
      </select>
      {error && <span style={{ fontSize: '12px', color: '#ef4444' }}>{error}</span>}
    </div>
  );
}
