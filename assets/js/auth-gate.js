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
} from './auth-adapter.js';
import { t } from './i18n.js';

const DEMO_SESSION_KEY = 'moscatelli.atlas.demo.auth-session.v1';
let currentSession = null;
let appStarted = false;
let onAuthenticatedCallback = null;
let providerUnsubscribe = null;

const root = document.querySelector('[data-auth-gate]');
const panel = root?.querySelector('[data-auth-panel]');
const title = root?.querySelector('[data-auth-title]');
const description = root?.querySelector('[data-auth-description]');
const status = root?.querySelector('[data-auth-status]');
const forms = [...(root?.querySelectorAll('[data-auth-form]') || [])];
const modeButtons = [...(root?.querySelectorAll('[data-auth-mode]') || [])];
const demoEntry = root?.querySelector('[data-auth-demo-entry]');
const appSurface = document.querySelector('[data-auth-app-surface]');
let revealSerial = 0;

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
    }),
    raw: session,
  });
}

async function revealApplication(session) {
  const serial = ++revealSerial;
  currentSession = session;
  document.documentElement.dataset.authState = 'checking';
  document.documentElement.dataset.authMode = session?.demo ? 'demo' : 'provider';
  window.dispatchEvent(new CustomEvent('atlas:auth-session', { detail: getAuthenticationSnapshot() }));

  if (!appStarted) {
    appStarted = true;
    await onAuthenticatedCallback?.(getAuthenticationSnapshot());
  }
  if (serial !== revealSerial || !currentSession) return;

  await new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));
  if (serial !== revealSerial || !currentSession) return;

  document.documentElement.dataset.authState = 'authenticated';
  if (appSurface) {
    appSurface.removeAttribute('inert');
    appSurface.setAttribute('aria-hidden', 'false');
  }
  if (root) {
    root.dataset.state = 'success';
    root.setAttribute('aria-hidden', 'true');
    root.inert = true;
  }

  const finish = () => { if (serial === revealSerial && root) root.hidden = true; };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
  else window.setTimeout(finish, 180);
}

function showGate({ message = '' } = {}) {
  revealSerial += 1;
  currentSession = null;
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
    await revealApplication(await sessionFromProvider(session));
  } catch (error) {
    setStatus(error?.message || 'Atlas could not sign in.', 'error');
  } finally { setBusy(false); }
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
      await revealApplication(await sessionFromProvider(session));
    } else {
      await signInWithOtp({ email, emailRedirectTo: window.location.href.split('#')[0] });
      const verification = form.querySelector('[data-auth-otp-verification]');
      if (verification) verification.hidden = false;
      form.elements.token?.setAttribute('required', '');
      form.querySelector('[type="submit"]').textContent = t('Verify email code');
      setStatus('Check your email, then enter the six-digit code or use the secure link.', 'success');
      window.requestAnimationFrame(() => form.elements.token?.focus());
    }
  } catch (error) { setStatus(error?.message || 'Atlas could not request email access.', 'error'); }
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
    await revealApplication(await sessionFromProvider(session));
  } catch (error) { setStatus(error?.message || 'Atlas could not update the password.', 'error'); }
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
      const session = await getSession();
      const isRecovery = new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery';
      if (session && isRecovery) setMode('recovery');
      else if (session) await revealApplication(await sessionFromProvider(session));
      else showGate();
      providerUnsubscribe = onAuthStateChange(async (event, nextSession) => {
        if (event === 'PASSWORD_RECOVERY') { setMode('recovery'); return; }
        if (nextSession) await revealApplication(await sessionFromProvider(nextSession));
        else if (event === 'SIGNED_OUT') showGate();
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
