// src/App.jsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { auth, db } from "./lib/firebase";
import './App.css';

import AuthComponent from './AuthComponent';
import SellerOnboardingView from './SellerOnboardingView';
import ProductCatalogueView from './ProductCatalogueView';
import StorefrontView from './StorefrontView';
import OrdersView from './OrdersView';
import AnalyticsView from './AnalyticsView';
import StorefrontPublicView from './StorefrontPublicView';
import SettingsView from './SettingsView';
import UpgradeView from './UpgradeView';
import AdminLite from './AdminLite';
// NOTE: ensure the case matches your real filename (macOS can be lenient, CI won’t)
// If your file is src/pages/sellerDashboard.tsx, change the import to './pages/sellerDashboard'
import SellerDashboard from './SellerDashboard';

// If your project does NOT have the "@" alias, change these two lines to:
// import StorefrontByUid from './pages/StorefrontByUid';
// import Logout from './pages/Logout';
import StorefrontByUid from './pages/StorefrontByUid';
import Logout from '@/pages/Logout';

// Admin
import AdminDashboard from './AdminDashboard';

// Public marketing/landing
import MarketLanding from './MarketLanding';

// 🔧 Dev utilities (for one-time data cleanup)
import DevCleanupPanel from './DevCleanupPanel';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (!u) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      try {
        const profileRef = ref(db, `users/${u.uid}/profile`);
        const snap = await get(profileRef);

        if (snap.exists()) {
          setUserProfile(snap.val());
        } else {
          const seeded = {
            email: u.email || '',
            storeName: (u.email && u.email.split('@')[0]) || 'My Store',
            currency: 'GHS',
            onboardingCompleted: false,
            createdAt: Date.now(),
            role: 'seller',
          };
          await set(profileRef, seeded);
          setUserProfile(seeded);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    });

    return unsub;
  }, []);

  const completeOnboarding = async (onboardingData) => {
    if (!user) return false;

    try {
      const profileRef = ref(db, `users/${user.uid}/profile`);
      const updatedProfile = {
        ...(userProfile || {}),
        ...(onboardingData || {}),
        onboardingCompleted: true,
        onboardingCompletedAt: Date.now(),
      };

      await update(profileRef, updatedProfile);
      setUserProfile(updatedProfile);
      return true;
    } catch (err) {
      console.error('Error completing onboarding:', err);
      setError('Failed to complete onboarding');
      return false;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      setError(null);
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to sign out');
    }
  };

  if (loading) {
    return (
      <div className="screen">
        <div className="bgGradient" />
        <div className="glassCard center">
          <div className="spinner" />
          <p style={{ marginTop: '16px', opacity: 0.7 }}>Loading ShopLink...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen">
        <div className="bgGradient" />
        <div className="glassCard center" style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#dc2626', marginBottom: '8px' }}>⚠️ Error</h2>
          <p style={{ marginBottom: '16px' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btnPrimary"
            style={{ width: 'auto', padding: '0 24px' }}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* ---------- PUBLIC ROUTES (buyer/marketing) ---------- */}
      <Route
        path="/"
        element={user ? <Navigate to="/app/dashboard" replace /> : <MarketLanding />}
      />
      {/* Always-open marketing route (no redirect even when signed-in) */}
      <Route path="/get-started" element={<MarketLanding />} />
      <Route
        path="/login"
        element={user ? <Navigate to="/app/dashboard" replace /> : <AuthComponent />}
      />

      {/* Public storefront (guest/buyer view only) */}
      <Route path="/store/:sellerId" element={<StorefrontPublicView />} />

      {/* NEW: legacy UID → seller redirect */}
      <Route path="/store-by-uid/:uid" element={<StorefrontByUid />} />

      {/* NEW: sign-out endpoint */}
      <Route path="/logout" element={<Logout />} />

      {/* 🔧 Dev cleanup route (visit /__dev_cleanup) */}
      <Route path="/__dev_cleanup" element={<DevCleanupPanel />} />

      {/* Utility pages (public) */}
      <Route path="/upgrade" element={<UpgradeView />} />

      {/* Admin Lite (public path, role-gated) */}
      <Route
        path="/admin-lite"
        element={
          user
            ? userProfile?.role === 'admin'
              ? <AdminLite />
              : <Navigate to="/app/dashboard" replace />
            : <Navigate to="/" replace />
        }
      />

      {/* ---------- BACKWARD-COMPAT REDIRECTS (old seller paths) ---------- */}
      <Route path="/catalog" element={<Navigate to="/app/catalog" replace />} />
      <Route path="/storefront" element={<Navigate to="/app/storefront" replace />} />
      <Route path="/orders" element={<Navigate to="/app/orders" replace />} />
      <Route path="/analytics" element={<Navigate to="/app/analytics" replace />} />
      <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
      <Route path="/admin" element={<Navigate to="/app/admin" replace />} />

      {/* Convenience redirect for bare /app */}
      <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />

      {/* ---------- AUTHENTICATED SELLER APP (under /app/*) ---------- */}
      {user ? (
        userProfile ? (
          userProfile.onboardingCompleted ? (
            <>
              {/* Seller Dashboard (default home) */}
              <Route
                path="/app/dashboard"
                element={<SellerDashboard user={user} userProfile={userProfile} />}
              />

              {/* Admin (guarded) */}
              <Route
                path="/app/admin"
                element={
                  userProfile?.role === 'admin' ? (
                    <AdminDashboard />
                  ) : (
                    <Navigate to="/app/dashboard" replace />
                  )
                }
              />

              <Route
                path="/app/catalog"
                element={<ProductCatalogueView user={user} userProfile={userProfile} />}
              />
              <Route
                path="/app/storefront"
                element={<StorefrontView user={user} userProfile={userProfile} />}
              />
              <Route
                path="/app/orders"
                element={<OrdersView user={user} userProfile={userProfile} />}
              />
              <Route
                path="/app/analytics"
                element={<AnalyticsView user={user} userProfile={userProfile} />}
              />
              <Route
                path="/app/settings"
                element={
                  <SettingsView
                    user={user}
                    userProfile={userProfile}
                    onSignOut={handleSignOut}
                  />
                }
              />

              {/* Unknown authed /app route → dashboard */}
              <Route path="/app/*" element={<Navigate to="/app/dashboard" replace />} />
            </>
          ) : (
            // Force onboarding flow for any /app/* if not completed
            <Route
              path="/app/*"
              element={
                <SellerOnboardingView
                  user={user}
                  userProfile={userProfile}
                  onSignOut={handleSignOut}
                  onComplete={completeOnboarding}
                />
              }
            />
          )
        ) : (
          // Brief "loading profile..." screen while userProfile fetches (for /app/* only)
          <Route
            path="/app/*"
            element={
              <div className="screen">
                <div className="bgGradient" />
                <div className="glassCard center">
                  <div className="spinner" />
                  <p style={{ marginTop: '16px' }}>Loading profile...</p>
                </div>
              </div>
            }
          />
        )
      ) : null}

      {/* ---------- FALLBACKS ---------- */}
      {/* If signed-in and hits unknown route → seller dashboard; else → marketing */}
      <Route
        path="*"
        element={
          user ? <Navigate to="/app/dashboard" replace /> : <Navigate to="/" replace />
        }
      />
    </Routes>
  );
}
