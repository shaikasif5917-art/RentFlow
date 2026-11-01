import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { parseAuthParamsFromUrl } from "../utils/authUrls";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const processCallback = async () => {
      const params = parseAuthParamsFromUrl(window.location.href);

      // Clean query parameters from URL to prevent duplicate processing on refresh
      if (window.location.search || window.location.hash.includes("?")) {
        window.history.replaceState(null, "", window.location.pathname + "#/auth/callback");
      }

      // Check if user is already authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        if (params.type === "recovery") {
          if (mounted) navigate("/reset-password", { replace: true });
        } else {
          if (mounted) navigate("/dashboard", { replace: true });
        }
        return;
      }

      // Handle confirmation or callback error from Supabase
      if (params.errorDescription || params.error) {
        const errorMsg = (params.errorDescription || params.error || "Authentication verification failed").replace(/\+/g, " ");
        if (mounted) setError(errorMsg);
        setTimeout(() => {
          if (mounted) {
            navigate(`/login?error_description=${encodeURIComponent(errorMsg)}`, { replace: true });
          }
        }, 2000);
        return;
      }

      // Handle recovery flow via access token or code
      if (params.type === "recovery") {
        if (params.accessToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.accessToken,
            refresh_token: params.refreshToken || "",
          });
          if (sessionError) {
            console.error("Recovery setSession error:", sessionError);
            if (mounted) navigate(`/login?error_description=${encodeURIComponent(sessionError.message)}`, { replace: true });
            return;
          }
          if (mounted) navigate("/reset-password", { replace: true });
          return;
        }

        if (params.code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
          if (exchangeError) {
            console.error("Recovery exchange error:", exchangeError);
            if (mounted) navigate(`/login?error_description=${encodeURIComponent(exchangeError.message)}`, { replace: true });
            return;
          }
          if (mounted) navigate("/reset-password", { replace: true });
          return;
        }
      }

      // Handle implicit grant access token (general login/signup)
      if (params.accessToken) {
        try {
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: params.accessToken,
            refresh_token: params.refreshToken || "",
          });
          if (!setSessionError && data.session) {
            if (mounted) navigate("/dashboard", { replace: true });
            return;
          }
        } catch (err) {
          console.error("Access token setSession error:", err);
        }
      }

      // Handle PKCE code exchange
      if (params.code) {
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);

          if (exchangeError) {
            // Check if Supabase auto-exchange already created the session
            const { data: retrySession } = await supabase.auth.getSession();
            if (retrySession.session) {
              if (mounted) navigate("/dashboard", { replace: true });
              return;
            }

            // Cross-device or code verifier mismatch:
            // Email was confirmed on Supabase, but session could not be established locally.
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
              <div className="size-6 font-bold text-red-600">!</div>
            </div>
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">Verification Failed</h2>
            <p className="mt-2 text-[14px] text-[var(--color-ink-soft)]">{error}</p>
          </>
        ) : (
          <>
            <Loader2 className="mb-4 size-8 animate-spin text-[var(--color-accent)]" />
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">Verifying authentication</h2>
            <p className="mt-2 text-[14px] text-[var(--color-ink-soft)]">Please wait while we confirm your access...</p>
          </>
        )}
      </div>
    </div>
  );
}
