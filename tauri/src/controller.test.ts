import {describe, expect, it, vi} from 'vitest';
import {DeliveryController} from './controller';

function response(body: unknown): Response {
  return new Response(JSON.stringify(body), {status: 200});
}

function delivery(receipt = 'opaque-server-value') {
  return {
    success: true,
    delivery: 'deep_link',
    link: {
      url: 'https://links.example.com/open/abc123',
      host: 'links.example.com',
      destination_url: 'https://app.example.com/product/example-42',
    },
    route_ack: {
      receipt,
      expires_in: 120,
      endpoint: '/api/mobile/v1/events/route-opened',
    },
  };
}

describe('direct and deferred delivery', () => {
  it('uses the same mobile path for cold and warm direct delivery', async () => {
    const fetcher = vi.fn().mockImplementation(async () => response(delivery()));
    const controller = new DeliveryController('Android', fetcher);

    const cold = await controller.direct('https://links.example.com/open/cold');
    const warm = await controller.direct('https://links.example.com/open/warm');

    expect(cold.route).toEqual(warm.route);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls.map((call) => String(call[0]))).toEqual([
      'https://a.zq.tn/api/mobile/v1/links/resolve',
      'https://a.zq.tn/api/mobile/v1/links/resolve',
    ]);
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toMatchObject({
      package_name: 'com.example.zipquantum.tauri',
    });
  });

  it('acknowledges once and only after the caller renders', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(response(delivery()))
      .mockResolvedValueOnce(response({success: true}));
    const navigation = await new DeliveryController('iOS', fetcher)
      .direct('https://links.example.com/open/abc123');

    expect(fetcher).toHaveBeenCalledTimes(1);
    await navigation.acknowledgeAfterRender();
    await navigation.acknowledgeAfterRender();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(String(fetcher.mock.calls[1]?.[0])).toBe('https://a.zq.tn/api/mobile/v1/events/route-opened');
  });

  it('recovers deferred mobile delivery without exposing another path', async () => {
    const deferred = {...delivery(), delivery: 'deferred_deep_link'};
    const fetcher = vi.fn().mockResolvedValue(response(deferred));
    const navigation = await new DeliveryController('Android', fetcher).deferred({
      token: 'opaque_token_value',
      host: 'links.example.com',
    });

    expect(navigation.route).toEqual({kind: 'product', identifier: 'example-42'});
    expect(String(fetcher.mock.calls[0]?.[0])).toBe('https://a.zq.tn/api/mobile/v1/deferred/recover');
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toMatchObject({
      package_name: 'com.example.zipquantum.tauri',
    });
  });

  it('never emits a desktop route acknowledgement', async () => {
    const fetcher = vi.fn();
    const navigation = await new DeliveryController('Desktop', fetcher)
      .direct('zq-example://campaign/launch_1');
    await navigation.acknowledgeAfterRender();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('rejects mobile-v1 use from desktop deferred recovery', async () => {
    await expect(new DeliveryController('Desktop').deferred({
      token: 'opaque_token_value',
      host: 'links.example.com',
    })).rejects.toThrow(/Desktop/);
  });
});
