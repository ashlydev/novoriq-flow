import { FlowV4State } from "@/lib/v4-types";

const STORAGE_KEY = "novoriq-flow-v4-state";

export function loadFlowV4State(): FlowV4State | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as FlowV4State;
  } catch {
    return null;
  }
}

export function saveFlowV4State(state: FlowV4State) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
