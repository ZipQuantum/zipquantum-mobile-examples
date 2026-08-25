import {Dimensions, Platform} from 'react-native';
import {zqConfig} from './config';
import {parseDelivery} from './delivery';
import {trustedAcknowledgementURL} from './handoff';
import type {DeferredHandoff, Delivery, RouteAcknowledgement} from './types';

const platform = Platform.OS === 'ios' ? 'iOS' : 'Android';

function baseContext(): Record<string, unknown> {
  const screen = Dimensions.get('screen');
  return {
    platform,
    os_name: platform,
    os_version: String(Platform.Version),
    language: Intl.DateTimeFormat().resolvedOptions().locale,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen_resolution: `${Math.round(screen.width * screen.scale)}x${Math.round(screen.height * screen.scale)}`,
    tracking_consent: false,
    consent_version: zqConfig.consentVersion,
  };
}

async function postJSON<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Accept: 'application/json'},
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`ZipQuantum HTTP ${response.status}`);
    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function appBinding(): Record<string, string> {
  return Platform.OS === 'ios'
    ? {bundle_id: zqConfig.appIdentifier}
    : {package_name: zqConfig.appIdentifier};
}

export async function resolveDirectLink(value: string): Promise<Delivery> {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !zqConfig.allowedHosts.some(host => host === url.host)) {
    throw new Error('Unconfigured Universal Link or App Link');
  }
  const reference = url.pathname.split('/').filter(Boolean).at(-1);
  if (!reference) throw new Error('Missing link reference');
  const response = await postJSON<unknown>(`${zqConfig.apiBaseURL}/api/mobile/v1/links/resolve`, {
    ...baseContext(), ...appBinding(), host: url.host, reference,
    url: url.toString(), parameters: Object.fromEntries(url.searchParams),
  });
  return parseDelivery(response);
}

export async function recoverDeferredLink(handoff: DeferredHandoff): Promise<Delivery> {
  if (!zqConfig.allowedHosts.some(host => host === handoff.host)) {
    throw new Error('Unconfigured deferred-link host');
  }
  const endpoint = Platform.OS === 'ios'
    ? '/api/mobile/v1/deferred/ios/recover'
    : '/api/mobile/v1/deferred/recover';
  const response = await postJSON<unknown>(`${zqConfig.apiBaseURL}${endpoint}`, {
    ...baseContext(), ...appBinding(), token: handoff.token, host: handoff.host,
  });
  return parseDelivery(response);
}

export async function acknowledgeRouteOpened(ack: RouteAcknowledgement, host: string): Promise<void> {
  const url = trustedAcknowledgementURL(ack.endpoint, zqConfig.apiBaseURL);
  await postJSON(url, {receipt: ack.receipt, host, platform, ...appBinding()});
}
