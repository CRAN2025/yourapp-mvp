import { useState, useEffect } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { Seller } from '@shared/schema';

export interface AuthState {
  user: User | null;
  seller: Seller | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    seller: null,
    loading: true,
    error: null,
  });

  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        console.log('🔐 Auth: onAuthStateChanged fired:', {
          user: !!user,
          uid: user?.uid,
          email: user?.email,
          isAnonymous: user?.isAnonymous
        });
        
        // CRITICAL: Block anonymous users immediately
        if (user && user.isAnonymous) {
          console.error('🚨 SECURITY: Anonymous user detected, blocking access');
          setState({
            user: null,
            seller: null,
            loading: false,
            error: 'Anonymous access not allowed',
          });
          return;
        }
        
        if (user) {
          // Load seller data from Firestore
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase');
          
          try {
            const sellerRef = doc(db, 'sellers', user.uid);
            const sellerSnap = await getDoc(sellerRef);
            
            let sellerData = sellerSnap.exists() ? sellerSnap.data() as Seller : null;
            
            // If no seller data exists, create it and bootstrap the user
            if (!sellerData) {
              console.log('🔐 Auth: No seller data found, creating seller profile and bootstrapping...');
              const { ensureBootstrap } = await import('@/lib/ensureBootstrap');
              const { setDoc, serverTimestamp } = await import('firebase/firestore');
              
              try {
                // First create the seller profile
                const sellerProfile = {
                  id: user.uid,
                  email: user.email || '',
                  phone: user.phoneNumber || '',
                  storeName: '',
                  category: '',
                  whatsappNumber: user.phoneNumber || '',
                  isAdmin: false,
                  onboardingCompleted: false,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                };
                
                await setDoc(sellerRef, sellerProfile);
                console.log('✅ Auth: Created seller profile in Firestore');
                
                // Then bootstrap the onboarding documents
                await ensureBootstrap(user.uid);
                console.log('✅ Auth: Bootstrap completed successfully');
                
                // Set the seller data to what we just created
                sellerData = sellerProfile as any;
                console.log('✅ Auth: Seller data after creation:', sellerData);
              } catch (bootstrapError) {
                console.error('❌ Auth: Bootstrap/creation failed:', bootstrapError);
              }
            }
            
            console.log('✅ Auth: Loaded seller data from Firestore:', sellerData);
            console.log('✅ Auth: User UID:', user.uid);
            console.log('✅ Auth: Seller storeName:', sellerData?.storeName);
            console.log('✅ Auth: Seller onboardingCompleted:', sellerData?.onboardingCompleted);
            
            setState({
              user,
              seller: sellerData,
              loading: false,
              error: null,
            });
            
            // Store seller data in sessionStorage for persistence across page reloads
            if (sellerData) {
              console.log('🔐 Auth: Storing seller data in sessionStorage for persistence');
              try {
                sessionStorage.setItem('seller_profile', JSON.stringify(sellerData));
              } catch (e) {
                console.warn('Could not store seller profile in sessionStorage:', e);
              }
            }
          } catch (error) {
            console.error('Error loading seller data:', error);
            
            // Try to load from sessionStorage as fallback
            try {
              const storedSeller = sessionStorage.getItem('seller_profile');
              if (storedSeller) {
                console.log('🔐 Auth: Loading seller from sessionStorage fallback');
                const sellerData = JSON.parse(storedSeller);
                setState({
                  user,
                  seller: sellerData,
                  loading: false,
                  error: null,
                });
                return;
              }
            } catch (storageError) {
              console.warn('Could not load from sessionStorage:', storageError);
            }
            
            setState({
              user,
              seller: null,
              loading: false,
              error: null,
            });
          }
        } else {
          console.log('🔐 Auth: No user found, setting null state');
          // Clear sessionStorage when user is not authenticated
          try {
            sessionStorage.removeItem('seller_profile');
          } catch (e) {
            console.warn('Could not clear sessionStorage:', e);
          }
          setState({
            user: null,
            seller: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Authentication error',
        }));
      }
    });

    return unsubscribe;
  }, []);

  // Listen for forced auth refresh events (from onboarding completion)
  useEffect(() => {
    const handleForceRefresh = async () => {
      if (state.user && !state.loading) {
        console.log('🔄 Auth: Received force refresh event');
        
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase');
          
          const sellerRef = doc(db, 'sellers', state.user.uid);
          const sellerSnap = await getDoc(sellerRef);
          const sellerData = sellerSnap.exists() ? sellerSnap.data() as Seller : null;
          
          console.log('✅ Auth: Force refresh completed:', sellerData);
          
          setState(prev => ({
            ...prev,
            seller: sellerData,
          }));
          
          if (sellerData) {
            try {
              sessionStorage.setItem('seller_profile', JSON.stringify(sellerData));
            } catch (e) {
              console.warn('Could not store refreshed seller profile:', e);
            }
          }
        } catch (error) {
          console.error('❌ Auth: Force refresh failed:', error);
        }
      }
    };

    window.addEventListener('force-auth-refresh', handleForceRefresh);
    return () => window.removeEventListener('force-auth-refresh', handleForceRefresh);
  }, [state.user, state.loading]);

  // Email/Password Sign In
  const signInWithEmail = async (email: string, password: string) => {
    try {
      // Set persistence to keep user signed in across tabs
      await setPersistence(auth, browserLocalPersistence);
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Input validation
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      
      if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      setState(prev => ({ ...prev, loading: false }));
      return result;
    } catch (error: any) {
      console.error('Email sign in error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Sign in failed';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  };

  // Email/Password Sign Up
  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Input validation
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      
      if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      setState(prev => ({ ...prev, loading: false }));
      return result;
    } catch (error: any) {
      console.error('Email sign up error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Sign up failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Use at least 6 characters';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  };

  // Phone Sign In - Step 1: Send verification code
  const sendPhoneVerification = async (phoneNumber: string, recaptchaContainer: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      console.log('Attempting phone verification for:', phoneNumber);
      
      // Initialize reCAPTCHA
      const verifier = new RecaptchaVerifier(auth, recaptchaContainer, {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
      });
      
      setRecaptchaVerifier(verifier);
      
      const confirmResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(confirmResult);
      
      setState(prev => ({ ...prev, loading: false }));
      return confirmResult;
    } catch (error) {
      console.error('Phone verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send verification code';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  // Phone Sign In - Step 2: Verify code
  const verifyPhoneCode = async (code: string) => {
    if (!confirmationResult) {
      throw new Error('No confirmation result available');
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const result = await confirmationResult.confirm(code);
      
      setState(prev => ({ ...prev, loading: false }));
      return result;
    } catch (error) {
      console.error('Phone code verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Invalid verification code';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await firebaseSignOut(auth);
      
      // Clean up reCAPTCHA if it exists
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        setRecaptchaVerifier(null);
      }
      setConfirmationResult(null);
      
      setState({
        user: null,
        seller: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  // Reset Password
  const resetPassword = async (email: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await sendPasswordResetEmail(auth, email);
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      console.error('Password reset error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  // Update seller profile
  const updateSellerProfile = async (updates: Partial<Seller>) => {
    if (!state.user) throw new Error('No authenticated user');
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      console.log('🔄 updateSellerProfile: Starting update for seller:', state.user.uid);
      console.log('🔄 updateSellerProfile: Updates:', updates);
      
      // Import Firebase Firestore functions
      const { doc, updateDoc, serverTimestamp, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      // Update the seller document in Firestore
      const sellerRef = doc(db, 'sellers', state.user.uid);
      await updateDoc(sellerRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      
      console.log('✅ updateSellerProfile: Firestore update completed');
      
      // Get the updated seller data to mirror to RTDB
      const updatedSellerSnap = await getDoc(sellerRef);
      const updatedSellerData = updatedSellerSnap.data();
      
      if (updatedSellerData) {
        // Mirror the updated seller profile to Firebase Realtime Database
        const { mirrorSellerProfile } = await import('@/lib/utils/dataMirror');
        await mirrorSellerProfile(state.user.uid, updatedSellerData);
        console.log('✅ updateSellerProfile: RTDB mirroring completed');
      }
      
      // Update local state with the new values
      setState(prev => ({
        ...prev,
        seller: prev.seller ? { ...prev.seller, ...updates } : null,
        loading: false,
      }));
      
      console.log('✅ updateSellerProfile: Local state updated');
    } catch (error) {
      console.error('❌ Update seller profile error:', error);
      console.error('❌ Attempted updates:', updates);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to update profile',
      }));
      throw error;
    }
  };

  // Force refresh seller data (for post-onboarding updates)
  const refreshSellerData = async () => {
    if (!state.user) return;
    
    try {
      console.log('🔄 Auth: Force refreshing seller data');
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const sellerRef = doc(db, 'sellers', state.user.uid);
      const sellerSnap = await getDoc(sellerRef);
      const sellerData = sellerSnap.exists() ? sellerSnap.data() as Seller : null;
      
      console.log('✅ Auth: Refreshed seller data:', sellerData);
      
      setState(prev => ({
        ...prev,
        seller: sellerData,
      }));
      
      if (sellerData) {
        try {
          sessionStorage.setItem('seller_profile', JSON.stringify(sellerData));
        } catch (e) {
          console.warn('Could not store refreshed seller profile:', e);
        }
      }
    } catch (error) {
      console.error('❌ Auth: Failed to refresh seller data:', error);
    }
  };

  return {
    ...state,
    signInWithEmail,
    signUpWithEmail,
    sendPhoneVerification,
    verifyPhoneCode,
    signOut,
    resetPassword,
    updateSellerProfile,
    refreshSellerData,
  };
}