import {ZQ_CONFIG} from './config';
import type {AppRoute, Delivery} from './types';

const ROUTES = new Map<string, AppRoute['kind']>([
  ['campaign', 'campaign'],
  ['invite', 'invite'],
  ['product', 'product'],
]);

function parseIdentifier(value: string | undefined): string {
  if (!value || !/^[A-Za-z0-9_-]{1,80}$/.test(value)) {
    throw new Error('Unknown or malformed application route');
  }
  return value;
}

function routeFromSegments(segments: string[]): AppRoute {
  const kind = ROUTES.get(segments[0] ?? '');
  if (!kind || segments.length !== 2) {
    throw new Error('Unknown or malformed application route');
  }
  return {kind, identifier: parseIdentifier(segments[1])};
}

export function parseDesktopRoute(value: string): AppRoute {
  if (/(?:^|\/)\.{1,2}(?:\/|$)/.test(value)) {
    throw new Error('Unknown or malformed application route');
  }
  const url = new URL(value);
  if (url.protocol !== ZQ_CONFIG.desktopScheme || url.username || url.password) {
    throw new Error('Unconfigured desktop deep link');
  }
  const segments = [url.hostname, ...url.pathname.split('/')].filter(Boolean);
  return routeFromSegments(segments);
}

export function parseDeliveryRoute(delivery: Delivery): AppRoute {
  const destination = new URL(delivery.link.destination_url ?? delivery.link.url);
  if (destination.protocol !== 'https:' || destination.host !== ZQ_CONFIG.allowedDestinationHost) {
    throw new Error('Unconfigured application destination');
  }
  return routeFromSegments(destination.pathname.split('/').filter(Boolean));
}

export function validateDirectMobileLink(value: string): {
  host: string;
  reference: string;
  url: string;
  parameters: Record<string, string>;
} {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !ZQ_CONFIG.allowedLinkHosts.includes(url.host)) {
    throw new Error('Unconfigured Universal Link or App Link');
  }
  const reference = url.pathname.split('/').filter(Boolean).at(-1);
  if (!reference || !/^[A-Za-z0-9_-]{1,128}$/.test(reference)) {
    throw new Error('Missing or malformed link reference');
  }
  return {
    host: url.host,
    reference,
    url: url.toString(),
    parameters: Object.fromEntries(url.searchParams),
  };
}
