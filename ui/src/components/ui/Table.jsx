export function Table({ children }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }) {
  return (
    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
      {children}
    </thead>
  );
}

export function Th({ children, style }) {
  return (
    <th
      style={{
        padding: '10px 16px',
        textAlign: 'left',
        fontSize: '11px',
        fontWeight: 600,
        color: '#64748b',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </th>
  );
}

export function Tbody({ children }) {
  return <tbody>{children}</tbody>;
}

export function Tr({ children, onClick, style }) {
  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: '1px solid #f1f5f9',
        transition: 'background 0.1s',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.background = '#f8fafc')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </tr>
  );
}

export function Td({ children, style }) {
  return (
    <td style={{ padding: '12px 16px', color: '#334155', verticalAlign: 'middle', ...style }}>
      {children}
    </td>
  );
}
