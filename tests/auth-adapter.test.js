import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureAuthAdapter, resetAuthAdapter, signInWithOtp, updatePassword, verifyEmailOtp } from '../assets/js/auth-adapter.js';

afterEach(() => resetAuthAdapter());

describe('Supabase auth adapter', () => {
  it('prevents OTP requests from creating unknown users', async () => {
    const signInWithOtpMock = vi.fn().mockResolvedValue({ data: {}, error: null });
    configureAuthAdapter({ auth: { signInWithOtp: signInWithOtpMock } });
    await signInWithOtp({ email: 'member@example.com', emailRedirectTo: 'https://atlas.example/' });
    expect(signInWithOtpMock).toHaveBeenCalledWith({ email: 'member@example.com', options: { shouldCreateUser: false, emailRedirectTo: 'https://atlas.example/' } });
  });

  it('verifies typed email codes and updates recovered passwords', async () => {
    const verifyOtp = vi.fn().mockResolvedValue({ data: { session: { access_token: 'test' } }, error: null });
    const updateUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user' } }, error: null });
    configureAuthAdapter({ auth: { verifyOtp, updateUser } });
    await expect(verifyEmailOtp({ email: 'member@example.com', token: '123456' })).resolves.toEqual({ access_token: 'test' });
    await updatePassword({ password: 'a secure test password' });
    expect(updateUser).toHaveBeenCalledWith({ password: 'a secure test password' });
  });
});
