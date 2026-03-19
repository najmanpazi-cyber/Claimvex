import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: err } = await signIn(email, password);
    setSubmitting(false);

    if (err) {
      setError(err);
    } else {
      navigate("/dashboard", { replace: true });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cv-surface px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="text-3xl font-extrabold tracking-tight text-cv-primary font-headline">
            ClaimVex
          </Link>
          <p className="mt-2 text-sm text-cv-on-surface-variant">Sign in to your account</p>
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-cv-outline-variant/40 bg-cv-surface px-4 py-2.5 text-sm text-cv-on-surface placeholder:text-cv-on-surface-variant/50 focus:border-cv-primary focus:outline-none focus:ring-2 focus:ring-cv-primary/20"
                placeholder="Enter your password"
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
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-cv-on-surface-variant">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-semibold text-cv-secondary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
