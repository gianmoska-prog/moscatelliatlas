import { t } from './i18n.js';

/**
 * Atlas PWA boundary.
 *
 * The service worker caches the application shell only. Internal knowledge JSON,
 * user-specific data and future authenticated/API responses are deliberately not
 * placed in Cache Storage by this module.
 */

function getStatusElements() {
  return {
    root: document.querySelector('[data-pwa-status]'),
    text: document.querySelector('[data-pwa-status-text]'),
    action: document.querySelector('[data-pwa-action]'),
    dismiss: document.querySelector('[data-pwa-dismiss]'),
  };
}

function showStatus(message, { actionLabel = '', onAction = null, persistent = false } = {}) {
  const { root, text, action, dismiss } = getStatusElements();
  if (!root || !text || !action) return;
  text.textContent = t(message);
  root.hidden = false;
  root.dataset.persistent = String(persistent);
  action.hidden = !actionLabel;
  action.textContent = actionLabel ? t(actionLabel) : '';
  action.onclick = typeof onAction === 'function' ? onAction : null;
  if (dismiss) dismiss.onclick = hideStatus;

  window.clearTimeout(showStatus.dismissTimer);
  if (!persistent) {
    showStatus.dismissTimer = window.setTimeout(() => {
      if (root.dataset.persistent !== 'true') root.hidden = true;
    }, 4200);
  }
}
showStatus.dismissTimer = 0;

function hideStatus() {
  const { root, action } = getStatusElements();
  if (!root) return;
  window.clearTimeout(showStatus.dismissTimer);
  root.hidden = true;
  delete root.dataset.persistent;
  if (action) {
    action.hidden = true;
    action.onclick = null;
  }
}

function listenForConnectivity() {
  window.addEventListener('offline', () => {
    showStatus('Atlas is offline. The application shell remains available; private knowledge is not cached by default.', { persistent: true });
  });
  window.addEventListener('online', () => {
    showStatus('Connection restored. Atlas can load current knowledge again.');
  });

  if (navigator.onLine === false) {
    showStatus('Atlas is offline. The application shell remains available; private knowledge is not cached by default.', { persistent: true });
  }
}

function watchForUpdates(registration) {
  if (!registration) return;
  let reloadRequested = false;

  const promptForWaitingWorker = () => {
    if (!registration.waiting) return;
    showStatus('A newer Atlas shell is ready.', {
      actionLabel: 'Reload',
      persistent: true,
      onAction: () => {
        if (!registration.waiting || reloadRequested) return;
        reloadRequested = true;
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      },
    });
  };

  promptForWaitingWorker();
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    if (!worker) return;
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) promptForWaitingWorker();
    });
  });

  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // clients.claim() also fires controllerchange on the first installation.
    // Reload only when the user explicitly accepted an available update.
    if (!reloadRequested || reloading) return;
    reloading = true;
    window.location.reload();
  });
}

export async function initPWA() {
  listenForConnectivity();

  if (!('serviceWorker' in navigator)) {
    return Object.freeze({ supported: false, registered: false, reason: 'service-worker-unsupported' });
  }

  const protocol = window.location.protocol;
  if (protocol !== 'https:' && !(protocol === 'http:' && ['localhost', '127.0.0.1'].includes(window.location.hostname))) {
    return Object.freeze({ supported: true, registered: false, reason: 'secure-context-required' });
  }

  try {
    const registration = await navigator.serviceWorker.register('./sw.js', { scope: './' });
    watchForUpdates(registration);
    return Object.freeze({ supported: true, registered: true, scope: registration.scope });
  } catch (error) {
    console.warn('[Atlas] Service worker registration failed:', error);
    hideStatus();
    return Object.freeze({ supported: true, registered: false, reason: 'registration-failed' });
  }
}
