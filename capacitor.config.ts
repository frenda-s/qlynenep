import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'vn.thptchuvanan.nenepos',
  appName: 'NeNepOS',
  webDir: '.output/public',
  server: process.env.CAPACITOR_SERVER_URL || process.env.APP_URL
    ? {
        url: process.env.CAPACITOR_SERVER_URL || process.env.APP_URL,
        cleartext: true,
        androidScheme: 'https',
      }
    : {
        androidScheme: 'https',
      },
  android: {
    allowMixedContent: true,
  },
}

export default config
