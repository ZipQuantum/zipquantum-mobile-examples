class ZqRouteAcknowledgement {
  const ZqRouteAcknowledgement(
      {required this.receipt, required this.endpoint, required this.expiresIn});
  final String receipt;
  final String endpoint;
  final int expiresIn;
}

class ZqResolvedLink {
  const ZqResolvedLink({required this.url, this.host, this.destinationUrl});
  final Uri url;
  final String? host;
  final Uri? destinationUrl;
}

class ZqDelivery {
  const ZqDelivery({required this.delivery, required this.link, this.routeAck});
  final String delivery;
  final ZqResolvedLink link;
  final ZqRouteAcknowledgement? routeAck;

  factory ZqDelivery.fromJson(Object? value) {
    if (value is! Map || value['success'] != true) {
      throw const FormatException('Unsuccessful ZipQuantum delivery');
    }
    final delivery = value['delivery'];
    if (delivery != 'deep_link' && delivery != 'deferred_deep_link') {
      throw const FormatException('Invalid delivery type');
    }
    final link = value['link'];
    if (link is! Map || link['url'] is! String) {
      throw const FormatException('Invalid link payload');
    }
    final url = Uri.tryParse(link['url'] as String);
    if (url == null || !url.hasScheme) {
      throw const FormatException('Invalid link URL');
    }

    ZqRouteAcknowledgement? acknowledgement;
    final ack = value['route_ack'];
    if (ack != null) {
      if (ack is! Map ||
          ack['receipt'] is! String ||
          (ack['receipt'] as String).isEmpty ||
          ack['endpoint'] is! String ||
          ack['expires_in'] is! int ||
          (ack['expires_in'] as int) < 1) {
        throw const FormatException('Invalid route acknowledgement');
      }
      acknowledgement = ZqRouteAcknowledgement(
        receipt: ack['receipt'] as String,
        endpoint: ack['endpoint'] as String,
        expiresIn: ack['expires_in'] as int,
      );
    }

    return ZqDelivery(
      delivery: delivery as String,
      link: ZqResolvedLink(
        url: url,
        host: link['host'] as String?,
        destinationUrl: link['destination_url'] is String
            ? Uri.tryParse(link['destination_url'] as String)
            : null,
      ),
      routeAck: acknowledgement,
    );
  }
}

class ZqDeferredHandoff {
  const ZqDeferredHandoff({required this.token, required this.host});
  final String token;
  final String host;
}
