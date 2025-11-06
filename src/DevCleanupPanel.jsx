import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref as dbRef, get, update } from 'firebase/database';
import { auth, db } from './lib/firebase';

// ----- Config -----
const PROFILE_FIELDS = new Set([
  'storeName',
  'storeDescription',
  'category',
  'whatsappNumber',
  'businessEmail',
  'country',
  'city',
  'businessType',
  'currency',
  'deliveryOptions',
  'paymentMethods',
]);

const META_FIELDS = new Set([
  'email',
  'role',
  'status',
  'onboardingCompleted',
  'onboardingCompletedAt',
  'uid',
  'updatedAt',
  'createdAt',
]);

const ALLOWED_PM = ['cash', 'mobile_money', 'bank_transfer', 'card'];
const ALLOWED_DOX = ['pickup', 'delivery', 'courier', 'shipping'];

// ----- Helpers -----
function normalizeList(value, allowed) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value)).filter((v) => allowed.includes(v));
  }
  if (value && typeof value === 'object') {
    const out = [];
    for (const k of Object.keys(value)) {
      const v = value[k];
      if (allowed.includes(k) && (v === true || v === 'true' || v === 1)) out.push(k);
      if (typeof v === 'string' && allowed.includes(v)) out.push(v);
    }
    return Array.from(new Set(out));
  }
  return [];
}

async function cleanUser(uid) {
  const userRef = dbRef(db, `/users/${uid}`);
  const userSnap = await get(userRef);
  if (!userSnap.exists()) return { uid, ok: true, note: 'no user node' };

  const root = userSnap.val() || {};
  const profileRef = dbRef(db, `/users/${uid}/profile`);
  const profileSnap = await get(profileRef);
  const profile = profileSnap.exists() ? profileSnap.val() : {};

  const ops = {};

  // 1) Move leaked meta out of /profile -> root
  Object.keys(profile || {}).forEach((k) => {
    if (META_FIELDS.has(k)) {
      ops[`/users/${uid}/${k}`] = profile[k];
      ops[`/users/${uid}/profile/${k}`] = null;
    }
  });

  // 2) Remove store fields that leaked to root
  Object.keys(root || {}).forEach((k) => {
    if (PROFILE_FIELDS.has(k)) {
      ops[`/users/${uid}/${k}`] = null;
    }
  });

  // 3) Normalize arrays
  const pm = normalizeList(profile?.paymentMethods, ALLOWED_PM);
  const dox = normalizeList(profile?.deliveryOptions, ALLOWED_DOX);
  ops[`/users/${uid}/profile/paymentMethods`] = pm;
  ops[`/users/${uid}/profile/deliveryOptions`] = dox;

  await update(dbRef(db), ops);
  return { uid, ok: true, paymentMethods: pm, deliveryOptions: dox };
}

// ----- UI Component -----
export default function DevCleanupPanel() {
  const [me, setMe] = useState(null);
  const [role, setRole] = useState('user');
  const [authReady, setAuthReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]);

  // Subscribe to auth state (fixes "unknown user" issue)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setMe(u);
      setAuthReady(true);
      if (u) {
        try {
          const r = await get(dbRef(db, `/users/${u.uid}/role`));
          setRole((r.exists() && r.val()) || 'user');
        } catch {
          setRole('user');
        }
      } else {
        setRole('user');
      }
    });
    return unsub;
  }, []);

  const appendLog = (entry) =>
    setLog((l) => [{ time: new Date().toISOString(), ...entry }, ...l]);

  const run = async (fn, label) => {
    setBusy(true);
    try {
      const res = await fn();
      appendLog({ label, result: res });
    } catch (e) {
      appendLog({ label, error: e?.message || String(e) });
    } finally {
      setBusy(false);
    }
  };

  const cleanCurrentUser = async () => {
    if (!me) throw new Error('No signed-in user');
    return cleanUser(me.uid);
  };

  const cleanAllUsers = async () => {
    if (!me) throw new Error('No signed-in user');
    if (role !== 'admin') throw new Error('Requires admin role. Use "Clean current user".');

    const listSnap = await get(dbRef(db, '/users')); // requires admin-readable rules
    if (!listSnap.exists()) return [];

    const users = Object.keys(listSnap.val() || {});
    const results = [];
    for (const uid of users) {
      try {
        results.push(await cleanUser(uid));
      } catch (e) {
        results.push({ uid, ok: false, error: e?.message || String(e) });
      }
    }
    return results;
  };

  return (
    <div style={{ padding: 24, fontFamily: 'ui-sans-serif, system-ui' }}>
      <h2 style={{ margin: 0, marginBottom: 8 }}>🧹 Dev Cleanup Panel</h2>
      <p style={{ marginTop: 0 }}>
        Cleans leaked meta from <code>/profile</code>, removes stray store fields from root,
        and normalizes <code>paymentMethods</code>/<code>deliveryOptions</code> as arrays.
      </p>

      <div style={{ marginBottom: 8, opacity: 0.75 }}>
        Signed in as <strong>{me?.email || 'unknown'}</strong> — role:{' '}
        <strong>{role}</strong>
        {!authReady && <span style={{ marginLeft: 8 }}>(checking…)</span>}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button
          onClick={() => run(cleanCurrentUser, 'cleanCurrentUser')}
          disabled={busy || !authReady || !me}
          title={!me ? 'Sign in first' : 'Clean your user node'}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            cursor: busy || !me ? 'not-allowed' : 'pointer',
            background: busy || !me ? '#f3f4f6' : '#fff',
          }}
        >
          Clean current user
        </button>

        <button
          onClick={() => run(cleanAllUsers, 'cleanAllUsers')}
          disabled={busy || !authReady || !me || role !== 'admin'}
          title={role !== 'admin' ? 'Requires admin role' : 'Clean every user (admin)'}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            cursor: busy || role !== 'admin' ? 'not-allowed' : 'pointer',
            background: busy || role !== 'admin' ? '#f3f4f6' : '#fff',
            opacity: role !== 'admin' ? 0.6 : 1,
          }}
        >
          Clean ALL users
        </button>
      </div>

      {!me && authReady && (
        <div
          style={{
            background: '#fff7ed',
            border: '1px solid #fdba74',
            color: '#9a3412',
            padding: 12,
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          You’re not signed in on this tab. Go to <a href="/login">/login</a> and sign in,
          then return here.
        </div>
      )}

      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 12,
          maxHeight: 360,
          overflow: 'auto',
          background: '#fafafa',
        }}
      >
        {log.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No runs yet.</div>
        ) : (
          log.map((entry, i) => (
            <pre
              key={i}
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                background: '#fff',
                padding: 10,
                borderRadius: 8,
                border: '1px solid #eee',
                marginBottom: 8,
              }}
            >
{JSON.stringify(entry, null, 2)}
            </pre>
          ))
        )}
      </div>
    </div>
  );
}
