import 'package:flutter_test/flutter_test.dart';
import 'package:zipquantum_flutter_example/handoff.dart';

void main() {
  test('parses an app-bound iOS handoff', () {
    final value = parseIosHandoff(
      'zqddl://restore?token=opaque-123&host=links.example.com&bundle_id=com.example.app',
      'com.example.app',
    );
    expect(value.token, 'opaque-123');
    expect(value.host, 'links.example.com');
  });

  test('rejects an iOS handoff bound to another app', () {
    expect(
      () => parseIosHandoff(
        'zqddl://restore?token=opaque&host=links.example.com&bundle_id=com.other.app',
        'com.example.app',
      ),
      throwsFormatException,
    );
  });

  test('parses and URL-decodes Play Install Referrer', () {
    final value = parseInstallReferrer(
        'utm_source=test&zq_token=opaque%2Bvalue&zq_host=links.example.com');
    expect(value.token, 'opaque+value');
    expect(value.host, 'links.example.com');
  });

  test('allows acknowledgement only on the HTTPS API host', () {
    expect(
      trustedAcknowledgementUri(
              '/api/mobile/v1/funnel/route-opened', 'https://a.zq.tn')
          .toString(),
      'https://a.zq.tn/api/mobile/v1/funnel/route-opened',
    );
    expect(
      () => trustedAcknowledgementUri(
          'https://attacker.example/ack', 'https://a.zq.tn'),
      throwsFormatException,
    );
    expect(
      () => trustedAcknowledgementUri('http://a.zq.tn/ack', 'https://a.zq.tn'),
      throwsFormatException,
    );
  });
}
