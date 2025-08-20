// src/MigrateStoreView.jsx
import React, { useState } from 'react';
import { migrateStore } from './storeMigration';
import { useNavigate } from 'react-router-dom';

export default function MigrateStoreView() {
  // Pre-fill from your message:
  const [sourceUid, setSourceUid] = useState('OPAslZR16zMTmjHi4PMSYyNFhdE2');
  const [destStoreId, setDestStoreId] = useState('my-new-store'); // change to what you want
  const [email, setEmail] = useState('test1@gmail.com');

  const [copyEverything, setCopyEverything] = useState(false);
  const [copyProducts, setCopyProducts] = useState(true);
  const [copyProfile, setCopyProfile] = useState(true);
  const [copyAnalytics, setCopyAnalytics] = useState(true);

  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState('');
  const nav = useNavigate();

  const run = async () => {
    setBusy(true);
    setLog('Migrating…');
    try {
      if (!destStoreId || destStoreId.trim() === '') {
        throw new Error('Destination Store ID is required');
      }
      const res = await migrateStore({
        sourceUid,
        destStoreId: destStoreId.trim(),
        copyProducts,
        copyProfile,
        copyAnalytics,
        copyEverything,
        linkUserUid: sourceUid,
        linkUserEmail: email,
      });
      setLog(`✅ Copied to ${res.destPath}
- Copied: ${res.report.copied.length} nodes
- Skipped: ${res.report.skipped.length} nodes
Now routing you to your store…`);
      // 👉 change to your actual dashboard route if different
      setTimeout(() => nav(`/product-catalogue?store=${destStoreId.trim()}`, { replace: true }), 800);
    } catch (e) {
      setLog(`❌ ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const field = { padding: 10, border: '1px solid #ddd', borderRadius: 10, width: 420 };

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui', maxWidth: 820 }}>
      <h1 style={{ margin: 0 }}>Store Migration (Safe Copy)</h1>
      <p style={{ color: '#555' }}>
        Copies from legacy <code>/{'{sourceUid}'}</code> to canonical <code>/stores/{'{destStoreId}'}</code>—no deletion.
        Also links your user to the destination store and sets it as active.
      </p>

      <div style={{ display: 'grid', gap: 12, margin: '16px 0' }}>
        <label>Source UID (legacy path)
          <br />
          <input style={field} value={sourceUid} onChange={(e) => setSourceUid(e.target.value)} />
        </label>

        <label>Destination Store ID (choose a new id, e.g., "bow-tech-gadgets")
          <br />
          <input style={field} value={destStoreId} onChange={(e) => setDestStoreId(e.target.value)} />
        </label>

        <label>Owner Email (for users/{'{uid}'}/email)
          <br />
          <input style={field} value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <div style={{ display: 'grid', gap: 6 }}>
          <label>
            <input type="checkbox" checked={copyEverything} onChange={(e) => setCopyEverything(e.target.checked)} />
            &nbsp;Copy Entire Store (everything under <code>/{'{uid}'}</code>)
          </label>
          <div style={{ marginLeft: 18, color: '#555' }}>or choose granular nodes:</div>
          <label style={{ marginLeft: 18 }}>
            <input type="checkbox" checked={copyProducts} onChange={(e) => setCopyProducts(e.target.checked)} disabled={copyEverything} />
            &nbsp;products
          </label>
          <label style={{ marginLeft: 18 }}>
            <input type="checkbox" checked={copyProfile} onChange={(e) => setCopyProfile(e.target.checked)} disabled={copyEverything} />
            &nbsp;profile
          </label>
          <label style={{ marginLeft: 18 }}>
            <input type="checkbox" checked={copyAnalytics} onChange={(e) => setCopyAnalytics(e.target.checked)} disabled={copyEverything} />
            &nbsp;analytics
          </label>
        </div>
      </div>

      <button
        onClick={run}
        disabled={busy}
        style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #ddd', cursor: 'pointer', fontWeight: 600 }}
      >
        {busy ? 'Working…' : 'Copy & Link'}
      </button>

      <pre style={{ background: '#f7f7f8', padding: 12, borderRadius: 10, marginTop: 16, whiteSpace: 'pre-wrap' }}>
        {log}
      </pre>

      <p style={{ color: '#666' }}>
        This tool never deletes your legacy data. You can re-run with a different destination safely.
      </p>
    </div>
  );
}
