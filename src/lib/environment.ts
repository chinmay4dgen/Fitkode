/**
 * Environment detection helper for Fitkode
 * Differentiates between live custom domain (fitkode.com) and dev/preview/staging environments.
 */

export function isLiveProductionSite(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname.toLowerCase();
  
  // Custom live production domain
  if (hostname === 'fitkode.com' || hostname.endsWith('.fitkode.com')) {
    return true;
  }
  
  // Exclude local dev and cloud run / ai studio preview URLs
  const isDevOrPreview = 
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.includes('ais-dev-') ||
    hostname.includes('ais-pre-') ||
    hostname.endsWith('.run.app') ||
    hostname.includes('webcontainer');
  
  return !isDevOrPreview;
}

/**
 * Returns true if test login / developer mode is explicitly enabled
 * (either on dev/preview domain OR via ?dev=true / ?test=true query flag).
 */
export function isDevOrTestingMode(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Allow explicitly forcing test mode via URL query parameter or localStorage flag
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('dev') === 'true' || params.get('test') === 'true' || params.get('admin') === 'true') {
      return true;
    }
    if (window.localStorage.getItem('fitkode_dev_mode') === 'true') {
      return true;
    }
  } catch {
    // ignore
  }

  // Otherwise, active on dev and preview environments
  return !isLiveProductionSite();
}

/**
 * Determines whether the "Test Login" button should be visible in the header.
 * On live site (fitkode.com), returns false by default.
 */
export function shouldShowTestLoginInHeader(): boolean {
  return isDevOrTestingMode() && !isLiveProductionSite();
}
