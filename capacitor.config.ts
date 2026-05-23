import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.getlegalsolution.portal',
  appName: 'Get Legal Solution',
  webDir: 'out',
  server: {
    url: 'https://portal.getlegalsolution.com',
    cleartext: true
  }
};

export default config;
