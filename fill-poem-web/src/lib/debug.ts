import type { RouteName } from '../types.ts';

// Dev-only shortcut to jump to any route for visual QA: `?debug=lottery`.

/** Read `?debug=<route>` from the URL. Only recognizes routes present in `validRoutes`. */
export function readDebugRoute(validRoutes: readonly string[]): RouteName | null {
  const route = new URLSearchParams(location.search).get('debug');
  return route && validRoutes.includes(route) ? (route as RouteName) : null;
}

/** Strip the debug param after consuming it so a reload does not repeat the jump. */
export function clearDebugParams(): void {
  const url = new URL(location.href);
  url.searchParams.delete('debug');
  history.replaceState(null, '', url.toString());
}
