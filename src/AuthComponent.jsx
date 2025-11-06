import { useEffect, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { auth } from "./lib/firebase";

export default function AuthComponent() {
  // Tabs & modes
  const [tab, setTab] = useState("email"); // "email" | "phone"
  const [emailMode, setEmailMode] = useState("signin"); // "signin" | "signup"
  const [phoneStep, setPhoneStep] = useState("enter"); // "enter" | "code"

  // Email state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone state - SEPARATE states to prevent cross-population
  const [phone, setPhone] = useState(""); 
  const [otp, setOtp] = useState("");
  const confirmationResultRef = useRef(null);
  const recaptchaRef = useRef(null);

  // UX state
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  // Clean up reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      try {
        if (recaptchaRef.current) {
          recaptchaRef.current.clear();
        }
      } catch {}
      recaptchaRef.current = null;
    };
  }, []);

  // Error handling
  const friendlyError = (err) => {
    const code = err?.code || "";
    switch (code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Email or password didn't match. Try again or use 'Forgot password?'.";
      case "auth/invalid-email":
        return "That email address looks invalid. Please fix and try again.";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait a moment and try again.";
      case "auth/email-already-in-use":
        return "An account already exists with this email. Try signing in.";
      case "auth/weak-password":
        return "Please choose a stronger password (at least 6 characters).";
      case "auth/invalid-phone-number":
        return "Please enter a valid phone number with country code (e.g., +233241234567).";
      case "auth/invalid-verification-code":
        return "Invalid verification code. Please check and try again.";
      default:
        return err?.message || "Something went wrong. Please try again.";
    }
  };

  // ---------- Shared helper ----------
  const handle = async (fn) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch (err) {
      setMsg(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  // ---------- Email auth ----------
  const onEmailSignIn = () =>
    handle(() => signInWithEmailAndPassword(auth, email.trim(), password));

  const onEmailSignUp = () =>
    handle(() => createUserWithEmailAndPassword(auth, email.trim(), password));

  const onReset = () =>
    handle(async () => {
      if (!email) throw { code: "auth/invalid-email", message: "Enter your email to reset the password." };
      await sendPasswordResetEmail(auth, email.trim());
      setMsg("Password reset email sent.");
    });

  // ---------- Phone auth ----------
  const ensureHiddenButton = (id) => {
    if (!document.getElementById(id)) {
      const btn = document.createElement("button");
      btn.id = id;
      btn.style.display = "none";
      document.body.appendChild(btn);
    }
  };

  const sendCode = () =>
    handle(async () => {
      const e164 = phone.trim();
      if (!/^\+\d{8,15}$/.test(e164)) {
        throw { code: "auth/invalid-phone-number", message: "Enter a valid phone number in international format (e.g., +233241234567)." };
      }

      const buttonId = "sign-in-button";
      ensureHiddenButton(buttonId);

      // Recreate verifier fresh each send
      try {
        if (recaptchaRef.current) {
          recaptchaRef.current.clear();
        }
      } catch {}
      recaptchaRef.current = new RecaptchaVerifier(auth, buttonId, { size: "invisible" });

      const res = await signInWithPhoneNumber(auth, e164, recaptchaRef.current);
      confirmationResultRef.current = res;
      setOtp(""); // Clear OTP field completely
      setPhoneStep("code");
    });

  const verifyCode = () =>
    handle(async () => {
      const code = otp.replace(/\D/g, "");
      if (code.length !== 6) throw { code: "auth/invalid-verification-code", message: "Please enter the 6-digit code." };
      const cr = confirmationResultRef.current;
      if (!cr) {
        setPhoneStep("enter");
        throw { message: "No verification in progress. Please send the code again." };
      }
      const cred = await cr.confirm(code);
      onAuthSuccess(cred.user);
    });

  const onAuthSuccess = (user) => {
    // Redirect after successful auth
    if (typeof window !== "undefined") {
      window.location.href = "/onboarding";
    } else {
      setMsg(`Signed in as ${user.phoneNumber || user.email || user.uid}`);
    }
  };

  return (
    <div className="auth-container">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .auth-container {
          position: relative;
          min-height: 100vh;
          width: 100vw;
          display: grid;
          place-items: center;
          overflow: hidden;
        }
        
        .auth-bg-gradient {
          position: absolute;
          inset: 0;
          background: radial-gradient(1200px 800px at 10% 10%, rgba(255,255,255,0.18), transparent 50%), 
                      linear-gradient(135deg, #6a5cff 0%, #7aa0ff 40%, #67d1ff 100%);
          opacity: 0.8;
        }
        
        .auth-card {
          position: relative;
          width: min(420px, calc(100vw - 48px));
          background: rgba(255,255,255,0.86);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 30px 80px rgba(22,25,45,0.25);
          border: 1px solid rgba(255,255,255,0.2);
          animation: fadeIn 0.6s ease-out;
          z-index: 1;
        }
        
        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }
        
        .auth-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .auth-brand-icon {
          font-size: 28px;
        }
        
        .auth-brand-text {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.4px;
          background: linear-gradient(135deg, #5a6bff, #67d1ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
        }
        
        .auth-subtitle {
          font-size: 16px;
          opacity: 0.75;
          margin: 0;
          line-height: 1.5;
        }

        /* Tabs for email/phone selection */
        .auth-tabs {
          display: flex;
          gap: 8px;
          margin: 16px 0 24px 0;
          justify-content: center;
        }
        
        .auth-tab {
          padding: 8px 16px;
          border-radius: 10px;
          border: 1px solid rgba(0,0,0,0.1);
          background: white;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
        }
        
        .auth-tab.active {
          background: #eef2ff;
          border-color: #6366f1;
          color: #3730a3;
        }
        
        .auth-tab:hover:not(.active) {
          background: #f8fafc;
        }
        
        .auth-benefits {
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.15);
          border-radius: 12px;
          padding: 16px;
          margin-top: 16px;
          text-align: left;
        }
        
        .auth-benefits-title {
          font-size: 14px;
          font-weight: 700;
          color: #059669;
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .auth-benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          font-size: 12px;
          opacity: 0.8;
        }
        
        .auth-form-group {
          margin-bottom: 16px;
          text-align: left;
        }
        
        .auth-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          opacity: 0.8;
          margin-bottom: 6px;
        }
        
        .auth-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 12px;
          background: rgba(255,255,255,0.8);
          font-size: 14px;
          outline: none;
          transition: all 0.3s ease;
        }
        
        .auth-input:focus {
          border-color: #5a6bff;
          box-shadow: 0 0 0 3px rgba(90,107,255,0.1);
          background: rgba(255,255,255,0.95);
        }
        
        .auth-input.error {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }

        .auth-error {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.15);
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 13px;
          margin: 16px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .auth-success {
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.15);
          color: #059669;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 13px;
          margin: 16px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .auth-btn-primary {
          width: 100%;
          height: 48px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #5a6bff, #67d1ff);
          color: white;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          margin: 24px 0 16px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 6px 20px rgba(90, 107, 255, 0.3);
        }
        
        .auth-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(90, 107, 255, 0.4);
        }
        
        .auth-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
        
        .auth-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .auth-links {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          gap: 12px;
        }
        
        .auth-link {
          background: transparent;
          border: none;
          color: #5a6bff;
          cursor: pointer;
          padding: 8px 0;
          font-weight: 600;
          font-size: 13px;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        
        .auth-link:hover:not(:disabled) {
          opacity: 0.8;
        }
        
        .auth-link:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .phone-hint {
          font-size: 12px;
          opacity: 0.7;
          margin-top: 4px;
          display: block;
        }
        
        @media (max-width: 480px) {
          .auth-card {
            padding: 24px;
            margin: 16px;
          }
          
          .auth-brand-text {
            font-size: 28px;
          }
          
          .auth-links {
            flex-direction: column;
            gap: 8px;
          }

          .auth-tabs {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>

      <div className="auth-bg-gradient" />
      
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand">
            <span className="auth-brand-icon">🛍️</span>
            <h1 className="auth-brand-text">ShopLink</h1>
          </div>
          <p className="auth-subtitle">
            {tab === "email" 
              ? (emailMode === "signin" ? "Welcome back to your WhatsApp store" : "Create your WhatsApp store in minutes")
              : "Sign in with your phone"
            }
          </p>
          
          {/* Email/Phone Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${tab === "email" ? "active" : ""}`}
              onClick={() => { setTab("email"); setMsg(null); }}
            >
              📧 Email
            </button>
            <button
              className={`auth-tab ${tab === "phone" ? "active" : ""}`}
              onClick={() => { setTab("phone"); setMsg(null); setPhoneStep("enter"); }}
            >
              📱 Phone
            </button>
          </div>
          
          {tab === "email" && emailMode === "signup" && (
            <div className="auth-benefits">
              <div className="auth-benefits-title">✨ Free to start!</div>
              <div className="auth-benefits-grid">
                <div>📱 WhatsApp Integration</div>
                <div>📦 Product Catalog</div>
                <div>💰 Payment Tracking</div>
                <div>📊 Sales Analytics</div>
              </div>
            </div>
          )}
        </div>

        {/* EMAIL AUTH */}
        {tab === "email" && (
          <>
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="email">Email</label>
              <input
                id="email"
                className={`auth-input ${msg && msg.toLowerCase().includes('email') ? 'error' : ''}`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@email.com"
              />
            </div>

            <div className="auth-form-group">
              <label className="auth-label" htmlFor="password">Password</label>
              <input
                id="password"
                className={`auth-input ${msg && msg.toLowerCase().includes('password') ? 'error' : ''}`}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={emailMode === "signin" ? "current-password" : "new-password"}
                placeholder="••••••••"
              />
            </div>

            {msg && tab === "email" && (
              <div className={msg.includes('sent') ? 'auth-success' : 'auth-error'}>
                {msg.includes('sent') ? '✅' : '⚠️'} {msg}
              </div>
            )}

            {emailMode === "signin" ? (
              <button className="auth-btn-primary" disabled={busy} onClick={onEmailSignIn}>
                {busy ? (
                  <>
                    <div className="auth-spinner" />
                    Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            ) : (
              <button className="auth-btn-primary" disabled={busy} onClick={onEmailSignUp}>
                {busy ? (
                  <>
                    <div className="auth-spinner" />
                    Creating account…
                  </>
                ) : (
                  "🚀 Create Account & Start Selling"
                )}
              </button>
            )}

            <div className="auth-links">
              {emailMode === "signin" ? (
                <>
                  <button className="auth-link" disabled={busy} onClick={() => setEmailMode("signup")}>
                    Create account
                  </button>
                  <button className="auth-link" disabled={busy} onClick={onReset}>
                    Forgot password?
                  </button>
                </>
              ) : (
                <button className="auth-link" disabled={busy} onClick={() => setEmailMode("signin")}>
                  Already have an account? Sign in
                </button>
              )}
            </div>
          </>
        )}

        {/* PHONE AUTH */}
        {tab === "phone" && (
          <>
            {phoneStep === "enter" && (
              <>
                <div className="auth-form-group">
                  <label className="auth-label" htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    className={`auth-input ${msg && msg.toLowerCase().includes('phone') ? 'error' : ''}`}
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
                    placeholder="+233241234567"
                    inputMode="tel"
                  />
                  <span className="phone-hint">Include country code (e.g., +233 for Ghana)</span>
                </div>

                {msg && tab === "phone" && phoneStep === "enter" && (
                  <div className="auth-error">⚠️ {msg}</div>
                )}

                {/* Hidden button for reCAPTCHA */}
                <button id="sign-in-button" style={{ display: 'none' }}></button>

                <button className="auth-btn-primary" disabled={busy} onClick={sendCode}>
                  {busy ? (
                    <>
                      <div className="auth-spinner" />
                      Sending code…
                    </>
                  ) : (
                    "📱 Send Verification Code"
                  )}
                </button>
              </>
            )}

            {phoneStep === "code" && (
              <>
                <div className="auth-form-group">
                  <label className="auth-label" htmlFor="otp">Verification Code</label>
                  <input
                    id="otp"
                    className={`auth-input ${msg && msg.toLowerCase().includes('code') ? 'error' : ''}`}
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                  <span className="phone-hint">Enter the 6-digit code sent to your phone</span>
                </div>

                {msg && tab === "phone" && phoneStep === "code" && (
                  <div className="auth-error">⚠️ {msg}</div>
                )}

                <button className="auth-btn-primary" disabled={busy} onClick={verifyCode}>
                  {busy ? (
                    <>
                      <div className="auth-spinner" />
                      Verifying…
                    </>
                  ) : (
                    "✅ Verify & Sign In"
                  )}
                </button>

                <div className="auth-links">
                  <button 
                    className="auth-link" 
                    disabled={busy} 
                    onClick={() => {
                      setPhoneStep("enter");
                      setOtp(""); // Clear OTP completely
                      setMsg(null);
                    }}
                  >
                    ← Back to phone number
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
