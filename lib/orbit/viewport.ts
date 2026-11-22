export interface OrbitViewportMeasurement {
  baselineHeight: number;
  visualHeight: number;
  headerHeight?: number;
  scale?: number;
}

export const ORBIT_KEYBOARD_THRESHOLD = 120;

/** Focus is not a virtual keyboard: use the actual unobstructed viewport. */
export function measureOrbitViewport({ baselineHeight, visualHeight, headerHeight = 0, scale = 1 }: OrbitViewportMeasurement) {
  const baseline = Number.isFinite(baselineHeight) ? Math.max(0, baselineHeight) : 0;
  const visible = Number.isFinite(visualHeight) && visualHeight > 0 ? visualHeight : baseline;
  const header = Number.isFinite(headerHeight) ? Math.max(0, headerHeight) : 0;
  const occlusion = Math.max(0, baseline - visible);
  const keyboardOpen = scale <= 1.05 && occlusion > ORBIT_KEYBOARD_THRESHOLD;
  return {
    availableHeight: Math.max(0, visible - header),
    keyboardOpen,
    keyboardOffset: keyboardOpen ? occlusion : 0,
  };
}
