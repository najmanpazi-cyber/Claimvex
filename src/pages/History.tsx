import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fetchValidations, computeMetrics } from "@/services/historyService";
import { fetchTrialStatus } from "@/services/trialService";
import type { StoredValidation, UserMetrics } from "@/services/historyService";
import type { TrialStatus } from "@/services/trialService";
import ValidationResults from "@/components/ValidationResults";
import TrialBanner from "@/components/TrialBanner";
import TrialBadge from "@/components/TrialBadge";

function MetricCard({ label, value, icon, accent = false }: { label: string; value: string; icon: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? "bg-cv-secondary/5 border-cv-secondary/20" : "bg-cv-surface-container-lowest border-cv-outline-variant/20"}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className={`material-symbols-outlined text-xl ${accent ? "text-cv-secondary" : "text-cv-on-surface-variant"}`}>{icon}</span>
        <span className="text-xs font-bold uppercase tracking-wider text-cv-on-surface-variant">{label}</span>
      </div>
      <div className={`text-2xl font-extrabold font-headline ${accent ? "text-cv-secondary" : "text-cv-primary"}`}>{value}</div>
    </div>
  );
}

export default function History() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [validations, setValidations] = useState<StoredValidation[]>([]);
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [trial, setTrial] = useState<TrialStatus | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchTrialStatus(user.id).then(setTrial);
    async function load() {
      const { data, error: err } = await fetchValidations(user!.id);
      if (err) {
        setError(err);
      } else {
        setValidations(data);
        setMetrics(computeMetrics(data));
      }
      setLoading(false);
    }
    load();
  }, [user]);

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
    });
  }

  return (
    <div className="min-h-screen bg-cv-surface">
      {/* Trial Banner */}
      {trial?.showBanner && <TrialBanner daysRemaining={trial.daysRemaining} />}

      {/* Top Nav */}
      <nav className="border-b border-cv-outline-variant/30 bg-cv-surface-container-lowest">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8 py-4">
          <Link to="/dashboard" className="text-2xl font-extrabold tracking-tight text-cv-primary font-headline">
            ClaimVex
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4 text-sm font-semibold">
              <Link to="/dashboard" className="text-cv-on-surface-variant hover:text-cv-primary transition-colors">Validate</Link>
              <Link to="/history" className="text-cv-primary border-b-2 border-cv-secondary pb-0.5">History</Link>
            </div>
            {trial && <TrialBadge status={trial} />}
            <span className="text-sm text-cv-on-surface-variant font-medium hidden md:inline">{user?.email}</span>
            <button onClick={handleSignOut} className="px-4 py-2 text-sm font-semibold text-cv-error hover:bg-cv-error-container/20 rounded-lg transition-colors">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-headline font-extrabold text-cv-primary">Validation History</h1>
          <p className="mt-2 text-cv-on-surface-variant">Your past validations and aggregate metrics.</p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-cv-on-surface-variant text-sm">Loading history...</div>
        ) : error ? (
          <div className="rounded-xl bg-cv-error-container/20 border border-cv-error/20 p-6 text-sm text-cv-error">
            {error}
          </div>
        ) : (
          <>
            {/* Metrics Dashboard */}
            {metrics && metrics.totalValidations > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
                <MetricCard label="Validations" value={String(metrics.totalValidations)} icon="assignment_turned_in" />
                <MetricCard label="Errors Caught" value={String(metrics.totalErrors)} icon="error" />
                <MetricCard label="Warnings" value={String(metrics.totalWarnings)} icon="warning" />
                <MetricCard label="Error Rate" value={`${metrics.errorRate.toFixed(1)}%`} icon="percent" />
                <MetricCard label="Denials Prevented" value={String(metrics.estimatedDenialsPrevented)} icon="shield" />
                <MetricCard label="Est. Savings" value={`$${metrics.estimatedSavings.toLocaleString()}`} icon="savings" accent />
              </div>
            )}

            {/* Empty State */}
            {validations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-cv-outline-variant/30 bg-cv-surface-container-lowest p-12 text-center">
                <span className="material-symbols-outlined text-cv-on-surface-variant/30 text-5xl mb-4 block">history</span>
                <h2 className="text-lg font-bold text-cv-on-surface mb-2">No validations yet</h2>
                <p className="text-sm text-cv-on-surface-variant mb-6">Run your first validation to start tracking metrics.</p>
                <Link
                  to="/dashboard"
                  className="inline-block bg-medical-gradient text-cv-on-primary px-6 py-3 text-sm font-bold rounded-lg shadow-sm hover:shadow-md hover:brightness-110 transition-all"
                >
                  Run First Validation
                </Link>
              </div>
            ) : (
              /* History Table */
              <div className="rounded-2xl border border-cv-outline-variant/20 bg-cv-surface-container-lowest overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cv-outline-variant/20 bg-cv-surface-container-low">
                      <th className="text-left px-5 py-3 font-bold text-cv-on-surface-variant text-xs uppercase tracking-wider">Date</th>
                      <th className="text-left px-5 py-3 font-bold text-cv-on-surface-variant text-xs uppercase tracking-wider">CPT Codes</th>
                      <th className="text-center px-5 py-3 font-bold text-cv-on-surface-variant text-xs uppercase tracking-wider">Status</th>
                      <th className="text-center px-5 py-3 font-bold text-cv-on-surface-variant text-xs uppercase tracking-wider">Errors</th>
                      <th className="text-center px-5 py-3 font-bold text-cv-on-surface-variant text-xs uppercase tracking-wider">Warnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validations.map((v) => (
                      <tr key={v.id} className="border-b border-cv-outline-variant/10 last:border-b-0">
                        <td colSpan={5} className="p-0">
                          <button
                            onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                            className="w-full grid grid-cols-5 items-center text-left hover:bg-cv-surface-container-low/50 transition-colors"
                          >
                            <span className="px-5 py-4 text-cv-on-surface font-medium whitespace-nowrap">
                              {formatDate(v.created_at)}
                            </span>
                            <span className="px-5 py-4 text-cv-on-surface font-mono text-xs">
                              {v.input_data.cptCodes?.join(", ") ?? "—"}
                            </span>
                            <span className="px-5 py-4 text-center">
                              <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                                v.overall_status === "clean"
                                  ? "bg-green-50 text-green-700 border border-green-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}>
                                {v.overall_status === "clean" ? "Clean" : "Issues"}
                              </span>
                            </span>
                            <span className="px-5 py-4 text-center font-bold text-red-600">{v.errors_found || "—"}</span>
                            <span className="px-5 py-4 text-center font-bold text-amber-600">{v.warnings_found || "—"}</span>
                          </button>
                          {expandedId === v.id && (
                            <div className="px-5 pb-5 border-t border-cv-outline-variant/10">
                              <ValidationResults
                                result={v.results}
                                onValidateAnother={() => navigate("/dashboard")}
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
