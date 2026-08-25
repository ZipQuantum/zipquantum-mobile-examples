param([ValidateSet('all','ios','android')][string]$Platform = 'all')
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$errors = 0

function Ok([string]$message) { Write-Output "ZQ_OK $message" }
function Warn([string]$message) { Write-Output "ZQ_WARN $message" }
function Fail([string]$message) { $script:errors++; Write-Output "ZQ_ERROR $message" }

try { Get-Content "$root/contracts/mobile-v1.schema.json" -Raw | ConvertFrom-Json | Out-Null; Ok 'contract_json_valid' } catch { Fail "contract_json_invalid: $($_.Exception.Message)" }
try { Get-Content "$root/ai-manifest.json" -Raw | ConvertFrom-Json | Out-Null; Ok 'ai_manifest_valid' } catch { Fail "ai_manifest_invalid: $($_.Exception.Message)" }

$sources = @(
  Get-ChildItem "$root/ios-swiftui" -Recurse -File
  Get-ChildItem "$root/android-kotlin" -Recurse -File
)
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

if ($errors -gt 0) { exit 1 }
Ok 'static_validation_complete'
