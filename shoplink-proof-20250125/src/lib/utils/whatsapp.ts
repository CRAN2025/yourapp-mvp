import { isMobileDevice } from './device';

/** Create WhatsApp message for product inquiry (RAW text) */
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
  if (url) message += `\n\nI found it here: ${url}`;
  if (productId) message += `\n\nProduct ID: ${productId}`;
  message += '\n\nCould you please provide more details?';
  return message; // raw text (do NOT encode here)
}

/** Generate a WhatsApp URL (mobile = wa.me, desktop = web.whatsapp.com) */
export function generateWhatsAppUrl(
  e164Number: string,
  message: string,
  forceMobile?: boolean
): string {
  const isMobile = forceMobile ?? isMobileDevice();
  const phone = String(e164Number || '').replace(/[^\d]/g, ''); // digits only
  const text = encodeURIComponent(message || '');
  return isMobile
    ? `https://wa.me/${phone}?text=${text}`
    : `https://web.whatsapp.com/send?phone=${phone}&text=${text}`;
}

/** Open WhatsApp with popup-safe fallback */
export function openWhatsApp(
  e164Number: string,
  message: string,
  forceMobile?: boolean
): void {
  const url = generateWhatsAppUrl(e164Number, message, forceMobile);
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (!win) window.location.href = url;
}