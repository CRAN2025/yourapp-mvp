// src/App.jsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { auth, db } from './firebase';
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

// Admin
import AdminDashboard from './AdminDashboard';

// Public marketing/landing
import MarketLanding from './MarketLanding';

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
      {/* PUBLIC ROUTES */}
      <Route
        path="/"
        element={user ? <Navigate to="/catalog" replace /> : <MarketLanding />}
      />
      <Route
        path="/login"
        element={user ? <Navigate to="/catalog" replace /> : <AuthComponent />}
      />
      <Route path="/store/:sellerId" element={<StorefrontPublicView />} />

      {/* Utility pages */}
      <Route path="/upgrade" element={<UpgradeView />} />
      <Route
        path="/admin-lite"
        element={
          userProfile?.role === 'admin' ? (
            <AdminLite />
          ) : (
            <Navigate to="/catalog" replace />
          )
        }
      />

      {/* AUTHENTICATED ROUTES */}
      {user ? (
        userProfile ? (
          userProfile.onboardingCompleted ? (
            <>
              {/* Admin (guarded) */}
              <Route
                path="/admin"
                element={
                  userProfile?.role === 'admin' ? (
                    <AdminDashboard />
                  ) : (
                    <Navigate to="/catalog" replace />
                  )
                }
              />

              <Route
                path="/catalog"
                element={<ProductCatalogueView user={user} userProfile={userProfile} />}
              />
              <Route
                path="/storefront"
                element={<StorefrontView user={user} userProfile={userProfile} />}
              />
              <Route
                path="/orders"
                element={<OrdersView user={user} userProfile={userProfile} />}
              />
              <Route
                path="/analytics"
                element={<AnalyticsView user={user} userProfile={userProfile} />}
              />
              <Route
                path="/settings"
                element={
                  <SettingsView
                    user={user}
                    userProfile={userProfile}
                    onSignOut={handleSignOut}
                  />
                }
              />

              {/* Unknown authed route → catalog */}
              <Route path="*" element={<Navigate to="/catalog" replace />} />
            </>
          ) : (
            // Force onboarding flow if not completed
            <Route
              path="*"
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
          // Brief "loading profile..." screen while userProfile fetches
          <Route
            path="*"
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
      ) : (
        // Unknown public route → landing
        <Route path="*" element={<Navigate to="/" replace />} />
      )}
    </Routes>
  );
}
