import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    const { error: err } = await signUp(email, password);
    setSubmitting(false);

    if (err) {
      setError(err);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cv-surface px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6 text-3xl font-extrabold tracking-tight text-cv-primary font-headline">ClaimVex</div>
          <div className="rounded-2xl border border-cv-outline-variant/20 bg-cv-surface-container-lowest p-8 shadow-lg">
            <div className="w-12 h-12 bg-cv-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-cv-secondary text-2xl">check_circle</span>
            </div>
            <h2 className="text-lg font-bold text-cv-on-surface mb-2">Check your email</h2>
            <p className="text-sm text-cv-on-surface-variant mb-6">
              We sent a confirmation link to <strong className="text-cv-on-surface">{email}</strong>. Click the link to activate your account.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-medical-gradient text-cv-on-primary py-3 text-sm font-bold rounded-lg shadow-sm hover:shadow-md hover:brightness-110 transition-all"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cv-surface px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="text-3xl font-extrabold tracking-tight text-cv-primary font-headline">
            ClaimVex
          </Link>
          <p className="mt-2 text-sm text-cv-on-surface-variant">Create your account</p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-cv-outline-variant/20 bg-cv-surface-container-lowest p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-cv-on-surface mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-cv-outline-variant/40 bg-cv-surface px-4 py-2.5 text-sm text-cv-on-surface placeholder:text-cv-on-surface-variant/50 focus:border-cv-primary focus:outline-none focus:ring-2 focus:ring-cv-primary/20"
                placeholder="you@practice.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-cv-on-surface mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-cv-outline-variant/40 bg-cv-surface px-4 py-2.5 text-sm text-cv-on-surface placeholder:text-cv-on-surface-variant/50 focus:border-cv-primary focus:outline-none focus:ring-2 focus:ring-cv-primary/20"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-semibold text-cv-on-surface mb-1.5">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-cv-outline-variant/40 bg-cv-surface px-4 py-2.5 text-sm text-cv-on-surface placeholder:text-cv-on-surface-variant/50 focus:border-cv-primary focus:outline-none focus:ring-2 focus:ring-cv-primary/20"
                placeholder="Repeat your password"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-cv-error-container/20 border border-cv-error/20 px-4 py-3 text-sm text-cv-error font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-medical-gradient text-cv-on-primary py-3 text-sm font-bold rounded-lg shadow-sm hover:shadow-md hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-cv-on-surface-variant">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-cv-secondary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
