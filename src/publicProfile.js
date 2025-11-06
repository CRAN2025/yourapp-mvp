// src/publicProfile.js
import { ref, set, update, serverTimestamp } from "firebase/database";
import { db } from "./lib/firebase.js";

/**
 * Create/refresh the public snapshot a buyer page reads.
 * Writes:
 *   - public/stores/{uid}          (canonical public record)
 *   - public/slugToUid/{slug} = uid  (slug index)
 *   - users/{uid}/publicSlug        (handy for UI buttons)
 */
export async function publishPublicProfile(uid, payload = {}) {
  const { storeName, displayName, slug: incomingSlug, ...rest } = payload;

  const name = (storeName || displayName || "").toString().trim();
  const slug =
    (incomingSlug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 60) ||
      uid);

  const publicData = {
    uid,
    slug,
    displayName: name || "My Store",
    ...rest,
    updatedAt: serverTimestamp(),
  };

  await Promise.all([
    set(ref(db, `public/stores/${uid}`), publicData),
    set(ref(db, `public/slugToUid/${slug}`), uid),
    update(ref(db, `users/${uid}`), { publicSlug: slug }),
  ]);

  return { slug };
}
