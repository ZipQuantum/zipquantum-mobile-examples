import type {DeferredHandoff} from './types';

export type IosHandoff = DeferredHandoff & {bundleID: string};

export function parseIosHandoff(value: string, expectedBundleID: string): IosHandoff {
  const url = new URL(value.trim());
  if (url.protocol !== 'zqddl:') throw new Error('Invalid ZipQuantum handoff scheme');
  const token = url.searchParams.get('token')?.trim();
  const host = url.searchParams.get('host')?.trim();
  const bundleID = url.searchParams.get('bundle_id')?.trim();
  if (!token || !host || bundleID !== expectedBundleID) {
    throw new Error('Invalid or app-mismatched ZipQuantum handoff');
  }
  return {token, host, bundleID};
}

export function parseInstallReferrer(value: string): DeferredHandoff {
  const values = new URLSearchParams(value);
  const token = values.get('zq_token')?.trim();
  const host = values.get('zq_host')?.trim();
  if (!token || !host) throw new Error('Install Referrer does not contain a ZipQuantum handoff');
  return {token, host};
}

export function trustedAcknowledgementURL(endpoint: string, apiBaseURL: string): string {
  const base = new URL(apiBaseURL);
  const resolved = new URL(endpoint, base);
  if (resolved.protocol !== 'https:' || resolved.host !== base.host) {
    throw new Error('Untrusted route acknowledgement endpoint');
  }
  return resolved.toString();
}
