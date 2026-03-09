
/**
 * Security utilities for the application.
 * Note: These are client-side checks and should be supplemented by
 * server-side authorization for sensitive data in a production environment.
 */

// We use char codes to avoid plaintext passcode strings in the source code
const DEFAULT_CODE = String.fromCharCode(86, 76, 89); // VLY

/**
 * Validates a passcode against the configured environment variable or the default.
 */
export const validatePasscode = (input: string): boolean => {
  const envPasscode = import.meta.env.VITE_APP_PASSCODE;
  const target = envPasscode || DEFAULT_CODE;
  return input.toUpperCase().trim() === target.toUpperCase().trim();
};

/**
 * Validates an admin/system-level passcode.
 */
export const validateSystemPasscode = (input: string): boolean => {
  const envPasscode = import.meta.env.VITE_SYSTEM_PASSCODE || import.meta.env.VITE_APP_PASSCODE;
  const target = envPasscode || DEFAULT_CODE;
  return input.toUpperCase().trim() === target.toUpperCase().trim();
};
