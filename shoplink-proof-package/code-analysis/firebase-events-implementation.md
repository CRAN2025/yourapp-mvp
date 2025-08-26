# Firebase Events Implementation Analysis

## Secondary App Configuration

### File: `src/lib/firebaseEvents.ts`
```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { firebaseConfig } from './firebase';

export const eventsApp =
  getApps().find(a => a.name === 'events') ?? initializeApp(firebaseConfig, 'events');

export const eventsAuth = getAuth(eventsApp);
export const eventsDb = getDatabase(eventsApp);

export async function ensureAnonymousEventsAuth() {
  if (!eventsAuth.currentUser) {
    try { 
      await signInAnonymously(eventsAuth); 
    } catch (e) { 
      console.warn('Anonymous auth failed', e); 
    }
  }
}
```

## Usage in Public Storefront

### File: `src/pages/StorefrontPublic.tsx` (Lines 64-66)
```typescript
// Owner detection and anonymous authentication for events
useEffect(() => {
  // 2A) Isolate analytics auth (secondary app)
  ensureAnonymousEventsAuth();
  
  // 2B) Detect owner on primary app (no anon sign-in here)
  const unsubscribe = onAuthStateChanged(primaryAuth, (user) => {
    setIsOwner(!!user && user.uid === sellerId);
  });
  
  return () => unsubscribe();
}, [sellerId]);
```

## Event Writing to Secondary App

### File: `src/lib/utils/analytics.ts`
```typescript
import { eventsDb } from '@/lib/firebaseEvents';

export async function trackInteraction({
  type,
  sellerId,
  productId,
  metadata = {},
}: {
  type: 'wa_click' | 'product_view' | 'store_view';
  sellerId: string;
  productId?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  const eventData = {
    type,
    sellerId,
    productId: productId || null,
    timestamp: Date.now(),
    metadata,
  };

  const eventsRef = ref(eventsDb, `events/${sellerId}`);
  await push(eventsRef, eventData);
}
```

## Verification Points

✅ **Anonymous auth only on secondary app**: `signInAnonymously(eventsAuth)`  
✅ **Events written to secondary database**: `ref(eventsDb, ...)`  
✅ **Primary app never goes anonymous**: Only `onAuthStateChanged(primaryAuth, ...)`  
✅ **Proper app isolation**: Two separate Firebase app instances