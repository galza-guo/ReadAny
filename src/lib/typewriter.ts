export function getNextRevealText(current: string, full: string, step: number) {
  return full.slice(0, Math.min(full.length, current.length + step));
}
