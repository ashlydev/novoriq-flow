import { AppState } from "@/lib/types";
import {
  hasRemoteSnapshotChanged,
  loadRemoteSnapshot,
  queueRemoteSnapshotSave
} from "@/lib/runtime-sync";

export const STATE_STORAGE_KEY = "novoriq-flow-state-v2";
export const LEGACY_STATE_STORAGE_KEY = "novoriq-businessos-state-v1";
export const SESSION_STORAGE_KEY = "novoriq-flow-session-v2";
export const LEGACY_SESSION_STORAGE_KEY = "novoriq-businessos-session-v1";
const REMOTE_STATE_SNAPSHOT_KEY = "app-state";

export interface SessionState {
  currentUserId: string | null;
}

export function loadStoredState(): unknown | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue =
    window.localStorage.getItem(STATE_STORAGE_KEY) ||
    window.localStorage.getItem(LEGACY_STATE_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as unknown;
  } catch {
    return null;
  }
}

export function saveStoredState(state: AppState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
}

export async function loadRemoteStoredState() {
  return loadRemoteSnapshot<AppState>(REMOTE_STATE_SNAPSHOT_KEY);
}

export function queueStoredStateSave(state: AppState) {
  if (!hasRemoteSnapshotChanged(REMOTE_STATE_SNAPSHOT_KEY, state)) {
    return;
  }

  queueRemoteSnapshotSave(REMOTE_STATE_SNAPSHOT_KEY, state);
}

export function loadStoredSession(): SessionState {
  if (typeof window === "undefined") {
    return { currentUserId: null };
  }

  const rawValue =
    window.localStorage.getItem(SESSION_STORAGE_KEY) ||
    window.localStorage.getItem(LEGACY_SESSION_STORAGE_KEY);
  if (!rawValue) {
    return { currentUserId: null };
  }

  try {
    return JSON.parse(rawValue) as SessionState;
  } catch {
    return { currentUserId: null };
  }
}

export function saveStoredSession(session: SessionState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}
