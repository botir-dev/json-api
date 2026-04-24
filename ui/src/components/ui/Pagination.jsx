import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.totalPages <= 1) return null;
  const { page, totalPages, total, limit } = meta;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderTop: '1px solid #f1f5f9',
        fontSize: '12px',
        color: '#64748b',
      }}
    >
      <span>Showing {from}–{to} of {total}</span>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <PageBtn disabled={page === 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft size={14} />
        </PageBtn>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let p;
          if (totalPages <= 5) p = i + 1;
          else if (page <= 3) p = i + 1;
          else if (page >= totalPages - 2) p = totalPages - 4 + i;
          else p = page - 2 + i;
          return (
            <PageBtn key={p} active={p === page} onClick={() => onPageChange(p)}>
              {p}
            </PageBtn>
          );
        })}
        <PageBtn disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight size={14} />
        </PageBtn>
      </div>
    </div>
  );
}

function PageBtn({ children, active, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '28px',
        height: '28px',
        padding: '0 6px',
        borderRadius: '6px',
        border: 'none',
        fontSize: '12px',
        fontWeight: active ? 600 : 400,
        background: active ? '#3b82f6' : 'transparent',
        color: active ? '#fff' : '#475569',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => !active && !disabled && (e.currentTarget.style.background = '#f1f5f9')}
      onMouseLeave={(e) => !active && (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </button>
  );
}
