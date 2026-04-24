export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 32px',
        textAlign: 'center',
        gap: '12px',
      }}
    >
      {Icon && (
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
          }}
        >
          <Icon size={24} />
        </div>
      )}
      <div>
        <p style={{ fontWeight: 600, color: '#334155', fontSize: '14px' }}>{title}</p>
        {description && (
          <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
