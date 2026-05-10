import React, { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:3000';

/* ── Modal ─────────────────────────────────────────── */
function DeleteModal({ item, onConfirm, onCancel }) {
  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={s.modalIcon}>🗑️</div>
        <h2 style={s.modalTitle}>Delete item?</h2>
        <p style={s.modalBody}>
          <strong>"{item.name}"</strong> will be permanently removed from the list.
        </p>
        <div style={s.modalActions}>
          <button style={s.cancelBtn} onClick={onCancel}>Cancel</button>
          <button style={s.confirmBtn} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ── Item row ───────────────────────────────────────── */
function ItemRow({ item, onToggle, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(item.name);

  const saveEdit = async () => {
    if (!editVal.trim() || editVal.trim() === item.name) {
      setEditing(false);
      setEditVal(item.name);
      return;
    }
    await onEdit(item.id, editVal.trim());
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditVal(item.name);
    setEditing(false);
  };

  return (
    <li style={s.item}>
      <input
        type="checkbox"
        style={s.checkbox}
        checked={Boolean(item.checked)}
        onChange={() => onToggle(item)}
      />

      {editing ? (
        <input
          style={s.editInput}
          value={editVal}
          autoFocus
          onChange={(e) => setEditVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit();
            if (e.key === 'Escape') cancelEdit();
          }}
        />
      ) : (
        <span style={item.checked ? s.nameChecked : s.name}>{item.name}</span>
      )}

      <div style={s.actions}>
        {editing ? (
          <>
            <button style={s.saveBtn} onClick={saveEdit}>Save</button>
            <button style={s.cancelSmBtn} onClick={cancelEdit}>✕</button>
          </>
        ) : (
          <>
            <button
              style={s.editBtn}
              onClick={() => { setEditVal(item.name); setEditing(true); }}
              title="Edit"
            >
              ✏️
            </button>
            <button style={s.deleteBtn} onClick={() => onDelete(item)} title="Delete">
              🗑️
            </button>
          </>
        )}
      </div>
    </li>
  );
}

/* ── App ────────────────────────────────────────────── */
export default function App() {
  const [items, setItems] = useState([]);
  const [input, setInput] = useState('');
  const [lastSync, setLastSync] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchItems = useCallback(async () => {
    const res = await fetch(`${API}/items`);
    const data = await res.json();
    setItems(data);
    setLastSync(new Date().toLocaleTimeString());
  }, []);

  useEffect(() => {
    fetchItems();
    const interval = setInterval(fetchItems, 3000);
    return () => clearInterval(interval);
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

  const confirmDelete = (item) => setDeleteTarget(item);

  const deleteItem = async () => {
    await fetch(`${API}/items/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    fetchItems();
  };

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div style={s.page}>
      {deleteTarget && (
        <DeleteModal
          item={deleteTarget}
          onConfirm={deleteItem}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div style={s.card}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.headerTop}>
            <div>
              <h1 style={s.title}>🛒 Global Shopping List</h1>
              <p style={s.subtitle}>PWAM Demo — Web Frontend</p>
            </div>
            {items.length > 0 && (
              <div style={s.badge}>
                {checkedCount}/{items.length}
              </div>
            )}
          </div>
        </div>

        {/* Add form */}
        <div style={s.formSection}>
          <form style={s.form} onSubmit={addItem}>
            <input
              style={s.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What do you need? (e.g. Apples)"
            />
            <button style={s.addBtn} type="submit">+ Add</button>
          </form>
        </div>

        {/* Sync bar */}
        <div style={s.syncBar}>
          <span style={s.syncDot} />
          <span style={s.syncText}>Last sync: {lastSync ?? '—'}</span>
          <button style={s.refreshBtn} onClick={fetchItems}>↻ Refresh</button>
        </div>

        {/* List */}
        <div style={s.listSection}>
          {items.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>🧺</div>
              <p style={s.emptyText}>The list is empty.</p>
              <p style={s.emptyHint}>Add something above to get started.</p>
            </div>
          ) : (
            <ul style={s.list}>
              {items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onToggle={toggleItem}
                  onEdit={editItem}
                  onDelete={confirmDelete}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={s.footer}>
            {checkedCount === items.length
              ? '✅ All items checked!'
              : `${items.length - checkedCount} item${items.length - checkedCount !== 1 ? 's' : ''} remaining`}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────── */
const s = {
  page: {
    minHeight: '100vh',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '40px 16px',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: 520,
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
    padding: '24px 24px 20px',
    color: '#fff',
  },
  headerTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: '-0.3px',
  },
  subtitle: {
    margin: '4px 0 0',
    fontSize: 13,
    opacity: 0.75,
  },
  badge: {
    background: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    padding: '4px 12px',
    fontSize: 13,
    fontWeight: 600,
    color: '#fff',
    whiteSpace: 'nowrap',
  },
  formSection: {
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
  },
  form: {
    display: 'flex',
    gap: 8,
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    fontSize: 15,
    border: '1.5px solid #e2e8f0',
    borderRadius: 8,
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  addBtn: {
    padding: '10px 18px',
    fontSize: 15,
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  syncBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 20px',
    fontSize: 12,
    color: '#94a3b8',
    borderBottom: '1px solid #f1f5f9',
    background: '#fafafa',
  },
  syncDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#22c55e',
    display: 'inline-block',
    flexShrink: 0,
  },
  syncText: {
    flex: 1,
  },
  refreshBtn: {
    background: 'none',
    border: '1px solid #e2e8f0',
    borderRadius: 5,
    padding: '2px 8px',
    cursor: 'pointer',
    fontSize: 12,
    color: '#64748b',
  },
  listSection: {
    minHeight: 80,
  },
  list: {
    listStyle: 'none',
    padding: '12px 16px',
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '11px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    background: '#fff',
    transition: 'box-shadow 0.15s',
  },
  checkbox: {
    width: 17,
    height: 17,
    cursor: 'pointer',
    flexShrink: 0,
    accentColor: '#2563eb',
  },
  name: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
  },
  nameChecked: {
    flex: 1,
    fontSize: 15,
    textDecoration: 'line-through',
    color: '#94a3b8',
  },
  editInput: {
    flex: 1,
    fontSize: 15,
    border: '1.5px solid #2563eb',
    borderRadius: 6,
    padding: '4px 8px',
    outline: 'none',
  },
  actions: {
    display: 'flex',
    gap: 4,
    flexShrink: 0,
  },
  editBtn: {
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    cursor: 'pointer',
    padding: '4px 7px',
    fontSize: 13,
    lineHeight: 1,
  },
  deleteBtn: {
    background: '#fff5f5',
    border: '1px solid #fecaca',
    borderRadius: 6,
    cursor: 'pointer',
    padding: '4px 7px',
    fontSize: 13,
    lineHeight: 1,
  },
  saveBtn: {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    padding: '4px 10px',
    fontSize: 13,
    fontWeight: 600,
  },
  cancelSmBtn: {
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    cursor: 'pointer',
    padding: '4px 7px',
    fontSize: 13,
  },
  empty: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: '#64748b',
  },
  emptyHint: {
    margin: '4px 0 0',
    fontSize: 13,
    color: '#94a3b8',
  },
  footer: {
    textAlign: 'center',
    padding: '12px 20px',
    fontSize: 13,
    color: '#64748b',
    borderTop: '1px solid #f1f5f9',
    background: '#fafafa',
  },
  /* Modal */
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
  modal: {
    background: '#fff',
    borderRadius: 16,
    padding: '28px 28px 24px',
    maxWidth: 360,
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    textAlign: 'center',
  },
  modalIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  modalTitle: {
    margin: '0 0 8px',
    fontSize: 20,
    fontWeight: 700,
    color: '#111827',
  },
  modalBody: {
    margin: '0 0 24px',
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 1.5,
  },
  modalActions: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
  },
  cancelBtn: {
    flex: 1,
    padding: '10px 0',
    fontSize: 15,
    border: '1.5px solid #e2e8f0',
    borderRadius: 8,
    cursor: 'pointer',
    background: '#fff',
    color: '#374151',
    fontWeight: 500,
  },
  confirmBtn: {
    flex: 1,
    padding: '10px 0',
    fontSize: 15,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    background: '#ef4444',
    color: '#fff',
    fontWeight: 600,
  },
};
