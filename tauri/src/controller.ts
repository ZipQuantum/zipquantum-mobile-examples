import type {MobilePlatform, RuntimePlatform} from './config';
import {acknowledgeRouteOpened, recoverDeferredLink, resolveDirectLink, type FetchLike} from './mobile-v1';
import {parseDeliveryRoute, parseDesktopRoute} from './routing';
import type {DeferredHandoff, Delivery, PendingNavigation} from './types';

function mobilePlatform(platform: RuntimePlatform): MobilePlatform {
  if (platform === 'Desktop') throw new Error('Desktop cannot use the mobile-v1 contract');
  return platform;
}

export class DeliveryController {
  constructor(
    private readonly platform: RuntimePlatform,
    private readonly fetcher: FetchLike = fetch,
  ) {}

  async direct(value: string): Promise<PendingNavigation> {
    if (this.platform === 'Desktop') {
      return {
        route: parseDesktopRoute(value),
        acknowledgeAfterRender: async () => undefined,
      };
    }
    const delivery = await resolveDirectLink(value, this.platform, this.fetcher);
    return this.mobileNavigation(delivery);
  }

  async deferred(handoff: DeferredHandoff): Promise<PendingNavigation> {
    const delivery = await recoverDeferredLink(
      handoff,
      mobilePlatform(this.platform),
      this.fetcher,
    );
    return this.mobileNavigation(delivery);
  }

  private mobileNavigation(delivery: Delivery): PendingNavigation {
    const route = parseDeliveryRoute(delivery);
    const acknowledgement = delivery.route_ack;
    const host = delivery.link.host ?? new URL(delivery.link.url).host;
    let acknowledgementAttempted = false;

    return {
      route,
      acknowledgeAfterRender: async () => {
        if (!acknowledgement || acknowledgementAttempted) return;
        acknowledgementAttempted = true;
        await acknowledgeRouteOpened(
          acknowledgement,
          host,
          mobilePlatform(this.platform),
          this.fetcher,
        );
      },
    };
  }
}
