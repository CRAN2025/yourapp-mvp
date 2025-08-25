import { ref, push, serverTimestamp } from 'firebase/database';
import { database } from '../firebase';
import { getDeviceType } from './device';
import type { InsertEvent } from '@shared/schema';

/**
 * Track user interaction with debouncing for views
 */
let viewTimeouts: Record<string, NodeJS.Timeout> = {};

async function recordEvent({
  sellerId,
  type,
  productId,
  metadata,
}: {
  sellerId: string;
  type: 'wa_click' | 'product_view' | 'store_view';
  productId?: string;
  metadata: Record<string, any>;
}) {
  const eventData: any = {
    sellerId,
    type,
    deviceType: getDeviceType(),
    metadata,
    timestamp: serverTimestamp(),
  };
  
  // Only include productId if it has a value (Firebase doesn't accept undefined)
  if (productId) {
    eventData.productId = productId;
  }
  
  const eventsRef = ref(database, `events/${sellerId}`);
  await push(eventsRef, eventData);
}

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
  try {
    // Debounce view events (500ms)
    if (type.includes('view')) {
      const key = `${type}_${sellerId}_${productId || 'store'}`;
      
      if (viewTimeouts[key]) {
        clearTimeout(viewTimeouts[key]);
      }
      
      viewTimeouts[key] = setTimeout(async () => {
        delete viewTimeouts[key];
        await recordEvent({ sellerId, type, productId, metadata });
      }, 500);
      
      return;
    }
    
    // Record click events immediately
    await recordEvent({ sellerId, type, productId, metadata });
  } catch (error) {
    console.error('Failed to track interaction:', error);
    // Fail silently to not disrupt user experience
  }
}
