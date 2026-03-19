import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ValidationForm from "@/components/ValidationForm";
import ValidationResults from "@/components/ValidationResults";
import type { ValidationFormData } from "@/components/ValidationForm";
import { runValidation } from "@/services/validationService";
import type { ValidationResult } from "@/services/validationService";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState<ValidationResult | null>(null);

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  function handleValidate(data: ValidationFormData) {
    const validationResult = runValidation(data);
    setResult(validationResult);
  }

  function handleValidateAnother() {
    setResult(null);
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
      <main className="mx-auto max-w-3xl px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-headline font-extrabold text-cv-primary">
            {result ? "Validation Results" : "Validate a Claim"}
          </h1>
          <p className="mt-2 text-cv-on-surface-variant">
            {result
              ? "Review the results below. Click on any module to see details."
              : "Enter claim data below to check against all validation modules."}
          </p>
        </div>

        {result ? (
          <ValidationResults result={result} onValidateAnother={handleValidateAnother} />
        ) : (
          <ValidationForm onSubmit={handleValidate} />
        )}
      </main>
    </div>
  );
}
