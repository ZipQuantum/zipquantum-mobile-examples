import { invoke } from '@tauri-apps/api/core'

export type DeferredHandoff = { token: string; host: string }

export async function getPendingRoute(): Promise<DeferredHandoff | null> {
  const response = await invoke<{handoff?: DeferredHandoff | null}>(
    'plugin:zq-deferred|get_pending_route'
  )
  return response.handoff ?? null
}
