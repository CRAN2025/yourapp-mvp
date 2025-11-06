// src/SellerOnboardingView.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { validatePhoneNumber, getPhoneHint, formatPhoneForDisplay } from './sharedUtils';

const categories = [
  '👗 Fashion & Clothing','📱 Electronics','🍔 Food & Beverages','💄 Beauty & Cosmetics',
  '🏠 Home & Garden','📚 Books & Education','🎮 Sports & Gaming','👶 Baby & Kids',
  '🚗 Automotive','🎨 Arts & Crafts','💊 Health & Wellness','🔧 Tools & Hardware',
  '🎁 Gifts & Souvenirs','💍 Jewelry & Accessories','📦 Other'
];

const countries = [
  { code: 'GH', name: 'Ghana',    currency: 'GHS', flag: '🇬🇭' },
  { code: 'NG', name: 'Nigeria',  currency: 'NGN', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya',    currency: 'KES', flag: '🇰🇪' },
  { code: 'UG', name: 'Uganda',   currency: 'UGX', flag: '🇺🇬' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', flag: '🇹🇿' },
];

const deliveryOptionsMaster = [
  { id: 'pickup',   label: '🚶 Customer Pickup', desc: 'Customers collect from your location' },
  { id: 'delivery', label: '🚚 Home Delivery',   desc: 'You deliver to customers' },
  { id: 'courier',  label: '📦 Courier Service', desc: 'Third-party delivery' },
  { id: 'shipping', label: '✈️ Shipping',       desc: 'Postal/shipping services' }
];

const paymentMethodsMaster = [
  { id: 'cash',          label: '💵 Cash',           desc: 'Cash on delivery/pickup' },
  { id: 'mobile_money',  label: '📱 Mobile Money',   desc: 'MTN, Vodafone, AirtelTigo' },
  { id: 'bank_transfer', label: '🏦 Bank Transfer',  desc: 'Direct bank deposits' },
  { id: 'card',          label: '💳 Card Payment',   desc: 'Credit/Debit cards' }
];

/**
 * Props:
 * - authMethod: 'email' | 'phone' (default 'email')
 * - requirePhoneVerification: boolean (default false) – if true & authMethod===phone, show code UI and require verification to proceed
 * - onSendPhoneCode?: (e164Phone) => Promise<boolean>
 * - onVerifyPhoneCode?: (code) => Promise<boolean>
 */
export default function SellerOnboardingView({
  user = null,
  userProfile = null, // reserved for future
  onSignOut = null,
  onComplete = null,
  authMethod = 'email',
  requirePhoneVerification = false,
  onSendPhoneCode,
  onVerifyPhoneCode
}) {
  const navigate = useNavigate();
  const { step: stepParam } = useParams();

  const defaultCountry = countries[0];

  const [currentStep, setCurrentStep] = useState(1); // 1 | 2 | 3
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  // --- phone verification state (kept separate from phone to avoid bleed) ---
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationSending, setVerificationSending] = useState(false);
  const [verificationChecking, setVerificationChecking] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  const [formData, setFormData] = useState({
    storeName: '',
    storeDescription: '',
    category: '',
    whatsappNumber: '',
    businessEmail: user?.email || '',
    countryCode: defaultCountry.code,
    countryName: defaultCountry.name,
    currency: defaultCountry.currency,
    city: '',
    businessType: 'individual',
    deliveryOptions: [],
    paymentMethods: []
  });

  // Keep URL and local step state in sync; guard invalid step values
  useEffect(() => {
    const n = Number(stepParam);
    if (![1, 2, 3].includes(n)) {
      navigate('/onboarding/1', { replace: true });
      return;
    }
    if (currentStep !== n) setCurrentStep(n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepParam, navigate]);

  // Recompute phone validation preview cheaply
  const phoneValidation = useMemo(() => {
    return validatePhoneNumber(formData.whatsappNumber, formData.countryCode);
  }, [formData.whatsappNumber, formData.countryCode]);

  // ---------- Validation ----------
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.storeName.trim()) newErrors.storeName = 'Store name is required';
      if (!formData.category) newErrors.category = 'Please select a category';
      if (!formData.storeDescription.trim()) {
        newErrors.storeDescription = 'Store description is required';
      } else if (formData.storeDescription.trim().length < 20) {
        newErrors.storeDescription = 'Description should be at least 20 characters';
      }
    }

    if (step === 2) {
      const v = phoneValidation;
      if (!v.isValid) newErrors.whatsappNumber = v.error || 'Enter a valid phone number';
      if (!formData.city.trim()) newErrors.city = 'City is required';

      // Only require verification code if you explicitly want it
      if (authMethod === 'phone' && requirePhoneVerification) {
        if (!isPhoneVerified) {
          if (!verificationCode.trim()) {
            newErrors.verificationCode = 'Enter the code we sent to your phone';
          } else if (verificationCode.trim().length < 4) {
            newErrors.verificationCode = 'Code seems too short';
          }
        }
      }
    }

    if (step === 3) {
      if (formData.deliveryOptions.length === 0) newErrors.deliveryOptions = 'Select at least one delivery option';
      if (formData.paymentMethods.length === 0) newErrors.paymentMethods = 'Select at least one payment method';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------- Handlers ----------
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleArrayToggle = (field, value) => {
    setFormData((prev) => {
      const exists = prev[field].includes(value);
      const next = exists ? prev[field].filter((v) => v !== value) : [...prev[field], value];
      return { ...prev, [field]: next };
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleCountryChange = (code) => {
    const c = countries.find((x) => x.code === code) || defaultCountry;
    setFormData((prev) => ({
      ...prev,
      countryCode: c.code,
      countryName: c.name,
      currency: c.currency
    }));
    if (errors.whatsappNumber) setErrors((prev) => ({ ...prev, whatsappNumber: null }));
  };

  // ---------- Phone code flow (optional) ----------
  const sendCode = async () => {
    // Require a valid phone to send code
    const v = validatePhoneNumber(formData.whatsappNumber, formData.countryCode);
    if (!v.isValid || !v.normalized) {
      setErrors((prev) => ({ ...prev, whatsappNumber: v.error || 'Enter a valid phone number before sending code' }));
      return;
    }
    setVerificationSending(true);
    try {
      if (onSendPhoneCode) {
        const ok = await onSendPhoneCode(v.normalized);
        if (!ok) throw new Error('Failed to send verification code');
      }
      setVerificationCode(''); // clear any old value
      setIsPhoneVerified(false);
    } catch (e) {
      setErrors((prev) => ({ ...prev, verificationCode: 'Could not send code. Please try again.' }));
    } finally {
      setVerificationSending(false);
    }
  };

  const verifyCode = async () => {
    setVerificationChecking(true);
    try {
      let ok = true;
      if (onVerifyPhoneCode) {
        ok = await onVerifyPhoneCode(verificationCode.trim());
      } else {
        // fallback: naive local rule for MVP if no backend provided
        ok = verificationCode.trim().length >= 4;
      }
      if (!ok) throw new Error('Invalid code');
      setIsPhoneVerified(true);
      setErrors((prev) => ({ ...prev, verificationCode: null }));
    } catch (e) {
      setIsPhoneVerified(false);
      setErrors((prev) => ({ ...prev, verificationCode: 'Invalid or expired code' }));
    } finally {
      setVerificationChecking(false);
    }
  };

  // ---------- Step navigation (state + URL) ----------
  const nextStep = () => {
    if (!validateStep(currentStep)) return;

    // If we’re on step 2 and phone verification is required for phone-auth users,
    // block advancing until verified.
    if (currentStep === 2 && authMethod === 'phone' && requirePhoneVerification && !isPhoneVerified) {
      setErrors((prev) => ({ ...prev, verificationCode: prev.verificationCode || 'Please verify your phone to continue' }));
      return;
    }

    const next = currentStep + 1;
    setCurrentStep(next);
    navigate(`/onboarding/${next}`);
  };

  const prevStep = () => {
    const prev = currentStep - 1;
    setCurrentStep(prev);
    navigate(`/onboarding/${prev}`);
  };

  // ---------- Complete ----------
  const handleComplete = async () => {
    if (!validateStep(3)) return;
    setLoading(true);
    try {
      const v = validatePhoneNumber(formData.whatsappNumber, formData.countryCode);
      if (!v.isValid || !v.normalized) {
        setErrors({ whatsappNumber: v.error || 'Invalid phone number' });
        setLoading(false);
        return;
      }

      const payload = {
        storeName: formData.storeName.trim(),
        storeDescription: formData.storeDescription.trim(),
        category: formData.category,
        whatsappE164: v.normalized,
        businessEmail: formData.businessEmail.trim(),
        countryCode: formData.countryCode,
        countryName: formData.countryName,
        currency: formData.currency,
        city: formData.city.trim(),
        businessType: formData.businessType,
        deliveryOptions: formData.deliveryOptions,
        paymentMethods: formData.paymentMethods
      };

      let ok = true;
      if (onComplete) {
        const res = await onComplete(payload);
        ok = !!res;
      }
      if (!ok) throw new Error('Failed to complete onboarding');

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/catalog');
      }, 800);
    } catch (e) {
      console.error('Onboarding completion error:', e);
      setErrors({ general: 'Failed to complete setup. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // ---------- UI ----------
  return (
    <div className="seller-onboarding">
      <style>{`
        /* --- Animations --- */
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* --- Scoped wrapper to prevent bleed onto other pages --- */
        .seller-onboarding { position: relative; min-height: 100vh; width: 100vw; display: grid; place-items: center; overflow: hidden; isolation: isolate; }
        .seller-onboarding .bgGradient { position: absolute; inset: 0; background: radial-gradient(1200px 800px at 10% 10%, rgba(255,255,255,0.18), transparent 50%), linear-gradient(135deg, #6a5cff 0%, #7aa0ff 40%, #67d1ff 100%); opacity: .8; z-index: 0; }

        .seller-onboarding .onb-toolbar,
        .seller-onboarding .onboarding-container,
        .seller-onboarding .success-toast { z-index: 1; position: relative; }

        .seller-onboarding .onb-toolbar { position: absolute; top: 18px; left: 24px; right: 24px; display: flex; align-items: center; justify-content: space-between; }
        .seller-onboarding .brandLeft { display: flex; align-items: center; gap: 10px; padding: 6px 10px; border-radius: 10px; cursor: pointer; }
        .seller-onboarding .brandLeft:hover { background: rgba(255,255,255,0.4); }
        .seller-onboarding .brandMark { font-size: 20px; }
        .seller-onboarding .brandWord { font-weight: 800; font-size: 18px; letter-spacing: -0.2px; }
        .seller-onboarding .toolbarRight { display: flex; align-items: center; gap: 10px; }
        .seller-onboarding .userChip { padding: 6px 10px; border-radius: 999px; background: rgba(255,255,255,0.55); backdrop-filter: blur(6px); border: 1px solid rgba(0,0,0,0.06); font-size: 12px; }

        .seller-onboarding .onboarding-container { width: min(1000px, calc(100vw - 48px)); margin: 84px auto 32px; border-radius: 20px; padding: 22px; background: rgba(255,255,255,0.86); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); box-shadow: 0 30px 80px rgba(22,25,45,0.25); }
        .seller-onboarding .onboarding-header h1 { margin: 0 0 6px; letter-spacing: -0.4px; font-size: 32px; background: linear-gradient(135deg, #5a6bff, #67d1ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .seller-onboarding .onboarding-header p { margin: 0 0 14px; opacity: .75; }

        .seller-onboarding .progress-container { margin: 10px 0 18px; }
        .seller-onboarding .progress-bar { height: 8px; border-radius: 999px; background: #eef1ff; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05); }
        .seller-onboarding .progress-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #5a6bff, #67d1ff); transition: width .25s ease; }
        .seller-onboarding .progress-steps { display: flex; gap: 10px; justify-content: space-between; font-size: 12px; margin-top: 8px; opacity: .7; }
        .seller-onboarding .progress-steps .active { font-weight: 700; opacity: 1; }

        .seller-onboarding .onboarding-content { margin-top: 10px; border-radius: 16px; padding: 16px; border: 1px solid rgba(0,0,0,0.06); background: rgba(255,255,255,0.55); animation: fadeIn 0.6s ease-out; }
        .seller-onboarding .form-group { margin: 12px 0; }
        .seller-onboarding .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .seller-onboarding label { font-size: 13px; opacity: .8; display: block; margin-bottom: 6px; }
        .seller-onboarding input, .seller-onboarding select, .seller-onboarding textarea { width: 100%; padding: 10px 12px; border-radius: 12px; border: 1px solid #e6e6e6; background: #f9fafb; outline: none; transition: all 0.3s ease; }
        .seller-onboarding textarea { resize: vertical; }
        .seller-onboarding input:focus, .seller-onboarding select:focus, .seller-onboarding textarea:focus { border-color: #b7c5ff; box-shadow: 0 0 0 3px rgba(50,100,255,.15); }
        .seller-onboarding .error { border-color: #ff7a7a !important; background: #fff6f6; }
        .seller-onboarding .error-text { color: #b00020; font-size: 12px; margin-top: 4px; display: inline-flex; align-items: center; gap: 4px; }
        .seller-onboarding .phone-hint { color: #6b7280; font-size: 11px; margin-top: 4px; font-style: italic; }
        .seller-onboarding .phone-preview { color: #059669; font-size: 11px; margin-top: 4px; font-weight: 500; }

        .seller-onboarding .radio-group { display: flex; gap: 14px; }
        .seller-onboarding .radio-option { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.06); cursor: pointer; transition: all 0.3s ease; }

        .seller-onboarding .checkbox-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; }
        .seller-onboarding .checkbox-option { display: grid; grid-template-columns: 18px 1fr; gap: 10px; align-items: start; padding: 10px; border-radius: 12px; border: 1px solid rgba(0,0,0,.06); background: rgba(255,255,255,.75); cursor: pointer; transition: all 0.3s ease; }
        .seller-onboarding .option-label { font-weight: 600; }
        .seller-onboarding .option-desc { opacity: .7; }

        .seller-onboarding .currency-display { display: inline-flex; gap: 6px; align-items: center; padding: 6px 10px; border-radius: 999px; background: #eef1ff; font-weight: 700; }

        .seller-onboarding .onboarding-navigation { display: flex; justify-content: space-between; gap: 10px; margin-top: 14px; }
        .seller-onboarding .btn-primary, .seller-onboarding .btn-secondary, .seller-onboarding .btn-success { height: 44px; padding: 0 16px; border-radius: 12px; border: none; cursor: pointer; font-weight: 800; display: flex; align-items: center; gap: 6px; transition: all 0.3s ease; }
        .seller-onboarding .btn-primary { background: linear-gradient(135deg, #5a6bff, #67d1ff); color: #fff; box-shadow: 0 6px 20px rgba(90,107,255,0.3); }
        .seller-onboarding .btn-secondary { background: #eef1ff; }
        .seller-onboarding .btn-success { background: linear-gradient(180deg, #22c55e, #16a34a); color: #fff; box-shadow: 0 6px 14px rgba(22,163,74,.35); }
        .seller-onboarding .spinner { width: 16px; height: 16px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; }

        .seller-onboarding .success-toast { position: fixed; top: 20px; right: 20px; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 16px 24px; border-radius: 12px; box-shadow: 0 6px 20px rgba(34, 197, 94, 0.3); display: flex; align-items: center; gap: 8px; font-weight: 600; }

        @media (max-width: 720px) {
          .seller-onboarding .form-row { grid-template-columns: 1fr; }
          .seller-onboarding .radio-group { flex-direction: column; }
        }
      `}</style>

      <div className="bgGradient" />

      <header className="onb-toolbar" aria-label="Onboarding Toolbar">
        <div
          className="brandLeft"
          title="Go to ShopLink — Create your free store"
          onClick={() => navigate('/#signup')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' ? navigate('/#signup') : null)}
        >
          <span className="brandMark" aria-hidden>🛍️</span>
          <span className="brandWord">ShopLink</span>
        </div>

        <div className="toolbarRight">
          <span className="userChip">{user?.email || 'user@example.com'}</span>
          <button
            onClick={onSignOut || undefined}
            style={{ background:'none', border:'none', cursor:'pointer', padding:'6px 12px', borderRadius:'8px', fontSize:'12px', opacity:.7 }}
            onMouseEnter={(e)=>{ e.currentTarget.style.opacity='1'; }}
            onMouseLeave={(e)=>{ e.currentTarget.style.opacity='.7'; }}
            aria-label="Sign out"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="onboarding-container" role="region" aria-label="Seller Onboarding">
        {showSuccess && <div className="success-toast" role="status">🎉 Setup completed successfully!</div>}

        <div className="onboarding-header">
          <h1>🎉 Welcome to ShopLink!</h1>
          <p>Let's get your WhatsApp store set up in just a few steps</p>
        </div>

        <div className="progress-container" aria-label="Progress">
          <div className="progress-bar" aria-hidden>
            <div className="progress-fill" style={{ width: `${(currentStep / 3) * 100}%` }} />
          </div>
          <div className="progress-steps" aria-live="polite">
            <span className={currentStep >= 1 ? 'active' : ''}>1. Store Info</span>
            <span className={currentStep >= 2 ? 'active' : ''}>2. Contact</span>
            <span className={currentStep >= 3 ? 'active' : ''}>3. Settings</span>
          </div>
        </div>

        <div className="onboarding-content">
          {errors.general && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                color: '#dc2626',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              role="alert"
            >
              ⚠️ {errors.general}
            </div>
          )}

          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="onboarding-step">
              <div style={{ textAlign:'center', marginBottom:32 }}>
                <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:80, height:80, background:'linear-gradient(135deg, rgba(90,107,255,.1), rgba(103,209,255,.1))', borderRadius:'50%', marginBottom:16, fontSize:36 }} aria-hidden>🛍️</div>
                <h2 style={{ fontSize:28, fontWeight:800, background:'linear-gradient(135deg, #5a6bff, #67d1ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:'0 0 8px 0' }}>Tell us about your store</h2>
                <p style={{ opacity:.7, margin:0 }}>Let's set up your WhatsApp storefront with some basic information</p>
              </div>

              <div className="form-group">
                <label htmlFor="storeName">Store Name *</label>
                <input
                  id="storeName"
                  type="text"
                  placeholder="e.g., Ama's Fashion Hub"
                  value={formData.storeName}
                  onChange={(e)=>handleInputChange('storeName', e.target.value)}
                  className={errors.storeName ? 'error' : ''}
                  aria-invalid={!!errors.storeName}
                  aria-describedby={errors.storeName ? 'err-storeName' : undefined}
                />
                {errors.storeName && <div id="err-storeName" className="error-text">⚠️ {errors.storeName}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e)=>handleInputChange('category', e.target.value)}
                  className={errors.category ? 'error' : ''}
                  aria-invalid={!!errors.category}
                  aria-describedby={errors.category ? 'err-category' : undefined}
                >
                  <option value="">Select your main category</option>
                  {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                {errors.category && <div id="err-category" className="error-text">⚠️ {errors.category}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="storeDescription">Store Description *</label>
                <textarea
                  id="storeDescription"
                  placeholder="Describe what you sell…"
                  rows={4}
                  value={formData.storeDescription}
                  onChange={(e)=>handleInputChange('storeDescription', e.target.value)}
                  className={errors.storeDescription ? 'error' : ''}
                  aria-invalid={!!errors.storeDescription}
                  aria-describedby={errors.storeDescription ? 'err-storeDescription' : 'storeDescription-hint'}
                />
                <div id="storeDescription-hint" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6 }}>
                  <small style={{ opacity:.6 }}>{formData.storeDescription.length}/200 characters (min 20)</small>
                </div>
                {errors.storeDescription && <div id="err-storeDescription" className="error-text">⚠️ {errors.storeDescription}</div>}
              </div>

              <div className="form-group">
                <label>Business Type</label>
                <div className="radio-group" role="radiogroup" aria-label="Business Type">
                  <label
                    className="radio-option"
                    style={{ background: formData.businessType==='individual' ? 'rgba(90,107,255,.1)' : 'rgba(255,255,255,.75)' }}
                  >
                    <input
                      type="radio"
                      value="individual"
                      checked={formData.businessType==='individual'}
                      onChange={(e)=>handleInputChange('businessType', e.target.value)}
                    />
                    <span style={{ fontSize:20, marginRight:8 }} aria-hidden>👤</span><span>Individual Seller</span>
                  </label>
                  <label
                    className="radio-option"
                    style={{ background: formData.businessType==='business' ? 'rgba(90,107,255,.1)' : 'rgba(255,255,255,.75)' }}
                  >
                    <input
                      type="radio"
                      value="business"
                      checked={formData.businessType==='business'}
                      onChange={(e)=>handleInputChange('businessType', e.target.value)}
                    />
                    <span style={{ fontSize:20, marginRight:8 }} aria-hidden>🏢</span><span>Registered Business</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="onboarding-step">
              <div style={{ textAlign:'center', marginBottom:32 }}>
                <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:80, height:80, background:'linear-gradient(135deg, rgba(34,197,94,.1), rgba(16,185,129,.1))', borderRadius:'50%', marginBottom:16, fontSize:36 }} aria-hidden>📞</div>
                <h2 style={{ fontSize:28, fontWeight:800, background:'linear-gradient(135deg, #22c55e, #10b981)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:'0 0 8px 0' }}>Contact & Location</h2>
                <p style={{ opacity:.7, margin:0 }}>How can customers reach you and where are you located?</p>
              </div>

              <div className="form-group">
                <label htmlFor="whatsappNumber">WhatsApp Number *</label>
                <input
                  id="whatsappNumber"
                  type="tel"
                  placeholder={getPhoneHint(formData.countryCode)}
                  value={formData.whatsappNumber}
                  onChange={(e)=>handleInputChange('whatsappNumber', e.target.value)}
                  className={errors.whatsappNumber ? 'error' : ''}
                  aria-invalid={!!errors.whatsappNumber}
                  aria-describedby={errors.whatsappNumber ? 'err-whatsapp' : 'hint-whatsapp'}
                  autoComplete="tel"
                  inputMode="tel"
                />
                <div id="hint-whatsapp" className="phone-hint">
                  {getPhoneHint(formData.countryCode)}
                </div>
                {formData.whatsappNumber && !errors.whatsappNumber && phoneValidation.isValid && phoneValidation.normalized && (
                  <div className="phone-preview">✓ Will be saved as: {formatPhoneForDisplay(phoneValidation.normalized)}</div>
                )}
                <small style={{ opacity:.6, display:'block', marginTop:4 }}>This is where customers will contact you for orders</small>
                {errors.whatsappNumber && <div id="err-whatsapp" className="error-text">⚠️ {errors.whatsappNumber}</div>}
              </div>

              {/* Optional phone verification UX (no bleed with phone field) */}
              {authMethod === 'phone' && requirePhoneVerification && (
                <>
                  <div className="form-group">
                    <label htmlFor="verificationCode">
                      Verification Code {isPhoneVerified ? '✓ (verified)' : '*'}
                    </label>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8 }}>
                      <input
                        id="verificationCode"
                        type="text"
                        placeholder="Enter the code"
                        value={verificationCode}           // <-- separate from phone
                        onChange={(e)=>{ setVerificationCode(e.target.value); if (errors.verificationCode) setErrors(prev=>({...prev, verificationCode: null})); }}
                        className={errors.verificationCode ? 'error' : ''}
                        aria-invalid={!!errors.verificationCode}
                        aria-describedby={errors.verificationCode ? 'err-code' : undefined}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                      />
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={sendCode}
                        disabled={verificationSending || !phoneValidation.isValid}
                        aria-busy={verificationSending}
                        title={!phoneValidation.isValid ? 'Enter a valid phone first' : 'Send code'}
                      >
                        {verificationSending ? 'Sending…' : 'Send code'}
                      </button>
                    </div>
                    {errors.verificationCode && <div id="err-code" className="error-text">⚠️ {errors.verificationCode}</div>}
                    <div style={{ marginTop:8 }}>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={verifyCode}
                        disabled={verificationChecking || verificationCode.trim().length < 4}
                        aria-busy={verificationChecking}
                      >
                        {verificationChecking ? 'Verifying…' : 'Verify code'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label htmlFor="businessEmail">Business Email</label>
                <input
                  id="businessEmail"
                  type="email"
                  placeholder="Enter your business email"
                  value={formData.businessEmail}
                  onChange={(e)=>handleInputChange('businessEmail', e.target.value)}
                  autoComplete="email"
                />
                <small style={{ opacity:.6, display:'block', marginTop:4 }}>This email will be used for business communications</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="country">Country *</label>
                  <select
                    id="country"
                    value={formData.countryCode}
                    onChange={(e)=>handleCountryChange(e.target.value)}
                  >
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="city">City *</label>
                  <input
                    id="city"
                    type="text"
                    placeholder="e.g., Accra, Lagos, Nairobi"
                    value={formData.city}
                    onChange={(e)=>handleInputChange('city', e.target.value)}
                    className={errors.city ? 'error' : ''}
                    aria-invalid={!!errors.city}
                    aria-describedby={errors.city ? 'err-city' : undefined}
                  />
                  {errors.city && <div id="err-city" className="error-text">⚠️ {errors.city}</div>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="onboarding-step">
              <div style={{ textAlign:'center', marginBottom:32 }}>
                <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:80, height:80, background:'linear-gradient(135deg, rgba(168,85,247,.1), rgba(139,92,246,.1))', borderRadius: '50%', marginBottom:16, fontSize:36 }} aria-hidden>⚙️</div>
                <h2 style={{ fontSize:28, fontWeight:800, background:'linear-gradient(135deg, #a855f7, #8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:'0 0 8px 0' }}>Store Settings</h2>
                <p style={{ opacity:.7, margin:0 }}>Configure how you'll handle orders and payments</p>
              </div>

              <div className="form-group">
                <label>Currency</label>
                <div className="currency-display" aria-live="polite">
                  💰 {formData.currency} ({formData.countryName})
                </div>
                <small style={{ opacity:.6, display:'block', marginTop:4 }}>Automatically set based on your country</small>
              </div>

              <div className="form-group">
                <label>
                  Delivery Options *
                  {errors.deliveryOptions && <span className="error-text"> ({errors.deliveryOptions})</span>}
                </label>
                <div className="checkbox-grid">
                  {deliveryOptionsMaster.map((opt) => (
                    <label
                      key={opt.id}
                      className="checkbox-option"
                      style={{
                        background: formData.deliveryOptions.includes(opt.id) ? 'rgba(34,197,94,.1)' : 'rgba(255,255,255,.75)',
                        border: formData.deliveryOptions.includes(opt.id) ? '2px solid #22c55e' : '1px solid rgba(0,0,0,.06)'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.deliveryOptions.includes(opt.id)}
                        onChange={()=>handleArrayToggle('deliveryOptions', opt.id)}
                        style={{ accentColor:'#22c55e', transform:'scale(1.2)' }}
                      />
                      <div className="option-content">
                        <span className="option-label">{opt.label}</span>
                        <small className="option-desc">{opt.desc}</small>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>
                  Payment Methods *
                  {errors.paymentMethods && <span className="error-text"> ({errors.paymentMethods})</span>}
                </label>
                <div className="checkbox-grid">
                  {paymentMethodsMaster.map((m) => (
                    <label
                      key={m.id}
                      className="checkbox-option"
                      style={{
                        background: formData.paymentMethods.includes(m.id) ? 'rgba(168,85,247,.1)' : 'rgba(255,255,255,.75)',
                        border: formData.paymentMethods.includes(m.id) ? '2px solid #a855f7' : '1px solid rgba(0,0,0,.06)'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.paymentMethods.includes(m.id)}
                        onChange={()=>handleArrayToggle('paymentMethods', m.id)}
                        style={{ accentColor:'#a855f7', transform:'scale(1.2)' }}
                      />
                      <div className="option-content">
                        <span className="option-label">{m.label}</span>
                        <small className="option-desc">{m.desc}</small>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="onboarding-navigation">
          {currentStep > 1 && (
            <button type="button" onClick={prevStep} className="btn-secondary" disabled={loading}>← Back</button>
          )}
          {currentStep < 3 ? (
            <button type="button" onClick={nextStep} className="btn-primary" disabled={loading}>Next →</button>
          ) : (
            <button type="button" onClick={handleComplete} className="btn-success" disabled={loading} aria-busy={loading}>
              {loading ? (<><div className="spinner" />Setting up…</>) : (<>🚀 Complete Setup</>)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
