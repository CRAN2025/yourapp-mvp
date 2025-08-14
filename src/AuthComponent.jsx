import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "./firebase";

export default function AuthComponent() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const handle = async (fn) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch (err) {
      setMsg(err?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const onSignIn = () =>
    handle(() => signInWithEmailAndPassword(auth, email.trim(), password));

  const onSignUp = () =>
    handle(() => createUserWithEmailAndPassword(auth, email.trim(), password));

  const onReset = () =>
    handle(async () => {
      if (!email) throw new Error("Enter your email to reset the password.");
      await sendPasswordResetEmail(auth, email.trim());
      setMsg("Password reset email sent.");
    });

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
            {mode === "signin" 
              ? "Welcome back to your WhatsApp store" 
              : "Create your WhatsApp store in minutes"
            }
          </p>
          
          {mode === "signup" && (
            <div className="auth-benefits">
              <div className="auth-benefits-title">
                ✨ Free to start!
              </div>
              <div className="auth-benefits-grid">
                <div>📱 WhatsApp Integration</div>
                <div>📦 Product Catalog</div>
                <div>💰 Payment Tracking</div>
                <div>📊 Sales Analytics</div>
              </div>
            </div>
          )}
        </div>

        <div className="auth-form-group">
          <label className="auth-label">Email</label>
          <input
            className={`auth-input ${msg && msg.includes('email') ? 'error' : ''}`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@email.com"
          />
        </div>

        <div className="auth-form-group">
          <label className="auth-label">Password</label>
          <input
            className={`auth-input ${msg && msg.includes('password') ? 'error' : ''}`}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder="••••••••"
          />
        </div>

        {msg && (
          <div className={msg.includes('sent') ? 'auth-success' : 'auth-error'}>
            {msg.includes('sent') ? '✅' : '⚠️'} {msg}
          </div>
        )}

        {mode === "signin" ? (
          <button className="auth-btn-primary" disabled={busy} onClick={onSignIn}>
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
          <button className="auth-btn-primary" disabled={busy} onClick={onSignUp}>
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
          {mode === "signin" ? (
            <>
              <button className="auth-link" disabled={busy} onClick={() => setMode("signup")}>
                Create account
              </button>
              <button className="auth-link" disabled={busy} onClick={onReset}>
                Forgot password?
              </button>
            </>
          ) : (
            <button className="auth-link" disabled={busy} onClick={() => setMode("signin")}>
              Already have an account? Sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}