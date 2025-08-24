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
      setState(prev => ({ ...prev, loading: true, error: null }));
      console.log('Attempting sign in with email:', email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful:', result.user.uid);
    } catch (error) {
      console.error('Email sign in error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  // Email/Password Sign Up
  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      console.log('Attempting sign up with email:', email);
      console.log('Auth object:', auth);
      console.log('Firebase config check:', {
        hasAuth: !!auth,
        authCurrentUser: auth.currentUser,
        authApp: auth.app?.name
      });
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Sign up successful:', result.user.uid);
      
      // Create initial seller profile
      const sellerData = {
        id: result.user.uid,
        email: result.user.email!,
        storeName: '',
        category: '',
        whatsappNumber: '',
        isAdmin: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const sellerRef = ref(database, `sellers/${result.user.uid}`);
      await set(sellerRef, sellerData);
      
    } catch (error) {
      console.error('Email sign up error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
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
      await set(sellerRef, {
        ...state.seller,
        ...updates,
        updatedAt: serverTimestamp(),
      });
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
