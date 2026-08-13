/**
 * MOSCATELLI ATLAS motion orchestration.
 * Progressive enhancement only: content remains visible and usable if this module,
 * IntersectionObserver or Web Animations are unavailable.
 */

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';
let revealObserver = null;
let revealFallbackTimer = 0;
let routeMotionSerial = 0;
let activeRouteAnimations = [];

export function prefersReducedMotion() {
  return Boolean(window.matchMedia?.(REDUCE_QUERY).matches);
}

export function prepareRouteMotion() {}

export function clearSharedRouteMotion() {
  delete document.documentElement.dataset.atlasSharedTransition;
}

function clearRouteAnimations(outlet) {
  activeRouteAnimations.forEach((animation) => animation.cancel());
  activeRouteAnimations = [];
  outlet?.removeAttribute('data-route-motion');
  delete document.documentElement.dataset.atlasRouteTransition;
  clearSharedRouteMotion();
}

export function cancelRouteMotion(outlet) {
  routeMotionSerial += 1;
  clearRouteAnimations(outlet);
}

export function commitRouteWithMotion(update, afterUpdate, outlet) {
  const serial = ++routeMotionSerial;
  const inheritedOpacity = outlet ? Number.parseFloat(getComputedStyle(outlet).opacity) : 1;
  clearRouteAnimations(outlet);

  const swap = () => {
    if (update() === false) return false;
    afterUpdate?.();
    return true;
  };

  if (!outlet || prefersReducedMotion() || typeof outlet.animate !== 'function') {
    swap();
    return null;
  }

  document.documentElement.dataset.atlasRouteTransition = 'true';
  outlet.dataset.routeMotion = 'leaving';
  const startOpacity = Number.isFinite(inheritedOpacity) ? inheritedOpacity : 1;
  const exit = outlet.animate([
    { opacity: startOpacity },
    { opacity: 0 },
  ], { duration: Math.round(110 * startOpacity), easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });
  activeRouteAnimations = [exit];

  const finished = exit.finished.catch(() => {}).then(() => {
    if (serial !== routeMotionSerial) return;
    if (!swap()) {
      clearRouteAnimations(outlet);
      return;
    }
    outlet.dataset.routeMotion = 'entering';
    const enter = outlet.animate([
      { opacity: 0 },
      { opacity: 1 },
    ], { duration: 190, easing: 'cubic-bezier(.22,.72,.14,1)', fill: 'forwards' });
    exit.cancel();
    activeRouteAnimations = [enter];
    return enter.finished.catch(() => {}).then(() => {
      if (serial !== routeMotionSerial) return;
      enter.cancel();
      activeRouteAnimations = [];
      outlet.removeAttribute('data-route-motion');
      delete document.documentElement.dataset.atlasRouteTransition;
    });
  });

  return Object.freeze({ finished, cancel: () => {
    if (serial !== routeMotionSerial) return;
    routeMotionSerial += 1;
    clearRouteAnimations(outlet);
  } });
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
  window.clearTimeout(revealFallbackTimer);
  revealFallbackTimer = 0;
  if (!root || prefersReducedMotion() || !('IntersectionObserver' in window)) return;

  const elements = [...root.querySelectorAll(REVEAL_SELECTOR)];
  if (!elements.length) return;
  if (document.documentElement.dataset.atlasRouteTransition === 'true') return;
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
  revealFallbackTimer = window.setTimeout(() => {
    for (const element of elements) element.classList.add('motion-reveal--visible');
    revealFallbackTimer = 0;
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
  viewTransitions: false,
  intersectionReveals: typeof window !== 'undefined' && 'IntersectionObserver' in window,
  reducedMotionAware: true,
});
