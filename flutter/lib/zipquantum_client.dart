import 'dart:convert';
import 'dart:io';

import 'configuration.dart';
import 'handoff.dart';
import 'models.dart';

class ZipQuantumClient {
  Map<String, Object?> get _context => {
        'platform': Platform.isIOS ? 'iOS' : 'Android',
        'os_name': Platform.operatingSystem,
        'os_version': Platform.operatingSystemVersion,
        'language': Platform.localeName,
        'tracking_consent': false,
        'consent_version': ZqConfiguration.consentVersion,
      };

  Future<ZqDelivery> resolve(Uri uri) async {
    if (uri.scheme != 'https' ||
        !ZqConfiguration.allowedHosts.contains(uri.host) ||
        uri.pathSegments.isEmpty) {
      throw const FormatException('Unconfigured Universal Link or App Link');
    }
    final body = await _post(
        Uri.parse('${ZqConfiguration.apiBaseUrl}/api/mobile/v1/links/resolve'),
        {
          ..._context,
          ..._appBinding,
          'host': uri.host,
          'reference': uri.pathSegments.last,
          'url': uri.toString(),
          'parameters': uri.queryParameters,
        });
    return ZqDelivery.fromJson(body);
  }

  Future<ZqDelivery> recover(ZqDeferredHandoff handoff) async {
    if (!ZqConfiguration.allowedHosts.contains(handoff.host)) {
      throw const FormatException('Unconfigured deferred-link host');
    }
    final path = Platform.isIOS
        ? '/api/mobile/v1/deferred/ios/recover'
        : '/api/mobile/v1/deferred/recover';
    final body = await _post(Uri.parse('${ZqConfiguration.apiBaseUrl}$path'), {
      ..._context,
      ..._appBinding,
      'token': handoff.token,
      'host': handoff.host,
    });
    return ZqDelivery.fromJson(body);
  }

  Future<void> acknowledgeRouteOpened(
      ZqRouteAcknowledgement ack, String host) async {
    await _post(
        trustedAcknowledgementUri(ack.endpoint, ZqConfiguration.apiBaseUrl), {
      'receipt': ack.receipt,
      'host': host,
      'platform': Platform.isIOS ? 'iOS' : 'Android',
      ..._appBinding,
    });
  }

  Map<String, String> get _appBinding => Platform.isIOS
      ? {'bundle_id': ZqConfiguration.iosBundleId}
      : {'package_name': ZqConfiguration.androidPackage};

  Future<Object?> _post(Uri uri, Map<String, Object?> body) async {
    final client = HttpClient()
      ..connectionTimeout = const Duration(seconds: 12);
    try {
      final request = await client.postUrl(uri);
      request.headers.contentType = ContentType.json;
      request.headers.set(HttpHeaders.acceptHeader, 'application/json');
      request.write(jsonEncode(body));
      final response =
          await request.close().timeout(const Duration(seconds: 15));
      final text = await utf8.decoder.bind(response).join();
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw HttpException('ZipQuantum HTTP ${response.statusCode}');
      }
      return text.isEmpty ? <String, Object?>{} : jsonDecode(text);
    } finally {
      client.close(force: true);
    }
  }
}
