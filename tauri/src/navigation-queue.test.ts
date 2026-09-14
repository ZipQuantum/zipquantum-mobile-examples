import {describe, expect, it, vi} from 'vitest';
import {NavigationQueue} from './navigation-queue';

describe('navigation queue', () => {
  it('does not overlap route rendering and acknowledgement', async () => {
    const queue = new NavigationQueue();
    const order: string[] = [];
    let releaseFirst: (() => void) | undefined;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = queue.enqueue(async () => {
      order.push('first:start');
      await firstGate;
      order.push('first:ack');
    });
    const secondTask = vi.fn(async () => {
      order.push('second:start');
    });
    const second = queue.enqueue(secondTask);

    await Promise.resolve();
    expect(secondTask).not.toHaveBeenCalled();
    releaseFirst?.();
    await Promise.all([first, second]);
    expect(order).toEqual(['first:start', 'first:ack', 'second:start']);
  });

  it('continues after a failed delivery', async () => {
    const queue = new NavigationQueue();
    const first = queue.enqueue(async () => {
      throw new Error('rejected route');
    });
    const second = queue.enqueue(async () => undefined);

    await expect(first).rejects.toThrow(/rejected route/);
    await expect(second).resolves.toBeUndefined();
  });
});
