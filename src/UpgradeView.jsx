import React, { useMemo, useState } from 'react';
import { auth, db } from './firebase';
import { ref as dbRef, set, serverTimestamp } from 'firebase/database';
import { PATHS } from './constants';

const PLANS = [
  { id: 'free',  label: 'Free',  price: 0, features: ['20 products', 'ShopLink watermark'] },
  { id: 'pro',   label: 'Pro',   price: 2, features: ['200 products', 'Remove watermark', 'Brand/logo'] },
  { id: 'plus',  label: 'Plus',  price: 4, features: ['Unlimited products', 'CSV import', 'Multiple catalogs'] },
];

export default function UpgradeView() {
  const user = auth.currentUser;
  const [plan, setPlan] = useState('pro');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const storeId = useMemo(() => user?.uid ?? '', [user]);

  const submit = async () => {
    if (!user) { setMsg('Please sign in first.'); return; }
    setBusy(true);
    try {
      const payload = {
        uid: user.uid,
        email: user.email || null,
        plan,
        note: note || null,
        createdAt: serverTimestamp(),
        status: 'new'
      };
      await set(dbRef(db, PATHS.billingIntents(storeId)), payload);
      setMsg('Upgrade request received. We’ll contact you shortly.');
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 780, margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1>Upgrade</h1>
      <p>This records your upgrade intent (no payments yet).</p>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', margin: '16px 0' }}>
        {PLANS.map(p => (
          <label key={p.id} style={{ border: '1px solid #ddd', borderRadius: 12, padding: 14 }}>
            <input
              type="radio"
              name="plan"
              value={p.id}
              checked={plan === p.id}
              onChange={() => setPlan(p.id)}
            />
            <strong style={{ marginLeft: 8 }}>{p.label}</strong>
            <div style={{ opacity: 0.8, marginTop: 4 }}>${p.price}/mo</div>
            <ul style={{ margin: '8px 0 0 24px' }}>
              {p.features.map(f => <li key={f}>{f}</li>)}
            </ul>
          </label>
        ))}
      </div>

      <textarea
        placeholder="Anything we should know? (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        style={{ width: '100%', minHeight: 80, padding: 10, borderRadius: 10, border: '1px solid #ddd' }}
      />

      <div style={{ marginTop: 12 }}>
        <button onClick={submit} disabled={busy} style={{ padding: '10px 16px', borderRadius: 10 }}>
          {busy ? 'Submitting…' : 'Submit Upgrade'}
        </button>
      </div>

      {msg && <div style={{ marginTop: 10 }}>{msg}</div>}
    </div>
  );
}
