// WhatsApp Integration Proof - Core Implementation

// 1. Device Detection Function (client/src/lib/utils/device.ts)
export function isMobileDevice() {
  // Check for touch capability
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Check screen size
  const isSmallScreen = window.innerWidth <= 768;
  
  // Check user agent for mobile indicators
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isMobileUA = mobileRegex.test(navigator.userAgent);
  
  // Consider mobile if any of these conditions are true
  return hasTouch && (isSmallScreen || isMobileUA);
}

// 2. WhatsApp URL Generation (client/src/lib/utils/whatsapp.ts)
export function generateWhatsAppUrl(e164Number, message, forceMobile) {
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

// 3. WhatsApp Opening Function with Security Headers
export function openWhatsApp(e164Number, message, forceMobile) {
  const url = generateWhatsAppUrl(e164Number, message, forceMobile);
  const isMobile = forceMobile ?? isMobileDevice();
  
  if (isMobile) {
    // Mobile: Open in same window (will launch app)
    window.location.href = url;
  } else {
    // Desktop: Open in new tab with security headers
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

// 4. Message Template Creation
export function createWhatsAppMessage({ storeName, productName, productId, url }) {
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

/* DEVICE FLOW EXAMPLES:

Desktop Chrome: 
- User clicks product WhatsApp button
- Opens new tab: https://web.whatsapp.com/send?phone=1234567890&text=Hi%21%20I%27m%20interested...
- User continues browsing store

iPhone Safari:
- User clicks product WhatsApp button  
- Opens WhatsApp app: https://wa.me/1234567890?text=Hi%21%20I%27m%20interested...
- Returns to store after sending message

Android Chrome:
- User clicks product WhatsApp button
- Opens WhatsApp app: https://wa.me/1234567890?text=Hi%21%20I%27m%20interested...
- Returns to store after sending message

*/