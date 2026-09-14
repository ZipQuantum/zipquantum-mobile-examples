#!/usr/bin/env sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
PLATFORM=${1:-all}
ERRORS=0
ok() { printf 'ZQ_OK %s\n' "$1"; }
warn() { printf 'ZQ_WARN %s\n' "$1"; }
fail() { printf 'ZQ_ERROR %s\n' "$1"; ERRORS=$((ERRORS + 1)); }

python3 -m json.tool "$ROOT/contracts/mobile-v1.schema.json" >/dev/null && ok contract_json_valid || fail contract_json_invalid
python3 -m json.tool "$ROOT/ai-manifest.json" >/dev/null && ok ai_manifest_valid || fail ai_manifest_invalid

if grep -R -n -E --exclude-dir=node_modules --exclude-dir=.dart_tool --exclude-dir=dist --exclude-dir=target 'AdvertisingIdClient|identifierForVendor|ASIdentifierManager|fingerprintjs|UIPasteboard\.general\.string' "$ROOT/ios-swiftui" "$ROOT/android-kotlin" "$ROOT/react-native" "$ROOT/flutter" "$ROOT/tauri"; then
  fail forbidden_privacy_pattern
else
  ok privacy_invariants_static
fi

if [ "$PLATFORM" = all ] || [ "$PLATFORM" = react-native ]; then
  grep -q UIPasteControl "$ROOT/react-native/ios/ZipQuantumPasteControlViewManager.swift" && ok react_native_explicit_paste_control || fail react_native_missing_uipastecontrol
  grep -q 'android:autoVerify="true"' "$ROOT/react-native/android/AndroidManifest.xml.snippet" && ok react_native_android_autoverify_enabled || fail react_native_android_autoverify_missing
  grep -q InstallReferrerClient "$ROOT/react-native/android/ZipQuantumInstallReferrerModule.kt" && ok react_native_install_referrer_enabled || fail react_native_install_referrer_missing
  grep -q links.example.com "$ROOT/react-native/src/config.ts" && warn react_native_uses_example_host || ok react_native_host_configured
fi

if [ "$PLATFORM" = all ] || [ "$PLATFORM" = flutter ]; then
  grep -q UIPasteControl "$ROOT/flutter/ios/ZipQuantumPasteControl.swift" && ok flutter_explicit_paste_control || fail flutter_missing_uipastecontrol
  grep -q 'android:autoVerify="true"' "$ROOT/flutter/android/AndroidManifest.xml.snippet" && ok flutter_android_autoverify_enabled || fail flutter_android_autoverify_missing
  grep -q InstallReferrerClient "$ROOT/flutter/android/MainActivity.kt.snippet" && ok flutter_install_referrer_enabled || fail flutter_install_referrer_missing
  grep -q links.example.com "$ROOT/flutter/lib/configuration.dart" && warn flutter_uses_example_host || ok flutter_host_configured
fi

if [ "$PLATFORM" = all ] || [ "$PLATFORM" = ios ]; then
  grep -q UIPasteControl "$ROOT/ios-swiftui/Sources/HandoffPasteControl.swift" && ok ios_explicit_paste_control || fail ios_missing_uipastecontrol
  grep -q links.example.com "$ROOT/ios-swiftui/Sources/Configuration.swift" && warn ios_uses_example_host || ok ios_host_configured
fi

if [ "$PLATFORM" = all ] || [ "$PLATFORM" = android ]; then
  grep -q 'android:autoVerify="true"' "$ROOT/android-kotlin/app/src/main/AndroidManifest.xml" && ok android_autoverify_enabled || fail android_autoverify_missing
  grep -q links.example.com "$ROOT/android-kotlin/app/src/main/java/com/example/zipquantum/ZQConfiguration.kt" && warn android_uses_example_host || ok android_host_configured
fi

if [ "$PLATFORM" = all ] || [ "$PLATFORM" = tauri ]; then
  RUST="$ROOT/tauri/src-tauri/src/lib.rs"
  FRONTEND="$ROOT/tauri/src/main.ts"
  CONTROLLER="$ROOT/tauri/src/controller.ts"
  IOS="$ROOT/tauri/plugins/deferred-link/ios/Sources/ZqDeferredPlugin.swift"
  ANDROID="$ROOT/tauri/plugins/deferred-link/android/src/main/java/com/zipquantum/tauri/deferredlink/ZqDeferredPlugin.kt"
  CONFIG="$ROOT/tauri/src/config.ts"

  SINGLE_LINE=$(grep -n 'tauri_plugin_single_instance::init' "$RUST" | head -n 1 | cut -d: -f1 || true)
  DEEP_LINE=$(grep -n 'tauri_plugin_deep_link::init' "$RUST" | head -n 1 | cut -d: -f1 || true)
  [ -n "$SINGLE_LINE" ] && [ -n "$DEEP_LINE" ] && [ "$SINGLE_LINE" -lt "$DEEP_LINE" ] && ok tauri_single_instance_registered_first || fail tauri_single_instance_order_invalid
  grep -q getCurrent "$FRONTEND" && grep -q onOpenUrl "$FRONTEND" && grep -q handleDirectUrls "$FRONTEND" && ok tauri_cold_warm_shared_handler || fail tauri_cold_warm_handler_missing
  grep -q UIPasteControl "$IOS" && ! grep -q 'UIPasteboard\.general' "$IOS" && ok tauri_ios_explicit_paste_control || fail tauri_ios_paste_boundary_invalid
  grep -q InstallReferrerClient "$ANDROID" && grep -q AtomicBoolean "$ANDROID" && ! grep -q -E 'SharedPreferences|android\.util\.Log' "$ANDROID" && ok tauri_android_one_shot_referrer || fail tauri_android_referrer_boundary_invalid
  grep -q "platform === 'Desktop'" "$CONTROLLER" && grep -q acknowledgeAfterRender "$CONTROLLER" && ok tauri_desktop_ack_out_of_scope || fail tauri_desktop_ack_boundary_missing
  grep -q links.example.com "$CONFIG" && grep -q com.example.zipquantum "$CONFIG" && warn tauri_uses_example_identifiers || ok tauri_identifiers_configured
fi

[ "$ERRORS" -eq 0 ] || exit 1
ok static_validation_complete
