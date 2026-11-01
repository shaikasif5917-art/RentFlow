import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Loader2, RefreshCw, Pencil, ShieldCheck } from "lucide-react";
import { BrandMark } from "../components/shell/BrandMark";
import { Button } from "../components/ui/Button";
import { OtpInput } from "../components/auth/OtpInput";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { getAuthRedirectUrl } from "../utils/authUrls";

type AuthMode = "signin" | "signup" | "forgot" | "verify";

const loginImages = [
  "https://images.pexels.com/photos/1099065/pexels-photo-1099065.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1600&w=1200",
  "https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1600&w=1200",
  "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1600&w=1200",
  "https://images.pexels.com/photos/259685/pexels-photo-259685.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1600&w=1200",
];

export default function Login() {
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [bgImage, setBgImage] = useState(loginImages[0]);

  useEffect(() => {
    setBgImage(loginImages[Math.floor(Math.random() * loginImages.length)]);
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    // Check both search and hash query strings for verification or error parameters
    const getParam = (name: string): string | null => {
      const searchVal = new URLSearchParams(window.location.search).get(name);
      if (searchVal) return searchVal;
      const hash = window.location.hash;
      const qIndex = hash.indexOf("?");
      if (qIndex !== -1) {
        return new URLSearchParams(hash.slice(qIndex + 1)).get(name);
      }
      return null;
    };

    const errorDesc = getParam("error_description");
    const verified = getParam("verified");
    const passwordReset = getParam("password_reset");
    const forgotParam = getParam("forgot");
    
    if (errorDesc) {
      setError(errorDesc.replace(/\+/g, " "));
      window.history.replaceState(null, "", window.location.pathname + "#/login");
    } else if (passwordReset) {
      setMessage("Password updated successfully! You can now sign in with your new password.");
      setMode("signin");
      window.history.replaceState(null, "", window.location.pathname + "#/login");
    } else if (verified) {
      setMessage("Email verified successfully! You can now sign in.");
      setMode("signin");
      window.history.replaceState(null, "", window.location.pathname + "#/login");
    } else if (forgotParam) {
      setMode("forgot");
      window.history.replaceState(null, "", window.location.pathname + "#/login");
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      navigate("/dashboard", { replace: true });
    }
  }, [session, navigate]);

  const verifyOtpCode = async (codeToVerify: string) => {
    if (codeToVerify.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      let { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: codeToVerify.trim(),
        type: "signup",
      });

      // Fallback for setups where Supabase treats unconfirmed verification as type 'email'
      if (verifyError) {
        const fallback = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: codeToVerify.trim(),
          type: "email",
        });
        if (!fallback.error && fallback.data?.session) {
          data = fallback.data;
          verifyError = null;
        }
      }

      if (verifyError) throw verifyError;

      if (data?.session) {
        navigate("/dashboard", { replace: true });
      } else {
        setMessage("Email verified! You can now sign in.");
        setMode("signin");
      }
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setError(null);
    setMessage(null);

    try {
      const callbackUrl = getAuthRedirectUrl("/auth/callback");
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: callbackUrl,
        },
      });
      if (resendError) throw resendError;
      setMessage("A fresh 6-digit verification code has been sent to your email.");
      setCooldown(60);
    } catch (err: any) {
      if (err.status === 429 || (err.message && err.message.toLowerCase().includes("rate limit"))) {
        setError("Please wait a moment before requesting another code.");
        setCooldown(60);
      } else {
        setError(err.message || "Unable to resend verification code. Please try again.");
      }
    } finally {
      setIsResending(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "verify") {
        await verifyOtpCode(otp);
      } else if (mode === "signup") {
        const callbackUrl = getAuthRedirectUrl("/auth/callback");
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: callbackUrl,
            data: {
              full_name: fullName.trim(),
            },
          },
        });
        if (signUpError) throw signUpError;
        
        if (data.user && !data.session) {
          setMode("verify");
          setOtp("");
          setCooldown(60);
          setMessage(`We've sent a 6-digit code to ${email.trim()}.`);
        } else {
          setMessage("Account created successfully!");
          navigate("/dashboard", { replace: true });
        }
      } else if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          if (signInError.message.toLowerCase().includes("email not confirmed")) {
            setMode("verify");
            setOtp("");
            setMessage("Your email has not been verified yet. Enter the 6-digit code below.");
            const callbackUrl = getAuthRedirectUrl("/auth/callback");
            supabase.auth
              .resend({
                type: "signup",
                email: email.trim(),
                options: {
                  emailRedirectTo: callbackUrl,
                },
              })
              .catch(() => {});
            setCooldown(60);
            return;
          }
          throw signInError;
        }
      } else if (mode === "forgot") {
        const resetPasswordUrl = getAuthRedirectUrl("/reset-password");
        const { error: forgotError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: resetPasswordUrl,
        });
        if (forgotError) throw forgotError;
        setMessage("Password reset instructions sent. Please check your email.");
        setMode("signin");
      }
    } catch (err: any) {
      if (err.status === 429 || (err.message && err.message.toLowerCase().includes("rate limit"))) {
        setError("Too many requests. Please wait a moment before trying again.");
        if (mode === "forgot") setCooldown(60);
      } else {
        setError(err.message || "An error occurred during authentication.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-[var(--color-canvas)] lg:grid-cols-[1fr_1.1fr]">
      {/* Auth panel */}
      <div className="flex items-center justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
        <div className="animate-fade-rise w-full max-w-[420px]">
          <BrandMark />

          <div className="mt-14 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              {mode === "forgot"
                ? "Account Recovery"
                : mode === "verify"
                ? "Email Verification"
                : "Private access"}
            </p>
            <h1 className="font-serif text-[1.75rem] font-medium leading-[1.1] tracking-tight text-[var(--color-ink)] sm:text-4xl">
              {mode === "signup"
                ? "Create your portfolio"
                : mode === "forgot"
                ? "Reset password"
                : mode === "verify"
                ? "Enter 6-digit code"
                : "Enter your portfolio"}
            </h1>
            <p className="text-[14.5px] text-[var(--color-ink-soft)] leading-relaxed">
              {mode === "signup" ? (
                "Sign up for your property command center."
              ) : mode === "forgot" ? (
                "Enter your email to receive password recovery instructions."
              ) : mode === "verify" ? (
                <span>
                  Enter the 6-digit code sent to{" "}
                  <span className="font-semibold text-[var(--color-ink)] break-all">{email}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                      setMessage(null);
                    }}
                    className="ml-1.5 inline-flex items-center gap-1 font-medium text-[var(--color-accent)] hover:underline underline-offset-2"
                  >
                    <Pencil className="size-3" /> Edit
                  </button>
                </span>
              ) : (
                "Sign in to your property command center."
              )}
            </p>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-xl bg-[var(--color-critical)]/10 p-3.5 text-[13.5px] text-[var(--color-critical)] border border-[var(--color-critical)]/15 shadow-sm">
                {error}
              </div>
            )}
            
            {message && (
              <div className="rounded-xl bg-[var(--color-positive)]/10 p-3.5 text-[13.5px] text-[var(--color-positive)] border border-[var(--color-positive)]/15 shadow-sm">
                {message}
              </div>
            )}

            {mode === "verify" && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-medium text-[var(--color-ink-soft)]">
                      Security Code
                    </label>
                    <span className="text-[12px] text-[var(--color-ink-faint)]">
                      6 digits
                    </span>
                  </div>
                  <OtpInput
                    value={otp}
                    onChange={(val) => {
                      setOtp(val);
                      if (error) setError(null);
                    }}
                    onComplete={(code) => {
                      verifyOtpCode(code);
                    }}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between pt-1 text-[13px]">
                  <span className="text-[var(--color-ink-soft)]">Didn't get the code?</span>
                  {cooldown > 0 ? (
                    <span className="font-medium text-[var(--color-ink-faint)]">
                      Resend in {cooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isResending}
                      className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-accent)] hover:text-[var(--color-ink)] hover:underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      {isResending ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="size-3.5" />
                      )}
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            )}

            {mode === "signup" && (
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[var(--color-ink-soft)]">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/80 bg-white/70 px-4 text-[14px] text-[var(--color-ink)] backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.02),0_1px_2px_rgba(255,255,255,0.7)] transition-all duration-200 placeholder:text-[var(--color-ink-faint)] hover:bg-white/85 focus:border-[var(--color-accent)] focus:bg-white/95 focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]/15 focus:shadow-[0_4px_16px_rgba(163,90,64,0.14)]"
                />
              </div>
            )}

            {mode !== "verify" && (
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[var(--color-ink-soft)]">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/80 bg-white/70 px-4 text-[14px] text-[var(--color-ink)] backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.02),0_1px_2px_rgba(255,255,255,0.7)] transition-all duration-200 placeholder:text-[var(--color-ink-faint)] hover:bg-white/85 focus:border-[var(--color-accent)] focus:bg-white/95 focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]/15 focus:shadow-[0_4px_16px_rgba(163,90,64,0.14)]"
                />
              </div>
            )}
            
            {mode !== "forgot" && mode !== "verify" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-medium text-[var(--color-ink-soft)]">Password</label>
                  {mode === "signin" && (
                    <button 
                      type="button" 
                      onClick={() => setMode("forgot")}
                      className="text-[12.5px] font-medium text-[var(--color-accent)] transition-colors hover:text-[var(--color-ink)] hover:underline underline-offset-2"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/80 bg-white/70 px-4 text-[14px] text-[var(--color-ink)] backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.02),0_1px_2px_rgba(255,255,255,0.7)] transition-all duration-200 placeholder:text-[var(--color-ink-faint)] hover:bg-white/85 focus:border-[var(--color-accent)] focus:bg-white/95 focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]/15 focus:shadow-[0_4px_16px_rgba(163,90,64,0.14)]"
                />
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                variant={mode === "verify" ? "primary" : "primary"}
                disabled={isLoading || (mode === "forgot" && cooldown > 0) || (mode === "verify" && otp.length !== 6)}
                className="h-12 w-full text-[14.5px] shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
                iconRight={isLoading ? <Loader2 className="animate-spin" /> : mode === "verify" ? <ShieldCheck className="size-4" /> : <ArrowRight />}
              >
                {isLoading 
                  ? "Verifying..." 
                  : mode === "signup" 
                  ? "Create account" 
                  : mode === "forgot" 
                  ? (cooldown > 0 ? `Try again in ${cooldown}s` : "Send reset link")
                  : mode === "verify"
                  ? "Verify & Continue"
                  : "Sign in"}
              </Button>
            </div>
            
            <div className="mt-6 text-center text-[13.5px] text-[var(--color-ink-soft)]">
              {mode === "signin" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                      setMessage(null);
                    }}
                    className="font-semibold text-[var(--color-accent)] transition-colors hover:text-[var(--color-ink)] hover:underline underline-offset-2"
                  >
                    Sign up
                  </button>
                </>
              ) : mode === "verify" ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setMessage(null);
                      setError(null);
                      setOtp("");
                    }}
                    className="font-semibold text-[var(--color-accent)] transition-colors hover:text-[var(--color-ink)] hover:underline underline-offset-2"
                  >
                    Back to Sign In
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setMessage(null);
                      setError(null);
                    }}
                    className="font-semibold text-[var(--color-accent)] transition-colors hover:text-[var(--color-ink)] hover:underline underline-offset-2"
                  >
                    Back to Sign In
                  </button>
                </>
              )}
            </div>
          </form>

          <div className="mt-12 flex items-center gap-2 text-[12.5px] text-[var(--color-ink-faint)]">
            <Lock className="size-4 stroke-[1.5]" />
            Secured private workspace · 6-digit OTP verification
          </div>
        </div>
      </div>

      {/* Editorial imagery */}
      <div className="relative hidden lg:block overflow-hidden">
        <img
          src={bgImage}
          alt="Property"
          className="absolute inset-0 size-full object-cover transition-transform duration-[20s] ease-out hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2b3428]/95 via-transparent to-transparent opacity-85" />
        
        <div className="absolute inset-x-0 bottom-0 p-12 lg:p-16 xl:p-20 flex flex-col justify-end">
          <p className="max-w-md font-serif text-3xl md:text-4xl lg:text-[2.5rem] font-medium leading-[1.15] text-white/95 text-balance">
            A seamless workspace to manage your real estate.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <div className="h-px w-8 bg-white/30" />
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/70">
              RentFlow · Property Management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
