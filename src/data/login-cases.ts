import { SLOW_RENDER_TIMEOUT } from '../utils/timeouts';
import { LOGIN_ERRORS } from './messages';
import { getUser, type UserKey } from './users';

/** One row of TC-LOGIN-02. An empty string means "leave the field untouched". */
export interface InvalidLoginCase {
  readonly name: string;
  readonly username: string;
  readonly password: string;
  readonly expectedError: string;
  /** The acceptance criterion this row covers. */
  readonly covers: string;
}

/**
 * The 13 rows of spec 01 TC-LOGIN-02, in spec order.
 * Built lazily from `getUser()`, so the values always match `.env`.
 */
export function invalidLoginCases(): readonly InvalidLoginCase[] {
  const standard = getUser('standard');
  const lockedOut = getUser('lockedOut');
  const { password } = standard;
  const wrongPassword = 'wrong_password';

  return [
    { name: 'Locked-out user', username: lockedOut.username, password, expectedError: LOGIN_ERRORS.lockedOut, covers: 'AC-LOGIN-02' },
    { name: 'Wrong password', username: standard.username, password: wrongPassword, expectedError: LOGIN_ERRORS.noMatch, covers: 'AC-LOGIN-03' },
    { name: 'Unknown user', username: 'unknown_user', password, expectedError: LOGIN_ERRORS.noMatch, covers: 'AC-LOGIN-04' },
    { name: 'Empty username', username: '', password, expectedError: LOGIN_ERRORS.usernameRequired, covers: 'AC-LOGIN-05' },
    { name: 'Empty password', username: standard.username, password: '', expectedError: LOGIN_ERRORS.passwordRequired, covers: 'AC-LOGIN-06' },
    { name: 'Both fields empty', username: '', password: '', expectedError: LOGIN_ERRORS.usernameRequired, covers: 'AC-LOGIN-07' },
    { name: 'Username wrong case', username: standard.username.toUpperCase(), password, expectedError: LOGIN_ERRORS.noMatch, covers: 'AC-LOGIN-12' },
    { name: 'Password wrong case', username: standard.username, password: password.toUpperCase(), expectedError: LOGIN_ERRORS.noMatch, covers: 'AC-LOGIN-12' },
    { name: 'Username leading space', username: ` ${standard.username}`, password, expectedError: LOGIN_ERRORS.noMatch, covers: 'AC-LOGIN-12' },
    { name: 'Username trailing space', username: `${standard.username} `, password, expectedError: LOGIN_ERRORS.noMatch, covers: 'AC-LOGIN-12' },
    { name: 'Password trailing space', username: standard.username, password: `${password} `, expectedError: LOGIN_ERRORS.noMatch, covers: 'AC-LOGIN-12' },
    { name: 'Locked-out user + wrong password', username: lockedOut.username, password: wrongPassword, expectedError: LOGIN_ERRORS.noMatch, covers: 'AC-LOGIN-16' },
    { name: 'Injection-like input', username: "' OR 1=1 --", password: 'x', expectedError: LOGIN_ERRORS.noMatch, covers: 'AC-LOGIN-17' },
  ];
}

/** One row of TC-LOGIN-04: an account that must be able to log in. */
export interface AcceptedAccountCase {
  readonly name: string;
  readonly user: UserKey;
  /** Assertion timeout for this account, when it needs more than the default. */
  readonly timeout?: number;
}

/** The 4 other accepted accounts of TC-LOGIN-04, in spec order. */
export const ACCEPTED_ACCOUNTS: readonly AcceptedAccountCase[] = [
  { name: 'Problem user', user: 'problem' },
  // The inventory takes about 5 s to render for this account.
  { name: 'Performance glitch user', user: 'performanceGlitch', timeout: SLOW_RENDER_TIMEOUT },
  { name: 'Error user', user: 'error' },
  { name: 'Visual user', user: 'visual' },
];
