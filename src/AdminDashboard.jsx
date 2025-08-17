// src/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { ref, get } from 'firebase/database';
import { db } from './firebase';

export default function AdminDashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await get(ref(db, 'users'));
        if (!snap.exists()) {
          setRows([]);
          return;
        }
        const users = snap.val();
        const list = Object.entries(users).map(([uid, u]) => ({
          uid,
          storeName: u.storeName || u.profile?.storeName || '(no name)',
          plan: u.plan || 'free',
          role: u.role || 'seller',
          status: u.status || 'active',
          products: u.products ? Object.keys(u.products).length : 0,
          createdAt: u.createdAt || 0,
        }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setRows(list);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f6f8ff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
        <h1 style={{ margin: '0 0 16px' }}>Admin • Stores</h1>

        <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 8px 24px rgba(0,0,0,.06)' }}>
          {loading ? (
            <div style={{ padding: 16, opacity: 0.6 }}>Loading…</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', opacity: 0.7 }}>
                  <th style={th}>Store</th>
                  <th style={th}>Plan</th>
                  <th style={th}>Role</th>
                  <th style={th}>Status</th>
                  <th style={th}>Products</th>
                  <th style={th}>UID</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.uid} style={{ borderTop: '1px solid #eef2ff' }}>
                    <td style={td}>{r.storeName}</td>
                    <td style={td}>{r.plan}</td>
                    <td style={td}>{r.role}</td>
                    <td style={td}>{r.status}</td>
                    <td style={td}>{r.products}</td>
                    <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>{r.uid}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td style={{ padding: 16, opacity: 0.6 }} colSpan={6}>
                      No stores yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const th = { padding: '12px 8px' };
const td = { padding: '12px 8px' };
