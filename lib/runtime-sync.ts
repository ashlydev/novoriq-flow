const SNAPSHOT_API_BASE = "/api/runtime-snapshots";
const SAVE_DEBOUNCE_MS = 600;

const pendingSaveTimers = new Map<string, ReturnType<typeof globalThis.setTimeout>>();
const lastSyncedPayloads = new Map<string, string>();

export async function loadRemoteSnapshot<T>(key: string): Promise<T | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const response = await fetch(`${SNAPSHOT_API_BASE}/${encodeURIComponent(key)}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { payload?: T };
    return payload.payload ?? null;
  } catch {
    return null;
  }
}

async function persistRemoteSnapshot(key: string, payload: unknown) {
  try {
    const response = await fetch(`${SNAPSHOT_API_BASE}/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ payload })
    });

    return response.ok;
  } catch {
    return false;
  }
}

export function queueRemoteSnapshotSave(key: string, payload: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  const serializedPayload = JSON.stringify(payload);
  const pendingTimer = pendingSaveTimers.get(key);
  if (pendingTimer) {
    globalThis.clearTimeout(pendingTimer);
  }

  const nextTimer = globalThis.setTimeout(() => {
    pendingSaveTimers.delete(key);
    void persistRemoteSnapshot(key, payload).then((success) => {
      if (success) {
        lastSyncedPayloads.set(key, serializedPayload);
      }
    });
  }, SAVE_DEBOUNCE_MS);

  pendingSaveTimers.set(key, nextTimer);
}

export function hasRemoteSnapshotChanged(key: string, payload: unknown) {
  if (typeof window === "undefined") {
    return false;
  }

  return lastSyncedPayloads.get(key) !== JSON.stringify(payload);
}
