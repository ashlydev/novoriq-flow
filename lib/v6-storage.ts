import { FlowV6State } from "@/lib/v6-types";
import {
  hasRemoteSnapshotChanged,
  loadRemoteSnapshot,
  queueRemoteSnapshotSave
} from "@/lib/runtime-sync";

const STORAGE_KEY = "novoriq-flow-v6-state";
const REMOTE_STATE_SNAPSHOT_KEY = "flow-v6-state";

export function loadFlowV6State(): FlowV6State | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as FlowV6State;
  } catch {
    return null;
  }
}

export function saveFlowV6State(state: FlowV6State) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function loadRemoteFlowV6State() {
  return loadRemoteSnapshot<FlowV6State>(REMOTE_STATE_SNAPSHOT_KEY);
}

export function queueFlowV6StateSave(state: FlowV6State) {
  if (!hasRemoteSnapshotChanged(REMOTE_STATE_SNAPSHOT_KEY, state)) {
    return;
  }

  queueRemoteSnapshotSave(REMOTE_STATE_SNAPSHOT_KEY, state);
}
