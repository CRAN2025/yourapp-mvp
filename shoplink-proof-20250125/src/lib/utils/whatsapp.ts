import { isMobileDevice } from './device';

/**
 * Create WhatsApp message for product inquiry
 */
export function createWhatsAppMessage({
  storeName,
  productName,
  productId,
  url,
}: {
  storeName: string;
  productName: string;
  productId?: string;
  url?: string;
}): string {
  let message = `Hi! I'm interested in the "${productName}" from ${storeName}.`;
  
  if (url) {
    message += `\n\nI found it here: ${url}`;
  }
  
  if (productId) {
    message += `\n\nProduct ID: ${productId}`;
  }
  
  message += '\n\nCould you please provide more details?';
  
  return encodeURIComponent(message);
}

/**
 * Generate WhatsApp URL based on device type
 */
export function generateWhatsAppUrl(
  e164Number: string,
  message: string,
  forceMobile?: boolean
): string {
  const isMobile = forceMobile ?? isMobileDevice();
  const encodedMessage = encodeURIComponent(message);
  
  if (isMobile) {
    // Mobile: Opens WhatsApp app directly
    return `https://wa.me/${e164Number.replace('+', '')}?text=${encodedMessage}`;
  } else {
    // Desktop: Opens WhatsApp Web in new tab
    return `https://web.whatsapp.com/send?phone=${e164Number.replace('+', '')}&text=${encodedMessage}`;
  }
}

/**
 * Open WhatsApp with proper device detection
 */
export function openWhatsApp(
  e164Number: string,
  message: string,
  forceMobile?: boolean
): void {
  const url = generateWhatsAppUrl(e164Number, message, forceMobile);
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (!win) window.location.href = url;
}
