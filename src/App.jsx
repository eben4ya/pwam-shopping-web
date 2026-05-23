import React, { useState, useEffect, useCallback } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const API              = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const YELLOW = '#FFD600';
const BLACK  = '#1A1A1A';
const GRAY   = '#9CA3AF';
const LIGHT  = '#F3F4F6';

/* ── helpers ────────────────────────────────────────── */
function authHeaders(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

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

  const startEdit  = () => { setVal(item.name); setEditing(true); };
  const cancelEdit = () => { setVal(item.name); setEditing(false); };
  const saveEdit   = async () => {
    if (val.trim() && val.trim() !== item.name) await onEdit(item.id, val.trim());
    setEditing(false);
  };

  return (
    <li style={s.item}>
      <span style={s.idx}>{String(index + 1).padStart(2, '0')}</span>

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

      {editing ? (
        <div style={s.actionGroup}>
          <button style={s.saveBtn} onClick={saveEdit}>Save</button>
          <button style={s.cancelSmBtn} onClick={cancelEdit}>✕</button>
        </div>
      ) : (
        <div style={s.actionGroup}>
          <button style={s.editPill} onClick={startEdit}>Edit</button>
          <button style={s.deleteBtn} onClick={() => onDelete(item)} title="Delete">✕</button>
        </div>
      )}

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

/* ── AI Suggest Box ─────────────────────────────────── */
function AiSuggestBox({ onAdd }) {
  const [prompt, setPrompt]   = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems]     = useState([]);
  const [error, setError]     = useState('');
  const [addedIdx, setAddedIdx] = useState(new Set());

  const suggest = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError('');
    setItems([]);
    setAddedIdx(new Set());
    try {
      const res = await fetch(`${API}/ai/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI gagal');
      setItems(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addOne = async (name, idx) => {
    await onAdd(name);
    setAddedIdx((prev) => new Set(prev).add(idx));
  };

  return (
    <div style={s.aiBox}>
      <form style={s.addRow} onSubmit={suggest}>
        <input
          style={s.addInput}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='Tanya AI: "mau bikin rendang untuk 5 porsi"'
          maxLength={500}
          disabled={loading}
        />
        <button style={s.aiBtn} type="submit" disabled={loading || !prompt.trim()}>
          {loading ? (
            <svg width="18" height="18" viewBox="0 0 18 18">
              <circle cx="9" cy="9" r="6.5" fill="none" stroke="rgba(255,214,0,0.3)" strokeWidth="2.5"/>
              <circle cx="9" cy="9" r="6.5" fill="none" stroke={YELLOW} strokeWidth="2.5"
                strokeDasharray="10 31" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate"
                  from="0 9 9" to="360 9 9" dur="0.75s" repeatCount="indefinite"/>
              </circle>
            </svg>
          ) : '✨'}
        </button>
      </form>
      {error && <div style={s.aiError}>{error}</div>}
      {items.length > 0 && (
        <div style={s.aiResults}>
          <div style={s.aiResultsHeader}>Hasil dari AI · {items.length} saran</div>
          <ul style={s.aiList}>
            {items.map((name, idx) => (
              <li key={idx} style={s.aiItem}>
                <span style={s.aiItemName}>{name}</span>
                <button
                  style={addedIdx.has(idx) ? s.aiAddedBtn : s.aiAddBtn}
                  onClick={() => addOne(name, idx)}
                  disabled={addedIdx.has(idx)}
                >
                  {addedIdx.has(idx) ? '✓ Ditambah' : '+ Tambah'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── Login Screen ───────────────────────────────────── */
function LoginScreen({ onLogin }) {
  return (
    <div style={s.page}>
      <div style={s.shell}>
        <div style={s.header}>
          <h1 style={s.appName}>Shopping List.</h1>
        </div>
        <div style={s.card}>
          <div style={s.loginWrap}>
            <p style={s.loginHint}>Sign in to access your personal list</p>
            <GoogleLogin
              onSuccess={onLogin}
              onError={() => console.error('Google login failed')}
              useOneTap
              shape="pill"
              size="large"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── App ────────────────────────────────────────────── */
function ShoppingApp() {
  const [token, setToken]       = useState(() => localStorage.getItem('jwt'));
  const [user, setUser]         = useState(null);
  const [items, setItems]       = useState([]);
  const [input, setInput]       = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showAi, setShowAi]         = useState(false);

  // Validate stored token on mount
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error('invalid');
        return r.json();
      })
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('jwt');
        setToken(null);
      });
  }, [token]);

  const handleLogin = async (credentialResponse) => {
    const res  = await fetch(`${API}/auth/google`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ idToken: credentialResponse.credential }),
    });
    const data = await res.json();
    if (!res.ok) return console.error('Auth error:', data);
    localStorage.setItem('jwt', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    setToken(null);
    setUser(null);
    setItems([]);
  };

  const fetchItems = useCallback(async () => {
    if (!token) return;
    const res  = await fetch(`${API}/items`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) { handleLogout(); return; }
    const data = await res.json();
    setItems(data);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchItems();
    const id = setInterval(fetchItems, 3000);
    return () => clearInterval(id);
  }, [fetchItems, token]);

  const addItemByName = async (name) => {
    if (!name || !name.trim()) return;
    await fetch(`${API}/items`, {
      method:  'POST',
      headers: authHeaders(token),
      body:    JSON.stringify({ name: name.trim() }),
    });
    fetchItems();
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    await addItemByName(input);
    setInput('');
  };

  const toggleItem = async (item) => {
    await fetch(`${API}/items/${item.id}`, {
      method:  'PUT',
      headers: authHeaders(token),
      body:    JSON.stringify({ checked: !item.checked }),
    });
    fetchItems();
  };

  const editItem = async (id, name) => {
    await fetch(`${API}/items/${id}`, {
      method:  'PUT',
      headers: authHeaders(token),
      body:    JSON.stringify({ name }),
    });
    fetchItems();
  };

  const deleteItem = async () => {
    await fetch(`${API}/items/${deleteTarget.id}`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setDeleteTarget(null);
    fetchItems();
  };

  if (!token || !user) return <LoginScreen onLogin={handleLogin} />;

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

      <div style={s.shell}>
        <div style={s.header}>
          <h1 style={s.appName}>Shopping List.</h1>
          <div style={s.userRow}>
            {user.picture && (
              <img src={user.picture} alt={user.name} style={s.avatar} referrerPolicy="no-referrer" />
            )}
            <span style={s.userName}>{user.name}</span>
            <button style={s.signOutBtn} onClick={handleLogout}>Sign out</button>
          </div>
        </div>

        <div style={s.card}>
          <div style={s.statsRow}>
            <span style={s.statsLabel}>
              Items <span style={s.statsCount}>({items.length})</span>
            </span>
            {items.length > 0 && (
              <span style={s.statsDone}>{checkedCount} done</span>
            )}
          </div>

          <form style={s.addRow} onSubmit={addItem}>
            <input
              style={s.addInput}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Add a new item…"
            />
            <button style={s.addBtn} type="submit">+</button>
            <button
              style={showAi ? s.aiToggleBtnActive : s.aiToggleBtn}
              type="button"
              onClick={() => setShowAi((v) => !v)}
              title={showAi ? 'Close AI' : 'Ask AI'}
            >
              {showAi ? '✕' : '✨'}
            </button>
          </form>

          {/* AI Suggest */}
          {showAi && <AiSuggestBox onAdd={addItemByName} />}

          <div style={s.divider} />

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

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ShoppingApp />
    </GoogleOAuthProvider>
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

  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
  },
  userName: {
    flex: 1,
    fontSize: 14,
    fontWeight: 600,
    color: BLACK,
  },
  signOutBtn: {
    background: 'rgba(0,0,0,0.12)',
    border: 'none',
    borderRadius: 20,
    padding: '4px 12px',
    fontSize: 12,
    fontWeight: 700,
    color: BLACK,
    cursor: 'pointer',
  },

  loginWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    padding: '40px 0',
  },
  loginHint: {
    margin: 0,
    fontSize: 15,
    color: GRAY,
    textAlign: 'center',
  },

  card: {
    background: '#fff',
    borderRadius: 24,
    padding: '20px 20px 0',
    boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
    overflow: 'hidden',
  },

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

  /* AI toggle icon in addRow */
  aiToggleBtn: {
    width: 46,
    height: 46,
    background: BLACK,
    border: 'none',
    borderRadius: 12,
    fontSize: 20,
    color: YELLOW,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  aiToggleBtnActive: {
    width: 46,
    height: 46,
    background: YELLOW,
    border: '2px solid ' + BLACK,
    borderRadius: 12,
    fontSize: 20,
    color: BLACK,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  /* AI Suggest */
  aiBox: {
    marginBottom: 16,
  },
  aiBtn: {
    width: 46,
    height: 46,
    background: BLACK,
    border: 'none',
    borderRadius: 12,
    fontSize: 20,
    color: YELLOW,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiError: {
    background: '#FEE2E2',
    color: '#991B1B',
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 10,
  },
  aiResults: {
    background: '#FFFDE7',
    border: `1px solid ${YELLOW}`,
    borderRadius: 12,
    padding: '10px 12px',
    marginBottom: 4,
  },
  aiResultsHeader: {
    fontSize: 11,
    fontWeight: 700,
    color: '#7A6800',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  aiList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  aiItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 0',
    borderTop: '1px solid #FFF59D',
  },
  aiItemName: {
    flex: 1,
    fontSize: 14,
    color: BLACK,
  },
  aiAddBtn: {
    background: YELLOW,
    border: 'none',
    borderRadius: 8,
    padding: '5px 12px',
    fontSize: 12,
    fontWeight: 700,
    color: BLACK,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  aiAddedBtn: {
    background: '#E5E7EB',
    border: 'none',
    borderRadius: 8,
    padding: '5px 12px',
    fontSize: 12,
    fontWeight: 600,
    color: GRAY,
    cursor: 'default',
    whiteSpace: 'nowrap',
  },

  /* List */
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },

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

  footer: {
    textAlign: 'center',
    padding: '12px 0',
    fontSize: 13,
    color: GRAY,
    borderTop: '1px solid #F3F4F6',
    margin: '0 -20px',
  },

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
