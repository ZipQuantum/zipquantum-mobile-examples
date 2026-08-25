import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

class ZipQuantumPasteControl extends StatelessWidget {
  const ZipQuantumPasteControl({super.key});

  @override
  Widget build(BuildContext context) {
    if (defaultTargetPlatform != TargetPlatform.iOS)
      return const SizedBox.shrink();
    return const SizedBox(
      height: 52,
      child: UiKitView(viewType: 'tn.zq.zipquantum/paste-control'),
    );
  }
}
