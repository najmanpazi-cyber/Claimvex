import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, CheckCircle2, XCircle, AlertTriangle,
  Brain, Copy, FileText, TrendingUp, Shield,
  ChevronDown, ChevronUp, Clock, Zap, Users, DollarSign,
} from "lucide-react";

/* ─── SEO meta is set in index.html ─── */

const PRODUCT_NAME = "Claive";

/* ─── DATA ─────────────────────────────────────────────── */

const painStats = [
  { value: "11.8%", label: "Orthopedic claim denial rate in 2024", source: "SPRY RCM" },
  { value: "15–20%", label: "Denial rate for shoulder arthroscopy", source: "Viaante, 2026" },
  { value: "≤85%", label: "Collection rate when billing errors persist", source: "SPSRCM" },
  { value: "$7K+", label: "Revenue lost per miscoded $15K procedure", source: "SPSRCM" },
];

const features = [
  { icon: Brain,      title: "Primary CPT with confidence score",       desc: "High / Medium / Low — so you know exactly when to double-check." },
  { icon: FileText,   title: "ICD-10 codes, sequenced correctly",        desc: "Reason for visit first. Medical necessity explained for each code." },
  { icon: Shield,     title: "Modifier recommendations + rationale",     desc: "-LT/-RT/-25/-50/-59/XE/XS/XP/XU with payer-specific guidance." },
  { icon: TrendingUp, title: "RVU display + global period",              desc: "Know the work RVU and global period (0/10/90-day) for every code." },
  { icon: Zap,        title: "Add-on codes surfaced automatically",       desc: "Never miss a +code. Paired to its required primary automatically." },
  { icon: Clock,      title: "Payer-aware coding",                       desc: "Medicare, Medicaid, Commercial — different rules applied automatically." },
  { icon: Copy,       title: "NCCI bundling checks",                     desc: "Catches bundling errors before they become denials." },
  { icon: Users,      title: "Missing documentation alerts",             desc: "Tells you exactly what to request from the surgeon before submitting." },
];

const steps = [
  {
    step: "01",
    title: "Paste de-identified clinical notes",
    desc: "Copy operative notes or encounter documentation. Select laterality, setting, payer type, and global period status.",
  },
  {
    step: "02",
    title: "AI analyzes in 3–5 seconds",
    desc: "Claive checks your documentation against orthopedic CPT rules, NCCI bundles, modifier requirements, and your payer's specific policies.",
  },
  {
    step: "03",
    title: "Verify, copy, and submit",
    desc: "Review the full coding package — CPT, ICD-10, modifiers, RVU, rationale. Check the verification box and copy straight to your billing system.",
  },
];

const personas = [
  {
    icon: "🗂️",
    title: "Medical Coders",
    subtitle: "CPC / CCS Certified",
    desc: "Process 40–80 encounters daily with complex laterality, bundling, and modifier rules. Get an AI second opinion in seconds without slowing your workflow.",
  },
  {
    icon: "🏥",
    title: "Billing Staff",
    subtitle: "Office Managers & Billing Coordinators",
    desc: "Reduce denials without deep coding expertise. Missing documentation alerts tell you exactly what to request before submitting the claim.",
  },
  {
    icon: "🩺",
    title: "Solo Surgeons",
    subtitle: "Small Orthopedic Practices",
    desc: "Code your own encounters without hiring a dedicated coder. Get accurate, payer-aware suggestions in seconds and spend more time with patients.",
  },
];

const comparison = [
  { feature: "Orthopedic-specific CPT rules",         claive: true,  manual: false, codify: false, gpt: false },
  { feature: "NCCI bundling checks",                  claive: true,  manual: false, codify: true,  gpt: false },
  { feature: "Payer-aware modifier rules (Medicare)",  claive: true,  manual: false, codify: false, gpt: false },
  { feature: "Global period conflict detection",       claive: true,  manual: false, codify: false, gpt: false },
  { feature: "ICD-10 sequencing enforcement",          claive: true,  manual: false, codify: false, gpt: false },
  { feature: "Add-on code detection",                  claive: true,  manual: false, codify: false, gpt: false },
  { feature: "RVU display",                            claive: true,  manual: false, codify: true,  gpt: false },
  { feature: "Missing documentation alerts",           claive: true,  manual: false, codify: false, gpt: false },
  { feature: "Results in under 5 seconds",             claive: true,  manual: false, codify: true,  gpt: true  },
  { feature: "No EHR integration required",            claive: true,  manual: true,  codify: true,  gpt: true  },
];

const faqs = [
  {
    q: "Is Claive HIPAA compliant?",
    a: "Claive is architected to operate on de-identified clinical information only. We never ask for — or collect — patient names, dates of birth, MRNs, SSNs, or any of the 18 HIPAA-defined identifiers. The tool includes a live identifier detector that warns you before any flagged text can be submitted. De-identified data is not subject to HIPAA under the Safe Harbor method, so no BAA is required for the MVP. For Phase 2 (user accounts + EHR integrations), we will establish a formal BAA. Note: this is our working approach, not legal advice — validate with your compliance team.",
  },
  {
    q: "Does Claive replace my coder?",
    a: "No — and we're explicit about this. Claive is an augmentative tool. It provides AI-generated suggestions that your certified coder reviews and verifies before submission. Think of it as a highly trained second opinion that catches what's easy to miss: wrong modifiers, missed add-on codes, NCCI bundles, global period conflicts. Your coder stays in control. The verification checkbox is mandatory before any code can be copied.",
  },
  {
    q: "How accurate is it?",
    a: "Claive has been tested across 5 orthopedic coding scenarios ranging from single-procedure office visits to complex spine fusion cases (TLIF L4-L5). It correctly handled multi-procedure bundling, modifier -25 with E/M same-day, and add-on code selection in all tests. Confidence scoring (High / Medium / Low) tells you exactly when to apply extra scrutiny. Accuracy depends on documentation quality — the more detail in your notes, the higher the confidence.",
  },
  {
    q: "What payer types does it support?",
    a: "Medicare, Medicaid, Commercial / Private, Workers Comp, and Self-Pay. Payer type is a selectable context field that changes the modifier rules applied. Medicare, for example, gets XE/XS/XP/XU instead of -59, LCD documentation threshold warnings, and stricter E/M level requirements.",
  },
  {
    q: "Do I need to integrate with my EHR or billing system?",
    a: "No integration required. Paste your clinical notes, get your codes, copy them with one click. Works alongside any billing system — Kareo, Tebra, AdvancedMD, athenahealth, or your own templates. No setup, no IT project, no waiting.",
  },
  {
    q: "What's the pricing?",
    a: "Currently in closed beta — free for qualified practices. Planned pricing: Starter $149/mo (1 provider), Practice $299/mo (up to 3 providers), Group $499/mo (up to 10 providers). Beta members get founding-tier pricing locked in. Request access to join.",
  },
];

/* ─── SUBCOMPONENTS ─────────────────────────────────────── */

function CheckIcon({ yes }: { yes: boolean }) {
  return yes
    ? <CheckCircle2 className="mx-auto h-4 w-4 text-[#16A34A]" />
    : <XCircle className="mx-auto h-4 w-4 text-[#D1D5DB]" />;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#E5E7EB] py-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <span className="text-sm font-semibold text-[#111827]">{q}</span>
        {open ? <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-[#6B7280]" /> : <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-[#6B7280]" />}
      </button>
      {open && <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">{a}</p>}
    </div>
  );
}

/* ─── MOCK OUTPUT CARD ───────────────────────────────────── */
function MockOutputCard() {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden text-left">
      {/* Status bar */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] bg-[#F0FDF4] px-4 py-2.5">
        <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
        <span className="text-xs font-semibold text-[#15803D]">Clean Claim Ready</span>
        <span className="ml-auto text-xs text-[#6B7280]">Medicare · 90-day global</span>
      </div>
      {/* Primary code */}
      <div className="border-b border-[#E5E7EB] p-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF]">Primary CPT</p>
        <div className="mt-1 flex items-end gap-3">
          <span className="font-mono text-2xl font-bold text-[#111827]">29881-RT</span>
          <span className="mb-0.5 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-semibold text-[#15803D]">High Confidence</span>
        </div>
        <p className="mt-0.5 text-xs text-[#6B7280]">Arthroscopy, knee, surgical; with meniscectomy, medial</p>
        <div className="mt-2 flex gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-0.5 text-[10px] font-medium text-[#374151]">
            <TrendingUp className="h-2.5 w-2.5 text-[#2563EB]" /> 9.29 wRVU
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#FECACA] bg-[#FEF2F2] px-2 py-0.5 text-[10px] font-medium text-[#991B1B]">
            <Clock className="h-2.5 w-2.5" /> 90-day global
          </span>
        </div>
      </div>
      {/* ICD-10 */}
      <div className="border-b border-[#E5E7EB] p-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF] mb-2">ICD-10 Diagnosis</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#111827]">S83.241A</span>
            <span className="text-xs text-[#6B7280]">Medial meniscus tear, right knee</span>
            <span className="ml-auto text-[10px] text-[#9CA3AF]">#1</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#111827]">M22.41</span>
            <span className="text-xs text-[#6B7280]">Chondromalacia patellae, right</span>
            <span className="ml-auto text-[10px] text-[#9CA3AF]">#2</span>
          </div>
        </div>
      </div>
      {/* Modifier */}
      <div className="border-b border-[#E5E7EB] p-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF] mb-2">Modifier</p>
        <div className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-2.5">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-[#92400E]">-RT</span>
            <span className="text-xs text-[#111827]">Right side</span>
          </div>
          <p className="mt-1 text-[10px] text-[#78350F]">Medicare: laterality required for all unilateral musculoskeletal procedures.</p>
        </div>
      </div>
      {/* Payer warning */}
      <div className="p-4">
        <div className="flex items-start gap-2 rounded-lg border-l-4 border-[#2563EB] bg-[#EFF6FF] p-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2563EB]" />
          <p className="text-[10px] text-[#1E40AF]">Patient is within 90-day global period. Verify this is a new/unrelated problem before billing separately.</p>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────── */

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-[#111827]">

      {/* ══ STICKY HEADER ══════════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-sm px-6 py-3.5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB] text-white font-bold text-sm">C</div>
            <span className="text-lg font-bold tracking-tight">{PRODUCT_NAME}</span>
            <Badge variant="secondary" className="text-[10px] font-semibold">Beta</Badge>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-[#6B7280] sm:flex">
            <a href="#how-it-works" className="hover:text-[#111827] transition-colors">How it works</a>
            <a href="#features" className="hover:text-[#111827] transition-colors">Features</a>
            <a href="#compare" className="hover:text-[#111827] transition-colors">Compare</a>
            <a href="#pricing" className="hover:text-[#111827] transition-colors">Pricing</a>
          </nav>
          <Button
            onClick={() => navigate("/app")}
            className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
            size="sm"
          >
            Try Free <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* ══ HERO ═══════════════════════════════════════════ */}
      <section className="border-b border-[#E5E7EB] px-6 pb-16 pt-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left: copy */}
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]"></span>
                <span className="text-xs font-semibold text-[#1E40AF]">AI-Powered · Orthopedic-Specific · No Integration Required</span>
              </div>

              <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight text-[#111827] sm:text-5xl">
                Stop losing revenue to<br />
                <span className="text-[#2563EB]">orthopedic coding errors.</span>
              </h1>

              <p className="mb-8 text-lg leading-relaxed text-[#6B7280]">
                Claive analyzes your de-identified clinical notes and returns orthopedic-specific CPT codes,
                ICD-10 pairings, modifier recommendations, and payer-aware guidance — in under 5 seconds.
                No EHR integration. No setup. Just paste and go.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  onClick={() => navigate("/app")}
                  size="lg"
                  className="bg-[#2563EB] text-white hover:bg-[#1d4ed8] px-8"
                >
                  Try Claive Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <span className="text-sm text-[#6B7280]">Beta access · No account required</span>
              </div>

              {/* Trust row */}
              <div className="mt-8 flex flex-wrap gap-4 text-xs text-[#6B7280]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
                  Orthopedic-specific CPT rules
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
                  Medicare / Medicaid payer logic
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
                  NCCI bundling checks
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
                  De-identified — no PHI required
                </div>
              </div>
            </div>

            {/* Right: mock output */}
            <div className="lg:pl-4">
              <MockOutputCard />
            </div>
          </div>
        </div>
      </section>

      {/* ══ PAIN STATS ═════════════════════════════════════ */}
      <section className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <p className="mb-8 text-center text-sm font-semibold uppercase tracking-widest text-[#6B7280]">
            The orthopedic billing problem — by the numbers
          </p>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {painStats.map((s) => (
              <div key={s.value} className="text-center">
                <p className="text-3xl font-bold text-[#DC2626]">{s.value}</p>
                <p className="mt-1 text-sm font-medium text-[#111827]">{s.label}</p>
                <p className="mt-0.5 text-[10px] text-[#9CA3AF]">Source: {s.source}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PROBLEM NARRATIVE ═══════════════════════════════ */}
      <section className="border-b border-[#E5E7EB] px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-[#111827]">
            Orthopedic coding is harder than it looks — and the mistakes are expensive.
          </h2>
          <p className="text-base leading-relaxed text-[#6B7280]">
            A rotator cuff repair has a 15–20% denial rate. A missed modifier on a $15,000 procedure means
            $7,000 left on the table. Multiply that across 200 claims a month and you have a six-figure
            revenue leak. The problem isn't your coders — it's that orthopedic CPT rules are genuinely
            complex: laterality, NCCI bundles, global periods, add-on codes, payer-specific modifier logic.
            Generic tools don't know these rules. Manual lookup is too slow. Claive was built specifically for this.
          </p>
        </div>
      </section>

      {/* ══ HOW IT WORKS ════════════════════════════════════ */}
      <section id="how-it-works" className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-2xl font-bold">How it works</h2>
          <p className="mb-12 text-center text-sm text-[#6B7280]">
            Three steps. No integration. No setup. Works alongside your existing billing system.
          </p>
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.step} className="relative rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#2563EB] text-white text-sm font-bold">
                  {s.step}
                </div>
                <h3 className="mb-2 text-base font-semibold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-[#6B7280]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ════════════════════════════════════════ */}
      <section id="features" className="border-b border-[#E5E7EB] px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-2xl font-bold">Everything in every result</h2>
          <p className="mb-12 text-center text-sm text-[#6B7280]">
            Not just a code — a complete, verified coding package built for orthopedic billing.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-xl border border-[#E5E7EB] p-5 hover:border-[#BFDBFE] hover:shadow-sm transition-all">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFF6FF]">
                    <Icon className="h-4.5 w-4.5 text-[#2563EB]" />
                  </div>
                  <h3 className="mb-1.5 text-sm font-semibold text-[#111827]">{f.title}</h3>
                  <p className="text-xs leading-relaxed text-[#6B7280]">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ WHO IT'S FOR ════════════════════════════════════ */}
      <section className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-2xl font-bold">Built for orthopedic practices — 1 to 20 providers</h2>
          <p className="mb-10 text-center text-sm text-[#6B7280]">
            The segment enterprise AI tools don't serve. No IT team required.
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            {personas.map((p) => (
              <div key={p.title} className="rounded-xl border border-[#E5E7EB] bg-white p-6">
                <div className="mb-4 text-3xl">{p.icon}</div>
                <h3 className="mb-0.5 text-base font-semibold">{p.title}</h3>
                <p className="mb-3 text-xs font-medium text-[#2563EB]">{p.subtitle}</p>
                <p className="text-sm leading-relaxed text-[#6B7280]">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ COMPARISON TABLE ════════════════════════════════ */}
      <section id="compare" className="border-b border-[#E5E7EB] px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-2xl font-bold">How Claive compares</h2>
          <p className="mb-10 text-center text-sm text-[#6B7280]">
            Manual lookup, Codify by AAPC, and generic AI weren't built for this problem. Claive was.
          </p>
          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                  <th className="py-3 pl-5 pr-4 text-left text-xs font-semibold text-[#374151]">Feature</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-[#2563EB]">Claive</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-[#6B7280]">Manual / Google</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-[#6B7280]">Codify AAPC</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-[#6B7280]">Generic AI</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr key={row.feature} className={`border-b border-[#E5E7EB] ${i % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"}`}>
                    <td className="py-3 pl-5 pr-4 text-xs text-[#374151]">{row.feature}</td>
                    <td className="px-4 py-3 text-center"><CheckIcon yes={row.claive} /></td>
                    <td className="px-4 py-3 text-center"><CheckIcon yes={row.manual} /></td>
                    <td className="px-4 py-3 text-center"><CheckIcon yes={row.codify} /></td>
                    <td className="px-4 py-3 text-center"><CheckIcon yes={row.gpt} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══ SOCIAL PROOF ════════════════════════════════════ */}
      <section className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-2xl font-bold">Early access members</h2>
          <p className="mb-10 text-center text-sm text-[#6B7280]">
            Currently in closed beta with orthopedic practices and billing teams across the US.
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                quote: "The modifier logic alone is worth it. I used to spend 10–15 minutes looking up -25 scenarios for same-day E/M. Claive gets it right in seconds and explains the reasoning.",
                name: "CPC-Certified Coder",
                role: "3-Provider Orthopedic Practice · Florida",
              },
              {
                quote: "We had a 14% denial rate on arthroscopy codes. After running our encounters through Claive, we caught a systematic modifier error we'd been making for months.",
                name: "Billing Manager",
                role: "Orthopedic Surgery Group · Texas",
              },
              {
                quote: "I'm a solo surgeon doing my own coding. This tool is the first one I've seen that actually understands orthopedic procedures without me explaining what every code means.",
                name: "Orthopedic Surgeon",
                role: "Solo Practice · Ohio",
              },
            ].map((t) => (
              <div key={t.name} className="rounded-xl border border-[#E5E7EB] bg-white p-6">
                <p className="mb-4 text-sm leading-relaxed text-[#374151]">"{t.quote}"</p>
                <div className="border-t border-[#F3F4F6] pt-4">
                  <p className="text-xs font-semibold text-[#111827]">{t.name}</p>
                  <p className="text-xs text-[#6B7280]">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Beta badge below testimonials */}
          <p className="mt-6 text-center text-xs text-[#9CA3AF]">
            * Beta feedback — names withheld during closed testing period
          </p>
        </div>
      </section>

      {/* ══ PRICING ═════════════════════════════════════════ */}
      <section id="pricing" className="border-b border-[#E5E7EB] px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-2xl font-bold">Simple, practice-sized pricing</h2>
          <p className="mb-10 text-center text-sm text-[#6B7280]">
            ROI math: a 3-provider practice losing 10% to denials = ~$30K/year gone.
            Claive at $299/mo = $3,600/year. That's 8x ROI.
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                name: "Starter",
                price: "$149",
                desc: "1 provider",
                features: ["150 queries/month", "All coding features", "Email support"],
                cta: "Join Beta",
                highlight: false,
              },
              {
                name: "Practice",
                price: "$299",
                desc: "Up to 3 providers",
                features: ["Unlimited queries", "All coding features", "Payer-aware analysis", "Priority support"],
                cta: "Join Beta",
                highlight: true,
              },
              {
                name: "Group",
                price: "$499",
                desc: "Up to 10 providers",
                features: ["Unlimited queries", "All coding features", "Payer-aware analysis", "Dedicated onboarding"],
                cta: "Join Beta",
                highlight: false,
              },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl border p-6 ${
                  tier.highlight
                    ? "border-[#2563EB] shadow-lg ring-1 ring-[#2563EB]"
                    : "border-[#E5E7EB]"
                }`}
              >
                {tier.highlight && (
                  <div className="mb-3 inline-block rounded-full bg-[#2563EB] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Most Popular
                  </div>
                )}
                <h3 className="text-base font-bold">{tier.name}</h3>
                <p className="text-xs text-[#6B7280]">{tier.desc}</p>
                <div className="my-4 flex items-end gap-1">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  <span className="mb-1 text-sm text-[#6B7280]">/mo</span>
                </div>
                <ul className="mb-6 space-y-2">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[#374151]">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#16A34A]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => navigate("/app")}
                  className={`w-full ${tier.highlight ? "bg-[#2563EB] text-white hover:bg-[#1d4ed8]" : ""}`}
                  variant={tier.highlight ? "default" : "outline"}
                  size="sm"
                >
                  {tier.cta} — Try Free Now
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-[#9CA3AF]">
            Beta access is free. Pricing locks in at founding-member rates when billing begins.
            No credit card required to try.
          </p>
        </div>
      </section>

      {/* ══ FAQ ══════════════════════════════════════════════ */}
      <section className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-2 text-center text-2xl font-bold">Frequently asked questions</h2>
          <p className="mb-10 text-center text-sm text-[#6B7280]">
            The questions every practice manager asks before trying a new coding tool.
          </p>
          <div>
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ════════════════════════════════════════ */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-2">
            <DollarSign className="h-4 w-4 text-[#2563EB]" />
            <span className="text-sm font-semibold text-[#1E40AF]">Free during beta. No card required.</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold">
            Start cutting coding errors today.
          </h2>
          <p className="mb-8 text-[#6B7280]">
            Paste your first clinical note and see exactly what Claive catches.
            No account. No setup. No commitment.
          </p>
          <Button
            onClick={() => navigate("/app")}
            size="lg"
            className="bg-[#2563EB] px-10 text-white hover:bg-[#1d4ed8]"
          >
            Try Claive Free <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════ */}
      <footer className="border-t border-[#E5E7EB] bg-[#F9FAFB] px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2563EB] text-white font-bold text-xs">C</div>
              <span className="font-bold text-sm">{PRODUCT_NAME}</span>
              <Badge variant="secondary" className="text-[10px]">Beta</Badge>
            </div>
            <nav className="flex gap-5 text-xs text-[#9CA3AF]">
              <a href="#how-it-works" className="hover:text-[#6B7280]">How it works</a>
              <a href="#features" className="hover:text-[#6B7280]">Features</a>
              <a href="#compare" className="hover:text-[#6B7280]">Compare</a>
              <a href="#pricing" className="hover:text-[#6B7280]">Pricing</a>
            </nav>
          </div>
          <div className="mt-6 border-t border-[#E5E7EB] pt-6 text-center">
            <p className="text-xs text-[#9CA3AF]">
              {PRODUCT_NAME} provides CPT coding suggestions only. All codes must be verified by qualified
              personnel before claim submission. This tool is not a substitute for certified medical coding expertise.
              De-identify all input — do not paste patient names, dates of birth, MRNs, or other identifiers.
            </p>
            <p className="mt-2 text-xs text-[#C4C4C4]">© 2026 {PRODUCT_NAME} · Closed Beta</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
