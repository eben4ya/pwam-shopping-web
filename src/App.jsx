import React, { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:3000';

const styles = {
  container: {
    maxWidth: 480,
    margin: '40px auto',
    fontFamily: 'system-ui, sans-serif',
    padding: '0 16px',
  },
  header: {
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    margin: 0,
  },
  subtitle: {
    color: '#666',
    margin: '4px 0 0',
    fontSize: 14,
  },
  form: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    fontSize: 16,
    border: '1px solid #ccc',
    borderRadius: 8,
    outline: 'none',
  },
  addBtn: {
    padding: '10px 18px',
    fontSize: 16,
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    marginBottom: 8,
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    background: '#fff',
  },
  checkbox: {
    width: 18,
    height: 18,
    cursor: 'pointer',
    flexShrink: 0,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
  },
  itemNameChecked: {
    flex: 1,
    fontSize: 16,
    textDecoration: 'line-through',
    color: '#999',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#ef4444',
    fontSize: 18,
    padding: '0 4px',
    lineHeight: 1,
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    padding: 32,
    border: '2px dashed #e5e7eb',
    borderRadius: 8,
    fontSize: 15,
  },
  refreshRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    fontSize: 13,
    color: '#666',
  },
  refreshBtn: {
    background: 'none',
    border: '1px solid #ccc',
    borderRadius: 6,
    padding: '4px 10px',
    cursor: 'pointer',
    fontSize: 13,
  },
};

export default function App() {
  const [items, setItems] = useState([]);
  const [input, setInput] = useState('');
  const [lastSync, setLastSync] = useState(null);

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

  const deleteItem = async (id) => {
    await fetch(`${API}/items/${id}`, { method: 'DELETE' });
    fetchItems();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Global Shopping List</h1>
        <p style={styles.subtitle}>PWAM Demo — Web Frontend</p>
      </div>

      <form style={styles.form} onSubmit={addItem}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add an item (e.g. Apples)"
        />
        <button style={styles.addBtn} type="submit">Add</button>
      </form>

      <div style={styles.refreshRow}>
        <span>Last sync: {lastSync ?? '—'}</span>
        <button style={styles.refreshBtn} onClick={fetchItems}>↻ Refresh</button>
      </div>

      {items.length === 0 ? (
        <div style={styles.empty}>The list is empty. Add something above!</div>
      ) : (
        <ul style={styles.list}>
          {items.map((item) => (
            <li key={item.id} style={styles.item}>
              <input
                type="checkbox"
                style={styles.checkbox}
                checked={Boolean(item.checked)}
                onChange={() => toggleItem(item)}
              />
              <span style={item.checked ? styles.itemNameChecked : styles.itemName}>
                {item.name}
              </span>
              <button style={styles.deleteBtn} onClick={() => deleteItem(item.id)}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
