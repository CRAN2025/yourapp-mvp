// src/SettingsView.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Save, ExternalLink, LogOut } from 'lucide-react';
import { ref, get } from 'firebase/database';
import { db } from './lib/firebase';
import { useNavigate } from 'react-router-dom';

import {
  validatePhoneNumber,
  getPhoneHint,
  formatPhoneForDisplay,
} from './sharedUtils';

// 🔐 Unified save that also publishes /users/{uid}/publicProfile
import { saveSellerProfile } from "./saveSellerProfile";

export default function SettingsView({ user = null, userProfile = null, onSignOut = () => {} }) {
  const navigate = useNavigate();

  // Option lists (kept in sync with SellerOnboardingView)
  const categories = [
    '👗 Fashion & Clothing','📱 Electronics','🍔 Food & Beverages','💄 Beauty & Cosmetics',
    '🏠 Home & Garden','📚 Books & Education','🎮 Sports & Gaming','👶 Baby & Kids',
    '🚗 Automotive','🎨 Arts & Crafts','💊 Health & Wellness','🔧 Tools & Hardware',
    '🎁 Gifts & Souvenirs','💍 Jewelry & Accessories','📦 Other'
  ];
  const countries = [
    { code: 'GH', name: 'Ghana', currency: 'GHS', flag: '🇬🇭' },
    { code: 'NG', name: 'Nigeria', currency: 'NGN', flag: '🇳🇬' },
    { code: 'KE', name: 'Kenya', currency: 'KES', flag: '🇰🇪' },
    { code: 'UG', name: 'Uganda', currency: 'UGX', flag: '🇺🇬' },
    { code: 'TZ', name: 'Tanzania', currency: 'TZS', flag: '🇹🇿' }
  ];
  const deliveryOptionsList = [
    { id: 'pickup',   label: '🚶 Customer Pickup', desc: 'Customers collect from your location' },
    { id: 'delivery', label: '🚚 Home Delivery',   desc: 'You deliver to customers' },
    { id: 'courier',  label: '📦 Courier Service', desc: 'Third-party delivery' },
    { id: 'shipping', label: '✈️ Shipping',        desc: 'Postal/shipping services' }
  ];
  const paymentMethodsList = [
    { id: 'cash',          label: '💵 Cash',          desc: 'Cash on delivery/pickup' },
    { id: 'mobile_money',  label: '📱 Mobile Money',  desc: 'MTN, Vodafone, AirtelTigo' },
    { id: 'bank_transfer', label: '🏦 Bank Transfer', desc: 'Direct bank deposits' },
    { id: 'card',          label: '💳 Card Payment',  desc: 'Credit/Debit cards' }
  ];

  const initial = useMemo(() => ({
    storeName:        userProfile?.storeName || '',
    storeDescription: userProfile?.storeDescription || '',
    category:         userProfile?.category || '',
    whatsappNumber:   userProfile?.whatsappNumber || '',
    businessEmail:    userProfile?.businessEmail || (user?.email || ''),
    country:          userProfile?.country || 'Ghana',
    city:             userProfile?.city || '',
    businessType:     userProfile?.businessType || 'individual',
    currency:         userProfile?.currency || 'GHS',
    // optional banner support (won't break anything if unused)
    bannerUrl:        userProfile?.bannerUrl || '',
    deliveryOptions:  Array.isArray(userProfile?.deliveryOptions) ? userProfile.deliveryOptions : [],
    paymentMethods:   Array.isArray(userProfile?.paymentMethods)  ? userProfile.paymentMethods  : [],
  }), [userProfile, user?.email]);

  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [savedToast, setSavedToast] = useState(false);

  // Ensure we load latest profile if page is visited before profile is ready
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.uid) return;
      setLoading(true);
      try {
        const snap = await get(ref(db, `users/${user.uid}/profile`));
        if (mounted && snap.exists()) {
          const p = snap.val();
          setForm({
            storeName:        p.storeName || '',
            storeDescription: p.storeDescription || '',
            category:         p.category || '',
            whatsappNumber:   p.whatsappNumber || '',
            businessEmail:    p.businessEmail || (user?.email || ''),
            country:          p.country || 'Ghana',
            city:             p.city || '',
            businessType:     p.businessType || 'individual',
            currency:         p.currency || 'GHS',
            bannerUrl:        p.bannerUrl || '',
            deliveryOptions:  Array.isArray(p.deliveryOptions) ? p.deliveryOptions : [],
            paymentMethods:   Array.isArray(p.paymentMethods)  ? p.paymentMethods  : [],
          });
        }
      } catch (_) {}
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [user?.uid]);

  // helpers
  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const toggleInArray = (k, v) =>
    setForm(prev => ({
      ...prev,
      [k]: prev[k].includes(v) ? prev[k].filter(x => x !== v) : [...prev[k], v],
    }));

  const handleCountryChange = (code) => {
    const c = countries.find(x => x.code === code);
    if (!c) return;
    setField('country', c.name);     // keep name as you already store
    setField('currency', c.currency);
  };

  const validate = () => {
    const n = {};
    if (!form.storeName.trim())        n.storeName = 'Store name is required';
    if (!form.category)                n.category = 'Select a category';
    if (!form.storeDescription.trim()) n.storeDescription = 'Description is required';
    if (!form.city.trim())             n.city = 'City is required';

    const phone = validatePhoneNumber(form.whatsappNumber, form.country);
    if (!phone.isValid) n.whatsappNumber = phone.error;

    if (form.deliveryOptions.length === 0) n.deliveryOptions = 'Pick at least one option';
    if (form.paymentMethods.length === 0)  n.paymentMethods = 'Pick at least one method';

    setErrors(n);
    return Object.keys(n).length === 0;
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    if (!validate()) return;

    setSaving(true);
    try {
      const phone = validatePhoneNumber(form.whatsappNumber, form.country);

      // Build payload to persist as *private* profile.
      const payload = {
        storeName:        form.storeName.trim(),
        storeDescription: form.storeDescription.trim(),
        category:         form.category,
        businessEmail:    form.businessEmail?.trim() || '',
        country:          form.country,
        city:             form.city.trim(),
        businessType:     form.businessType,
        currency:         form.currency,
        bannerUrl:        form.bannerUrl?.trim() || '',
        whatsappNumber:   phone.normalized, // normalized E.164
        // updatedAt is added in saveSellerProfile()
      };

      // 👇 Single call that saves private profile AND publishes /publicProfile
      await saveSellerProfile(user, payload, {
        paymentMethods: form.paymentMethods,
        deliveryOptions: form.deliveryOptions,
      });

      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 1600);
    } catch (e) {
      console.error(e);
      setErrors(prev => ({ ...prev, general: 'Failed to save. Please try again.' }));
    } finally {
      setSaving(false);
    }
  };

  const storefrontUrl = user ? `${window.location.origin}/store/${user.uid}` : '#';

  return (
    <div style={styles.screen}>
      <div style={styles.bg} />

      {savedToast && (
        <div style={styles.toast}>✓ Settings saved</div>
      )}

      <header style={styles.header}>
        <div style={styles.brand} onClick={() => navigate('/catalog')} role="button">🛍️ <b>ShopLink</b></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={storefrontUrl} target="_blank" rel="noreferrer" style={styles.linkBtn}>
            <ExternalLink size={16} /> View Storefront
          </a>
          <button onClick={onSignOut} style={styles.linkBtn}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.card}>

          <h2 style={styles.h2}>Store Info</h2>

          {errors.general && (
            <div style={styles.errorBox}>⚠️ {errors.general}</div>
          )}

          <div style={styles.row2}>
            <div style={styles.formGroup}>
              <label>Store Name *</label>
              <input
                value={form.storeName}
                onChange={e => setField('storeName', e.target.value)}
                className={errors.storeName ? 'error' : ''}
                style={inputStyle(errors.storeName)}
                placeholder="e.g., Ama's Fashion Hub"
              />
              {errors.storeName && <small style={styles.fieldErr}>⚠️ {errors.storeName}</small>}
            </div>

            <div style={styles.formGroup}>
              <label>Category *</label>
              <select
                value={form.category}
                onChange={e => setField('category', e.target.value)}
                className={errors.category ? 'error' : ''}
                style={inputStyle(errors.category)}
              >
                <option value="">Select your main category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <small style={styles.fieldErr}>⚠️ {errors.category}</small>}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label>Store Description *</label>
            <textarea
              rows={3}
              value={form.storeDescription}
              onChange={e => setField('storeDescription', e.target.value)}
              className={errors.storeDescription ? 'error' : ''}
              style={{ ...inputStyle(errors.storeDescription), resize: 'vertical' }}
              placeholder="Describe what you sell…"
            />
            {errors.storeDescription && <small style={styles.fieldErr}>⚠️ {errors.storeDescription}</small>}
          </div>

          {/* Optional banner URL (used by public storefront if present) */}
          <div style={styles.formGroup}>
            <label>Store Banner URL (optional)</label>
            <input
              value={form.bannerUrl}
              onChange={e => setField('bannerUrl', e.target.value)}
              style={inputStyle()}
              placeholder="https://… (image URL for your store header)"
            />
            <small style={styles.hint}>Leave empty to use the default gradient header.</small>
          </div>

          <h2 style={{ ...styles.h2, marginTop: 24 }}>Contact & Location</h2>

          <div style={styles.row2}>
            <div style={styles.formGroup}>
              <label>WhatsApp Number *</label>
              <input
                value={form.whatsappNumber}
                onChange={e => setField('whatsappNumber', e.target.value)}
                placeholder={getPhoneHint(form.country)}
                className={errors.whatsappNumber ? 'error' : ''}
                style={inputStyle(errors.whatsappNumber)}
              />
              <div style={styles.hint}>{getPhoneHint(form.country)}</div>
              {form.whatsappNumber && !errors.whatsappNumber && (
                <div style={styles.preview}>
                  ✓ Will be saved as{' '}
                  {(() => {
                    const v = validatePhoneNumber(form.whatsappNumber, form.country);
                    return v.isValid ? formatPhoneForDisplay(v.normalized) : 'Invalid format';
                  })()}
                </div>
              )}
              {errors.whatsappNumber && <small style={styles.fieldErr}>⚠️ {errors.whatsappNumber}</small>}
            </div>

            <div style={styles.formGroup}>
              <label>Business Email</label>
              <input
                type="email"
                value={form.businessEmail}
                onChange={e => setField('businessEmail', e.target.value)}
                style={inputStyle()}
                placeholder="e.g. hello@yourshop.com"
              />
            </div>
          </div>

          <div style={styles.row2}>
            <div style={styles.formGroup}>
              <label>Country *</label>
              <select
                value={countries.find(c => c.name === form.country)?.code || 'GH'}
                onChange={e => handleCountryChange(e.target.value)}
                style={inputStyle()}
              >
                {countries.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                ))}
              </select>
              <small style={styles.hint}>Currency is set automatically from your country.</small>
            </div>

            <div style={styles.formGroup}>
              <label>City *</label>
              <input
                value={form.city}
                onChange={e => setField('city', e.target.value)}
                className={errors.city ? 'error' : ''}
                style={inputStyle(errors.city)}
                placeholder="e.g., Accra, Lagos, Nairobi"
              />
              {errors.city && <small style={styles.fieldErr}>⚠️ {errors.city}</small>}
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <span style={styles.chip}>💰 Currency: <b>{form.currency}</b></span>
          </div>

          <h2 style={{ ...styles.h2, marginTop: 24 }}>Store Preferences</h2>

          <div style={styles.formGroup}>
            <label>Delivery Options * {errors.deliveryOptions && <span style={styles.fieldErrInline}>({errors.deliveryOptions})</span>}</label>
            <div style={styles.grid}>
              {deliveryOptionsList.map(opt => (
                <label key={opt.id} style={optionStyle(form.deliveryOptions.includes(opt.id), '#22c55e')}>
                  <input
                    type="checkbox"
                    checked={form.deliveryOptions.includes(opt.id)}
                    onChange={() => toggleInArray('deliveryOptions', opt.id)}
                    style={{ accentColor: '#22c55e', transform: 'scale(1.15)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700 }}>{opt.label}</div>
                    <small style={{ opacity: .7 }}>{opt.desc}</small>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label>Payment Methods * {errors.paymentMethods && <span style={styles.fieldErrInline}>({errors.paymentMethods})</span>}</label>
            <div style={styles.grid}>
              {paymentMethodsList.map(m => (
                <label key={m.id} style={optionStyle(form.paymentMethods.includes(m.id), '#a855f7')}>
                  <input
                    type="checkbox"
                    checked={form.paymentMethods.includes(m.id)}
                    onChange={() => toggleInArray('paymentMethods', m.id)}
                    style={{ accentColor: '#a855f7', transform: 'scale(1.15)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700 }}>{m.label}</div>
                    <small style={{ opacity: .7 }}>{m.desc}</small>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, gap: 8 }}>
            <button onClick={() => navigate('/catalog')} style={styles.secondaryBtn}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={styles.primaryBtn}>
              {saving ? (<><span className="spinner" style={styles.spin} /> Saving…</>) : (<><Save size={16}/> Save Changes</>)}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ---------- styles ----------
const styles = {
  screen: { position: 'relative', minHeight: '100vh', width: '100vw', overflowX: 'hidden' },
  bg: { position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #6a5cff 0%, #7aa0ff 40%, #67d1ff 100%)', opacity: .2 },
  header: {
    position: 'sticky', top: 0, zIndex: 2,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px', background: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(0,0,0,.06)'
  },
  brand: { display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, cursor: 'pointer' },
  main: { maxWidth: 980, margin: '20px auto', padding: '0 16px' },
  card: {
    background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)',
    borderRadius: 16, border: '1px solid rgba(0,0,0,.06)', padding: 20,
    boxShadow: '0 18px 36px rgba(0,0,0,.06)'
  },
  h2: { margin: '0 0 10px', letterSpacing: '-0.2px' },
  formGroup: { margin: '12px 0' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 },
  hint: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  preview: { color: '#059669', fontSize: 12, marginTop: 4, fontWeight: 500 },
  fieldErr: { color: '#b00020', fontSize: 12, marginTop: 4 },
  fieldErrInline: { color: '#b00020', fontSize: 12, marginLeft: 6 },
  chip: { display: 'inline-flex', gap: 6, alignItems: 'center', padding: '6px 10px', borderRadius: 999, background: '#eef1ff', fontWeight: 700 },
  primaryBtn: { background: 'linear-gradient(135deg, #5a6bff, #67d1ff)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 14px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 },
  secondaryBtn: { background: '#eef1ff', color: '#111827', border: 'none', borderRadius: 10, padding: '10px 14px', fontWeight: 700, cursor: 'pointer' },
  linkBtn: { background: 'rgba(255,255,255,.7)', border: '1px solid rgba(0,0,0,.08)', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: '#111827', fontWeight: 700 },
  toast: { position: 'fixed', top: 18, right: 18, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', borderRadius: 12, padding: '10px 14px', fontWeight: 800, boxShadow: '0 10px 26px rgba(22,163,74,.25)', zIndex: 50 },
  spin: { width: 16, height: 16, border: '2px solid rgba(255,255,255,.6)', borderTop: '2px solid transparent', borderRadius: '50%' },
  errorBox: { background:'#fff6f6', border:'1px solid #ffbaba', color:'#7f1d1d', padding:10, borderRadius:10, marginBottom:10 }
};

// small helpers for inline inputs
function inputStyle(hasError = false) {
  return {
    width: '100%', padding: '10px 12px', borderRadius: 12,
    border: `1px solid ${hasError ? '#ff7a7a' : 'rgba(0,0,0,.12)'}`,
    background: hasError ? '#fff6f6' : '#f9fafb', outline: 'none'
  };
}
function optionStyle(active, color) {
  return {
    display: 'grid',
    gridTemplateColumns: '20px 1fr',
    gap: 10,
    alignItems: 'start',
    padding: 10,
    borderRadius: 12,
    border: active ? `2px solid ${color}` : '1px solid rgba(0,0,0,.06)',
    background: active ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,.85)',
  };
}
