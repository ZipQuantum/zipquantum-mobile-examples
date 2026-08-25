import assert from 'node:assert/strict';
import test from 'node:test';
import {parseInstallReferrer, parseIosHandoff, trustedAcknowledgementURL} from '../src/handoff';

test('parses an app-bound iOS handoff after explicit paste', () => {
  assert.deepEqual(
    parseIosHandoff('zqddl://restore?token=opaque-123&host=links.example.com&bundle_id=com.example.app', 'com.example.app'),
    {token: 'opaque-123', host: 'links.example.com', bundleID: 'com.example.app'},
  );
});

test('rejects a handoff bound to another app', () => {
  assert.throws(
    () => parseIosHandoff('zqddl://restore?token=opaque&host=links.example.com&bundle_id=com.other.app', 'com.example.app'),
    /app-mismatched/,
  );
});

test('parses ZipQuantum parameters from Play Install Referrer', () => {
  assert.deepEqual(
    parseInstallReferrer('utm_source=test&zq_token=opaque%2Bvalue&zq_host=links.example.com'),
    {token: 'opaque+value', host: 'links.example.com'},
  );
});

test('rejects an unrelated Play Install Referrer', () => {
  assert.throws(() => parseInstallReferrer('utm_source=campaign'), /does not contain/);
});

test('allows only HTTPS acknowledgement endpoints on the API host', () => {
  assert.equal(
    trustedAcknowledgementURL('/api/mobile/v1/funnel/route-opened', 'https://a.zq.tn'),
    'https://a.zq.tn/api/mobile/v1/funnel/route-opened',
  );
  assert.throws(
    () => trustedAcknowledgementURL('https://attacker.example/ack', 'https://a.zq.tn'),
    /Untrusted/,
  );
  assert.throws(
    () => trustedAcknowledgementURL('http://a.zq.tn/ack', 'https://a.zq.tn'),
    /Untrusted/,
  );
});
