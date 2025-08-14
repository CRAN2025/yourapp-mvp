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


export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      
      if (u) {
        try {
          // Check if user has completed onboarding using Realtime Database
          const userRef = ref(db, `users/${u.uid}`);
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            setUserProfile(snapshot.val());
          } else {
            // Create initial user document
            const initialProfile = {
              email: u.email,
              createdAt: Date.now(),
              onboardingCompleted: false
            };
            await set(userRef, initialProfile);
            setUserProfile(initialProfile);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setError('Failed to load user profile');
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });
    
    return unsub;
  }, []);

  // Complete onboarding function
  const completeOnboarding = async (onboardingData) => {
    if (!user) return false;
    
    try {
      const userRef = ref(db, `users/${user.uid}`);
      const updatedProfile = {
        ...userProfile,
        ...onboardingData,
        onboardingCompleted: true,
        onboardingCompletedAt: Date.now()
      };
      
      await update(userRef, updatedProfile);
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

  // Loading state
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

  // Error state
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
      {/* PUBLIC ROUTES - No authentication required */}
      <Route 
        path="/store/:sellerId" 
        element={<StorefrontPublicView />} 
      />

      {/* AUTHENTICATED ROUTES */}
      {user ? (
        userProfile ? (
          userProfile.onboardingCompleted ? (
            // Main dashboard routes for completed users
            <>
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
                element={<SettingsView user={user} userProfile={userProfile} onSignOut={handleSignOut} />} 
              />

              {/* Default redirect to catalog */}
              <Route 
                path="*" 
                element={<Navigate to="/catalog" replace />} 
              />
            </>
          ) : (
            // User hasn't completed onboarding
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
          // User authenticated but no profile loaded yet
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
        // Not authenticated - Show auth component for all routes except public storefront
        <Route 
          path="*"
          element={<AuthComponent />}
        />
      )}
    </Routes>
  );
}