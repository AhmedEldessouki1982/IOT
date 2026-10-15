export function motionMs(name: string): number {
  return Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue(`--duration-${name}`)) || 0;
}
export function motionEase(name = "standard"): [number, number, number, number] {
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--ease-${name}`);
  return value.slice(value.indexOf("(") + 1, value.indexOf(")")).split(",").map(Number) as [number, number, number, number];
}
