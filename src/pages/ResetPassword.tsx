import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Lock } from "lucide-react";
import { supabase } from "../lib/supabase";
import { BrandMark } from "../components/shell/BrandMark";
import { Button } from "../components/ui/Button";
import { Field, TextInput } from "../components/ui/Field";
import { parseAuthParamsFromUrl } from "../utils/authUrls";

type SessionStatus = "checking" | "valid" | "invalid";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initRecoverySession() {
      try {
        const params = parseAuthParamsFromUrl(window.location.href);

        // 1. Check for errors returned in the URL (e.g. otp_expired, link already used)
        if (params.errorDescription || params.error) {
          const errText = (params.errorDescription || params.error || "The password reset link is invalid or has expired.").replace(/\+/g, " ");
          if (mounted) {
            setError(errText);
            setSessionStatus("invalid");
          }
          window.history.replaceState(null, "", window.location.pathname + "#/reset-password");
          return;
        }

        // 2. If access_token and refresh_token are in URL (implicit flow, including double-hash URLs)
        if (params.accessToken) {
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: params.accessToken,
            refresh_token: params.refreshToken || "",
          });

          if (setSessionError) {
            if (mounted) {
              setError(setSessionError.message || "Failed to establish password recovery session. The link may have expired.");
              setSessionStatus("invalid");
            }
          } else if (data.session) {
            if (mounted) setSessionStatus("valid");
          } else {
            if (mounted) {
              setError("Could not establish a valid password recovery session.");
              setSessionStatus("invalid");
            }
          }

          // Clean URL of sensitive tokens
          window.history.replaceState(null, "", window.location.pathname + "#/reset-password");
          return;
        }

        // 3. If PKCE code is in URL
        if (params.code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);

          if (exchangeError) {
            // Check fallback session
            const { data: checkSession } = await supabase.auth.getSession();
            if (checkSession.session && mounted) {
              setSessionStatus("valid");
            } else if (mounted) {
              setError(exchangeError.message || "Invalid or expired recovery code.");
              setSessionStatus("invalid");
            }
          } else if (data.session && mounted) {
            setSessionStatus("valid");
          } else if (mounted) {
            setError("Could not exchange recovery code for an active session.");
            setSessionStatus("invalid");
          }

          window.history.replaceState(null, "", window.location.pathname + "#/reset-password");
          return;
        }

        // 4. If no tokens in URL, check if Supabase or a previous step already established a session
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          setSessionStatus("valid");
        } else if (mounted) {
          setError("No active password reset session found. Please request a new password recovery link.");
          setSessionStatus("invalid");
        }
      } catch (err: any) {
        console.error("Recovery initialization exception:", err);
        if (mounted) {
          setError(err.message || "An unexpected error occurred while verifying the recovery link.");
          setSessionStatus("invalid");
        }
      }
    }

    initRecoverySession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setSuccess(true);

      // Sign out recovery session cleanly so user logs in with new password
      await supabase.auth.signOut().catch(() => {});

      // Redirect to login with success parameter after brief confirmation
      setTimeout(() => {
        navigate("/login?password_reset=true", { replace: true });
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An error occurred while updating the password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-[var(--color-canvas)] lg:grid-cols-[1fr_1.05fr]">
      <div className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="animate-fade-rise w-full max-w-sm">
          <BrandMark className="mb-8" />

          {sessionStatus === "checking" && (
            <div className="flex flex-col items-center py-12 text-center">
              <Loader2 className="size-8 animate-spin text-[var(--color-accent)]" />
              <h2 className="mt-4 text-lg font-medium text-[var(--color-ink)]">
                Verifying password reset access
              </h2>
              <p className="mt-1 text-[13.5px] text-[var(--color-ink-soft)]">
                Connecting your recovery session...
              </p>
            </div>
          )}

          {sessionStatus === "invalid" && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-critical)]/10 text-[var(--color-critical)]">
                  <AlertCircle className="size-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-[var(--color-ink)]">
                    Reset link unavailable
                  </h1>
                  <p className="text-[13px] text-[var(--color-ink-soft)]">
                    Session could not be verified
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--color-critical)]/15 bg-[var(--color-critical)]/10 p-4 text-[13.5px] leading-relaxed text-[var(--color-critical)]">
                {error || "This password reset link is invalid, expired, or has already been used."}
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  className="w-full justify-center"
                  onClick={() => navigate("/login?forgot=true", { replace: true })}
                >
                  Request a new reset link
                </Button>
                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => navigate("/login", { replace: true })}
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                  >
                    <ArrowLeft className="size-3.5" /> Back to sign in
                  </button>
                </div>
              </div>
            </div>
          )}

          {sessionStatus === "valid" && (
            <div>
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                  Security
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">
                  Create new password
                </h1>
                <p className="text-[14px] text-[var(--color-ink-soft)]">
                  Enter and confirm your new password below.
                </p>
              </div>

              {success ? (
                <div className="mt-8 rounded-xl border border-[#8c9a6e]/30 bg-[#8c9a6e]/15 p-5 text-center text-[#2b3428]">
                  <CheckCircle2 className="mx-auto size-8 text-[#8c9a6e]" />
                  <p className="mt-2 font-medium">Password updated successfully!</p>
                  <p className="mt-1 text-xs opacity-85">Redirecting to login...</p>
                </div>
              ) : (
                <form onSubmit={handleReset} className="mt-8 space-y-5">
                  <Field label="New password">
                    <TextInput
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Minimum 6 characters"
                      disabled={isSubmitting}
                      autoFocus
                    />
                  </Field>

                  <Field label="Confirm new password">
                    <TextInput
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Re-enter your new password"
                      disabled={isSubmitting}
                    />
                  </Field>

                  {error && (
                    <div className="rounded-xl border border-[var(--color-critical)]/15 bg-[var(--color-critical)]/10 p-3.5 text-[13px] text-[var(--color-critical)]">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full justify-center"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" /> Updating password...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <Lock className="size-4" /> Save new password
                      </span>
                    )}
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Decorative panel */}
      <div className="hidden bg-[var(--color-surface)] lg:block" />
    </div>
  );
}
