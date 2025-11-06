// src/saveSellerProfile.js
import { ref, set, update, serverTimestamp } from "firebase/database";
import { db } from "./lib/firebase.js";
import { publishPublicProfile } from "./publicProfile.js";

/**
 * Persist the seller's private profile and publish a sanitized public copy.
 *
 * @param {object} user                    Firebase user (must include .uid)
 * @param {object} profilePayload          fields to merge under /users/{uid}/profile
 * @param {object} opts
 * @param {string[]} opts.paymentMethods   force arrays
 * @param {string[]} opts.deliveryOptions  force arrays
 */
export async function saveSellerProfile(
  user,
  profilePayload = {},
  { paymentMethods = [], deliveryOptions = [] } = {}
) {
  if (!user?.uid) throw new Error("saveSellerProfile: missing user.uid");

  const uid = user.uid;
  const pm  = Array.isArray(paymentMethods) ? paymentMethods.filter(Boolean) : [];
  const dox = Array.isArray(deliveryOptions) ? deliveryOptions.filter(Boolean) : [];

  // 1) Normalize arrays
  const profileBase = `users/${uid}/profile`;
  await Promise.all([
    set(ref(db, `${profileBase}/paymentMethods`), pm),
    set(ref(db, `${profileBase}/deliveryOptions`), dox),
    // 2) Merge/patch private profile
    update(ref(db, profileBase), {
      ...profilePayload,
      updatedAt: serverTimestamp(),
    }),
  ]);

  // 3) Publish public copy used by the guest storefront
  await publishPublicProfile(uid, {
    ...profilePayload,
    paymentMethods: pm,
    deliveryOptions: dox,
  });

  // 4) Root meta
  await update(ref(db, `users/${uid}`), {
    uid,
    email: user.email ?? "",
    role: "seller",
    status: "active",
    onboardingCompleted: true,
    onboardingCompletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { uid };
}
