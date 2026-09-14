import {getCurrent, onOpenUrl} from '@tauri-apps/plugin-deep-link';
import {type} from '@tauri-apps/plugin-os';
import {DeliveryController} from './controller';
import './style.css';
import type {RuntimePlatform} from './config';
import {NavigationQueue} from './navigation-queue';
import type {PendingNavigation} from './types';
import {getPendingRoute} from './zq-deferred';

const appElement = document.querySelector<HTMLElement>('#app');
if (!appElement) throw new Error('Missing application root');
const root: HTMLElement = appElement;

function runtimePlatform(): RuntimePlatform {
  const current = type();
  if (current === 'ios') return 'iOS';
  if (current === 'android') return 'Android';
  return 'Desktop';
}

const platform = runtimePlatform();
const controller = new DeliveryController(platform);
const navigationQueue = new NavigationQueue();

function renderStatus(message: string, isError = false): void {
  root.innerHTML = `
    <section class="card">
      <span class="eyebrow">ZipQuantum · Tauri 2</span>
      <h1>${isError ? 'Link not opened' : 'Ready for a verified link'}</h1>
      <p class="status ${isError ? 'error' : ''}">${message}</p>
      ${platform === 'Desktop' ? '' : '<button id="recover" type="button">Recover link after install</button>'}
      <p class="privacy">No fingerprinting. No advertising identifier. Receipts stay opaque and in memory.</p>
    </section>`;
  root.querySelector<HTMLButtonElement>('#recover')?.addEventListener('click', () => {
    void recoverDeferred();
  });
}

async function renderNavigation(navigation: PendingNavigation): Promise<void> {
  root.innerHTML = `
    <section class="card destination">
      <span class="eyebrow">Route opened</span>
      <h1>${navigation.route.kind}</h1>
      <p class="route-id"></p>
      <p class="privacy">The route acknowledgement is sent only after this view renders.</p>
    </section>`;
  const routeId = root.querySelector<HTMLElement>('.route-id');
  if (routeId) routeId.textContent = navigation.route.identifier;
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await navigation.acknowledgeAfterRender();
}

async function handleDirectUrls(values: string[]): Promise<void> {
  for (const value of values) {
    try {
      await renderNavigation(await controller.direct(value));
      return;
    } catch {
      // Try the next candidate without logging the URL or server receipt.
    }
  }
  renderStatus('The link did not match an allowlisted route.', true);
}

function enqueueDirectUrls(values: string[]): Promise<void> {
  // Keep the complete render/ack sequence serial: simultaneous warm-link
  // events must not acknowledge a route replaced before its first paint.
  return navigationQueue.enqueue(() => handleDirectUrls(values));
}

async function recoverDeferredNow(): Promise<void> {
  try {
    const handoff = await getPendingRoute();
    if (!handoff) {
      renderStatus('No one-time deferred route is available.');
      return;
    }
    await renderNavigation(await controller.deferred(handoff));
  } catch {
    renderStatus('Deferred recovery failed closed.', true);
  }
}

function recoverDeferred(): Promise<void> {
  return navigationQueue.enqueue(recoverDeferredNow);
}

async function start(): Promise<void> {
  renderStatus('Waiting for a direct or deferred deep link.');
  await onOpenUrl((urls) => {
    void enqueueDirectUrls(urls);
  });
  const coldStartURLs = await getCurrent();
  if (coldStartURLs?.length) await enqueueDirectUrls(coldStartURLs);
}

void start();
