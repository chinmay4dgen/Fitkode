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
 * (ONLY on dev/preview environments, NEVER on live production).
 */
export function isDevOrTestingMode(): boolean {
  if (typeof window === 'undefined') return false;
  
  // NEVER allow test accounts on the live production site under any circumstances
  if (isLiveProductionSite()) {
    return false;
  }
  
  // Allow explicitly forcing test mode via URL query parameter or localStorage flag in dev
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

  // Otherwise, active only on dev and preview environments
  return true;
}

/**
 * Strictly determines whether test/sample profiles or test sign-in should be available anywhere.
 * On live site (fitkode.com), returns false always.
 */
export function shouldShowTestProfiles(): boolean {
  return !isLiveProductionSite() && isDevOrTestingMode();
}

/**
 * Determines whether the "Test Login" button should be visible in the header.
 * On live site (fitkode.com), returns false always.
 */
export function shouldShowTestLoginInHeader(): boolean {
  return shouldShowTestProfiles();
}

