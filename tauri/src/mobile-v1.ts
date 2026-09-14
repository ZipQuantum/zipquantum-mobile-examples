import {ZQ_CONFIG, type MobilePlatform} from './config';
import {validateDirectMobileLink} from './routing';
import type {DeferredHandoff, Delivery, RouteAcknowledgement} from './types';

export type FetchLike = typeof fetch;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseDelivery(value: unknown): Delivery {
  if (!isRecord(value) || value.success !== true) {
    throw new Error('Unsuccessful ZipQuantum delivery');
  }
  if (value.delivery !== 'deep_link' && value.delivery !== 'deferred_deep_link') {
    throw new Error('Invalid ZipQuantum delivery type');
  }
  if (!isRecord(value.link) || typeof value.link.url !== 'string') {
    throw new Error('Invalid ZipQuantum link payload');
  }
  if (value.route_ack !== undefined) {
    const acknowledgement = value.route_ack;
    if (!isRecord(acknowledgement) || typeof acknowledgement.receipt !== 'string' ||
        acknowledgement.receipt.length === 0 || typeof acknowledgement.endpoint !== 'string' ||
        typeof acknowledgement.expires_in !== 'number' || acknowledgement.expires_in < 1) {
      throw new Error('Invalid ZipQuantum route acknowledgement');
    }
  }
  return value as Delivery;
}

function appBinding(platform: MobilePlatform): Record<string, string> {
  return platform === 'iOS'
    ? {bundle_id: ZQ_CONFIG.appIdentifiers.iOS}
    : {package_name: ZQ_CONFIG.appIdentifiers.Android};
}

function operationalContext(platform: MobilePlatform): Record<string, unknown> {
  return {
    platform,
    os_name: platform,
    language: Intl.DateTimeFormat().resolvedOptions().locale,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    tracking_consent: false,
    consent_version: ZQ_CONFIG.consentVersion,
  };
}

async function postJSON(
  fetcher: FetchLike,
  url: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const response = await fetcher(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Accept: 'application/json'},
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`ZipQuantum HTTP ${response.status}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

export async function resolveDirectLink(
  value: string,
  platform: MobilePlatform,
  fetcher: FetchLike = fetch,
): Promise<Delivery> {
  const direct = validateDirectMobileLink(value);
  const response = await postJSON(fetcher, `${ZQ_CONFIG.apiBaseURL}/api/mobile/v1/links/resolve`, {
    ...operationalContext(platform),
    ...appBinding(platform),
    ...direct,
  });
  return parseDelivery(response);
}

export async function recoverDeferredLink(
  handoff: DeferredHandoff,
  platform: MobilePlatform,
  fetcher: FetchLike = fetch,
): Promise<Delivery> {
  if (!ZQ_CONFIG.allowedLinkHosts.includes(handoff.host)) {
    throw new Error('Unconfigured deferred-link host');
  }
  if (!/^[A-Za-z0-9._~-]{1,512}$/.test(handoff.token)) {
    throw new Error('Malformed deferred-link token');
  }
  const endpoint = platform === 'iOS'
    ? '/api/mobile/v1/deferred/ios/recover'
    : '/api/mobile/v1/deferred/recover';
  const response = await postJSON(fetcher, `${ZQ_CONFIG.apiBaseURL}${endpoint}`, {
    ...operationalContext(platform),
    ...appBinding(platform),
    token: handoff.token,
    host: handoff.host,
  });
  return parseDelivery(response);
}

export function trustedAcknowledgementURL(endpoint: string): string {
  const base = new URL(ZQ_CONFIG.apiBaseURL);
  const resolved = new URL(endpoint, base);
  if (resolved.protocol !== 'https:' || resolved.host !== base.host) {
    throw new Error('Untrusted route acknowledgement endpoint');
  }
  return resolved.toString();
}

export async function acknowledgeRouteOpened(
  acknowledgement: RouteAcknowledgement,
  host: string,
  platform: MobilePlatform,
  fetcher: FetchLike = fetch,
): Promise<void> {
  await postJSON(fetcher, trustedAcknowledgementURL(acknowledgement.endpoint), {
    receipt: acknowledgement.receipt,
    host,
    platform,
    ...appBinding(platform),
  });
}
