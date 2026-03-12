import { FlowV7State } from "@/lib/v7-types";
import {
  hasRemoteSnapshotChanged,
  loadRemoteSnapshot,
  queueRemoteSnapshotSave
} from "@/lib/runtime-sync";

const STORAGE_KEY = "novoriq-flow-v7-state";
const REMOTE_STATE_SNAPSHOT_KEY = "flow-v7-state";

export function loadFlowV7State(): FlowV7State | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as FlowV7State;
  } catch {
    return null;
  }
}

export function saveFlowV7State(state: FlowV7State) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function loadRemoteFlowV7State() {
  return loadRemoteSnapshot<FlowV7State>(REMOTE_STATE_SNAPSHOT_KEY);
}

export function queueFlowV7StateSave(state: FlowV7State) {
  if (!hasRemoteSnapshotChanged(REMOTE_STATE_SNAPSHOT_KEY, state)) {
    return;
  }

  queueRemoteSnapshotSave(REMOTE_STATE_SNAPSHOT_KEY, state);
}
