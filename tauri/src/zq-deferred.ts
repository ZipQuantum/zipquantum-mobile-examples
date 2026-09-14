import {invoke} from '@tauri-apps/api/core';
import type {DeferredHandoff} from './types';

export async function getPendingRoute(): Promise<DeferredHandoff | null> {
  const response = await invoke<{handoff?: DeferredHandoff | null}>(
    'plugin:zq-deferred|get_pending_route',
  );
  return response.handoff ?? null;
}
