import { ref, push, serverTimestamp } from 'firebase/database';
import { database } from '../firebase';
import { getDeviceType } from './device';
import type { InsertEvent } from '@shared/schema';

/**
 * Track user interaction with debouncing for views
 */
let viewTimeouts: Record<string, NodeJS.Timeout> = {};

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
        await recordEvent();
      }, 500);
      
      return;
    }
    
    // Record click events immediately
    await recordEvent();
    
    function recordEvent() {
      return (async () => {
        const eventData: Omit<InsertEvent, 'id'> = {
          sellerId,
          type,
          productId,
          deviceType: getDeviceType(),
          metadata,
        };
        
        const eventsRef = ref(database, `events/${sellerId}`);
        await push(eventsRef, {
          ...eventData,
          timestamp: serverTimestamp(),
        });
      })();
    }
  } catch (error) {
    console.error('Failed to track interaction:', error);
    // Fail silently to not disrupt user experience
  }
}
