/**
 * Utilities for generating and parsing environment-aware authentication redirect URLs
 * compatible with React Router HashRouter and Supabase Auth.
 */

/**
 * Resolves the base application URL normalized without trailing slash.
 * Priority:
 * 1. If in browser and running on localhost / 127.0.0.1, use window.location.origin (e.g. http://localhost:5173).
 * 2. If VITE_APP_URL environment variable is defined, use that.
 * 3. Fallback to browser window.location.origin.
 * 4. Production fallback: "https://rent-flow-pied.vercel.app".
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

  return "https://rent-flow-pied.vercel.app";
}

/**
 * Returns the full callback or redirect URL formatted for HashRouter.
 * Guarantees no duplicate hashes or double slashes.
 *
 * Examples:
 * - Production: getAuthRedirectUrl("/auth/callback") -> "https://rent-flow-pied.vercel.app/#/auth/callback"
 * - Development: getAuthRedirectUrl("/auth/callback") -> "http://localhost:5173/#/auth/callback"
 * - Password Reset: getAuthRedirectUrl("/reset-password") -> "https://rent-flow-pied.vercel.app/#/reset-password"
 */
export function getAuthRedirectUrl(path: string = "/auth/callback"): string {
  const base = getAppBaseUrl();
  const cleanPath = path.replace(/^[/#]+/, "");
  return `${base}/#/${cleanPath}`;
}

export interface ExtractedAuthParams {
  accessToken: string | null;
  refreshToken: string | null;
  type: string | null;
  code: string | null;
  error: string | null;
  errorCode: string | null;
  errorDescription: string | null;
}

/**
 * Robustly parses auth tokens, codes, and error parameters from any combination
 * of search queries and hash fragments, including HashRouter double-hash URLs like:
 * `/#/reset-password#access_token=...&refresh_token=...&type=recovery`
 * or `/#/reset-password?code=...`
 */
export function parseAuthParamsFromUrl(href: string = window.location.href): ExtractedAuthParams {
  const result: ExtractedAuthParams = {
    accessToken: null,
    refreshToken: null,
    type: null,
    code: null,
    error: null,
    errorCode: null,
    errorDescription: null,
  };

  try {
    const url = new URL(href);

    // 1. Check standard URL search parameters (?key=val)
    url.searchParams.forEach((val, key) => {
      assignAuthParam(result, key, val);
    });

    // 2. Check hash fragments. In HashRouter apps, Supabase tokens may appear after a secondary '#'
    // or as a query string attached to the hash route (e.g. #/route#access_token=... or #/route?code=...)
    const hash = url.hash;
    if (hash) {
      const chunks = hash.split("#").filter(Boolean);
      for (const chunk of chunks) {
        const qIndex = chunk.indexOf("?");
        const paramStrings: string[] = [];

        if (qIndex !== -1) {
          paramStrings.push(chunk.slice(qIndex + 1));
        }

        if (chunk.includes("=")) {
          paramStrings.push(qIndex !== -1 ? chunk.slice(0, qIndex) : chunk);
        }

        for (const ps of paramStrings) {
          const sp = new URLSearchParams(ps);
          sp.forEach((val, key) => {
            const cleanKey = key.includes("/") ? key.split("/").pop()! : key;
            assignAuthParam(result, cleanKey, val);
          });
        }
      }
    }
  } catch (err) {
    console.error("Failed to parse auth params from URL:", err);
  }

  return result;
}

function assignAuthParam(result: ExtractedAuthParams, key: string, val: string) {
  const k = key.trim().toLowerCase();
  const v = val.trim();
  if (!v) return;

  if (k === "access_token") result.accessToken = v;
  else if (k === "refresh_token") result.refreshToken = v;
  else if (k === "type") result.type = v;
  else if (k === "code") result.code = v;
  else if (k === "error") result.error = v;
  else if (k === "error_code") result.errorCode = v;
  else if (k === "error_description") result.errorDescription = v;
}
