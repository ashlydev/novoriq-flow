import { FlowV5State } from "@/lib/v5-types";

const STORAGE_KEY = "novoriq-flow-v5-state";

export function loadFlowV5State(): FlowV5State | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as FlowV5State;
  } catch {
    return null;
  }
}

export function saveFlowV5State(state: FlowV5State) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
