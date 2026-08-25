import type {Delivery} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseDelivery(value: unknown): Delivery {
  if (!isRecord(value) || value.success !== true) throw new Error('Unsuccessful ZipQuantum delivery');
  if (value.delivery !== 'deep_link' && value.delivery !== 'deferred_deep_link') {
    throw new Error('Invalid ZipQuantum delivery type');
  }
  if (!isRecord(value.link) || typeof value.link.url !== 'string') {
    throw new Error('Invalid ZipQuantum link payload');
  }
  if (value.route_ack !== undefined) {
    const ack = value.route_ack;
    if (!isRecord(ack) || typeof ack.receipt !== 'string' || !ack.receipt ||
        typeof ack.endpoint !== 'string' || typeof ack.expires_in !== 'number' || ack.expires_in < 1) {
      throw new Error('Invalid ZipQuantum route acknowledgement');
    }
  }
  return value as Delivery;
}
