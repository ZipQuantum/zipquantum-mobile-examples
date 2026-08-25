import {NativeModules, Platform} from 'react-native';

type InstallReferrerModule = {getRawInstallReferrer(): Promise<string>};

export async function getRawInstallReferrer(): Promise<string> {
  if (Platform.OS !== 'android') throw new Error('Install Referrer is Android-only');
  const module = NativeModules.ZipQuantumInstallReferrer as InstallReferrerModule | undefined;
  if (!module) throw new Error('ZipQuantumInstallReferrer native module is not registered');
  return module.getRawInstallReferrer();
}
