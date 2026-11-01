import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

function extractAuthParams(): {
  code: string | null;
  error: string | null;
  errorDescription: string | null;
} {
  // 1. Check window.location.search (standard query params)
  const searchParams = new URLSearchParams(window.location.search);
  let code = searchParams.get("code");
  let error = searchParams.get("error");
  let errorDescription = searchParams.get("error_description");

  // 2. Check window.location.hash (HashRouter query or fragment params)
  const hash = window.location.hash;
  if (!code || !error || !errorDescription) {
    const qIndex = hash.indexOf("?");
    if (qIndex !== -1) {
      const hashParams = new URLSearchParams(hash.slice(qIndex + 1));
      if (!code) code = hashParams.get("code");
      if (!error) error = hashParams.get("error");
      if (!errorDescription) errorDescription = hashParams.get("error_description");
    }
  }

  // 3. Check for secondary hash fragment params e.g. #error_description=...
  if (!code || !error || !errorDescription) {
    const secondHash = hash.indexOf("#", 1);
    if (secondHash !== -1) {
      const fragParams = new URLSearchParams(hash.slice(secondHash + 1));
      if (!code) code = fragParams.get("code");
      if (!error) error = fragParams.get("error");
      if (!errorDescription) errorDescription = fragParams.get("error_description");
    }
  }

  return { code, error, errorDescription };
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const processCallback = async () => {
      const { code, error: errParam, errorDescription } = extractAuthParams();

      // Clean query parameters from URL to prevent duplicate processing on refresh
      if (window.location.search || window.location.hash.includes("?")) {
        window.history.replaceState(null, "", window.location.pathname + "#/auth/callback");
      }

      // Check if user is already authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        if (mounted) navigate("/dashboard", { replace: true });
        return;
      }

      // Handle confirmation or callback error from Supabase
      if (errorDescription || errParam) {
        const errorMsg = (errorDescription || errParam || "Email verification failed").replace(/\+/g, " ");
        if (mounted) setError(errorMsg);
        setTimeout(() => {
          if (mounted) {
            navigate(`/login?error_description=${encodeURIComponent(errorMsg)}`, { replace: true });
          }
        }, 2000);
        return;
      }

      // Handle PKCE code exchange
      if (code) {
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            // Check if Supabase auto-exchange already created the session
            const { data: retrySession } = await supabase.auth.getSession();
            if (retrySession.session) {
              if (mounted) navigate("/dashboard", { replace: true });
              return;
            }

            // Cross-device or code verifier mismatch:
            // The email was confirmed on Supabase, but session could not be established locally.
            // Direct user to log in with confirmed status.
            console.warn("PKCE code exchange notice:", exchangeError.message);
            if (mounted) navigate("/login?verified=true", { replace: true });
            return;
          }

          if (data?.session) {
            if (mounted) navigate("/dashboard", { replace: true });
          } else {
            if (mounted) navigate("/login?verified=true", { replace: true });
          }
        } catch (err: any) {
          console.error("Auth callback exchange error:", err);
          if (mounted) navigate("/login?verified=true", { replace: true });
        }
        return;
      }

      // Fallback: If no code or error is in the URL, verify if session exists or redirect to login
      const { data: finalCheck } = await supabase.auth.getSession();
      if (finalCheck.session) {
        if (mounted) navigate("/dashboard", { replace: true });
      } else {
        if (mounted) navigate("/login", { replace: true });
      }
    };

    processCallback();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-canvas)] p-6">
      <div className="flex max-w-sm flex-col items-center text-center">
        {error ? (
          <>
            <div className="mb-4 rounded-full bg-red-100 p-3">
              <div className="size-6 text-red-600 font-bold">!</div>
            </div>
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">Verification Failed</h2>
            <p className="mt-2 text-[14px] text-[var(--color-ink-soft)]">{error}</p>
          </>
        ) : (
          <>
            <Loader2 className="mb-4 size-8 animate-spin text-[var(--color-accent)]" />
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">Verifying your email</h2>
            <p className="mt-2 text-[14px] text-[var(--color-ink-soft)]">Please wait while we confirm your access...</p>
          </>
        )}
      </div>
    </div>
  );
}
