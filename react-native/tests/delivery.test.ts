import assert from 'node:assert/strict';
import test from 'node:test';
import {parseDelivery} from '../src/delivery';

test('accepts a minimal contract-compliant delivery', () => {
  const value = {success: true, delivery: 'deep_link', link: {url: 'https://links.example.com/p/42'}};
  assert.equal(parseDelivery(value), value);
});

test('rejects unsuccessful or malformed deliveries', () => {
  assert.throws(
    () => parseDelivery({success: false, delivery: 'deep_link', link: {url: 'https://links.example.com'}}),
    /Unsuccessful/,
  );
  assert.throws(
    () => parseDelivery({success: true, delivery: 'deferred_deep_link', link: {}}),
    /link payload/,
  );
});

test('rejects an incomplete route acknowledgement', () => {
  assert.throws(
    () => parseDelivery({
      success: true,
      delivery: 'deep_link',
      link: {url: 'https://links.example.com'},
      route_ack: {receipt: '', endpoint: '/ack', expires_in: 0},
    }),
    /route acknowledgement/,
  );
});
