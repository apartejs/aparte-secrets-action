// Turn the CLI's SARIF report into GitHub annotations, a job summary and the `findings` output.
// Secret values are never printed: the SARIF report does not contain them.
import { appendFileSync, readFileSync } from "node:fs";

const report = JSON.parse(readFileSync(process.argv[2], "utf-8"));
const results = report.runs.flatMap((r) => r.results);
const kind = (id) => id.replace("_", " ");
const esc = (s) => String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");

const rows = [];
for (const r of results) {
  const loc = r.locations[0].physicalLocation;
  const file = loc.artifactLocation.uri, line = loc.region.startLine, col = loc.region.startColumn;
  const command = r.level === "error" ? "error" : "warning";
  console.log(`::${command} file=${esc(file)},line=${line},col=${col},title=${esc("Possible " + kind(r.ruleId))}::${esc(r.message.text)}`);
  rows.push(`| \`${file}\` | ${line}:${col} | ${kind(r.ruleId)} | ${r.message.text.match(/score ([\d.]+)/)?.[1] ?? ""} |`);
}

const n = results.length;
console.log(n ? `aparte-secrets: ${n} possible secret(s).` : "aparte-secrets: nothing found.");
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, n
    ? `### aparte-secrets: ${n} possible secret(s)\n\n| file | line | kind | score |\n|---|---|---|---|\n${rows.join("\n")}\n\n`
      + "Values are not shown. To accept one: an `aparte-secrets:ignore` comment on its line, `ignore` in `.aparte-secrets.json`, or a baseline.\n"
    : "### aparte-secrets: nothing found\n");
}
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `findings=${n}\n`);
