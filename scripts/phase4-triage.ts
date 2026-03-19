#!/usr/bin/env bun
/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync } from "fs";

const data = JSON.parse(readFileSync("artifacts/acc09-redteam-results.json", "utf-8"));

const actionMap: Record<string, string> = {
  "R-3.1.1": "block", "R-3.1.2": "block", "R-3.1.3": "block", "R-3.1.4": "block",
  "R-3.2.1": "block", "R-3.2.2": "warn",
  "R-3.3.1": "force-review", "R-3.3.2": "block", "R-3.3.3": "warn",
  "R-3.4.1": "block", "R-3.4.2": "force-review", "R-3.4.3": "force-review", "R-3.4.4": "block",
  "R-3.5.1": "block", "R-3.5.2": "block", "R-3.5.3": "warn", "R-3.5.4": "block", "R-3.5.5": "warn",
};

for (const cls of ["FALSE_FAIL", "WRONG_ACTION", "PARTIAL"]) {
  const items = data.findings.filter((f: any) => f.classification === cls);
  console.log(`\n=== ${cls} (${items.length}) ===\n`);

  for (const f of items) {
    const extras = f.domain_details.flatMap((d: any) => d.extra_rules);
    const missing = f.domain_details.flatMap((d: any) => d.missing_rules);
    const extraWarn = extras.filter((r: string) => actionMap[r] === "warn");
    const extraBlock = extras.filter((r: string) => actionMap[r] === "block");
    const extraFR = extras.filter((r: string) => actionMap[r] === "force-review");
    console.log(f.scenario_id
      + " | " + f.expected_action + "→" + f.actual_action
      + " | extras=[" + extras.join(",") + "]"
      + " | missing=[" + missing.join(",") + "]"
      + " | extra_block=[" + extraBlock.join(",") + "]"
      + " | extra_fr=[" + extraFR.join(",") + "]"
      + " | extra_warn=[" + extraWarn.join(",") + "]"
    );
  }
}
