import React, { useState, useEffect, useCallback } from 'react';

const API    = 'http://localhost:3000';
const YELLOW = '#FFD600';
const BLACK  = '#1A1A1A';
const GRAY   = '#9CA3AF';
const LIGHT  = '#F3F4F6';

/* ── Delete Modal ───────────────────────────────────── */
function DeleteModal({ item, onConfirm, onCancel }) {
  return (
    <div style={s.overlay} onClick={onCancel}>
      <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
        <p style={s.modalQuestion}>
          Remove <strong>"{item.name}"</strong> from the list?
        </p>
        <div style={s.modalActions}>
          <button style={s.modalCancel} onClick={onCancel}>Cancel</button>
          <button style={s.modalDelete} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ── Item Row ───────────────────────────────────────── */
function ItemRow({ item, index, onToggle, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(item.name);

  const startEdit = () => { setVal(item.name); setEditing(true); };

  const saveEdit = async () => {
    if (val.trim() && val.trim() !== item.name) await onEdit(item.id, val.trim());
    setEditing(false);
  };

  const cancelEdit = () => { setVal(item.name); setEditing(false); };

  return (
    <li style={s.item}>
      {/* Index */}
      <span style={s.idx}>{String(index + 1).padStart(2, '0')}</span>

      {/* Name / inline edit */}
      {editing ? (
        <input
          style={s.inlineInput}
          value={val}
          autoFocus
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter')  saveEdit();
            if (e.key === 'Escape') cancelEdit();
          }}
        />
      ) : (
        <span style={item.checked ? s.nameDone : s.name}>{item.name}</span>
      )}

      {/* Edit / save actions */}
      {editing ? (
        <div style={s.actionGroup}>
          <button style={s.saveBtn} onClick={saveEdit}>Save</button>
          <button style={s.cancelSmBtn} onClick={cancelEdit}>✕</button>
        </div>
      ) : (
        <div style={s.actionGroup}>
          <button style={s.editPill} onClick={startEdit}>Edit</button>
          <button
            style={s.deleteBtn}
            onClick={() => onDelete(item)}
            title="Delete"
          >
            ✕
          </button>
        </div>
      )}

      {/* Circle checkbox */}
      <button
        style={item.checked ? s.circleChecked : s.circle}
        onClick={() => onToggle(item)}
        title={item.checked ? 'Mark undone' : 'Mark done'}
      >
        {item.checked && <span style={s.circleCheckmark}>✓</span>}
      </button>
    </li>
  );
}

/* ── App ────────────────────────────────────────────── */
export default function App() {
  const [items, setItems]           = useState([]);
  const [input, setInput]           = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchItems = useCallback(async () => {
    const res  = await fetch(`${API}/items`);
    const data = await res.json();
    setItems(data);
  }, []);

  useEffect(() => {
    fetchItems();
    const id = setInterval(fetchItems, 3000);
    return () => clearInterval(id);
  }, [fetchItems]);

  const addItem = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    await fetch(`${API}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: input.trim() }),
    });
    setInput('');
    fetchItems();
  };

  const toggleItem = async (item) => {
    await fetch(`${API}/items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked: !item.checked }),
    });
    fetchItems();
  };

  const editItem = async (id, name) => {
    await fetch(`${API}/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    fetchItems();
  };

  const deleteItem = async () => {
    await fetch(`${API}/items/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    fetchItems();
  };

  const checkedCount = items.filter((i) => i.checked).length;
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div style={s.page}>
      {deleteTarget && (
        <DeleteModal
          item={deleteTarget}
          onConfirm={deleteItem}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div style={s.shell}>
        {/* ── Yellow header ── */}
        <div style={s.header}>
          <h1 style={s.appName}>Shopping List.</h1>
          <p style={s.appSub}>PWAM Demo  ·  {today}</p>
        </div>

        {/* ── White card ── */}
        <div style={s.card}>
          {/* Stats */}
          <div style={s.statsRow}>
            <span style={s.statsLabel}>
              Items <span style={s.statsCount}>({items.length})</span>
            </span>
            {items.length > 0 && (
              <span style={s.statsDone}>{checkedCount} done</span>
            )}
          </div>

          {/* Add form */}
          <form style={s.addRow} onSubmit={addItem}>
            <input
              style={s.addInput}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Add a new item…"
            />
            <button style={s.addBtn} type="submit">+</button>
          </form>

          <div style={s.divider} />

          {/* List */}
          {items.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>🧺</div>
              <p style={s.emptyText}>Your list is empty</p>
              <p style={s.emptyHint}>Add the first item above</p>
            </div>
          ) : (
            <ul style={s.list}>
              {items.map((item, index) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  onToggle={toggleItem}
                  onEdit={editItem}
                  onDelete={setDeleteTarget}
                />
              ))}
            </ul>
          )}

          {items.length > 0 && (
            <div style={s.footer}>
              {checkedCount === items.length
                ? '✅ All done!'
                : `${items.length - checkedCount} item${items.length - checkedCount !== 1 ? 's' : ''} remaining`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────── */
const s = {
  page: {
    minHeight: '100vh',
    backgroundColor: YELLOW,
    display: 'flex',
    justifyContent: 'center',
    padding: '0 16px 40px',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  shell: {
    width: '100%',
    maxWidth: 480,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
  },

  /* Header */
  header: {
    padding: '36px 8px 28px',
  },
  appName: {
    margin: 0,
    fontSize: 38,
    fontWeight: 900,
    color: BLACK,
    letterSpacing: '-0.5px',
    lineHeight: 1.1,
  },
  appSub: {
    margin: '6px 0 0',
    fontSize: 13,
    color: '#5A5A00',
  },

  /* White card */
  card: {
    background: '#fff',
    borderRadius: 24,
    padding: '20px 20px 0',
    boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
    overflow: 'hidden',
  },

  /* Stats */
  statsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  statsLabel: {
    fontSize: 16,
    fontWeight: 700,
    color: BLACK,
  },
  statsCount: {
    color: GRAY,
    fontWeight: 400,
  },
  statsDone: {
    fontSize: 13,
    color: GRAY,
  },

  /* Add row */
  addRow: {
    display: 'flex',
    gap: 10,
    marginBottom: 16,
  },
  addInput: {
    flex: 1,
    height: 46,
    background: LIGHT,
    border: 'none',
    borderRadius: 12,
    padding: '0 14px',
    fontSize: 15,
    color: BLACK,
    outline: 'none',
  },
  addBtn: {
    width: 46,
    height: 46,
    background: YELLOW,
    border: 'none',
    borderRadius: 12,
    fontSize: 28,
    fontWeight: 700,
    color: BLACK,
    cursor: 'pointer',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  divider: {
    height: 1,
    background: '#F3F4F6',
    margin: '0 -20px 4px',
  },

  /* List */
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },

  /* Item row */
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '13px 0',
    borderBottom: '1px solid #F3F4F6',
  },
  idx: {
    fontSize: 12,
    fontWeight: 600,
    color: GRAY,
    width: 22,
    textAlign: 'right',
    flexShrink: 0,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: 600,
    color: BLACK,
  },
  nameDone: {
    flex: 1,
    fontSize: 15,
    fontWeight: 400,
    color: GRAY,
    textDecoration: 'line-through',
  },
  inlineInput: {
    flex: 1,
    fontSize: 15,
    border: `2px solid ${YELLOW}`,
    borderRadius: 8,
    padding: '4px 8px',
    outline: 'none',
    background: '#FFFDE7',
  },

  /* Action group */
  actionGroup: {
    display: 'flex',
    gap: 6,
    flexShrink: 0,
    alignItems: 'center',
  },
  editPill: {
    background: '#FFF9C4',
    border: `1px solid ${YELLOW}`,
    borderRadius: 20,
    padding: '3px 10px',
    fontSize: 12,
    fontWeight: 700,
    color: '#7A6800',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  saveBtn: {
    background: YELLOW,
    border: 'none',
    borderRadius: 8,
    padding: '4px 10px',
    fontSize: 13,
    fontWeight: 700,
    color: BLACK,
    cursor: 'pointer',
  },
  cancelSmBtn: {
    background: LIGHT,
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '4px 8px',
    fontSize: 13,
    cursor: 'pointer',
    color: GRAY,
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    fontSize: 14,
    color: '#D1D5DB',
    cursor: 'pointer',
    padding: '2px 4px',
    lineHeight: 1,
  },

  /* Circle checkbox */
  circle: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: '2px solid #D1D5DB',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    padding: 0,
  },
  circleChecked: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: `2px solid ${YELLOW}`,
    background: YELLOW,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    padding: 0,
  },
  circleCheckmark: {
    fontSize: 13,
    fontWeight: 800,
    color: BLACK,
    lineHeight: 1,
  },

  /* Empty */
  empty: {
    textAlign: 'center',
    padding: '44px 0',
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 12,
  },
  emptyText: {
    margin: '0 0 4px',
    fontSize: 17,
    fontWeight: 700,
    color: BLACK,
  },
  emptyHint: {
    margin: 0,
    fontSize: 13,
    color: GRAY,
  },

  /* Footer */
  footer: {
    textAlign: 'center',
    padding: '12px 0',
    fontSize: 13,
    color: GRAY,
    borderTop: '1px solid #F3F4F6',
    margin: '0 -20px',
  },

  /* Delete Modal */
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 16,
  },
  modalBox: {
    background: '#fff',
    borderRadius: 20,
    padding: '28px 24px 20px',
    maxWidth: 340,
    width: '100%',
    boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
    textAlign: 'center',
  },
  modalQuestion: {
    margin: '0 0 24px',
    fontSize: 16,
    color: '#374151',
    lineHeight: 1.5,
  },
  modalActions: {
    display: 'flex',
    gap: 10,
  },
  modalCancel: {
    flex: 1,
    padding: '11px 0',
    fontSize: 15,
    border: '1.5px solid #E5E7EB',
    borderRadius: 12,
    cursor: 'pointer',
    background: '#fff',
    color: '#374151',
    fontWeight: 500,
  },
  modalDelete: {
    flex: 1,
    padding: '11px 0',
    fontSize: 15,
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    background: '#EF4444',
    color: '#fff',
    fontWeight: 700,
  },
};
