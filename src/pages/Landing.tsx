import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, CheckCircle2, XCircle, AlertTriangle,
  Brain, Copy, FileText, TrendingUp, Shield,
  ChevronDown, ChevronUp, Clock, Zap, Users, DollarSign,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

/* ─── SEO meta is set in index.html ─── */

const PRODUCT_NAME = "ClaimVex";

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
    desc: "ClaimVex checks your documentation against orthopedic CPT rules, NCCI bundles, modifier requirements, and your payer's specific policies.",
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
  { feature: "Orthopedic-specific CPT rules",         claimvex: true,  manual: false, codify: false, gpt: false },
  { feature: "NCCI bundling checks",                  claimvex: true,  manual: false, codify: true,  gpt: false },
  { feature: "Payer-aware modifier rules (Medicare)",  claimvex: true,  manual: false, codify: false, gpt: false },
  { feature: "Global period conflict detection",       claimvex: true,  manual: false, codify: false, gpt: false },
  { feature: "ICD-10 sequencing enforcement",          claimvex: true,  manual: false, codify: false, gpt: false },
  { feature: "Add-on code detection",                  claimvex: true,  manual: false, codify: false, gpt: false },
  { feature: "RVU display",                            claimvex: true,  manual: false, codify: true,  gpt: false },
  { feature: "Missing documentation alerts",           claimvex: true,  manual: false, codify: false, gpt: false },
  { feature: "Results in under 5 seconds",             claimvex: true,  manual: false, codify: true,  gpt: true  },
  { feature: "No EHR integration required",            claimvex: true,  manual: true,  codify: true,  gpt: true  },
];

const faqs = [
  {
    q: "Is ClaimVex HIPAA compliant?",
    a: "ClaimVex is architected to operate on de-identified clinical information only. We never ask for — or collect — patient names, dates of birth, MRNs, SSNs, or any of the 18 HIPAA-defined identifiers. The tool includes a live identifier detector that warns you before any flagged text can be submitted. De-identified data is not subject to HIPAA under the Safe Harbor method, so no BAA is required for the MVP. For Phase 2 (user accounts + EHR integrations), we will establish a formal BAA. Note: this is our working approach, not legal advice — validate with your compliance team.",
  },
  {
    q: "Does ClaimVex replace my coder?",
    a: "No — and we're explicit about this. ClaimVex is an augmentative tool. It provides AI-generated suggestions that your certified coder reviews and verifies before submission. Think of it as a highly trained second opinion that catches what's easy to miss: wrong modifiers, missed add-on codes, NCCI bundles, global period conflicts. Your coder stays in control. The verification checkbox is mandatory before any code can be copied.",
  },
  {
    q: "How accurate is it?",
    a: "ClaimVex has been tested across 5 orthopedic coding scenarios ranging from single-procedure office visits to complex spine fusion cases (TLIF L4-L5). It correctly handled multi-procedure bundling, modifier -25 with E/M same-day, and add-on code selection in all tests. Confidence scoring (High / Medium / Low) tells you exactly when to apply extra scrutiny. Accuracy depends on documentation quality — the more detail in your notes, the higher the confidence.",
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
    ? <CheckCircle2 className="mx-auto h-4 w-4 text-success" />
    : <XCircle className="mx-auto h-4 w-4 text-muted-foreground/30" />;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border py-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <span className="text-sm font-semibold text-foreground">{q}</span>
        {open ? <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>
      <div className={`grid transition-all duration-200 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── MOCK OUTPUT CARD ───────────────────────────────────── */
function MockOutputCard() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden text-left">
      {/* Status bar */}
      <div className="flex items-center gap-2 border-b border-border bg-confidence-high px-4 py-2.5">
        <CheckCircle2 className="h-4 w-4 text-success" />
        <span className="text-xs font-semibold text-confidence-high-foreground">Clean Claim Ready</span>
        <span className="ml-auto text-xs text-muted-foreground">Medicare · 90-day global</span>
      </div>
      {/* Primary code */}
      <div className="border-b border-border p-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">Primary CPT</p>
        <div className="mt-1 flex items-end gap-3">
          <span className="font-mono text-2xl font-bold text-foreground">29881-RT</span>
          <span className="mb-0.5 rounded-full bg-confidence-high px-2 py-0.5 text-[10px] font-semibold text-confidence-high-foreground">High Confidence</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">Arthroscopy, knee, surgical; with meniscectomy, medial</p>
        <div className="mt-2 flex gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground/80">
            <TrendingUp className="h-2.5 w-2.5 text-primary" /> 9.29 wRVU
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-confidence-low-border bg-confidence-low px-2 py-0.5 text-[10px] font-medium text-confidence-low-foreground">
            <Clock className="h-2.5 w-2.5" /> 90-day global
          </span>
        </div>
      </div>
      {/* ICD-10 */}
      <div className="border-b border-border p-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 mb-2">ICD-10 Diagnosis</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-foreground">S83.241A</span>
            <span className="text-xs text-muted-foreground">Medial meniscus tear, right knee</span>
            <span className="ml-auto text-[10px] text-muted-foreground/70">#1</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-foreground">M22.41</span>
            <span className="text-xs text-muted-foreground">Chondromalacia patellae, right</span>
            <span className="ml-auto text-[10px] text-muted-foreground/70">#2</span>
          </div>
        </div>
      </div>
      {/* Modifier */}
      <div className="border-b border-border p-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 mb-2">Modifier</p>
        <div className="rounded-lg border border-modifier-border bg-modifier p-2.5">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-modifier-foreground">-RT</span>
            <span className="text-xs text-foreground">Right side</span>
          </div>
          <p className="mt-1 text-[10px] text-modifier-foreground">Medicare: laterality required for all unilateral musculoskeletal procedures.</p>
        </div>
      </div>
      {/* Payer warning */}
      <div className="p-4">
        <div className="flex items-start gap-2 rounded-lg border-l-4 border-primary bg-info p-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="text-[10px] text-info-foreground">Patient is within 90-day global period. Verify this is a new/unrelated problem before billing separately.</p>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────── */

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ══ STICKY HEADER ══════════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm px-6 py-3.5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">CV</div>
            <span className="text-lg font-bold tracking-tight">{PRODUCT_NAME}</span>
            <Badge variant="secondary" className="text-[10px] font-semibold">Beta</Badge>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#compare" className="hover:text-foreground transition-colors">Compare</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              onClick={() => navigate("/app")}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              size="sm"
            >
              Try Free <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ══ HERO ═══════════════════════════════════════════ */}
      <section className="border-b border-border px-6 pb-16 pt-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left: copy */}
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-info-border bg-info px-3 py-1.5 animate-fade-in-up" style={{ animationDelay: "0ms", animationFillMode: "both" }}>
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                <span className="text-xs font-semibold text-info-foreground">AI-Powered · Orthopedic-Specific · No Integration Required</span>
              </div>

              <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl animate-fade-in-up" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
                Stop losing revenue to<br />
                <span className="text-primary">orthopedic coding errors.</span>
              </h1>

              <p className="mb-8 text-lg leading-relaxed text-muted-foreground animate-fade-in-up" style={{ animationDelay: "160ms", animationFillMode: "both" }}>
                ClaimVex analyzes your de-identified clinical notes and returns orthopedic-specific CPT codes,
                ICD-10 pairings, modifier recommendations, and payer-aware guidance — in under 5 seconds.
                No EHR integration. No setup. Just paste and go.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center animate-fade-in-up" style={{ animationDelay: "240ms", animationFillMode: "both" }}>
                <Button
                  onClick={() => navigate("/app")}
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
                >
                  Try ClaimVex Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Beta access · No account required</span>
              </div>

              {/* Trust row */}
              <div className="mt-8 flex flex-wrap gap-4 text-xs text-muted-foreground animate-fade-in-up" style={{ animationDelay: "320ms", animationFillMode: "both" }}>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  Orthopedic-specific CPT rules
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  Medicare / Medicaid payer logic
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  NCCI bundling checks
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  De-identified — no PHI required
                </div>
              </div>
            </div>

            {/* Right: mock output */}
            <div className="lg:pl-4 animate-fade-in-up" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
              <MockOutputCard />
            </div>
          </div>
        </div>
      </section>

      {/* ══ PAIN STATS ═════════════════════════════════════ */}
      <section className="border-b border-border bg-muted px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <p className="mb-8 text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            The orthopedic billing problem — by the numbers
          </p>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {painStats.map((s) => (
              <div key={s.value} className="text-center">
                <p className="text-3xl font-bold text-destructive">{s.value}</p>
                <p className="mt-1 text-sm font-medium text-foreground">{s.label}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/70">Source: {s.source}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PROBLEM NARRATIVE ═══════════════════════════════ */}
      <section className="border-b border-border px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-foreground">
            Orthopedic coding is harder than it looks — and the mistakes are expensive.
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            A rotator cuff repair has a 15–20% denial rate. A missed modifier on a $15,000 procedure means
            $7,000 left on the table. Multiply that across 200 claims a month and you have a six-figure
            revenue leak. The problem isn't your coders — it's that orthopedic CPT rules are genuinely
            complex: laterality, NCCI bundles, global periods, add-on codes, payer-specific modifier logic.
            Generic tools don't know these rules. Manual lookup is too slow. ClaimVex was built specifically for this.
          </p>
        </div>
      </section>

      {/* ══ HOW IT WORKS ════════════════════════════════════ */}
      <section id="how-it-works" className="border-b border-border bg-muted px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-2xl font-bold">How it works</h2>
          <p className="mb-12 text-center text-sm text-muted-foreground">
            Three steps. No integration. No setup. Works alongside your existing billing system.
          </p>
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.step} className="relative rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {s.step}
                </div>
                <h3 className="mb-2 text-base font-semibold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ════════════════════════════════════════ */}
      <section id="features" className="border-b border-border px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-2xl font-bold">Everything in every result</h2>
          <p className="mb-12 text-center text-sm text-muted-foreground">
            Not just a code — a complete, verified coding package built for orthopedic billing.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-sm transition-all">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-info">
                    <Icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <h3 className="mb-1.5 text-sm font-semibold text-foreground">{f.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ WHO IT'S FOR ════════════════════════════════════ */}
      <section className="border-b border-border bg-muted px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-2xl font-bold">Built for orthopedic practices — 1 to 20 providers</h2>
          <p className="mb-10 text-center text-sm text-muted-foreground">
            The segment enterprise AI tools don't serve. No IT team required.
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            {personas.map((p) => (
              <div key={p.title} className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 text-3xl">{p.icon}</div>
                <h3 className="mb-0.5 text-base font-semibold">{p.title}</h3>
                <p className="mb-3 text-xs font-medium text-primary">{p.subtitle}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ COMPARISON TABLE ════════════════════════════════ */}
      <section id="compare" className="border-b border-border px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-2xl font-bold">How ClaimVex compares</h2>
          <p className="mb-10 text-center text-sm text-muted-foreground">
            Manual lookup, Codify by AAPC, and generic AI weren't built for this problem. ClaimVex was.
          </p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="py-3 pl-5 pr-4 text-left text-xs font-semibold text-foreground/80">Feature</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-primary">ClaimVex</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Manual / Google</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Codify AAPC</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Generic AI</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr key={row.feature} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-muted/50"}`}>
                    <td className="py-3 pl-5 pr-4 text-xs text-foreground/80">{row.feature}</td>
                    <td className="px-4 py-3 text-center"><CheckIcon yes={row.claimvex} /></td>
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
      <section className="border-b border-border bg-muted px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-2xl font-bold">Early access members</h2>
          <p className="mb-10 text-center text-sm text-muted-foreground">
            Currently in closed beta with orthopedic practices and billing teams across the US.
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                quote: "The modifier logic alone is worth it. I used to spend 10–15 minutes looking up -25 scenarios for same-day E/M. ClaimVex gets it right in seconds and explains the reasoning.",
                name: "CPC-Certified Coder",
                role: "3-Provider Orthopedic Practice · Florida",
              },
              {
                quote: "We had a 14% denial rate on arthroscopy codes. After running our encounters through ClaimVex, we caught a systematic modifier error we'd been making for months.",
                name: "Billing Manager",
                role: "Orthopedic Surgery Group · Texas",
              },
              {
                quote: "I'm a solo surgeon doing my own coding. This tool is the first one I've seen that actually understands orthopedic procedures without me explaining what every code means.",
                name: "Orthopedic Surgeon",
                role: "Solo Practice · Ohio",
              },
            ].map((t) => (
              <div key={t.name} className="rounded-xl border border-border bg-card p-6">
                <p className="mb-4 text-sm leading-relaxed text-foreground/80">"{t.quote}"</p>
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Beta badge below testimonials */}
          <p className="mt-6 text-center text-xs text-muted-foreground/70">
            * Beta feedback — names withheld during closed testing period
          </p>
        </div>
      </section>

      {/* ══ PRICING ═════════════════════════════════════════ */}
      <section id="pricing" className="border-b border-border px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-2xl font-bold">Simple, practice-sized pricing</h2>
          <p className="mb-10 text-center text-sm text-muted-foreground">
            ROI math: a 3-provider practice losing 10% to denials = ~$30K/year gone.
            ClaimVex at $299/mo = $3,600/year. That's 8x ROI.
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
                    ? "border-primary shadow-lg ring-1 ring-primary"
                    : "border-border"
                }`}
              >
                {tier.highlight && (
                  <div className="mb-3 inline-block rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <h3 className="text-base font-bold">{tier.name}</h3>
                <p className="text-xs text-muted-foreground">{tier.desc}</p>
                <div className="my-4 flex items-end gap-1">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  <span className="mb-1 text-sm text-muted-foreground">/mo</span>
                </div>
                <ul className="mb-6 space-y-2">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => navigate("/app")}
                  className={`w-full ${tier.highlight ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
                  variant={tier.highlight ? "default" : "outline"}
                  size="sm"
                >
                  {tier.cta} — Try Free Now
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground/70">
            Beta access is free. Pricing locks in at founding-member rates when billing begins.
            No credit card required to try.
          </p>
        </div>
      </section>

      {/* ══ FAQ ══════════════════════════════════════════════ */}
      <section className="border-b border-border bg-muted px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-2 text-center text-2xl font-bold">Frequently asked questions</h2>
          <p className="mb-10 text-center text-sm text-muted-foreground">
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
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-info-border bg-info px-4 py-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-info-foreground">Free during beta. No card required.</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold">
            Start cutting coding errors today.
          </h2>
          <p className="mb-8 text-muted-foreground">
            Paste your first clinical note and see exactly what ClaimVex catches.
            No account. No setup. No commitment.
          </p>
          <Button
            onClick={() => navigate("/app")}
            size="lg"
            className="bg-primary px-10 text-primary-foreground hover:bg-primary/90"
          >
            Try ClaimVex Free <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════ */}
      <footer className="border-t border-border bg-muted px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">CV</div>
              <span className="font-bold text-sm">{PRODUCT_NAME}</span>
              <Badge variant="secondary" className="text-[10px]">Beta</Badge>
            </div>
            <nav className="flex gap-5 text-xs text-muted-foreground/70">
              <a href="#how-it-works" className="hover:text-muted-foreground">How it works</a>
              <a href="#features" className="hover:text-muted-foreground">Features</a>
              <a href="#compare" className="hover:text-muted-foreground">Compare</a>
              <a href="#pricing" className="hover:text-muted-foreground">Pricing</a>
            </nav>
          </div>
          <div className="mt-6 border-t border-border pt-6 text-center">
            <p className="text-xs text-muted-foreground/70">
              {PRODUCT_NAME} provides CPT coding suggestions only. All codes must be verified by qualified
              personnel before claim submission. This tool is not a substitute for certified medical coding expertise.
              De-identify all input — do not paste patient names, dates of birth, MRNs, or other identifiers.
            </p>
            <p className="mt-2 text-xs text-muted-foreground/50">© 2026 {PRODUCT_NAME} · Closed Beta</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
