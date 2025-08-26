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
import { ref, get, set, serverTimestamp } from 'firebase/database';
import { auth, database } from '@/lib/firebase';
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
        
        if (user) {
          // Fetch seller profile
          const sellerRef = ref(database, `sellers/${user.uid}`);
          const sellerSnapshot = await get(sellerRef);
          const seller = sellerSnapshot.exists() ? sellerSnapshot.val() : null;
          
          setState({
            user,
            seller,
            loading: false,
            error: null,
          });
        } else {
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
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
      console.log('Attempting sign in with email:', email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful:', result.user.uid);
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
      // Set persistence to keep user signed in across tabs
      await setPersistence(auth, browserLocalPersistence);
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Input validation
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
      console.log('Attempting sign up with email:', email);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Sign up successful:', result.user.uid);
      
      // Create initial seller profile with retry logic
      const sellerData = {
        id: result.user.uid,
        email: result.user.email!,
        storeName: '',
        category: '',
        whatsappNumber: '',
        country: '',
        currency: 'USD',
        businessType: 'individual',
        deliveryOptions: [],
        paymentMethods: [],
        onboardingCompleted: false,
        isAdmin: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const sellerRef = ref(database, `sellers/${result.user.uid}`);
      
      // Retry database write up to 3 times
      let retries = 3;
      while (retries > 0) {
        try {
          await set(sellerRef, sellerData);
          break;
        } catch (dbError) {
          retries--;
          if (retries === 0) throw dbError;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
      
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
      
      // Check if seller profile exists, create if not
      const sellerRef = ref(database, `sellers/${result.user.uid}`);
      const sellerSnapshot = await get(sellerRef);
      
      if (!sellerSnapshot.exists()) {
        const sellerData = {
          id: result.user.uid,
          email: result.user.email || '',
          phone: result.user.phoneNumber!,
          storeName: '',
          category: '',
          whatsappNumber: result.user.phoneNumber!,
          isAdmin: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        
        await set(sellerRef, sellerData);
      }
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Invalid verification code',
      }));
      throw error;
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Sign out failed',
      }));
      throw error;
    }
  };

  // Reset Password
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  };

  // Update seller profile
  const updateSellerProfile = async (updates: Partial<Seller>) => {
    if (!state.user) throw new Error('No authenticated user');

    try {
      const sellerRef = ref(database, `sellers/${state.user.uid}`);
      const updatedProfile = {
        ...state.seller,
        ...updates,
        updatedAt: Date.now(),
      };
      
      await set(sellerRef, updatedProfile);
      
      // Mirror to public store
      const { mirrorSellerProfile } = await import('@/lib/utils/dataMirror');
      await mirrorSellerProfile(state.user.uid, updatedProfile);
    } catch (error) {
      throw error;
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
  };
}
