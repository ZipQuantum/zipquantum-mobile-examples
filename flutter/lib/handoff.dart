import 'models.dart';

ZqDeferredHandoff parseIosHandoff(String value, String expectedBundleId) {
  final uri = Uri.tryParse(value.trim());
  final token = uri?.queryParameters['token']?.trim();
  final host = uri?.queryParameters['host']?.trim();
  if (uri?.scheme != 'zqddl' ||
      token == null ||
      token.isEmpty ||
      host == null ||
      host.isEmpty ||
      uri?.queryParameters['bundle_id'] != expectedBundleId) {
    throw const FormatException('Invalid or app-mismatched ZipQuantum handoff');
  }
  return ZqDeferredHandoff(token: token, host: host);
}

ZqDeferredHandoff parseInstallReferrer(String value) {
  final values = Uri.splitQueryString(value);
  final token = values['zq_token']?.trim();
  final host = values['zq_host']?.trim();
  if (token == null || token.isEmpty || host == null || host.isEmpty) {
    throw const FormatException(
        'Install Referrer does not contain a ZipQuantum handoff');
  }
  return ZqDeferredHandoff(token: token, host: host);
}

Uri trustedAcknowledgementUri(String endpoint, String apiBaseUrl) {
  final base = Uri.parse(apiBaseUrl);
  final resolved = base.resolve(endpoint);
  if (resolved.scheme != 'https' || resolved.host != base.host) {
    throw const FormatException('Untrusted route acknowledgement endpoint');
  }
  return resolved;
}
