export const ZQ_CONFIG = Object.freeze({
  apiBaseURL: 'https://a.zq.tn',
  allowedLinkHosts: Object.freeze(['links.example.com']),
  allowedDestinationHost: 'app.example.com',
  appIdentifiers: Object.freeze({
    iOS: 'com.example.zipquantum',
    Android: 'com.example.zipquantum',
  }),
  consentVersion: 'example-1',
  desktopScheme: 'zq-example:',
});

export type MobilePlatform = keyof typeof ZQ_CONFIG.appIdentifiers;
export type RuntimePlatform = MobilePlatform | 'Desktop';
