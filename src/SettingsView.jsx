import React, { useEffect, useState } from 'react';
import {
  Save, User, Store, MapPin, Phone, Globe, Package, BarChart3, Settings,
  ShoppingBag, ExternalLink, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ref, get, update } from 'firebase/database'; // get used in maintenance + safe merge
import { db } from './firebase';
import {
  validatePhoneNumber,
  formatPhoneForDisplay,
  phoneNeedsUpdate,
  getPhoneHint
} from './sharedUtils.js';

const SettingsView = ({ user, userProfile, onProfileUpdate }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    storeName: '',
    storeDescription: '',
    whatsappNumber: '',
    location: '',
    businessCategory: '',
    currency: 'GHS'
  });

  const [phoneValidation, setPhoneValidation] = useState({ isValid: true, error: '', normalized: '' });
  const [phoneNeedsFixing, setPhoneNeedsFixing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ─────────────────────────────────────────────
  // One-time maintenance helper state
  // ─────────────────────────────────────────────
  const [normalizing, setNormalizing] = useState(false);

  // Load user profile data
  useEffect(() => {
    if (userProfile) {
      setFormData({
        storeName: userProfile.storeName || '',
        storeDescription: userProfile.storeDescription || '',
        whatsappNumber: userProfile.whatsappNumber || '',
        location: userProfile.location || '',
        businessCategory: userProfile.businessCategory || '',
        currency: userProfile.currency || 'GHS'
      });

      // Check if existing phone number needs updating to E.164 format
      if (userProfile.whatsappNumber && phoneNeedsUpdate(userProfile.whatsappNumber)) {
        setPhoneNeedsFixing(true);
      }
    }
  }, [userProfile]);

  // Validate phone number as user types
  const handlePhoneChange = (value) => {
    setFormData(prev => ({ ...prev, whatsappNumber: value }));

    if (value.trim()) {
      const validation = validatePhoneNumber(value, userProfile?.country || 'Ghana');
      setPhoneValidation(validation);

      // Clear the "needs fixing" flag when user starts typing
      if (phoneNeedsFixing) {
        setPhoneNeedsFixing(false);
      }
    } else {
      setPhoneValidation({ isValid: true, error: '', normalized: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;
    setSaving(true);

    try {
      // Final phone validation before save
      let finalWhatsappNumber = formData.whatsappNumber;
      if (formData.whatsappNumber.trim()) {
        const validation = validatePhoneNumber(formData.whatsappNumber, userProfile?.country || 'Ghana');
        if (!validation.isValid) {
          setPhoneValidation(validation);
          setSaving(false);
          return;
        }
        finalWhatsappNumber = validation.normalized; // Store in E.164 format
      }

      const profilePath = `users/${user.uid}/profile`;
      const profileRef = ref(db, profilePath);

      // ✅ Read current profile so we don't clobber other keys (paymentMethods, deliveryOptions, etc.)
      const snap = await get(profileRef);
      const current = snap.exists() ? (snap.val() || {}) : {};

      // Merge only fields we edit here
      const mergedProfile = {
        ...current,
        ...formData,
        whatsappNumber: finalWhatsappNumber,
        updatedAt: Date.now()
      };

      // ✅ Write per-field under /profile (non-destructive)
      const multi = {};
      Object.entries(mergedProfile).forEach(([k, v]) => {
        multi[`${profilePath}/${k}`] = v;
      });

      // (Optional) mirrors if any legacy code still reads from users/{uid}
      multi[`users/${user.uid}/storeName`] = mergedProfile.storeName;
      multi[`users/${user.uid}/storeDescription`] = mergedProfile.storeDescription;
      multi[`users/${user.uid}/whatsappNumber`] = mergedProfile.whatsappNumber;
      multi[`users/${user.uid}/location`] = mergedProfile.location;
      multi[`users/${user.uid}/businessCategory`] = mergedProfile.businessCategory;
      multi[`users/${user.uid}/currency`] = mergedProfile.currency;
      multi[`users/${user.uid}/updatedAt`] = mergedProfile.updatedAt;

      await update(ref(db), multi); // root-level multi-location update

      // Update local state in parent if provided
      if (typeof onProfileUpdate === 'function') {
        onProfileUpdate(mergedProfile);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Clear phone needs fixing flag after successful save
      setPhoneNeedsFixing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // One-time maintenance: normalize product images
  // Run once, then you can remove this block + button.
  // ─────────────────────────────────────────────
  async function normalizeProductImages() {
    if (!user?.uid) return alert('Sign in first');
    setNormalizing(true);
    try {
      const productsRef = ref(db, `users/${user.uid}/products`);
      const snap = await get(productsRef);
      if (!snap.exists()) {
        alert('No products found to normalize.');
        return;
      }

      const updates = {};
      snap.forEach((child) => {
        const key = child.key;
        const p = child.val() || {};
        let urls = [];

        if (typeof p.images === 'string') {
          urls = [p.images];
        } else if (Array.isArray(p.images)) {
          urls = p.images.filter(Boolean);
        } else if (p.images?.primary || (Array.isArray(p.images?.gallery) && p.images.gallery.length)) {
          urls = [p.images.primary, ...(p.images.gallery || [])].filter(Boolean);
        } else if (p.imageUrl) {
          urls = [p.imageUrl];
        }

        if (!urls.length) return;

        const primary = urls[0];
        const gallery = urls.slice(1);

        updates[`${key}/imageUrl`] = primary;
        updates[`${key}/images`] = { primary, gallery };
      });

      if (Object.keys(updates).length) {
        await update(productsRef, updates);
        alert('Normalized product images ✅');
      } else {
        alert('Nothing to normalize.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to normalize: ' + err.message);
    } finally {
      setNormalizing(false);
    }
  }

  const styles = {
    container: { position: 'relative', minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    bgGradient: { position: 'absolute', inset: 0, background: 'radial-gradient(1200px 800px at 10% 10%, rgba(255,255,255,0.18), transparent 50%), linear-gradient(135deg, #6a5cff 0%, #7aa0ff 40%, #67d1ff 100%)', opacity: .8 },
    header: { position: 'relative', zIndex: 2, background: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.2)', padding: '16px 20px' },
    headerContent: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto' },
    title: { fontSize: 24, fontWeight: 800, background: 'linear-gradient(135deg, #5a6bff, #67d1ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 },
    nav: { display: 'flex', gap: 8 },
    navButton: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.3)', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', textDecoration: 'none' },
    navButtonActive: { background: 'linear-gradient(135deg, #5a6bff, #67d1ff)', color: 'white', border: '1px solid transparent' },
    content: { position: 'relative', zIndex: 1, flex: 1, maxWidth: '800px', margin: '0 auto', padding: '20px', width: '100%' },
    card: { background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderRadius: 16, padding: 24, marginBottom: 20, border: '1px solid rgba(255,255,255,0.2)' },
    formGroup: { marginBottom: 20 },
    label: { display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#374151' },
    input: { width: '100%', padding: '12px 16px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, fontSize: 14, background: 'white' },
    inputError: { borderColor: '#dc2626', background: 'rgba(239,68,68,0.05)' },
    inputValid: { borderColor: '#059669', background: 'rgba(5,150,105,0.05)' },
    textarea: { width: '100%', padding: '12px 16px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, fontSize: 14, background: 'white', minHeight: 80, resize: 'vertical' },
    select: { width: '100%', padding: '12px 16px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, fontSize: 14, background: 'white' },
    button: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.2s' },
    primaryButton: { background: 'linear-gradient(135deg, #5a6bff, #67d1ff)', color: 'white' },
    saveButton: { background: '#059669', color: 'white' },
    errorText: { color: '#dc2626', fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 },
    hintText: { color: '#6b7280', fontSize: 12, marginTop: 4 },
    validText: { color: '#059669', fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 },
    warningBanner: { background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }
  };

  return (
    <>
      <style>{`
        .btn-hover:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .save-success { background: #22c55e !important; }
      `}</style>

      <div style={styles.container}>
        <div style={styles.bgGradient} />

        <header style={styles.header}>
          <div style={styles.headerContent}>
            <h1 style={styles.title}>⚙️ Settings</h1>

            {/* Navigation */}
            <nav style={styles.nav}>
              <button onClick={() => navigate('/catalog')} style={styles.navButton} className="btn-hover">
                <Package size={16} />
                Catalog
              </button>
              <button onClick={() => navigate('/storefront')} style={styles.navButton} className="btn-hover">
                <ExternalLink size={16} />
                Storefront
              </button>
              <button onClick={() => navigate('/orders')} style={styles.navButton} className="btn-hover">
                <ShoppingBag size={16} />
                Orders
              </button>
              <button onClick={() => navigate('/analytics')} style={styles.navButton} className="btn-hover">
                <BarChart3 size={16} />
                Analytics
              </button>
              <button onClick={() => navigate('/settings')} style={{ ...styles.navButton, ...styles.navButtonActive }}>
                <Settings size={16} />
                Settings
              </button>
            </nav>
          </div>
        </header>

        <div style={styles.content}>
          {/* Phone Number Needs Fixing Warning */}
          {phoneNeedsFixing && (
            <div style={styles.warningBanner}>
              <AlertCircle size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, color: '#92400e', marginBottom: 4 }}>
                  WhatsApp Number Needs Updating
                </div>
                <div style={{ fontSize: 14, color: '#a16207' }}>
                  Your WhatsApp number isn't in the correct international format. Please update it below to ensure customers can reach you properly.
                </div>
              </div>
            </div>
          )}

          {/* Store Information */}
          <div style={styles.card}>
            <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Store size={20} />
              Store Information
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <User size={16} style={{ display: 'inline', marginRight: 8 }} />
                  Store Name
                </label>
                <input
                  type="text"
                  value={formData.storeName}
                  onChange={(e) => setFormData(prev => ({ ...prev, storeName: e.target.value }))}
                  placeholder="Enter your store name"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Store Description</label>
                <textarea
                  value={formData.storeDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, storeDescription: e.target.value }))}
                  placeholder="Describe what you sell..."
                  style={styles.textarea}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Phone size={16} style={{ display: 'inline', marginRight: 8 }} />
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={formData.whatsappNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="Enter your WhatsApp number"
                  style={{
                    ...styles.input,
                    ...(phoneValidation.isValid
                      ? (formData.whatsappNumber && phoneValidation.normalized ? styles.inputValid : {})
                      : styles.inputError)
                  }}
                  required
                />

                {/* Phone validation feedback */}
                {!phoneValidation.isValid && phoneValidation.error && (
                  <div style={styles.errorText}>
                    <AlertCircle size={12} />
                    {phoneValidation.error}
                  </div>
                )}

                {phoneValidation.isValid && formData.whatsappNumber && phoneValidation.normalized && (
                  <div style={styles.validText}>
                    ✓ Will be saved as: {formatPhoneForDisplay(phoneValidation.normalized)}
                  </div>
                )}

                {(!formData.whatsappNumber || !phoneValidation.normalized) && (
                  <div style={styles.hintText}>
                    {getPhoneHint(userProfile?.country || 'Ghana')}
                  </div>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <MapPin size={16} style={{ display: 'inline', marginRight: 8 }} />
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="City, Region"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Business Category</label>
                <select
                  value={formData.businessCategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessCategory: e.target.value }))}
                  style={styles.select}
                >
                  <option value="">Select category</option>
                  <option value="Fashion & Clothing">Fashion & Clothing</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Food & Beverages">Food & Beverages</option>
                  <option value="Health & Beauty">Health & Beauty</option>
                  <option value="Home & Garden">Home & Garden</option>
                  <option value="Sports & Fitness">Sports & Fitness</option>
                  <option value="Books & Education">Books & Education</option>
                  <option value="Automotive">Automotive</option>
                  <option value="Services">Services</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Globe size={16} style={{ display: 'inline', marginRight: 8 }} />
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  style={styles.select}
                >
                  <option value="GHS">🇬🇭 Ghanaian Cedi (GHS)</option>
                  <option value="NGN">🇳🇬 Nigerian Naira (NGN)</option>
                  <option value="KES">🇰🇪 Kenyan Shilling (KES)</option>
                  <option value="UGX">🇺🇬 Ugandan Shilling (UGX)</option>
                  <option value="TZS">🇹🇿 Tanzanian Shilling (TZS)</option>
                  <option value="USD">🇺🇸 US Dollar (USD)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={saving || (!phoneValidation.isValid && formData.whatsappNumber.trim())}
                style={{
                  ...styles.button,
                  ...(saveSuccess ? styles.saveButton : styles.primaryButton),
                  opacity: (saving || (!phoneValidation.isValid && formData.whatsappNumber.trim())) ? 0.6 : 1,
                  cursor: (saving || (!phoneValidation.isValid && formData.whatsappNumber.trim())) ? 'not-allowed' : 'pointer'
                }}
                className="btn-hover"
              >
                {saving ? (
                  <>
                    <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Saving...
                  </>
                ) : saveSuccess ? (
                  <>✅ Saved Successfully!</>
                ) : (
                  <>
                    <Save size={16} />
                    Save Settings
                  </>
                )}
              </button>
            </form>
          </div>

          {/* 🛠 One-time Maintenance (you can remove after running) */}
          <div style={styles.card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>
              🛠 Maintenance
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: 14, opacity: .8 }}>
              Run once to fix product image fields created by the bulk upload.
            </p>
            <button
              onClick={normalizeProductImages}
              disabled={normalizing}
              className="btn-hover"
              style={{ ...styles.button, ...styles.saveButton, opacity: normalizing ? .6 : 1 }}
            >
              {normalizing ? 'Normalizing…' : 'Normalize Product Images'}
            </button>
          </div>

          {/* Account Information */}
          <div style={styles.card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>
              👤 Account Information
            </h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Email</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{user?.email}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Account Created</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>
                  {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Recently'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Store URL</div>
                <div style={{ fontSize: 14, fontWeight: 500, fontFamily: 'monospace', background: 'rgba(0,0,0,0.05)', padding: '4px 8px', borderRadius: 4 }}>
                  {window.location.origin}/store/{user?.uid}
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div
            style={{
              ...styles.card,
              borderColor: 'rgba(239,68,68,0.2)',
              background: 'rgba(254,242,242,0.8)'
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#dc2626' }}>
              ⚠️ Danger Zone
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 14, opacity: 0.8 }}>
              These actions cannot be undone. Please be careful.
            </p>
            <button
              style={{
                ...styles.button,
                background: 'rgba(239,68,68,0.1)',
                color: '#dc2626',
                border: '1px solid rgba(239,68,68,0.2)'
              }}
              className="btn-hover"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                  // Implement account deletion logic here
                  console.log('Account deletion requested');
                }
              }}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
};

export default SettingsView;
