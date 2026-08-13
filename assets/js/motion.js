/**
 * MOSCATELLI ATLAS motion orchestration.
 * Progressive enhancement only: content remains visible and usable if this module,
 * IntersectionObserver, Web Animations or the View Transitions API are unavailable.
 */

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';
let pendingSharedSource = null;
let revealObserver = null;

export function prefersReducedMotion() {
  return Boolean(window.matchMedia?.(REDUCE_QUERY).matches);
}

function sharedTitleCandidate(link) {
  return link?.querySelector?.([
    '.library-item__title',
    '.search-result__title',
    '.playbook-list-item__title',
    '.personal-item strong',
    '.academia-lesson-row__copy strong',
  ].join(',')) || null;
}

export function prepareRouteMotion(link) {
  if (prefersReducedMotion() || !document.startViewTransition) return;
  clearSharedRouteMotion();
  const source = sharedTitleCandidate(link);
  if (!source) return;
  source.style.viewTransitionName = 'atlas-shared-title';
  pendingSharedSource = source;
  document.documentElement.dataset.atlasSharedTransition = 'true';
}

export function clearSharedRouteMotion() {
  if (pendingSharedSource instanceof HTMLElement) pendingSharedSource.style.removeProperty('view-transition-name');
  pendingSharedSource = null;
  delete document.documentElement.dataset.atlasSharedTransition;
}

export function commitRouteWithMotion(update, afterUpdate, outlet) {
  const run = () => {
    update();
    if (pendingSharedSource && outlet) {
      const destination = outlet.querySelector('h1');
      if (destination) destination.style.viewTransitionName = 'atlas-shared-title';
    }
    afterUpdate?.();
  };

  if (prefersReducedMotion() || typeof document.startViewTransition !== 'function') {
    run();
    clearSharedRouteMotion();
    return null;
  }

  document.documentElement.dataset.atlasRouteTransition = 'true';
  let transition;
  try {
    transition = document.startViewTransition(run);
  } catch {
    run();
    clearSharedRouteMotion();
    delete document.documentElement.dataset.atlasRouteTransition;
    return null;
  }

  transition.finished.catch(() => {}).then(() => {
    outlet?.querySelector('h1')?.style.removeProperty('view-transition-name');
    clearSharedRouteMotion();
    delete document.documentElement.dataset.atlasRouteTransition;
  });
  return transition;
}

const REVEAL_SELECTOR = [
  '.library-item',
  '.search-result',
  '.playbook-list-item',
  '.academia-course-card',
  '.academia-module',
  '.personal-item',
  '.update-item',
  '.article-section',
  '.playbook-response-section',
  '.academia-reading-section',
].join(',');

export function enhanceRouteReveals(root) {
  revealObserver?.disconnect();
  revealObserver = null;
  if (!root || prefersReducedMotion() || !('IntersectionObserver' in window)) return;

  const elements = [...root.querySelectorAll(REVEAL_SELECTOR)];
  if (!elements.length) return;
  document.documentElement.classList.add('motion-enhanced');
  elements.forEach((element, index) => {
    element.classList.add('motion-reveal');
    element.style.setProperty('--motion-order', String(Math.min(index, 5)));
  });

  revealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('motion-reveal--visible');
      revealObserver?.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });

  elements.forEach((element) => revealObserver.observe(element));
  window.setTimeout(() => {
    for (const element of elements) element.classList.add('motion-reveal--visible');
  }, 900);
}

export function closeDialogWithMotion(dialog, onClose) {
  if (!dialog?.open) return;
  if (prefersReducedMotion()) { onClose(); return; }
  dialog.dataset.closing = 'true';
  window.setTimeout(() => {
    delete dialog.dataset.closing;
    if (dialog.open) onClose();
  }, 180);
}

export function pulseState(control) {
  if (!control || prefersReducedMotion() || typeof control.animate !== 'function') return;
  control.animate([
    { transform: 'scale(1)' },
    { transform: 'scale(0.975)', offset: 0.38 },
    { transform: 'scale(1)' },
  ], { duration: 230, easing: 'cubic-bezier(.2,.8,.2,1)' });
}

export const motionStatus = Object.freeze({
  orchestrationImplemented: true,
  viewTransitions: typeof document !== 'undefined' && 'startViewTransition' in document,
  intersectionReveals: typeof window !== 'undefined' && 'IntersectionObserver' in window,
  reducedMotionAware: true,
});
