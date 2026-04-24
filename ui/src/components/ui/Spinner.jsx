export default function Spinner({ size = 24, color = '#3b82f6' }) {
  return (
    <div
      className="animate-spin"
      style={{
        width: size,
        height: size,
        border: `2px solid ${color}20`,
        borderTop: `2px solid ${color}`,
        borderRadius: '50%',
        flexShrink: 0,
      }}
    />
  );
}

export function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '200px',
      }}
    >
      <Spinner size={32} />
    </div>
  );
}
