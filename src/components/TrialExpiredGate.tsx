export default function TrialExpiredGate() {
  return (
    <div className="rounded-2xl border border-cv-outline-variant/20 bg-cv-surface-container-lowest p-10 text-center shadow-sm">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <span className="material-symbols-outlined text-gray-400 text-3xl">lock</span>
      </div>
      <h2 className="text-xl font-bold text-cv-on-surface mb-3">Your free trial has ended</h2>
      <p className="text-sm text-cv-on-surface-variant max-w-lg mx-auto mb-6 leading-relaxed">
        Your validation history and metrics are still available.
        To continue using ClaimVex at our founding partner rate of <strong className="text-cv-on-surface">$99/month</strong>,
        contact Pazi at{" "}
        <a href="mailto:pazi@claimvex.com" className="text-cv-secondary font-semibold hover:underline">
          pazi@claimvex.com
        </a>.
      </p>
      <div className="flex justify-center gap-4">
        <a
          href="mailto:pazi@claimvex.com?subject=ClaimVex%20—%20Continue%20subscription"
          className="bg-medical-gradient text-cv-on-primary px-8 py-3 text-sm font-bold rounded-lg shadow-sm hover:shadow-md hover:brightness-110 transition-all"
        >
          Contact Pazi
        </a>
        <a
          href="/history"
          className="px-6 py-3 text-sm font-semibold text-cv-on-surface-variant hover:bg-cv-surface-container-high rounded-lg transition-colors border border-cv-outline-variant/30"
        >
          View History & Metrics
        </a>
      </div>
    </div>
  );
}
