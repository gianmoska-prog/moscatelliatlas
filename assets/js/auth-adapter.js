/**
 * MOSCATELLI ATLAS authentication adapter.
 *
 * This module intentionally contains no Supabase URL, publishable key, password
 * rule, fake credential validation or production secret. A future integration
 * may inject an already-created Supabase client with `configureAuthAdapter()`.
 */

export class AtlasAuthError extends Error {
  constructor(code, message, cause = null) {
    super(message);
    this.name = 'AtlasAuthError';
    this.code = code;
    this.cause = cause;
  }
}

let authClient = null;
let unsubscribe = null;

export function getSupabaseClient() { return authClient; }

function requireClient() {
  if (!authClient?.auth) {
    throw new AtlasAuthError(
      'AUTH_PROVIDER_UNAVAILABLE',
      'The production authentication provider is not connected in this build.'
    );
  }
  return authClient;
}

function normaliseError(error, fallback = 'Authentication could not be completed.') {
  if (error instanceof AtlasAuthError) return error;
  return new AtlasAuthError(
    error?.code || 'AUTH_PROVIDER_ERROR',
    error?.message || fallback,
    error || null
  );
}

export function configureAuthAdapter(client) {
  if (!client?.auth) throw new TypeError('configureAuthAdapter requires a Supabase-compatible client with an auth interface.');
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  authClient = client;
  return getAuthAdapterStatus();
}

export function resetAuthAdapter() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  authClient = null;
}

export function getAuthAdapterStatus() {
  return Object.freeze({
    implemented: true,
    configured: Boolean(authClient?.auth),
    provider: 'supabase-compatible',
    embedsCredentials: false,
    fakeValidation: false,
  });
}

export async function getSession() {
  try {
    const client = requireClient();
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data?.session || null;
  } catch (error) {
    throw normaliseError(error, 'Atlas could not determine the current authentication session.');
  }
}

export async function signInWithPassword({ email, password }) {
  try {
    const client = requireClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data?.session || null;
  } catch (error) {
    throw normaliseError(error, 'Atlas could not sign in with this account.');
  }
}

export async function signInWithOtp({ email, emailRedirectTo } = {}) {
  try {
    const client = requireClient();
    const options = { shouldCreateUser: false, ...(emailRedirectTo ? { emailRedirectTo } : {}) };
    const { data, error } = await client.auth.signInWithOtp({ email, options });
    if (error) throw error;
    return data || null;
  } catch (error) {
    throw normaliseError(error, 'Atlas could not request an email sign-in code.');
  }
}

export async function verifyEmailOtp({ email, token }) {
  try {
    const client = requireClient();
    const { data, error } = await client.auth.verifyOtp({ email, token, type: 'email' });
    if (error) throw error;
    return data?.session || null;
  } catch (error) {
    throw normaliseError(error, 'Atlas could not verify this email code.');
  }
}

export async function updatePassword({ password }) {
  try {
    const client = requireClient();
    const { data, error } = await client.auth.updateUser({ password });
    if (error) throw error;
    return data?.user || null;
  } catch (error) {
    throw normaliseError(error, 'Atlas could not update the password.');
  }
}

export async function getProfile() {
  try {
    const client = requireClient();
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError || !authData?.user?.id) throw authError || new Error('Authenticated user is unavailable.');
    const { data, error } = await client.from('profiles').select('id,email,display_name,role,division,is_active').eq('id', authData.user.id).single();
    if (error) throw error;
    if (!data?.is_active) throw new AtlasAuthError('AUTH_PROFILE_INACTIVE', 'This Atlas profile is inactive.');
    return data;
  } catch (error) {
    throw normaliseError(error, 'Atlas could not verify your internal profile.');
  }
}

export async function resetPasswordForEmail({ email, redirectTo } = {}) {
  try {
    const client = requireClient();
    const options = redirectTo ? { redirectTo } : undefined;
    const { data, error } = await client.auth.resetPasswordForEmail(email, options);
    if (error) throw error;
    return data || null;
  } catch (error) {
    throw normaliseError(error, 'Atlas could not start the password-reset flow.');
  }
}

export async function signOut() {
  try {
    const client = requireClient();
    const { error } = await client.auth.signOut();
    if (error) throw error;
    return true;
  } catch (error) {
    throw normaliseError(error, 'Atlas could not sign out cleanly.');
  }
}

export function onAuthStateChange(listener) {
  if (typeof listener !== 'function') throw new TypeError('onAuthStateChange requires a listener function.');
  const client = requireClient();
  const { data } = client.auth.onAuthStateChange((event, session) => {
    window.setTimeout(() => listener(event, session || null), 0);
  });
  const subscription = data?.subscription;
  unsubscribe = () => subscription?.unsubscribe?.();
  return unsubscribe;
}
