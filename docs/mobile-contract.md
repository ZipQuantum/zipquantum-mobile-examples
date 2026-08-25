# Mobile delivery contract

The base URL is `https://a.zq.tn`.

## Direct links

When the OS opens a verified HTTPS link, post its host, final path segment, full URL, platform, and registered app identifier to `POST /api/mobile/v1/links/resolve`.

## iOS deferred recovery

The handoff is an opaque `zqddl:` URL copied for the app. Read it only after the user activates `UIPasteControl`. Validate scheme, token, host, and expected Bundle ID, then post to `POST /api/mobile/v1/deferred/ios/recover`.

## Android deferred recovery

Read Google Play Install Referrer and parse `zq_token` plus `zq_host`, then post them with the registered package name to `POST /api/mobile/v1/deferred/recover`.

## Route acknowledgement

A successful response may contain `route_ack.receipt`, `route_ack.expires_in`, and `route_ack.endpoint`. After the destination route is actually displayed, POST the opaque receipt, host, platform, and registered app identifier to the supplied endpoint. Do not decode, persist, replay, or log the receipt.

## Optional context

Examples send only coarse operational context: platform, OS name/version, locale, timezone, screen resolution, and processor count. Set `tracking_consent` from an explicit product choice. Delivery does not require stored optional device context.
