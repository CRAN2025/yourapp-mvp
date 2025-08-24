/**
 * Detect if user is on a mobile device
 */
export function isMobileDevice(): boolean {
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

/**
 * Get device type string for analytics
 */
export function getDeviceType(): 'mobile' | 'desktop' {
  return isMobileDevice() ? 'mobile' : 'desktop';
}

/**
 * Check if device is iOS
 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Check if device is Android
 */
export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}
