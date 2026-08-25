import 'package:flutter_test/flutter_test.dart';
import 'package:zipquantum_flutter_example/models.dart';

void main() {
  test('accepts a contract-compliant delivery', () {
    final value = ZqDelivery.fromJson({
      'success': true,
      'delivery': 'deep_link',
      'link': {'url': 'https://links.example.com/product/42'},
      'route_ack': {
        'receipt': 'opaque',
        'endpoint': '/api/mobile/v1/funnel/route-opened',
        'expires_in': 900
      },
    });
    expect(value.delivery, 'deep_link');
    expect(value.routeAck?.expiresIn, 900);
  });

  test('rejects unsuccessful and malformed deliveries', () {
    expect(
      () => ZqDelivery.fromJson({
        'success': false,
        'delivery': 'deep_link',
        'link': {'url': 'https://example.com'}
      }),
      throwsFormatException,
    );
    expect(
      () => ZqDelivery.fromJson(
          {'success': true, 'delivery': 'deferred_deep_link', 'link': {}}),
      throwsFormatException,
    );
  });
}
