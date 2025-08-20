// Centralized keys & paths so names stay consistent.
export const KEYS = Object.freeze({
  onboardingFlag: 'onboardingCompleted',   // nested under users/<uid>/profile
  activeStoreId: 'activeStoreId',
  role: 'role',
});

export const PATHS = Object.freeze({
  userProfile: (uid) => `users/${uid}/profile`,
  userRoot:     (uid) => `users/${uid}`,
  storeRoot:    (id)  => `stores/${id}`,
  storeMembers: (storeId, uid) => `storeMembers/${storeId}/${uid}`,
  storeMembersByUser: (uid, storeId) => `storeMembersByUser/${uid}/${storeId}`,
  events:       (uid) => `events/${uid}`,
  activation:   (uid) => `users/${uid}/activation`,
  billingIntents: (storeId) => `billingIntents/${storeId}`,   // where Upgrade writes
});
