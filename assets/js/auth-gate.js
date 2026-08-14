import { ATLAS_CONFIG } from './config.js';
import {
  AtlasAuthError,
  getAuthAdapterStatus,
  getProfile,
  getSession,
  onAuthStateChange,
  resetPasswordForEmail,
  signInWithOtp,
  signInWithPassword,
  signOut,
  updatePassword,
  verifyEmailOtp,
} from './auth-adapter.js?v=1.10.1';
import { getLocale, t } from './i18n.js?v=1.10.1';
import { setStorageIdentity } from './store.js?v=1.10.1';

const DEMO_SESSION_KEY = 'moscatelli.atlas.demo.auth-session.v1';
const AUTO_AUTH_MINIMUM_MS = 900;
const EMPTY_SESSION_MINIMUM_MS = 260;
const AUTH_STAGE_MINIMUM_MS = 420;
const AUTH_CONTENT_FADE_MS = 230;
const AUTH_GATE_FADE_MS = 270;
let currentSession = null;
let onAuthenticatedCallback = null;
let providerUnsubscribe = null;
let providerRevealPromise = null;
let providerRevealUserId = null;
let providerTransitionSerial = 0;

const root = document.querySelector('[data-auth-gate]');
const panel = root?.querySelector('[data-auth-panel]');
const title = root?.querySelector('[data-auth-title]');
const description = root?.querySelector('[data-auth-description]');
const status = root?.querySelector('[data-auth-status]');
const forms = [...(root?.querySelectorAll('[data-auth-form]') || [])];
const modeButtons = [...(root?.querySelectorAll('[data-auth-mode]') || [])];
const demoEntry = root?.querySelector('[data-auth-demo-entry]');
const appSurface = document.querySelector('[data-auth-app-surface]');
const welcome = document.querySelector('[data-atlas-welcome]');
const welcomeText = welcome?.querySelector('[data-atlas-welcome-text]');
let revealSerial = 0;
let welcomeRevealTimer = null;
let welcomeDismissTimer = null;

function waitForMinimum(startedAt, minimumMs) {
  const elapsed = performance.now() - startedAt;
  return new Promise((resolve) => window.setTimeout(resolve, Math.max(0, minimumMs - elapsed)));
}

function welcomeFirstName(user = null) {
  const rawName = String(user?.displayName || user?.email?.split('@')[0] || '')
    .trim().replace(/\s+/g, ' ');
  const firstName = rawName.split(' ')[0].replace(/[._-]+/g, ' ').trim().split(' ')[0] || '';
  if (!firstName) return '';
  return `${firstName.charAt(0).toLocaleUpperCase()}${firstName.slice(1)}`.slice(0, 40);
}

function hideWelcome({ immediate = false } = {}) {
  window.clearTimeout(welcomeRevealTimer);
  window.clearTimeout(welcomeDismissTimer);
  welcomeRevealTimer = null;
  welcomeDismissTimer = null;
  if (!welcome) return;
  welcome.removeAttribute('data-visible');
  welcome.setAttribute('aria-hidden', 'true');
  if (immediate) welcome.getBoundingClientRect();
}

function showWelcome(user) {
  if (!welcome || !welcomeText || !user) return;
  hideWelcome({ immediate: true });
  const firstName = welcomeFirstName(user);
  const grammaticalGender = ['masculine', 'feminine'].includes(user.grammaticalGender)
    ? user.grammaticalGender
    : 'neutral';
  const genderedKey = `Welcome back, {name} (${grammaticalGender})`;
  const greeting = firstName && getLocale() !== 'en' && grammaticalGender !== 'neutral'
    ? t(genderedKey)
    : (firstName ? t('Welcome back, {name}') : t('Welcome back'));
  welcomeText.textContent = firstName ? greeting.replace('{name}', firstName) : greeting;
  welcomeRevealTimer = window.setTimeout(() => {
    welcome.setAttribute('aria-hidden', 'false');
    welcome.dataset.visible = 'true';
    welcomeDismissTimer = window.setTimeout(() => hideWelcome(), 2100);
  }, 140);
}

function focusableElements(container) {
  if (!container) return [];
  return [...container.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter((element) => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden');
}

function setStatus(message = '', kind = 'neutral') {
  if (!status) return;
  status.textContent = t(message);
  status.dataset.kind = kind;
  status.hidden = !message;
}

function setBusy(busy) {
  if (!root) return;
  root.dataset.busy = String(Boolean(busy));
  root.setAttribute('aria-busy', String(Boolean(busy)));
  root.querySelectorAll('button,input').forEach((control) => {
    if (control.matches('[data-auth-demo-entry]') && !ATLAS_CONFIG.demoMode) return;
    control.disabled = Boolean(busy);
  });
}

function setMode(mode = 'password') {
  if (!root) return;
  const selected = ['password', 'otp', 'reset', 'recovery'].includes(mode) ? mode : 'password';
  root.dataset.mode = selected;
  forms.forEach((form) => { form.hidden = form.dataset.authForm !== selected; });
  modeButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.authMode === selected)));
  setStatus('');

  if (selected === 'password') {
    title.textContent = t('Welcome back.');
    description.textContent = t('Sign in to enter MOSCATELLI Atlas.');
  } else if (selected === 'otp') {
    title.textContent = t('Use an email code.');
    description.textContent = t('Request a one-time sign-in link or code from the connected authentication provider.');
  } else if (selected === 'reset') {
    title.textContent = t('Reset your password.');
    description.textContent = t('Request the secure password-reset flow for your Atlas account.');
  } else {
    title.textContent = t('Choose a new password.');
    description.textContent = t('Use at least 12 characters and a password unique to MOSCATELLI.');
  }
  window.requestAnimationFrame(() => root.querySelector(`[data-auth-form="${selected}"] input`)?.focus({ preventScroll: true }));
}

function storeDemoSession(session) {
  try { window.sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session)); } catch { /* ephemeral session still works in memory */ }
}
function readDemoSession() {
  try {
    const raw = window.sessionStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.demo === true ? parsed : null;
  } catch { return null; }
}
function clearDemoSession() {
  try { window.sessionStorage.removeItem(DEMO_SESSION_KEY); } catch { /* no-op */ }
}

function demoSession() {
  return Object.freeze({
    demo: true,
    provider: 'development-preview',
    user: Object.freeze({ id: 'demo-preview-user', email: null, displayName: 'Development Preview', role: 'Preview' }),
    issuedAt: new Date().toISOString(),
  });
}

async function sessionFromProvider(session) {
  if (!session) return null;
  const user = session.user || {};
  const profile = await getProfile();
  return Object.freeze({
    demo: false,
    provider: 'supabase',
    user: Object.freeze({
      id: user.id || '',
      email: user.email || '',
      displayName: profile.display_name || profile.email || user.email || 'Atlas user',
      role: profile.role || '',
      division: profile.division || '',
      grammaticalGender: profile.grammatical_gender || 'neutral',
    }),
    raw: session,
  });
}

function providerUserId(session) {
  return session?.user?.id || '';
}

function publishSession() {
  window.dispatchEvent(new CustomEvent('atlas:auth-session', { detail: getAuthenticationSnapshot() }));
}

function synchroniseProviderSession(session) {
  if (!session || currentSession?.demo || providerUserId(session) !== currentSession?.user?.id) return false;
  const providerUser = session.user || {};
  currentSession = Object.freeze({
    ...currentSession,
    user: Object.freeze({
      ...currentSession.user,
      email: providerUser.email || currentSession.user.email || '',
    }),
    raw: session,
  });
  publishSession();
  return true;
}

async function openProviderSession(session) {
  const userId = providerUserId(session);
  if (!userId) throw new AtlasAuthError('AUTH_SESSION_MISSING', 'The authentication provider did not return an active user.');
  if (synchroniseProviderSession(session)) return currentSession;
  if (providerRevealPromise && providerRevealUserId === userId) return providerRevealPromise;

  const transitionSerial = ++providerTransitionSerial;
  providerRevealUserId = userId;
  const revealPromise = sessionFromProvider(session).then((resolvedSession) => {
    if (transitionSerial !== providerTransitionSerial) return null;
    return revealApplication(resolvedSession);
  });
  providerRevealPromise = revealPromise;
  try {
    await revealPromise;
    return currentSession;
  } finally {
    if (providerRevealPromise === revealPromise) {
      providerRevealPromise = null;
      providerRevealUserId = null;
    }
  }
}

async function refreshProviderProfile(session) {
  if (!session) return;
  const userId = providerUserId(session);
  if (currentSession?.user?.id !== userId) {
    await openProviderSession(session);
    return;
  }
  const refreshed = await sessionFromProvider(session);
  if (!currentSession || currentSession.demo || currentSession.user?.id !== userId) return;
  currentSession = refreshed;
  publishSession();
}

async function revealApplication(session) {
  const serial = ++revealSerial;
  const stageStartedAt = performance.now();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  currentSession = session;
  setStorageIdentity(session?.user?.id || session?.provider || 'anonymous');
  document.documentElement.dataset.authState = 'checking';
  document.documentElement.dataset.authMode = session?.demo ? 'demo' : 'provider';
  if (root) root.dataset.state = 'checking';
  publishSession();

  await onAuthenticatedCallback?.(getAuthenticationSnapshot());
  if (serial !== revealSerial || !currentSession) return;

  await new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));
  if (serial !== revealSerial || !currentSession) return;

  if (!reducedMotion) await waitForMinimum(stageStartedAt, AUTH_STAGE_MINIMUM_MS);
  if (serial !== revealSerial || !currentSession) return;

  // Prepare the complete application beneath one opaque gate. Atlas first
  // removes the loading content, then dismisses the gate; the application
  // itself never fades against the departing authentication layer.
  if (appSurface) {
    appSurface.removeAttribute('inert');
    appSurface.setAttribute('aria-hidden', 'false');
  }
  document.documentElement.dataset.authState = 'authenticated';

  if (root) {
    root.dataset.state = 'departing';
    root.setAttribute('aria-hidden', 'true');
    root.inert = true;
  }

  if (!reducedMotion) await new Promise((resolve) => window.setTimeout(resolve, AUTH_CONTENT_FADE_MS));
  if (serial !== revealSerial || !currentSession) return;

  if (root) root.dataset.state = 'success';
  if (!reducedMotion) await new Promise((resolve) => window.setTimeout(resolve, AUTH_GATE_FADE_MS));
  if (serial !== revealSerial || !currentSession) return;

  if (root) root.hidden = true;
  showWelcome(session?.user);
}

function showGate({ message = '' } = {}) {
  if (!currentSession && document.documentElement.dataset.authState === 'locked' && !message) return;
  revealSerial += 1;
  providerTransitionSerial += 1;
  currentSession = null;
  setStorageIdentity(null);
  providerRevealPromise = null;
  providerRevealUserId = null;
  hideWelcome();
  document.documentElement.dataset.authState = 'locked';
  document.documentElement.dataset.authMode = ATLAS_CONFIG.demoMode ? 'demo-preview' : 'provider';
  if (appSurface) {
    appSurface.setAttribute('inert', '');
    appSurface.setAttribute('aria-hidden', 'true');
  }
  if (root) {
    root.hidden = false;
    root.inert = false;
    root.removeAttribute('aria-hidden');
    root.dataset.state = 'ready';
  }
  setMode('password');
  setStatus(message, message ? 'error' : 'neutral');
  window.requestAnimationFrame(() => {
    const target = ATLAS_CONFIG.demoMode ? demoEntry : root?.querySelector('[data-auth-form="password"] input');
    target?.focus({ preventScroll: true });
  });
}

function reportAuthFailure(error, fallback) {
  const message = error?.message || fallback;
  if (root?.dataset.state === 'checking') showGate({ message });
  else setStatus(message, 'error');
}

async function handlePasswordSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const email = form.elements.email?.value?.trim() || '';
  const password = form.elements.password?.value || '';
  if (!email || !password) {
    setStatus('Enter both your email address and password.', 'error');
    return;
  }
  setBusy(true); setStatus('Signing in…', 'loading');
  try {
    const session = await signInWithPassword({ email, password });
    if (!session) throw new AtlasAuthError('AUTH_SESSION_MISSING', 'The authentication provider did not return an active session.');
    setStatus('Access confirmed.', 'success');
    await openProviderSession(session);
  } catch (error) { reportAuthFailure(error, 'Atlas could not sign in.'); }
  finally { setBusy(false); }
}

async function handleOtpSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const email = form.elements.email?.value?.trim() || '';
  const token = form.elements.token?.value?.replace(/\D/g, '') || '';
  if (!email) { setStatus('Enter your email address.', 'error'); return; }
  setBusy(true); setStatus(token ? 'Verifying email code…' : 'Requesting email access…', 'loading');
  try {
    if (token) {
      if (token.length !== 6) throw new AtlasAuthError('AUTH_INVALID_OTP', 'Enter the six-digit email code.');
      const session = await verifyEmailOtp({ email, token });
      if (!session) throw new AtlasAuthError('AUTH_SESSION_MISSING', 'The code was accepted but no session was returned.');
      await openProviderSession(session);
    } else {
      await signInWithOtp({ email, emailRedirectTo: window.location.href.split('#')[0] });
      const verification = form.querySelector('[data-auth-otp-verification]');
      if (verification) verification.hidden = false;
      form.elements.token?.setAttribute('required', '');
      form.querySelector('[type="submit"]').textContent = t('Verify email code');
      setStatus('Check your email, then enter the six-digit code or use the secure link.', 'success');
      window.requestAnimationFrame(() => form.elements.token?.focus());
    }
  } catch (error) { reportAuthFailure(error, 'Atlas could not request email access.'); }
  finally { setBusy(false); }
}

async function handleRecoverySubmit(event) {
  event.preventDefault();
  const password = event.currentTarget.elements.password?.value || '';
  const confirmation = event.currentTarget.elements.confirmation?.value || '';
  if (password.length < 12) { setStatus('Use at least 12 characters for the new password.', 'error'); return; }
  if (password !== confirmation) { setStatus('The password confirmation does not match.', 'error'); return; }
  setBusy(true); setStatus('Updating password…', 'loading');
  try {
    await updatePassword({ password });
    const session = await getSession();
    setStatus('Password updated. Opening Atlas…', 'success');
    await openProviderSession(session);
  } catch (error) { reportAuthFailure(error, 'Atlas could not update the password.'); }
  finally { setBusy(false); }
}

async function handleResetSubmit(event) {
  event.preventDefault();
  const email = event.currentTarget.elements.email?.value?.trim() || '';
  if (!email) { setStatus('Enter your email address.', 'error'); return; }
  setBusy(true); setStatus('Preparing password reset…', 'loading');
  try {
    await resetPasswordForEmail({ email, redirectTo: window.location.href.split('#')[0] });
    setStatus('Check your email for the secure password-reset message.', 'success');
  } catch (error) { setStatus(error?.message || 'Atlas could not start the password-reset flow.', 'error'); }
  finally { setBusy(false); }
}

function bindGateInteractions() {
  modeButtons.forEach((button) => button.addEventListener('click', () => setMode(button.dataset.authMode)));
  forms.find((form) => form.dataset.authForm === 'password')?.addEventListener('submit', handlePasswordSubmit);
  forms.find((form) => form.dataset.authForm === 'otp')?.addEventListener('submit', handleOtpSubmit);
  forms.find((form) => form.dataset.authForm === 'reset')?.addEventListener('submit', handleResetSubmit);
  forms.find((form) => form.dataset.authForm === 'recovery')?.addEventListener('submit', handleRecoverySubmit);

  demoEntry?.addEventListener('click', async () => {
    if (!ATLAS_CONFIG.demoMode) return;
    const session = demoSession();
    storeDemoSession(session);
    setStatus('Opening the isolated development preview…', 'success');
    await revealApplication(session);
  });

  root?.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusables = focusableElements(panel);
    if (!focusables.length) return;
    const first = focusables[0]; const last = focusables.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
}

export function getAuthenticationSnapshot() {
  return Object.freeze({
    authenticated: Boolean(currentSession),
    demo: Boolean(currentSession?.demo),
    provider: currentSession?.provider || null,
    user: currentSession?.user || null,
    adapter: getAuthAdapterStatus(),
  });
}

export async function signOutAtlas() {
  try {
    if (currentSession?.demo) clearDemoSession();
    else if (currentSession) await signOut();
  } catch (error) {
    setStatus(error?.message || 'Atlas could not sign out. Please retry.', 'error');
    throw error;
  }
  document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close());
  showGate();
  window.dispatchEvent(new CustomEvent('atlas:auth-signout'));
}

export async function initAuthenticationThreshold({ onAuthenticated } = {}) {
  if (!root || !appSurface) throw new Error('Atlas authentication threshold markup is missing.');
  onAuthenticatedCallback = typeof onAuthenticated === 'function' ? onAuthenticated : null;
  bindGateInteractions();

  if (!ATLAS_CONFIG.authenticationEnabled) {
    if (!ATLAS_CONFIG.demoMode) throw new Error('Authentication is disabled while demo mode is also disabled. Atlas would have no safe entry path.');
    await revealApplication(demoSession());
    return getAuthenticationSnapshot();
  }

  const storedDemo = ATLAS_CONFIG.demoMode ? readDemoSession() : null;
  if (storedDemo) {
    await revealApplication(storedDemo);
    return getAuthenticationSnapshot();
  }

  if (!ATLAS_CONFIG.demoMode && getAuthAdapterStatus().configured) {
    setBusy(true); setStatus('Checking your session…', 'loading');
    try {
      const sessionCheckStartedAt = performance.now();
      const session = await getSession();
      const isRecovery = new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery';
      await waitForMinimum(sessionCheckStartedAt, session ? AUTO_AUTH_MINIMUM_MS : EMPTY_SESSION_MINIMUM_MS);
      if (session && isRecovery) {
        document.documentElement.dataset.authState = 'locked';
        root.dataset.state = 'ready';
        setMode('recovery');
      } else if (session) await openProviderSession(session);
      else showGate();
      providerUnsubscribe = onAuthStateChange(async (event, nextSession) => {
        try {
          if (event === 'PASSWORD_RECOVERY') { setMode('recovery'); return; }
          if (event === 'SIGNED_OUT') { showGate(); return; }
          if (!nextSession) return;

          // INITIAL_SESSION is emitted on subscription, TOKEN_REFRESHED happens
          // in the background, and SIGNED_IN may repeat when a tab regains focus.
          // They update session data silently when the authenticated user is the
          // same; only a genuinely new session crosses the visual auth threshold.
          if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
            if (!synchroniseProviderSession(nextSession)) await openProviderSession(nextSession);
            return;
          }
          if (event === 'USER_UPDATED') await refreshProviderProfile(nextSession);
        } catch (error) {
          console.error(`[Atlas] Authentication event ${event} failed:`, error);
          if (!currentSession || event === 'USER_UPDATED') {
            showGate({ message: error?.message || 'Atlas could not verify the updated authentication session.' });
          }
        }
      });
    } catch (error) {
      showGate({ message: error?.message || 'Atlas could not check the authentication session.' });
    } finally { setBusy(false); }
  } else {
    showGate();
  }

  return getAuthenticationSnapshot();
}

export function destroyAuthenticationThreshold() {
  providerUnsubscribe?.();
  providerUnsubscribe = null;
}
