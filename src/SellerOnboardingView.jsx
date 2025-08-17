import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { normalizeToE164, validatePhoneNumber, getPhoneHint, formatPhoneForDisplay } from './sharedUtils';

const SellerOnboardingView = ({ user = null, userProfile = null, onSignOut = null, onComplete = null }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    storeName: '',
    storeDescription: '',
    category: '',
    whatsappNumber: '',
    businessEmail: user?.email || 'user@example.com',
    country: 'Ghana',
    city: '',
    businessType: 'individual',
    currency: 'GHS',
    deliveryOptions: [],
    paymentMethods: []
  });

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

  const deliveryOptions = [
    { id: 'pickup', label: '🚶 Customer Pickup', desc: 'Customers collect from your location' },
    { id: 'delivery', label: '🚚 Home Delivery', desc: 'You deliver to customers' },
    { id: 'courier', label: '📦 Courier Service', desc: 'Third-party delivery' },
    { id: 'shipping', label: '✈️ Shipping', desc: 'Postal/shipping services' }
  ];

  const paymentMethods = [
    { id: 'cash', label: '💵 Cash', desc: 'Cash on delivery/pickup' },
    { id: 'mobile_money', label: '📱 Mobile Money', desc: 'MTN, Vodafone, AirtelTigo' },
    { id: 'bank_transfer', label: '🏦 Bank Transfer', desc: 'Direct bank deposits' },
    { id: 'card', label: '💳 Card Payment', desc: 'Credit/Debit cards' }
  ];

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.storeName.trim()) newErrors.storeName = 'Store name is required';
      if (!formData.category) newErrors.category = 'Please select a category';
      if (!formData.storeDescription.trim()) {
        newErrors.storeDescription = 'Store description is required';
      } else if (formData.storeDescription.length < 20) {
        newErrors.storeDescription = 'Description should be at least 20 characters';
      }
    }
    if (step === 2) {
      const phoneValidation = validatePhoneNumber(formData.whatsappNumber, formData.country);
      if (!phoneValidation.isValid) {
        newErrors.whatsappNumber = phoneValidation.error;
      }
      if (!formData.city.trim()) newErrors.city = 'City is required';
    }
    if (step === 3) {
      if (formData.deliveryOptions.length === 0) newErrors.deliveryOptions = 'Select at least one delivery option';
      if (formData.paymentMethods.length === 0) newErrors.paymentMethods = 'Select at least one payment method';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleArrayToggle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleCountryChange = (code) => {
    const c = countries.find(x => x.code === code);
    setFormData(prev => ({ ...prev, country: c.name, currency: c.currency }));
    if (errors.whatsappNumber) {
      setErrors(prev => ({ ...prev, whatsappNumber: null }));
    }
  };

  const nextStep = () => validateStep(currentStep) && setCurrentStep(s => s + 1);
  const prevStep = () => setCurrentStep(s => s - 1);

  const handleComplete = async () => {
    if (!validateStep(3)) return;
    setLoading(true);
    try {
      const phoneValidation = validatePhoneNumber(formData.whatsappNumber, formData.country);
      if (!phoneValidation.isValid) {
        setErrors({ whatsappNumber: phoneValidation.error });
        setLoading(false);
        return;
      }

      const finalFormData = {
        ...formData,
        whatsappNumber: phoneValidation.normalized
      };

      console.log('📞 Phone normalized:', formData.whatsappNumber, '→', phoneValidation.normalized);

      if (onComplete) {
        const success = await onComplete(finalFormData);
        if (success) {
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            navigate('/catalog');
          }, 800);
        } else {
          throw new Error('Failed to complete onboarding');
        }
      } else {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          navigate('/catalog');
        }, 800);
      }
    } catch (err) {
      console.error('Onboarding completion error:', err);
      setErrors({ general: 'Failed to complete setup. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => onSignOut && onSignOut();

  return (
    <div className="seller-onboarding">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .seller-onboarding { position: relative; min-height: 100vh; width: 100vw; display: grid; place-items: center; overflow: hidden; }
        .bgGradient { position: absolute; inset: 0; background: radial-gradient(1200px 800px at 10% 10%, rgba(255,255,255,0.18), transparent 50%), linear-gradient(135deg, #6a5cff 0%, #7aa0ff 40%, #67d1ff 100%); opacity: .8; }
        .onb-toolbar { position: absolute; top: 18px; left: 24px; right: 24px; display: flex; align-items: center; justify-content: space-between; z-index: 2; }
        .brandLeft { display: flex; align-items: center; gap: 10px; padding: 6px 10px; border-radius: 10px; cursor: pointer; }
        .brandLeft:hover { background: rgba(255,255,255,0.4); }
        .brandMark { font-size: 20px; }
        .brandWord { font-weight: 800; font-size: 18px; letter-spacing: -0.2px; }
        .toolbarRight { display: flex; align-items: center; gap: 10px; }
        .userChip { padding: 6px 10px; border-radius: 999px; background: rgba(255,255,255,0.55); backdrop-filter: blur(6px); border: 1px solid rgba(0,0,0,0.06); font-size: 12px; }
        .onboarding-container { position: relative; width: min(1000px, calc(100vw - 48px)); margin: 84px auto 32px; border-radius: 20px; padding: 22px; z-index: 1; }
        .glass { background: rgba(255,255,255,0.86); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); box-shadow: 0 30px 80px rgba(22,25,45,0.25); }
        .onboarding-header h1 { margin: 0 0 6px; letter-spacing: -0.4px; font-size: 32px; background: linear-gradient(135deg, #5a6bff, #67d1ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .onboarding-header p { margin: 0 0 14px; opacity: .75; }
        .progress-container { margin: 10px 0 18px; }
        .progress-bar { height: 8px; border-radius: 999px; background: #eef1ff; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05); }
        .progress-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #5a6bff, #67d1ff); transition: width .25s ease; }
        .progress-steps { display: flex; gap: 10px; justify-content: space-between; font-size: 12px; margin-top: 8px; opacity: .7; }
        .progress-steps .active { font-weight: 700; opacity: 1; }
        .onboarding-content { margin-top: 10px; border-radius: 16px; padding: 16px; border: 1px solid rgba(0,0,0,0.06); background: rgba(255,255,255,0.55); animation: fadeIn 0.6s ease-out; }
        .form-group { margin: 12px 0; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        label { font-size: 13px; opacity: .8; display: block; margin-bottom: 6px; }
        input, select, textarea { width: 100%; padding: 10px 12px; border-radius: 12px; border: 1px solid #e6e6e6; background: #f9fafb; outline: none; transition: all 0.3s ease; }
        textarea { resize: vertical; }
        input:focus, select:focus, textarea:focus { border-color: #b7c5ff; box-shadow: 0 0 0 3px rgba(50,100,255,.15); }
        .error { border-color: #ff7a7a !important; background: #fff6f6; }
        .error-text { color: #b00020; font-size: 12px; margin-top: 4px; display: flex; align-items: center; gap: 4px; }
        .phone-hint { color: #6b7280; font-size: 11px; margin-top: 4px; font-style: italic; }
        .phone-preview { color: #059669; font-size: 11px; margin-top: 4px; font-weight: 500; }
        .radio-group { display: flex; gap: 14px; }
        .radio-option { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.06); cursor: pointer; transition: all 0.3s ease; }
        .checkbox-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; }
        .checkbox-option { display: grid; grid-template-columns: 18px 1fr; gap: 10px; align-items: start; padding: 10px; border-radius: 12px; border: 1px solid rgba(0,0,0,.06); background: rgba(255,255,255,.75); cursor: pointer; transition: all 0.3s ease; }
        .option-label { font-weight: 600; }
        .option-desc { opacity: .7; }
        .currency-display { display: inline-flex; gap: 6px; align-items: center; padding: 6px 10px; border-radius: 999px; background: #eef1ff; font-weight: 700; }
        .onboarding-navigation { display: flex; justify-content: space-between; gap: 10px; margin-top: 14px; }
        .btn-primary, .btn-secondary, .btn-success { height: 44px; padding: 0 16px; border-radius: 12px; border: none; cursor: pointer; font-weight: 800; display: flex; align-items: center; gap: 6px; transition: all 0.3s ease; }
        .btn-primary { background: linear-gradient(135deg, #5a6bff, #67d1ff); color: #fff; box-shadow: 0 6px 20px rgba(90, 107, 255, 0.3); }
        .btn-secondary { background: #eef1ff; }
        .btn-success { background: linear-gradient(180deg, #22c55e, #16a34a); color: #fff; box-shadow: 0 6px 14px rgba(22,163,74,.35); }
        .spinner { width: 16px; height: 16px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; }
        .success-toast { position: fixed; top: 20px; right: 20px; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 16px 24px; border-radius: 12px; box-shadow: 0 6px 20px rgba(34, 197, 94, 0.3); z-index: 1000; animation: fadeIn 0.5s ease-out; display: flex; align-items: center; gap: 8px; font-weight: 600; }
        @media (max-width: 720px) { .form-row { grid-template-columns: 1fr; } .radio-group { flex-direction: column; } }
      `}</style>

      <div className="bgGradient" />
      <header className="onb-toolbar">
        {/* BRAND → CTA: go to marketing landing #signup */}
        <div
          className="brandLeft"
          title="Go to ShopLink — Create your free store"
          onClick={() => navigate('/#signup')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' ? navigate('/#signup') : null)}
        >
          <span className="brandMark">🛍️</span>
          <span className="brandWord">ShopLink</span>
        </div>

        <div className="toolbarRight">
          <span className="userChip">{user?.email || 'user@example.com'}</span>
          <button
            onClick={handleSignOut}
            style={{ background:'none', border:'none', cursor:'pointer', padding:'6px 12px', borderRadius:'8px', fontSize:'12px', opacity:.7 }}
            onMouseEnter={(e)=>e.target.style.opacity='1'}
            onMouseLeave={(e)=>e.target.style.opacity='.7'}
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="onboarding-container glass">
        {showSuccess && <div className="success-toast">🎉 Setup completed successfully!</div>}

        <div className="onboarding-header">
          <h1>🎉 Welcome to ShopLink!</h1>
          <p>Let's get your WhatsApp store set up in just a few steps</p>
        </div>

        <div className="progress-container">
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${(currentStep / 3) * 100}%` }} /></div>
          <div className="progress-steps">
            <span className={currentStep >= 1 ? 'active' : ''}>1. Store Info</span>
            <span className={currentStep >= 2 ? 'active' : ''}>2. Contact</span>
            <span className={currentStep >= 3 ? 'active' : ''}>3. Settings</span>
          </div>
        </div>

        <div className="onboarding-content">
          {errors.general && (
            <div style={{ 
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
            }}>
              ⚠️ {errors.general}
            </div>
          )}
          
          {currentStep === 1 && (
            <div className="onboarding-step">
              <div style={{ textAlign:'center', marginBottom:32 }}>
                <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:80, height:80, background:'linear-gradient(135deg, rgba(90,107,255,.1), rgba(103,209,255,.1))', borderRadius:'50%', marginBottom:16, fontSize:36 }}>🛍️</div>
                <h2 style={{ fontSize:28, fontWeight:800, background:'linear-gradient(135deg, #5a6bff, #67d1ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:'0 0 8px 0' }}>Tell us about your store</h2>
                <p style={{ opacity:.7, margin:0 }}>Let's set up your WhatsApp storefront with some basic information</p>
              </div>

              <div className="form-group">
                <label>Store Name *</label>
                <input type="text" placeholder="e.g., Ama's Fashion Hub" value={formData.storeName}
                  onChange={(e)=>handleInputChange('storeName', e.target.value)} className={errors.storeName ? 'error' : ''}/>
                {errors.storeName && <div className="error-text">⚠️ {errors.storeName}</div>}
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select value={formData.category} onChange={(e)=>handleInputChange('category', e.target.value)} className={errors.category ? 'error' : ''}>
                  <option value="">Select your main category</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                {errors.category && <div className="error-text">⚠️ {errors.category}</div>}
              </div>

              <div className="form-group">
                <label>Store Description *</label>
                <textarea placeholder="Describe what you sell…" rows={4} value={formData.storeDescription}
                  onChange={(e)=>handleInputChange('storeDescription', e.target.value)} className={errors.storeDescription ? 'error' : ''}/>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6 }}>
                  <small style={{ opacity:.6 }}>{formData.storeDescription.length}/200 characters (min 20)</small>
                </div>
                {errors.storeDescription && <div className="error-text">⚠️ {errors.storeDescription}</div>}
              </div>

              <div className="form-group">
                <label>Business Type</label>
                <div className="radio-group">
                  <label className="radio-option" style={{ background: formData.businessType==='individual' ? 'rgba(90,107,255,.1)' : 'rgba(255,255,255,.75)' }}>
                    <input type="radio" value="individual" checked={formData.businessType==='individual'} onChange={(e)=>handleInputChange('businessType', e.target.value)} />
                    <span style={{ fontSize:20, marginRight:8 }}>👤</span><span>Individual Seller</span>
                  </label>
                  <label className="radio-option" style={{ background: formData.businessType==='business' ? 'rgba(90,107,255,.1)' : 'rgba(255,255,255,.75)' }}>
                    <input type="radio" value="business" checked={formData.businessType==='business'} onChange={(e)=>handleInputChange('businessType', e.target.value)} />
                    <span style={{ fontSize:20, marginRight:8 }}>🏢</span><span>Registered Business</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="onboarding-step">
              <div style={{ textAlign:'center', marginBottom:32 }}>
                <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:80, height:80, background:'linear-gradient(135deg, rgba(34,197,94,.1), rgba(16,185,129,.1))', borderRadius:'50%', marginBottom:16, fontSize:36 }}>📞</div>
                <h2 style={{ fontSize:28, fontWeight:800, background:'linear-gradient(135deg, #22c55e, #10b981)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:'0 0 8px 0' }}>Contact & Location</h2>
                <p style={{ opacity:.7, margin:0 }}>How can customers reach you and where are you located?</p>
              </div>

              <div className="form-group">
                <label>WhatsApp Number *</label>
                <input 
                  type="tel" 
                  placeholder={getPhoneHint(formData.country)}
                  value={formData.whatsappNumber}
                  onChange={(e)=>handleInputChange('whatsappNumber', e.target.value)} 
                  className={errors.whatsappNumber ? 'error' : ''}
                />
                <div className="phone-hint">
                  {getPhoneHint(formData.country)}
                </div>
                {formData.whatsappNumber && !errors.whatsappNumber && (
                  <div className="phone-preview">
                    ✓ Will be saved as: {(() => {
                      const validation = validatePhoneNumber(formData.whatsappNumber, formData.country);
                      return validation.isValid ? formatPhoneForDisplay(validation.normalized) : 'Invalid format';
                    })()}
                  </div>
                )}
                <small style={{ opacity:.6, display:'block', marginTop:4 }}>This is where customers will contact you for orders</small>
                {errors.whatsappNumber && <div className="error-text">⚠️ {errors.whatsappNumber}</div>}
              </div>

              <div className="form-group">
                <label>Business Email</label>
                <input type="email" placeholder="Enter your business email" value={formData.businessEmail}
                  onChange={(e)=>handleInputChange('businessEmail', e.target.value)} />
                <small style={{ opacity:.6, display:'block', marginTop:4 }}>This email will be used for business communications</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Country *</label>
                  <select value={countries.find(c => c.name===formData.country)?.code || 'GH'} onChange={(e)=>handleCountryChange(e.target.value)}>
                    {countries.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>City *</label>
                  <input type="text" placeholder="e.g., Accra, Lagos, Nairobi" value={formData.city}
                    onChange={(e)=>handleInputChange('city', e.target.value)} className={errors.city ? 'error' : ''}/>
                  {errors.city && <div className="error-text">⚠️ {errors.city}</div>}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="onboarding-step">
              <div style={{ textAlign:'center', marginBottom:32 }}>
                <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:80, height:80, background:'linear-gradient(135deg, rgba(168,85,247,.1), rgba(139,92,246,.1))', borderRadius:'50%', marginBottom:16, fontSize:36 }}>⚙️</div>
                <h2 style={{ fontSize:28, fontWeight:800, background:'linear-gradient(135deg, #a855f7, #8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:'0 0 8px 0' }}>Store Settings</h2>
                <p style={{ opacity:.7, margin:0 }}>Configure how you'll handle orders and payments</p>
              </div>

              <div className="form-group">
                <label>Currency</label>
                <div className="currency-display">💰 {formData.currency} ({countries.find(c => c.name === formData.country)?.name})</div>
                <small style={{ opacity:.6, display:'block', marginTop:4 }}>Automatically set based on your country</small>
              </div>

              <div className="form-group">
                <label>Delivery Options * {errors.deliveryOptions && <span className="error-text">({errors.deliveryOptions})</span>}</label>
                <div className="checkbox-grid">
                  {deliveryOptions.map(opt => (
                    <label key={opt.id} className="checkbox-option"
                      style={{ background: formData.deliveryOptions.includes(opt.id) ? 'rgba(34,197,94,.1)' : 'rgba(255,255,255,.75)', border: formData.deliveryOptions.includes(opt.id) ? '2px solid #22c55e' : '1px solid rgba(0,0,0,.06)' }}>
                      <input type="checkbox" checked={formData.deliveryOptions.includes(opt.id)}
                        onChange={()=>handleArrayToggle('deliveryOptions', opt.id)} style={{ accentColor:'#22c55e', transform:'scale(1.2)' }} />
                      <div className="option-content"><span className="option-label">{opt.label}</span><small className="option-desc">{opt.desc}</small></div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Payment Methods * {errors.paymentMethods && <span className="error-text">({errors.paymentMethods})</span>}</label>
                <div className="checkbox-grid">
                  {paymentMethods.map(m => (
                    <label key={m.id} className="checkbox-option"
                      style={{ background: formData.paymentMethods.includes(m.id) ? 'rgba(168,85,247,.1)' : 'rgba(255,255,255,.75)', border: formData.paymentMethods.includes(m.id) ? '2px solid #a855f7' : '1px solid rgba(0,0,0,.06)' }}>
                      <input type="checkbox" checked={formData.paymentMethods.includes(m.id)}
                        onChange={()=>handleArrayToggle('paymentMethods', m.id)} style={{ accentColor:'#a855f7', transform:'scale(1.2)' }} />
                      <div className="option-content"><span className="option-label">{m.label}</span><small className="option-desc">{m.desc}</small></div>
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
            <button type="button" onClick={handleComplete} className="btn-success" disabled={loading}>
              {loading ? (<><div className="spinner" />Setting up…</>) : (<>🚀 Complete Setup</>)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerOnboardingView;
