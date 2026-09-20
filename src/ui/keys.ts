/** Helpers shared by the global keyboard handlers. */

/**
 * Decides whether a key press should be left alone because the user is typing or holding a modifier.
 * Range sliders are not treated as typing, so shortcuts keep working after moving a slider.
 * @param e - the keyboard event
 * @returns true when shortcuts must not react to this event
 */
export function ignoreShortcut(e: KeyboardEvent): boolean {
  if (e.metaKey || e.ctrlKey || e.altKey) return true;
  const target = e.target;
  // Events fired on window or document have no element to inspect.
  if (!(target instanceof Element)) return false;
  return target.closest('input:not([type="range"]), textarea, select, [contenteditable="true"]') !== null;
}
