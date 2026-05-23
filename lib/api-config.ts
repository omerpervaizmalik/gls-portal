import { isNative } from './platform';

/**
 * Returns the correct API base URL based on the platform.
 * If running on a native device (Capacitor), it points to the production server.
 * If running on web, it uses relative paths (standard Next.js behavior).
 */
export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  if (isNative()) {
    // Branded Production URL for GLS Portal
    const productionUrl = 'https://portal.getlegalsolution.com';
    return `${productionUrl}${cleanPath}`;
  }
  
  return cleanPath;
};
