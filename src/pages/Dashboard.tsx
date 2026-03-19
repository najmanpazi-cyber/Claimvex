import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-cv-surface">
      {/* Top Nav */}
      <nav className="border-b border-cv-outline-variant/30 bg-cv-surface-container-lowest">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8 py-4">
          <Link to="/dashboard" className="text-2xl font-extrabold tracking-tight text-cv-primary font-headline">
            ClaimVex
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-cv-on-surface-variant font-medium hidden sm:inline">
              {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-semibold text-cv-error hover:bg-cv-error-container/20 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-headline font-extrabold text-cv-primary">Welcome to ClaimVex</h1>
          <p className="mt-2 text-cv-on-surface-variant">CPT Coding Validation Engine</p>
        </div>

        {/* Placeholder Card */}
        <div className="rounded-2xl border border-cv-outline-variant/20 bg-cv-surface-container-lowest p-10 text-center shadow-sm">
          <div className="w-16 h-16 bg-cv-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <span className="material-symbols-outlined text-cv-secondary text-3xl">fact_check</span>
          </div>
          <h2 className="text-xl font-bold text-cv-on-surface mb-2">Validation Form Coming Soon</h2>
          <p className="text-sm text-cv-on-surface-variant max-w-md mx-auto">
            In the next phase, you&apos;ll be able to enter CPT codes, modifiers, and dates of service to validate claims against all 5 rule modules.
          </p>
        </div>
      </main>
    </div>
  );
}
