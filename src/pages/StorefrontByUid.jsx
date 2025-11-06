// client/src/pages/StorefrontByUid.tsx
import React, { useEffect } from "react";
import { useLocation, useRoute } from "wouter";

import { app } from "../lib/firebase";
import {
  getFirestore,
  collection,
  query,
  where,
  limit,
  getDocs,
} from "firebase/firestore";

export default function StorefrontByUid() {
  const [, params] = useRoute<{ uid: string }>("/store-by-uid/:uid");
  const [, navigate] = useLocation();
  const uid = params?.uid ?? "";

  useEffect(() => {
    if (!uid) return;

    (async () => {
      try {
        const db = getFirestore(app);
        // assumes each seller doc has ownerUid === legacy uid
        const q = query(
          collection(db, "sellers"),
          where("ownerUid", "==", uid),
          limit(1)
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
          const sellerId = snap.docs[0].id; // document id == sellerId
          navigate(`/store/${sellerId}`, { replace: true });
        } else {
          navigate("/demo/not-ready", { replace: true });
        }
      } catch {
        navigate("/demo/not-ready", { replace: true });
      }
    })();
  }, [uid, navigate]);

  return <div style={{ padding: 24 }}>Redirecting…</div>;
}
