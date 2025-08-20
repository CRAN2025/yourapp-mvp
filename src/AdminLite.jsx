import React, { useEffect, useMemo, useState } from 'react';
import { auth, db } from './firebase';
import { ref as dbRef, onValue, query, limitToLast } from 'firebase/database';
import { PATHS } from './constants';

export default function AdminLite() {
  const me = auth.currentUser;
  const [uidInput, setUidInput] = useState(me?.uid || '');
  const [profile, setProfile] = useState(null);
  const [activation, setActivation] = useState(null);
  const [intent, setIntent] = useState(null);
  const [events, setEvents] = useState([]);

  const targetUid = useMemo(() => uidInput.trim(), [uidInput]);

  useEffect(() => {
    if (!targetUid) return;

    const profRef   = dbRef(db, `users/${targetUid}/profile`);
    const actRef    = dbRef(db, PATHS.activation(targetUid));
    const intentRef = dbRef(db, PATHS.billingIntents(targetUid));
    const eventsRef = query(dbRef(db, PATHS.events(targetUid)), limitToLast(50));

    const unsubs = [
      onValue(profRef,  s => setProfile(s.val() || null)),
      onValue(actRef,   s => setActivation(s.val() || null)),
      onValue(intentRef,s => setIntent(s.val() || null)),
      onValue(eventsRef,s => {
        const list = [];
        s.forEach(child => list.push({ id: child.key, ...child.val() }));
        list.sort((a,b) => b.ts - a.ts);
        setEvents(list);
      }),
    ];
    return () => unsubs.forEach(u => u && u());
  }, [targetUid]);

  const isAdmin = profile?.role === 'admin' || auth.currentUser?.uid === targetUid;

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>Admin Lite</h1>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <input
          value={uidInput}
          onChange={(e) => setUidInput(e.target.value)}
          placeholder="Enter seller UID (default = me)"
          style={{ padding: 8, borderRadius: 8, border: '1px solid #ddd', width: 380 }}
        />
        <span style={{ opacity: 0.7 }}>Role: <code>{profile?.role || 'seller'}</code></span>
      </div>

      {!isAdmin && (
        <div style={{ color: '#b91c1c', marginBottom: 10 }}>
          You’re viewing your own data. Set your role to <code>admin</code> to view others.
        </div>
      )}

      <section style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', marginTop: 8 }}>
        <Card title="Activation">
          <Row label="First order at" value={fmt(activation?.firstOrderAt)} />
          <Row label="Last order at"  value={fmt(activation?.lastOrderAt)} />
          <Row label="Last shared"    value={fmt(activation?.lastSharedAt)} />
          <Row label="Last inquiry"   value={fmt(activation?.lastInquiryAt)} />
          <Row label="Orders count"   value={activation?.ordersCount ?? 0} />
        </Card>

        <Card title="Upgrade Intent">
          <Row label="Plan" value={intent?.plan || '—'} />
          <Row label="Status" value={intent?.status || '—'} />
          <Row label="Email" value={intent?.email || '—'} />
          <Row label="Created" value={fmt(intent?.createdAt)} />
        </Card>

        <Card title="Profile">
          <Row label="Store name" value={profile?.storeName || '—'} />
          <Row label="Onboarding" value={String(profile?.onboardingCompleted ?? false)} />
          <Row label="Currency" value={profile?.currency || '—'} />
        </Card>
      </section>

      <h3 style={{ marginTop: 18 }}>Recent Events</h3>
      <div style={{ border: '1px solid #eee', borderRadius: 10 }}>
        {events.map(ev => (
          <div key={ev.id} style={{ padding: 10, borderBottom: '1px solid #f1f1f1' }}>
            <code>{new Date(ev.ts).toLocaleString()}</code> — <strong>{ev.type}</strong> {ev.productId ? `(${ev.productId})` : ''}
          </div>
        ))}
        {!events.length && <div style={{ padding: 12, color: '#777' }}>No events yet.</div>}
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ border: '1px solid #eee', borderRadius: 12, padding: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}
function Row({ label, value }) {
  return (
    <div style={{ margin: '4px 0' }}>
      <span style={{ fontWeight: 600 }}>{label}:</span> <span style={{ marginLeft: 6 }}>{String(value)}</span>
    </div>
  );
}
function fmt(v) {
  if (!v) return '—';
  const d = typeof v === 'number' ? new Date(v) : new Date(v);
  return isNaN(d.getTime()) ? String(v) : d.toLocaleString();
}
