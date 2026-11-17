/**
 * Typed access to environment variables loaded from `.env` (see `.env.example`).
 * Missing variables fail fast with a clear message instead of producing
 * confusing locator timeouts later in a test.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') {
    throw new Error(
      `Missing environment variable "${name}". Copy .env.example to .env and fill in the values.`,
    );
  }
  return value;
}

export const ENV = {
  get baseURL(): string {
    return process.env.BASE_URL ?? 'https://www.saucedemo.com';
  },
  get password(): string {
    return requireEnv('PASSWORD');
  },
} as const;
