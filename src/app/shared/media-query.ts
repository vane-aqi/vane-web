import { DestroyRef, Signal, inject, signal } from '@angular/core';

/**
 * A signal that tracks a CSS media query, e.g. mediaQuery('(max-width: 699px)').
 * Call it in a field initializer or constructor (it needs the injection context).
 */
export function mediaQuery(query: string): Signal<boolean> {
  const mql = typeof matchMedia === 'function' ? matchMedia(query) : null;
  const matches = signal(mql?.matches ?? false);
  const onChange = (e: MediaQueryListEvent) => matches.set(e.matches);
  mql?.addEventListener('change', onChange);
  inject(DestroyRef).onDestroy(() => mql?.removeEventListener('change', onChange));
  return matches.asReadonly();
}
