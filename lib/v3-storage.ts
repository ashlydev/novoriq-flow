import { FlowV3State } from "@/lib/v3-types";

const FLOW_V3_STORAGE_KEY = "novoriq-flow-v3-state";

export function loadFlowV3State(): FlowV3State | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(FLOW_V3_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as FlowV3State;
  } catch {
    return null;
  }
}

export function saveFlowV3State(state: FlowV3State) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(FLOW_V3_STORAGE_KEY, JSON.stringify(state));
}
