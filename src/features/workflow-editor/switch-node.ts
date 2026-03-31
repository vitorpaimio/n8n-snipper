export const SWITCH_MAX_OUTPUTS = 5;
export const SWITCH_DEFAULT_OUTPUT_COUNT = 2;

export function switchHandleId(index: number): string {
  return `switch-${index}`;
}

export function defaultSwitchLabels(count: number): string[] {
  return Array.from({ length: count }, (_, i) => String(i));
}
