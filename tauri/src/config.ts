export const ZQ_CONFIG = Object.freeze({
  apiBaseURL: 'https://a.zq.tn',
  allowedLinkHosts: Object.freeze(['links.example.com']),
  allowedDestinationHost: 'app.example.com',
  appIdentifiers: Object.freeze({
    // These must match `src-tauri/tauri.conf.json > identifier`: the server
    // binds mobile-v1 recovery and acknowledgements to the installed app.
    iOS: 'com.example.zipquantum.tauri',
    Android: 'com.example.zipquantum.tauri',
  }),
  consentVersion: 'example-1',
  desktopScheme: 'zq-example:',
});

export type MobilePlatform = keyof typeof ZQ_CONFIG.appIdentifiers;
export type RuntimePlatform = MobilePlatform | 'Desktop';
