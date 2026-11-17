import { ENV, requireEnv } from '../utils/env';

/** Keys of the demo accounts published on the saucedemo login page. */
export type UserKey =
  | 'standard'
  | 'lockedOut'
  | 'problem'
  | 'performanceGlitch'
  | 'error'
  | 'visual';

export interface UserCredentials {
  readonly username: string;
  readonly password: string;
}

/** Maps each user key to the environment variable holding its username. */
const USERNAME_ENV: Readonly<Record<UserKey, string>> = {
  standard: 'STANDARD_USER',
  lockedOut: 'LOCKED_OUT_USER',
  problem: 'PROBLEM_USER',
  performanceGlitch: 'PERFORMANCE_GLITCH_USER',
  error: 'ERROR_USER',
  visual: 'VISUAL_USER',
};

/** Resolves credentials lazily, so only the users a run actually needs must be configured. */
export function getUser(key: UserKey): UserCredentials {
  return { username: requireEnv(USERNAME_ENV[key]), password: ENV.password };
}
