import 'dart:async';
import 'dart:io';

import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'configuration.dart';
import 'handoff.dart';
import 'ios_paste_control.dart';
import 'models.dart';
import 'zipquantum_client.dart';

const ink = Color(0xFF06140F);
const surface = Color(0xFF0C2018);
const lime = Color(0xFF83FF2B);
const text = Color(0xFFF5FFF8);
const muted = Color(0xFF9BB1A4);

void main() => runApp(const ZipQuantumExample());

class ZipQuantumExample extends StatelessWidget {
  const ZipQuantumExample({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: ThemeData.dark(useMaterial3: true)
            .copyWith(scaffoldBackgroundColor: ink),
        home: const LinkPage(),
      );
}

class LinkPage extends StatefulWidget {
  const LinkPage({super.key});
  @override
  State<LinkPage> createState() => _LinkPageState();
}

class _LinkPageState extends State<LinkPage> {
  static const handoffChannel = MethodChannel('tn.zq.zipquantum/handoff');
  final client = ZipQuantumClient();
  final appLinks = AppLinks();
  StreamSubscription<Uri>? subscription;
  ZqDelivery? delivery;
  String status = 'Ready for a verified link';
  Object? error;

  @override
  void initState() {
    super.initState();
    handoffChannel.setMethodCallHandler((call) async {
      if (call.method == 'onIosPastedHandoff' && call.arguments is String) {
        await _recover(parseIosHandoff(
            call.arguments as String, ZqConfiguration.iosBundleId));
      }
    });
    unawaited(_listen());
    if (Platform.isAndroid) unawaited(_recoverFromPlay());
  }

  Future<void> _listen() async {
    final initial = await appLinks.getInitialLink();
    if (initial != null) await _resolve(initial);
    subscription = appLinks.uriLinkStream.listen(_resolve, onError: _fail);
  }

  Future<void> _recoverFromPlay() async {
    try {
      final value =
          await handoffChannel.invokeMethod<String>('getInstallReferrer');
      if (value != null && value.isNotEmpty)
        await _recover(parseInstallReferrer(value));
    } on MissingPluginException {
      // Available only in the Android build distributed through Google Play.
    } on Object catch (value) {
      _fail(value);
    }
  }

  Future<void> _resolve(Uri uri) async {
    try {
      await _accept(await client.resolve(uri));
    } on Object catch (value) {
      _fail(value);
    }
  }

  Future<void> _recover(ZqDeferredHandoff handoff) async {
    try {
      await _accept(await client.recover(handoff));
    } on Object catch (value) {
      _fail(value);
    }
  }

  Future<void> _accept(ZqDelivery next) async {
    if (!mounted) return;
    setState(() {
      delivery = next;
      error = null;
      status = next.delivery == 'deep_link'
          ? 'Direct link resolved'
          : 'Destination restored';
    });
    // Acknowledge only after Flutter has painted the destination route card.
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final ack = next.routeAck;
      if (ack == null) return;
      final host = next.link.host ?? next.link.url.host;
      try {
        await client.acknowledgeRouteOpened(ack, host);
      } on Object catch (value) {
        _fail(value);
      }
    });
  }

  void _fail(Object value) {
    if (mounted) setState(() => error = value);
  }

  @override
  void dispose() {
    subscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const SizedBox(height: 24),
              const Text('ZIPQUANTUM REFERENCE',
                  style: TextStyle(
                      color: lime,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.8)),
              const SizedBox(height: 10),
              const Text('Open the right route.',
                  style: TextStyle(
                      color: text, fontSize: 34, fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              const Text('No SDK. No fingerprinting. Native handoff only.',
                  style: TextStyle(color: muted, fontSize: 16)),
              const SizedBox(height: 28),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                    color: surface,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: const Color(0xFF234231))),
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('DELIVERY STATUS',
                          style: TextStyle(
                              color: lime,
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.4)),
                      const SizedBox(height: 8),
                      Text(error?.toString() ?? status,
                          style: const TextStyle(
                              color: text,
                              fontSize: 20,
                              fontWeight: FontWeight.w700)),
                      if (delivery != null) ...[
                        const SizedBox(height: 14),
                        Text(
                            (delivery!.link.destinationUrl ??
                                    delivery!.link.url)
                                .toString(),
                            style: const TextStyle(color: muted)),
                      ],
                    ]),
              ),
              const Spacer(),
              if (Platform.isIOS) ...[
                const Text('Installed from the App Store?',
                    style: TextStyle(
                        color: text,
                        fontSize: 18,
                        fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                const Text(
                    'Use Apple’s visible paste control to restore your destination.',
                    style: TextStyle(color: muted)),
                const SizedBox(height: 12),
                const ZipQuantumPasteControl(),
              ] else
                FilledButton(
                    onPressed: _recoverFromPlay,
                    style: FilledButton.styleFrom(
                        backgroundColor: lime,
                        foregroundColor: ink,
                        minimumSize: const Size.fromHeight(52)),
                    child: const Text('Retry deferred recovery')),
            ]),
          ),
        ),
      );
}
