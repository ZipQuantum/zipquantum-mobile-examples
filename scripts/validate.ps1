param([ValidateSet('all','ios','android','react-native','flutter','tauri')][string]$Platform = 'all')
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$errors = 0

function Ok([string]$message) { Write-Output "ZQ_OK $message" }
function Warn([string]$message) { Write-Output "ZQ_WARN $message" }
function Fail([string]$message) { $script:errors++; Write-Output "ZQ_ERROR $message" }

try { Get-Content "$root/contracts/mobile-v1.schema.json" -Raw | ConvertFrom-Json | Out-Null; Ok 'contract_json_valid' } catch { Fail "contract_json_invalid: $($_.Exception.Message)" }
try { Get-Content "$root/ai-manifest.json" -Raw | ConvertFrom-Json | Out-Null; Ok 'ai_manifest_valid' } catch { Fail "ai_manifest_invalid: $($_.Exception.Message)" }

$sources = Get-ChildItem @(
  "$root/ios-swiftui",
  "$root/android-kotlin",
  "$root/react-native"
  "$root/flutter"
  "$root/tauri"
) -Recurse -File | Where-Object {
  $_.FullName -notmatch '[\\/](node_modules|build|dist|target|\.gradle|\.dart_tool|Pods)[\\/]'
}
$forbidden = 'AdvertisingIdClient|identifierForVendor|ASIdentifierManager|fingerprintjs|UIPasteboard\.general\.string'
$matches = $sources | Select-String -Pattern $forbidden
if ($matches) { $matches | ForEach-Object { Fail "forbidden_pattern $($_.Path):$($_.LineNumber)" } } else { Ok 'privacy_invariants_static' }

if ($Platform -in @('all','ios')) {
  $swift = Get-Content "$root/ios-swiftui/Sources/Configuration.swift" -Raw
  $entitlements = Get-Content "$root/ios-swiftui/Sources/ZipQuantumExample.entitlements" -Raw
  if ($swift -match 'links\.example\.com' -and $entitlements -match 'links\.example\.com') { Warn 'ios_uses_example_host' } else { Ok 'ios_host_configured' }
  if ((Get-Content "$root/ios-swiftui/Sources/HandoffPasteControl.swift" -Raw) -match 'UIPasteControl') { Ok 'ios_explicit_paste_control' } else { Fail 'ios_missing_uipastecontrol' }
}

if ($Platform -in @('all','android')) {
  $manifest = Get-Content "$root/android-kotlin/app/src/main/AndroidManifest.xml" -Raw
  $config = Get-Content "$root/android-kotlin/app/src/main/java/com/example/zipquantum/ZQConfiguration.kt" -Raw
  if ($manifest -match 'android:autoVerify="true"') { Ok 'android_autoverify_enabled' } else { Fail 'android_autoverify_missing' }
  if ($config -match 'links\.example\.com' -and $manifest -match 'links\.example\.com') { Warn 'android_uses_example_host' } else { Ok 'android_host_configured' }
}

if ($Platform -in @('all','react-native')) {
  $paste = Get-Content "$root/react-native/ios/ZipQuantumPasteControlViewManager.swift" -Raw
  $manifest = Get-Content "$root/react-native/android/AndroidManifest.xml.snippet" -Raw
  $referrer = Get-Content "$root/react-native/android/ZipQuantumInstallReferrerModule.kt" -Raw
  $config = Get-Content "$root/react-native/src/config.ts" -Raw
  if ($paste -match 'UIPasteControl') { Ok 'react_native_explicit_paste_control' } else { Fail 'react_native_missing_uipastecontrol' }
  if ($manifest -match 'android:autoVerify="true"') { Ok 'react_native_android_autoverify_enabled' } else { Fail 'react_native_android_autoverify_missing' }
  if ($referrer -match 'InstallReferrerClient') { Ok 'react_native_install_referrer_enabled' } else { Fail 'react_native_install_referrer_missing' }
  if ($config -match 'links\.example\.com') { Warn 'react_native_uses_example_host' } else { Ok 'react_native_host_configured' }
}

if ($Platform -in @('all','flutter')) {
  $paste = Get-Content "$root/flutter/ios/ZipQuantumPasteControl.swift" -Raw
  $manifest = Get-Content "$root/flutter/android/AndroidManifest.xml.snippet" -Raw
  $referrer = Get-Content "$root/flutter/android/MainActivity.kt.snippet" -Raw
  $config = Get-Content "$root/flutter/lib/configuration.dart" -Raw
  if ($paste -match 'UIPasteControl') { Ok 'flutter_explicit_paste_control' } else { Fail 'flutter_missing_uipastecontrol' }
  if ($manifest -match 'android:autoVerify="true"') { Ok 'flutter_android_autoverify_enabled' } else { Fail 'flutter_android_autoverify_missing' }
  if ($referrer -match 'InstallReferrerClient') { Ok 'flutter_install_referrer_enabled' } else { Fail 'flutter_install_referrer_missing' }
  if ($config -match 'links\.example\.com') { Warn 'flutter_uses_example_host' } else { Ok 'flutter_host_configured' }
}

if ($Platform -in @('all','tauri')) {
  $rust = Get-Content "$root/tauri/src-tauri/src/lib.rs" -Raw
  $frontend = Get-Content "$root/tauri/src/main.ts" -Raw
  $controller = Get-Content "$root/tauri/src/controller.ts" -Raw
  $ios = Get-Content "$root/tauri/plugins/deferred-link/ios/Sources/ZqDeferredPlugin.swift" -Raw
  $android = Get-Content "$root/tauri/plugins/deferred-link/android/src/main/java/com/zipquantum/tauri/deferredlink/ZqDeferredPlugin.kt" -Raw
  $config = Get-Content "$root/tauri/src/config.ts" -Raw
  $tauriConfig = Get-Content "$root/tauri/src-tauri/tauri.conf.json" -Raw | ConvertFrom-Json
  $singleIndex = $rust.IndexOf('tauri_plugin_single_instance::init')
  $deepIndex = $rust.IndexOf('tauri_plugin_deep_link::init')

  if ($singleIndex -ge 0 -and $deepIndex -gt $singleIndex) { Ok 'tauri_single_instance_registered_first' } else { Fail 'tauri_single_instance_order_invalid' }
  if ($frontend -match 'getCurrent' -and $frontend -match 'onOpenUrl' -and $frontend -match 'handleDirectUrls') { Ok 'tauri_cold_warm_shared_handler' } else { Fail 'tauri_cold_warm_handler_missing' }
  if ($ios -match 'UIPasteControl' -and $ios -notmatch 'UIPasteboard\.general') { Ok 'tauri_ios_explicit_paste_control' } else { Fail 'tauri_ios_paste_boundary_invalid' }
  if ($android -match 'InstallReferrerClient' -and $android -match 'AtomicBoolean' -and $android -notmatch 'SharedPreferences|android\.util\.Log') { Ok 'tauri_android_one_shot_referrer' } else { Fail 'tauri_android_referrer_boundary_invalid' }
  if ($controller -match "platform === 'Desktop'" -and $controller -match 'acknowledgeAfterRender') { Ok 'tauri_desktop_ack_out_of_scope' } else { Fail 'tauri_desktop_ack_boundary_missing' }
  if ($config -match [regex]::Escape("iOS: '$($tauriConfig.identifier)'") -and $config -match [regex]::Escape("Android: '$($tauriConfig.identifier)'")) { Ok 'tauri_mobile_identity_matches_bundle' } else { Fail 'tauri_mobile_identity_mismatch' }
  if ($config -match 'links\.example\.com' -and $config -match 'com\.example\.zipquantum') { Warn 'tauri_uses_example_identifiers' } else { Ok 'tauri_identifiers_configured' }
}

if ($errors -gt 0) { exit 1 }
Ok 'static_validation_complete'
