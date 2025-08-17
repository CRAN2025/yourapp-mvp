import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { db } from '../firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export default function AdminRoute({ children }) {
  const [state, setState] = useState({loading:true, authed:false, isAdmin:false});

  useEffect(() => {
    const auth = getAuth();
    const off = onAuthStateChanged(auth, async (u) => {
      if (!u) return setState({loading:false, authed:false, isAdmin:false});
      // store role under /users/{uid}/role = 'admin' | 'seller'
      const snap = await get(ref(db, `users/${u.uid}/role`));
      const role = snap.exists() ? snap.val() : 'seller';
      setState({loading:false, authed:true, isAdmin: role === 'admin'});
    });
    return () => off();
  }, []);

  if (state.loading) return null;
  if (!state.authed) return <Navigate to="/auth?next=/admin" replace />;
  if (!state.isAdmin) return <Navigate to="/" replace />;
  return children;
}