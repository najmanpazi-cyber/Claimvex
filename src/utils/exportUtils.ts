import type { CodingResult, CodingRequest } from "@/types/coding";

// ─────────────────────────────────────────────────────────────────────────────
// CSV EXPORT
// ─────────────────────────────────────────────────────────────────────────────

function csvCell(value: string | number | boolean | null | undefined): string {
  const str = String(value ?? "");
  // Wrap in quotes if it contains commas, quotes, or newlines
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function csvRow(cells: (string | number | boolean | null | undefined)[]): string {
  return cells.map(csvCell).join(",");
}

export function buildCsvContent(result: CodingResult, request?: CodingRequest | null): string {
  const rows: string[] = [];
  const ts = new Date().toLocaleString();

  // Header metadata
  rows.push(csvRow(["Claive Coding Export", ts]));
  if (request?.specialty) rows.push(csvRow(["Specialty", request.specialty]));
  if (request?.setting)   rows.push(csvRow(["Setting",   request.setting]));
  if (request?.payer_type && request.payer_type !== "Not specified") {
    rows.push(csvRow(["Payer", request.payer_type]));
  }
  rows.push("");

  // ── CPT Codes ──────────────────────────────────────────────────────────────
  rows.push(csvRow(["TYPE", "CODE", "DESCRIPTION", "CONFIDENCE", "GLOBAL PERIOD (DAYS)", "wRVU", "NOTES"]));

  // Primary
  const modStr = result.modifiers.filter(m => m.apply).map(m => m.code).join(" ");
  rows.push(csvRow([
    "Primary CPT",
    `${result.primary_code.cpt_code}${modStr ? " " + modStr : ""}`,
    result.primary_code.description,
    result.primary_code.confidence,
    result.primary_code.global_period_days ?? "N/A",
    result.primary_code.rvu ?? "N/A",
    "",
  ]));

  // Add-ons
  for (const a of (result.add_on_codes ?? [])) {
    rows.push(csvRow([
      "Add-On CPT",
      a.cpt_code,
      a.description,
      "",
      "N/A",
      "",
      `Requires: ${a.requires_primary} | ${a.reason}`,
    ]));
  }

  rows.push("");

  // ── ICD-10 Codes ───────────────────────────────────────────────────────────
  rows.push(csvRow(["TYPE", "CODE", "DESCRIPTION", "SEQUENCE", "MEDICAL NECESSITY", "", ""]));
  for (const c of result.icd10_codes) {
    rows.push(csvRow([
      "ICD-10",
      c.code,
      c.description,
      c.sequence_position ?? "",
      c.necessity,
      "",
      "",
    ]));
  }

  rows.push("");

  // ── Modifiers ──────────────────────────────────────────────────────────────
  rows.push(csvRow(["TYPE", "CODE", "NAME", "APPLY", "REASON", "PAYER NOTE", ""]));
  for (const m of result.modifiers) {
    rows.push(csvRow([
      "Modifier",
      m.code,
      m.name,
      m.apply ? "Yes" : "No",
      m.reason,
      m.payer_note ?? "",
      "",
    ]));
  }

  rows.push("");

  // ── Alternatives ───────────────────────────────────────────────────────────
  if (result.alternatives?.length > 0) {
    rows.push(csvRow(["TYPE", "CODE", "DESCRIPTION", "CONSIDER WHEN", "", "", ""]));
    for (const alt of result.alternatives) {
      rows.push(csvRow(["Alternative", alt.cpt_code, alt.description, alt.why_consider, "", "", ""]));
    }
    rows.push("");
  }

  // ── Rationale ──────────────────────────────────────────────────────────────
  rows.push(csvRow(["RATIONALE", result.rationale, "", "", "", "", ""]));
  rows.push("");

  // ── Missing Information ────────────────────────────────────────────────────
  if (result.missing_information?.length > 0) {
    rows.push(csvRow(["MISSING DOCUMENTATION", "", "", "", "", "", ""]));
    for (const m of result.missing_information) {
      rows.push(csvRow(["", m, "", "", "", "", ""]));
    }
    rows.push("");
  }

  // ── Warnings ──────────────────────────────────────────────────────────────
  if (result.warnings?.length > 0) {
    rows.push(csvRow(["WARNINGS / FLAGS", "", "", "", "", "", ""]));
    for (const w of result.warnings) {
      rows.push(csvRow(["", w.type.toUpperCase(), w.message, "", "", "", ""]));
    }
    rows.push("");
  }

  // Footer
  rows.push(csvRow(["Clean Claim Ready", result.clean_claim_ready ? "Yes" : "No", "", "", "", "", ""]));
  rows.push(csvRow(["DISCLAIMER", "Claive provides coding suggestions only. All codes must be verified by a qualified coder before claim submission.", "", "", "", "", ""]));

  return rows.join("\n");
}

export function downloadCsv(result: CodingResult, request?: CodingRequest | null): void {
  const content = buildCsvContent(result, request);
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const primaryCode = result.primary_code?.cpt_code ?? "export";
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `claive-${primaryCode}-${dateStr}.csv`;

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// PRINT-FRIENDLY VIEW
// Opens a clean, styled HTML page in a new tab and triggers print dialog
// ─────────────────────────────────────────────────────────────────────────────

function confidenceBadgeStyle(conf: string): string {
  if (conf === "high")   return "background:#DCFCE7;color:#15803D;border:1px solid #BBF7D0;";
  if (conf === "medium") return "background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;";
  return "background:#FEE2E2;color:#991B1B;border:1px solid #FECACA;";
}

function globalLabel(days: number | null | undefined): string {
  if (days === 0)  return "0-day global";
  if (days === 10) return "10-day global";
  if (days === 90) return "90-day global";
  return "";
}

export function openPrintView(result: CodingResult, request?: CodingRequest | null): void {
  const ts = new Date().toLocaleString();
  const primaryCode = result.primary_code;
  const modStr = result.modifiers.filter(m => m.apply).map(m => m.code).join(" ");
  const fullCode = `${primaryCode.cpt_code}${modStr ? " " + modStr : ""}`;
  const globalPeriod = globalLabel(primaryCode.global_period_days);

  const metaRows = [
    request?.specialty ? `<tr><td>Specialty</td><td>${request.specialty}</td></tr>` : "",
    request?.setting   ? `<tr><td>Setting</td><td>${request.setting}</td></tr>` : "",
    request?.payer_type && request.payer_type !== "Not specified"
      ? `<tr><td>Payer</td><td>${request.payer_type}</td></tr>` : "",
    request?.global_period && request.global_period !== "Not in global period"
      ? `<tr><td>Global Period Status</td><td>${request.global_period}</td></tr>` : "",
  ].filter(Boolean).join("\n");

  const addOnRows = (result.add_on_codes ?? []).map(a => `
    <tr>
      <td><span class="code">${a.cpt_code}</span></td>
      <td>${a.description}</td>
      <td>${a.reason}</td>
      <td>Requires: ${a.requires_primary}</td>
    </tr>`).join("");

  const icdRows = result.icd10_codes.map(c => `
    <tr>
      <td>${c.sequence_position ?? ""}</td>
      <td><span class="code">${c.code}</span></td>
      <td>${c.description}</td>
      <td>${c.necessity}</td>
    </tr>`).join("");

  const modRows = result.modifiers.map(m => `
    <tr>
      <td><span class="code">${m.code}</span></td>
      <td>${m.name}</td>
      <td>${m.apply ? "✓ Apply" : "✗ N/A"}</td>
      <td>${m.reason}${m.payer_note ? `<br><em style="color:#92400E;">Payer note: ${m.payer_note}</em>` : ""}</td>
    </tr>`).join("");

  const altRows = (result.alternatives ?? []).map(a => `
    <tr>
      <td><span class="code">${a.cpt_code}</span></td>
      <td>${a.description}</td>
      <td>${a.why_consider}</td>
    </tr>`).join("");

  const missingHtml = (result.missing_information ?? []).length > 0
    ? `<div class="section warning-box">
        <h2>⚠ Missing Documentation</h2>
        <ul>${result.missing_information.map(m => `<li>${m}</li>`).join("")}</ul>
      </div>` : "";

  const warningsHtml = (result.warnings ?? []).length > 0
    ? `<div class="section">
        <h2>Flags &amp; Warnings</h2>
        ${result.warnings.map(w => `
          <div class="warning-item ${w.type}">
            <strong>${w.type.toUpperCase()}:</strong> ${w.message}
          </div>`).join("")}
      </div>` : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Claive Coding Summary — ${fullCode}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 13px; color: #111827; background: #fff; padding: 32px; max-width: 900px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563EB; padding-bottom: 12px; margin-bottom: 20px; }
    .logo { font-size: 22px; font-weight: 800; color: #2563EB; letter-spacing: -0.5px; }
    .logo span { color: #111827; }
    .meta-right { text-align: right; color: #6B7280; font-size: 11px; line-height: 1.6; }
    .primary-block { background: #F9FAFB; border: 1px solid #E5E7EB; border-left: 4px solid #2563EB; border-radius: 6px; padding: 16px 20px; margin-bottom: 20px; }
    .primary-code { font-family: "Courier New", monospace; font-size: 32px; font-weight: 800; color: #111827; letter-spacing: -1px; }
    .primary-desc { color: #6B7280; margin-top: 4px; font-size: 13px; }
    .badges { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
    .badge { padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-rvu { background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE; }
    .badge-global { background:#FEF2F2; color:#991B1B; border:1px solid #FECACA; }
    .badge-clean { background:#DCFCE7; color:#15803D; border:1px solid #BBF7D0; }
    .badge-dirty { background:#FEE2E2; color:#991B1B; border:1px solid #FECACA; }
    .section { margin-bottom: 20px; }
    h2 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #374151; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #E5E7EB; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #F3F4F6; color: #374151; font-weight: 600; text-align: left; padding: 6px 10px; border: 1px solid #E5E7EB; font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em; }
    td { padding: 6px 10px; border: 1px solid #E5E7EB; vertical-align: top; line-height: 1.4; }
    tr:nth-child(even) td { background: #F9FAFB; }
    .code { font-family: "Courier New", monospace; font-weight: 700; font-size: 13px; }
    .rationale-box { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 6px; padding: 12px 16px; font-size: 12px; line-height: 1.6; color: #1E40AF; }
    .warning-box { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 6px; padding: 12px 16px; }
    .warning-box h2 { color: #991B1B; border-bottom-color: #FECACA; }
    .warning-box ul { padding-left: 18px; color: #7F1D1D; font-size: 12px; line-height: 1.8; }
    .warning-item { padding: 6px 10px; border-radius: 4px; margin-bottom: 6px; font-size: 12px; }
    .warning-item.error   { background: #FEF2F2; color: #991B1B; }
    .warning-item.warning { background: #FFFBEB; color: #92400E; }
    .warning-item.info    { background: #EFF6FF; color: #1E40AF; }
    .meta-table td:first-child { font-weight: 600; color: #374151; width: 140px; }
    .disclaimer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #E5E7EB; font-size: 10px; color: #9CA3AF; line-height: 1.5; }
    @media print {
      body { padding: 16px; }
      .no-print { display: none !important; }
      @page { margin: 0.75in; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Claive <span>Coding Summary</span></div>
      <div style="color:#6B7280;font-size:11px;margin-top:2px;">For coder verification only — not a final billing determination</div>
    </div>
    <div class="meta-right">
      Generated: ${ts}<br/>
      ${request?.specialty ? `Specialty: ${request.specialty}<br/>` : ""}
      ${request?.payer_type && request.payer_type !== "Not specified" ? `Payer: ${request.payer_type}` : ""}
    </div>
  </div>

  <!-- Primary Code -->
  <div class="primary-block">
    <div class="primary-code">${fullCode}</div>
    <div class="primary-desc">${primaryCode.description}</div>
    <div class="badges">
      <span class="badge" style="${confidenceBadgeStyle(primaryCode.confidence)}">${primaryCode.confidence.charAt(0).toUpperCase() + primaryCode.confidence.slice(1)} Confidence</span>
      ${primaryCode.rvu != null ? `<span class="badge badge-rvu">${primaryCode.rvu} wRVU</span>` : ""}
      ${globalPeriod ? `<span class="badge badge-global">${globalPeriod}</span>` : ""}
      <span class="badge ${result.clean_claim_ready ? "badge-clean" : "badge-dirty"}">${result.clean_claim_ready ? "✓ Clean Claim Ready" : "⚠ Missing Info"}</span>
    </div>
  </div>

  ${metaRows ? `
  <!-- Encounter Context -->
  <div class="section">
    <h2>Encounter Context</h2>
    <table class="meta-table"><tbody>${metaRows}</tbody></table>
  </div>` : ""}

  ${addOnRows ? `
  <!-- Add-On Codes -->
  <div class="section">
    <h2>Add-On CPT Codes</h2>
    <table>
      <thead><tr><th>Code</th><th>Description</th><th>Reason</th><th>Required Primary</th></tr></thead>
      <tbody>${addOnRows}</tbody>
    </table>
  </div>` : ""}

  <!-- ICD-10 Codes -->
  <div class="section">
    <h2>Diagnosis Codes (ICD-10)</h2>
    <table>
      <thead><tr><th>#</th><th>Code</th><th>Description</th><th>Medical Necessity</th></tr></thead>
      <tbody>${icdRows}</tbody>
    </table>
  </div>

  <!-- Modifiers -->
  ${modRows ? `
  <div class="section">
    <h2>Modifiers</h2>
    <table>
      <thead><tr><th>Code</th><th>Name</th><th>Apply</th><th>Reason / Payer Note</th></tr></thead>
      <tbody>${modRows}</tbody>
    </table>
  </div>` : ""}

  ${altRows ? `
  <!-- Alternatives -->
  <div class="section">
    <h2>Alternative Codes</h2>
    <table>
      <thead><tr><th>Code</th><th>Description</th><th>Consider When</th></tr></thead>
      <tbody>${altRows}</tbody>
    </table>
  </div>` : ""}

  <!-- Rationale -->
  <div class="section">
    <h2>Coding Rationale</h2>
    <div class="rationale-box">${result.rationale}</div>
  </div>

  ${missingHtml}
  ${warningsHtml}

  <div class="disclaimer">
    Claive provides coding suggestions only. All codes must be reviewed and verified by a qualified, credentialed coder or billing specialist before claim submission.
    This report does not constitute a legal, compliance, or billing determination. Generated by Claive — ${ts}
  </div>

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
