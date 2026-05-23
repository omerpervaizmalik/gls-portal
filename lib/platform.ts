import { Capacitor } from '@capacitor/core';

/**
 * Utility to detect if the application is running on a native platform (Android/iOS)
 * using Capacitor.
 */
export const isNative = (): boolean => {
  // Ensure we are in a browser environment
  if (typeof window === 'undefined') return false;
  return Capacitor.isNativePlatform();
};

/**
 * Utility to check if the current platform is specifically Android.
 */
export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Capacitor.getPlatform() === 'android';
};

/**
 * Injects a class into the body to allow for global mobile-app styling.
 */
export const initMobileAppStyling = () => {
  if (isNative()) {
    document.body.classList.add('mobile-app');
  }
};
