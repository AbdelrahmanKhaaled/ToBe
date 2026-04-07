/** Attached to Error when login succeeds but account is blocked (see AuthContext). */
export const LOGIN_BLOCKED_CODE = 'BLOCKED';

export function createLoginBlockedError() {
  const err = new Error(LOGIN_BLOCKED_CODE);
  err.code = LOGIN_BLOCKED_CODE;
  return err;
}

/**
 * True if the failed login should show the "entry prohibited" (blocked account) message.
 * Covers: explicit code from AuthContext, API error payload, and common message hints.
 */
export function isLoginBlockedError(err) {
  if (!err || typeof err !== 'object') return false;
  if (err.code === LOGIN_BLOCKED_CODE) return true;

  const data = err.data && typeof err.data === 'object' ? err.data : {};
  const statusField = String(data.status ?? data.user_status ?? '').toLowerCase();
  if (statusField === 'blocked') return true;

  const errCode = String(data.error_code ?? data.code ?? '').toLowerCase();
  if (errCode === 'blocked' || errCode === 'account_blocked' || errCode === 'user_blocked') return true;

  const msg = `${err.message || ''} ${data.message || ''} ${typeof data.error === 'string' ? data.error : ''}`.toLowerCase();
  const hints = [
    'blocked',
    'banned',
    'suspended',
    'deactivated',
    'account has been',
    'account is',
    'prohibit',
    'not allowed to',
    'access denied',
    'forbidden',
    'محظور',
    'ممنوع',
    'الدخول',
    'حساب',
    'موقوف',
  ];
  if (hints.some((h) => msg.includes(h))) return true;

  return false;
}

export function isUserPayloadBlocked(user) {
  if (!user || typeof user !== 'object') return false;
  return String(user.status ?? '').trim().toLowerCase() === 'blocked';
}
