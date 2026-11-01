/**
 * Utilities for generating environment-aware authentication redirect URLs
 * compatible with React Router HashRouter and Supabase Auth.
 */

/**
 * Resolves the base application URL normalized without trailing slash.
 * Priority:
 * 1. If in browser and running on localhost / 127.0.0.1, use window.location.origin (e.g. http://localhost:5173).
 * 2. If VITE_APP_URL environment variable is defined, use that.
 * 3. Fallback to browser window.location.origin.
 * 4. Production fallback: "https://rentflow-portfolio-pi.vercel.app".
 */
export function getAppBaseUrl(): string {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".local");

    if (isLocalhost) {
      return window.location.origin.replace(/\/+$/, "");
    }
  }

  const envUrl = (import.meta.env.VITE_APP_URL as string | undefined)?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  return "https://rentflow-portfolio-pi.vercel.app";
}

/**
 * Returns the full callback or redirect URL formatted for HashRouter.
 * Guarantees no duplicate hashes or double slashes.
 *
 * Examples:
 * - Production: getAuthRedirectUrl("/auth/callback") -> "https://rentflow-portfolio-pi.vercel.app/#/auth/callback"
 * - Development: getAuthRedirectUrl("/auth/callback") -> "http://localhost:5173/#/auth/callback"
 * - Password Reset: getAuthRedirectUrl("/reset-password") -> "https://rentflow-portfolio-pi.vercel.app/#/reset-password"
 */
export function getAuthRedirectUrl(path: string = "/auth/callback"): string {
  const base = getAppBaseUrl();
  const cleanPath = path.replace(/^[/#]+/, "");
  return `${base}/#/${cleanPath}`;
}
