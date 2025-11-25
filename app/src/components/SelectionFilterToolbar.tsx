import type { CSSProperties, ReactNode } from 'react';

export type BulkAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'danger' | 'success';
};

interface SelectionFilterToolbarProps {
  title: string;
  subtitle?: ReactNode;
  selectedCount: number;
  visibleCount?: number;
  totalCount?: number;
  searchPlaceholder?: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  actions?: BulkAction[];
}

export function SelectionFilterToolbar({
  title,
  subtitle,
  selectedCount,
  visibleCount,
  totalCount,
  searchPlaceholder = 'Search…',
  searchTerm,
  onSearchChange,
  onSelectAll,
  onClearSelection,
  actions = [],
}: SelectionFilterToolbarProps) {
  const buttonStyle: CSSProperties = {
    padding: '0.5rem 1rem',
    background: '#e9ecef',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
  };

  const variantStyle = (variant: BulkAction['variant']): CSSProperties => {
    if (variant === 'primary') {
      return { background: '#007bff', borderColor: '#007bff', color: 'white', fontWeight: 'bold' };
    }
    if (variant === 'danger') {
      return { background: '#e74c3c', borderColor: '#c0392b', color: 'white', fontWeight: 'bold' };
    }
    if (variant === 'success') {
      return { background: '#28a745', borderColor: '#28a745', color: 'white', fontWeight: 'bold' };
    }
    return {};
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
      <div>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#6c757d' }}>
          {subtitle}
          {visibleCount !== undefined && totalCount !== undefined && (
            <>
              {subtitle ? ' · ' : ''}
              {selectedCount} selected · {visibleCount} visible / {totalCount} total
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            padding: '0.4rem 0.75rem',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            fontSize: '0.9rem',
            minWidth: '220px',
          }}
        />
        <button type="button" onClick={onSelectAll} style={buttonStyle}>
          Select All
        </button>
        <button type="button" onClick={onClearSelection} style={buttonStyle}>
          Unselect All
        </button>
        {actions.map((action, idx) => (
          <button
            key={`${action.label}-${idx}`}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            style={{
              ...buttonStyle,
              ...(variantStyle(action.variant)),
              opacity: action.disabled ? 0.6 : 1,
              cursor: action.disabled ? 'not-allowed' : 'pointer',
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

