/**
 * Returns true when the current page was loaded as a fresh document for
 * *this* route — i.e. a hard refresh (Ctrl/Cmd+R) OR a first direct/typed
 * load — but NOT via Next.js client-side (soft) navigation.
 *
 * Uses the Navigation Timing API: a fresh document load produces a
 * navigation entry of type "reload" (refresh) or "navigate" (direct load);
 * a soft navigation creates none. We also confirm the loaded document URL
 * matches the current path so loading a *different* page and then
 * soft-navigating here doesn't trigger it. ("back_forward" is excluded.)
 *
 * Call inside a useEffect (client only) to avoid hydration mismatches.
 * Returns true at most once per document load, so dev Fast Refresh remounts
 * (which keep the same JS context) won't replay it — only a real reload,
 * which creates a fresh context, resets this guard.
 */
let consumed = false;

export function wasPageRefreshed(): boolean {
  if (typeof window === 'undefined' || typeof performance === 'undefined') return false;
  if (consumed) return false;

  const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  const nav = entries[0];
  if (!nav || (nav.type !== 'reload' && nav.type !== 'navigate')) return false;

  let onThisPage = true;
  try {
    onThisPage = new URL(nav.name).pathname === window.location.pathname;
  } catch {
    onThisPage = true; // if the entry URL can't be parsed, rely on reload-type
  }

  if (onThisPage) consumed = true;
  return onThisPage;
}
