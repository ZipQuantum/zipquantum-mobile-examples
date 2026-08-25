import {Platform} from 'react-native';

export const zqConfig = {
  apiBaseURL: 'https://a.zq.tn',
  allowedHosts: ['links.example.com'],
  appIdentifier: Platform.select({
    ios: 'com.example.ZipQuantumExample',
    android: 'com.example.zipquantum',
    default: 'com.example.zipquantum',
  })!,
  consentVersion: '2026-08',
} as const;
