# Kotlin Android example

Native Android reference using verified App Links, Jetpack Compose, and Google Play Install Referrer.

## Configure

1. Replace `com.example.zipquantum` and `links.example.com` in `app/build.gradle.kts`, `AndroidManifest.xml`, and `ZQConfiguration.kt`.
2. Add the release certificate SHA-256 and package in the ZipQuantum dashboard, then verify `assetlinks.json`.
3. Build non-interactively:

```sh
gradle test lint
```

Install Referrer must be tested with a build delivered through Google Play. Direct App Links can also be tested with `adb shell am start` as documented by Android.

## Agent check

```sh
../scripts/validate.sh android
```

The example caches the raw Play referrer only to avoid repeated service calls. It never stores the recovered token or route receipt.
