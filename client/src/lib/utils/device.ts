/** Detect if user is on a mobile device */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false; // SSR safety
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** Get device type string for analytics */
export function getDeviceType(): 'mobile' | 'desktop' {
  return isMobileDevice() ? 'mobile' : 'desktop';
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}