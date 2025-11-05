import { useEffect, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type User,
} from "firebase/auth";
import { auth } from "./firebase"; // <- your initialized Firebase Auth

type Tab = "email" | "phone";
type EmailMode = "signin" | "signup";
type PhoneStep = "enter" | "code";

export default function AuthComponent() {
  // Tabs & modes
  const [tab, setTab] = useState<Tab>("email");
  const [emailMode, setEmailMode] = useState<EmailMode>("signin");

  // Email state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone state
  const [phone, setPhone] = useState(""); // E.164, e.g., +16505551234
  const [otp, setOtp] = useState("");
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("enter");
  const confirmationResultRef = useRef<any>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  // UX state
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Clean up reCAPTCHA on unmount (prevents “already rendered” errors on re-entry)
  useEffect(() => {
    return () => {
      try {
        recaptchaRef.current?.clear();
      } catch {}
      recaptchaRef.current = null;
    };
  }, []);

  // ---------- Shared helper ----------
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch (err: any) {
      setMsg(err?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  // ---------- Email auth ----------
  const onEmailSignIn = () =>
    run(async () => {
      const em = email.trim();
      if (!em) throw new Error("Please enter your email.");
      if (!password) throw new Error("Please enter your password.");
      await signInWithEmailAndPassword(auth, em, password);
    });

  const onEmailSignUp = () =>
    run(async () => {
      const em = email.trim();
      if (!em) throw new Error("Please enter your email.");
      if (password.length < 6) throw new Error("Password must be at least 6 characters.");
      await createUserWithEmailAndPassword(auth, em, password);
    });

  const onReset = () =>
    run(async () => {
      const em = email.trim();
      if (!em) throw new Error("Enter your email to reset the password.");
      await sendPasswordResetEmail(auth, em);
      setMsg("Password reset email sent.");
    });

  // ---------- Phone auth ----------
  const ensureHiddenButton = (id: string) => {
    if (!document.getElementById(id)) {
      const btn = document.createElement("button");
      btn.id = id;
      btn.style.display = "none";
      document.body.appendChild(btn);
    }
  };

  const sendCode = () =>
    run(async () => {
      const e164 = phone.trim();
      if (!/^\+\d{8,15}$/.test(e164)) {
        throw new Error("Enter a valid phone number in international format (e.g., +16505551234).");
      }

      const buttonId = "sign-in-button";
      ensureHiddenButton(buttonId);

      // Recreate verifier fresh each send (avoids stale instance & render clashes)
      try {
        recaptchaRef.current?.clear();
      } catch {}
      recaptchaRef.current = new RecaptchaVerifier(auth, buttonId, { size: "invisible" });

      const res = await signInWithPhoneNumber(auth, e164, recaptchaRef.current);
      confirmationResultRef.current = res;
      setOtp(""); // clear any previous text
      setPhoneStep("code");
    });

  const verifyCode = () =>
    run(async () => {
      const code = otp.replace(/\D/g, "");
      if (code.length !== 6) throw new Error("Please enter the 6-digit code.");
      const cr = confirmationResultRef.current;
      if (!cr) {
        setPhoneStep("enter");
        throw new Error("No verification in progress. Please send the code again.");
      }
      const cred = await cr.confirm(code);
      onAuthSuccess(cred.user);
    });

  const onAuthSuccess = (user: User) => {
    // Hook: route to onboarding/dashboard here if desired
    setMsg(`Signed in as ${user.phoneNumber || user.email || user.uid}`);
  };

  // ---------- UI ----------
  return (
    <div className="auth-container">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .auth-container { position: relative; min-height: 100vh; width: 100vw; display: grid; place-items: center; overflow: hidden; }
        .auth-bg-gradient { position: absolute; inset: 0; background:
          radial-gradient(1200px 800px at 10% 10%, rgba(255,255,255,0.18), transparent 50%),
          linear-gradient(135deg, #6a5cff 0%, #7aa0ff 40%, #67d1ff 100%); opacity: 0.8; }
        .auth-card { position: relative; width: min(420px, calc(100vw - 48px)); background: rgba(255,255,255,0.86);
          backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-radius: 20px; padding: 32px;
          box-shadow: 0 30px 80px rgba(22,25,45,0.25); border: 1px solid rgba(255,255,255,0.2);
          animation: fadeIn 0.6s ease-out; z-index: 1; }
        .auth-header { text-align: center; margin-bottom: 24px; }
        .auth-brand { display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:8px; }
        .auth-brand-icon { font-size:28px; }
        .auth-brand-text { font-size:32px; font-weight:800; letter-spacing:-0.4px;
          background: linear-gradient(135deg, #5a6bff, #67d1ff);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; margin:0; }
        .auth-subtitle { font-size:16px; opacity:0.75; margin:0; line-height:1.5; }
        .tabrow { display:flex; gap:8px; margin-top:16px; justify-content:center; }
        .tabbtn { padding:8px 12px; border-radius:10px; border:1px solid rgba(0,0,0,0.1); background:white; font-weight:700; cursor:pointer; }
        .tabbtn.active { background:#eef2ff; border-color:#6366f1; color:#3730a3; }
        .auth-form-group { margin-top:16px; text-align:left; }
        .auth-label { display:block; font-size:13px; font-weight:600; opacity:0.8; margin-bottom:6px; }
        .auth-input { width:100%; padding:12px 16px; border:1px solid rgba(0,0,0,0.1); border-radius:12px; background:rgba(255,255,255,0.8);
          font-size:14px; outline:none; transition:all .3s ease; }
        .auth-input:focus { border-color:#5a6bff; box-shadow:0 0 0 3px rgba(90,107,255,0.1); background:rgba(255,255,255,0.95); }
        .auth-error { background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.15); color:#dc2626; padding:12px 16px;
          border-radius:8px; font-size:13px; margin:16px 0; display:flex; align-items:center; gap:6px; }
        .auth-success { background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.15); color:#059669; padding:12px 16px;
          border-radius:8px; font-size:13px; margin:16px 0; display:flex; align-items:center; gap:6px; }
        .auth-btn-primary { width:100%; height:48px; border-radius:12px; border:none; background:linear-gradient(135deg,#5a6bff,#67d1ff);
          color:white; font-size:14px; font-weight:700; cursor:pointer; transition:all .3s ease; margin:24px 0 8px 0;
          display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 6px 20px rgba(90,107,255,0.3); }
        .auth-btn-primary:hover:not(:disabled){ transform:translateY(-1px); box-shadow:0 8px 24px rgba(90,107,255,0.4); }
        .auth-btn-primary:disabled { opacity:.7; cursor:not-allowed; transform:none; }
        .auth-secondary { width:100%; height:44px; border-radius:12px; background:white; border:1px solid rgba(0,0,0,0.12);
          font-weight:700; }
        .auth-spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,0.3); border-top:2px solid white;
          border-radius:50%; animation:spin 1s linear infinite; }
      `}</style>

      <div className="auth-bg-gradient" />

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand">
            <span className="auth-brand-icon">🛍️</span>
            <h1 className="auth-brand-text">ShopLynk</h1>
          </div>
          <p className="auth-subtitle">Create your account</p>

          <div className="tabrow" role="tablist" aria-label="Sign-in method">
            <button
              role="tab"
              aria-selected={tab === "email"}
              className={`tabbtn ${tab === "email" ? "active" : ""}`}
              onClick={() => setTab("email")}
            >
              Email
            </button>
            <button
              role="tab"
              aria-selected={tab === "phone"}
              className={`tabbtn ${tab === "phone" ? "active" : ""}`}
              onClick={() => setTab("phone")}
            >
              Phone
            </button>
          </div>
        </div>

        {/* EMAIL TAB */}
        {tab === "email" && (
          <>
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="email">Email</label>
              <input
                id="email"
                className="auth-input"
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
                className="auth-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={emailMode === "signin" ? "current-password" : "new-password"}
                placeholder="••••••••"
              />
            </div>

            {msg && tab === "email" && (
              <div className={msg.includes("sent") ? "auth-success" : "auth-error"}>
                {msg.includes("sent") ? "✅" : "⚠️"} {msg}
              </div>
            )}

            {emailMode === "signin" ? (
              <button className="auth-btn-primary" disabled={busy} onClick={onEmailSignIn}>
                {busy ? (<><div className="auth-spinner" /> Signing in…</>) : "Sign In"}
              </button>
            ) : (
              <button className="auth-btn-primary" disabled={busy} onClick={onEmailSignUp}>
                {busy ? (<><div className="auth-spinner" /> Creating account…</>) : "Create Account"}
              </button>
            )}

            <button className="auth-secondary" disabled={busy} onClick={onReset}>
              Forgot password?
            </button>

            <div style={{ marginTop: 8 }}>
              {emailMode === "signin" ? (
                <button className="auth-secondary" disabled={busy} onClick={() => setEmailMode("signup")}>
                  Create account instead
                </button>
              ) : (
                <button className="auth-secondary" disabled={busy} onClick={() => setEmailMode("signin")}>
                  Already have an account? Sign in
                </button>
              )}
            </div>
          </>
        )}

        {/* PHONE TAB */}
        {tab === "phone" && (
          <>
            {phoneStep === "enter" && (
              <>
                <div className="auth-form-group">
                  <label className="auth-label" htmlFor="phone">Phone number</label>
                  <input
                    id="phone"
                    className="auth-input"
                    type="tel"
                    inputMode="tel"
                    placeholder="+16505551234"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
                  />
                </div>

                {msg && tab === "phone" && <div className="auth-error">⚠️ {msg}</div>}

                {/* Keep this button in DOM; RecaptchaVerifier targets its id */}
                <button id="sign-in-button" className="auth-btn-primary" disabled={busy} onClick={sendCode}>
                  {busy ? (<><div className="auth-spinner" /> Sending…</>) : "Send verification code"}
                </button>
              </>
            )}

            {phoneStep === "code" && (
              <>
                <div className="auth-form-group">
                  <label className="auth-label" htmlFor="otp">Verification code</label>
                  <input
                    id="otp"
                    key="otp-input"               /* force clean remount */
                    className="auth-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onPaste={(e) => {
                      e.preventDefault();
                      const v = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
                      setOtp(v);
                    }}
                  />
                </div>

                {msg && tab === "phone" && <div className="auth-error">⚠️ {msg}</div>}

                <button className="auth-btn-primary" disabled={busy} onClick={verifyCode}>
                  {busy ? (<><div className="auth-spinner" /> Verifying…</>) : "Verify & Sign in"}
                </button>

                <button
                  className="auth-secondary"
                  disabled={busy}
                  onClick={() => {
                    setPhoneStep("enter");
                    setOtp("");
                    setMsg(null);
                  }}
                >
                  Back to phone number
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
