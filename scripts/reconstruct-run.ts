/**
 * reconstructs a `run.json` from transcript files when a run crashes
 * before writing results. merges incrementally with the existing `run.json`, if
 * present, so you can layer on scoring and reviews in separate passes.
 *
 * usage: npx tsx scripts/reconstruct-run.ts <run-dir> [--skip-scoring] [--skip-reviews]
 *
 * flags:
 *   --skip-scoring    don't re-run test scoring
 *   --skip-reviews    don't re-run AI code reviews
 *   --only-missing    only run scoring/reviews for trials that don't have them yet
 *   --fix-durations   only update `durationMs` from transcript data (no scoring/reviews)
 *
 * incremental behavior:
 *   if run.json already exists, each trial's existing data is preserved
 *   for any step that is skipped. for example:
 *     1. run with --skip-scoring --skip-reviews → creates run.json with cost/turns/status
 *     2. run with --skip-reviews                → adds scoring, preserves transcript data
 *     3. run with --skip-scoring                → adds reviews, preserves scoring data
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { scoreTrialDir } from "../src/scorer.js";
import { reviewTrialDir } from "../src/reviewer.js";
import type { BenchmarkRun, TrialResult, LanguageConfig } from "../src/types.js";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const TASKS_DIR = path.join(ROOT_DIR, "tasks");
const LANGUAGES_PATH = path.join(ROOT_DIR, "languages.json");

function interpolate(template: string, taskId: string): string {
  return template.replaceAll("{taskId}", taskId);
}

function loadLanguages(): Record<string, Omit<LanguageConfig, "id">> {
  return JSON.parse(fs.readFileSync(LANGUAGES_PATH, "utf-8"));
}

function trialKey(r: { taskId: string; language: string; trial: number }): string {
  return `${r.taskId}/${r.language}/trial-${r.trial}`;
}

interface TranscriptInfo {
  status: TrialResult["status"];
  costUsd: number;
  inputTokens: number;
  outputTokens: number;
  turns: number;
  durationMs: number;
}

function extractFromTranscript(transcriptPath: string): TranscriptInfo {
  const lines = fs.readFileSync(transcriptPath, "utf-8").trim().split("\n");

  // find the best result message: prefer the one with actual data
  // (the SDK sometimes emits a spurious error_during_execution with 0 turns after the real result)
  let bestResult: any = null;
  for (const line of lines) {
    try {
      const msg = JSON.parse(line);
      if (msg.type === "result") {
        if (!bestResult || (bestResult.num_turns === 0 && msg.num_turns > 0)) {
          bestResult = msg;
        }
      }
    } catch {}
  }

  if (!bestResult) {
    return { status: "error", costUsd: 0, inputTokens: 0, outputTokens: 0, turns: 0, durationMs: 0 };
  }

  let status: TrialResult["status"];
  switch (bestResult.subtype) {
    case "success": status = "success"; break;
    case "error_max_turns": status = "max_turns"; break;
    case "error_max_budget_usd": status = "max_budget"; break;
    default: status = "error"; break;
  }

  let inputTokens = 0;
  let outputTokens = 0;
  if (bestResult.modelUsage) {
    for (const mu of Object.values(bestResult.modelUsage) as any[]) {
      inputTokens += mu.inputTokens ?? 0;
      outputTokens += mu.outputTokens ?? 0;
    }
  }

  return {
    status,
    costUsd: bestResult.total_cost_usd ?? 0,
    inputTokens,
    outputTokens,
    turns: bestResult.num_turns ?? 0,
    durationMs: bestResult.duration_ms ?? 0,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter(a => a.startsWith("--")));
  const positional = args.filter(a => !a.startsWith("--"));

  const runDir = path.resolve(positional[0]!);
  if (!fs.existsSync(runDir)) {
    console.error(`Run directory not found: ${runDir}`);
    process.exit(1);
  }

  const fixDurations = flags.has("--fix-durations");
  const skipScoring = fixDurations || flags.has("--skip-scoring");
  const skipReviews = fixDurations || flags.has("--skip-reviews");
  const onlyMissing = flags.has("--only-missing");

  if (fixDurations) console.log("fixing durations only");
  if (skipScoring) console.log("skipping scoring");
  if (skipReviews) console.log("skipping reviews");
  if (onlyMissing) console.log("only processing trials with missing data");

  // load existing run.json if present (for incremental merging)
  const outPath = path.join(runDir, "run.json");
  const existing = new Map<string, TrialResult>();
  if (fs.existsSync(outPath)) {
    const prev: BenchmarkRun = JSON.parse(fs.readFileSync(outPath, "utf-8"));
    for (const r of prev.results) {
      existing.set(trialKey(r), r);
    }
    console.log(`loaded ${existing.size} existing results from run.json`);
  }

  const languageDefs = loadLanguages();
  const runId = path.basename(runDir);
  const results: TrialResult[] = [];

  // discover tasks and trials from directory structure
  const taskIds = fs.readdirSync(runDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort();

  for (const taskId of taskIds) {
    const taskDir = path.join(runDir, taskId);
    const testsPath = path.join(TASKS_DIR, taskId, "tests.json");
    const specPath = path.join(TASKS_DIR, taskId, "spec.md");
    const rubricPath = path.join(TASKS_DIR, taskId, "rubric.md");
    const scaffoldBase = path.join(TASKS_DIR, taskId);

    const langIds = fs.readdirSync(taskDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort();

    for (const langId of langIds) {
      const langDir = path.join(taskDir, langId);
      const langDef = languageDefs[langId];
      if (!langDef) {
        console.warn(`  unknown language: ${langId}, skipping`);
        continue;
      }

      const langConfig: Pick<LanguageConfig, "runCommand" | "preScoringCommand"> = {
        runCommand: interpolate(langDef.runCommand, taskId),
        preScoringCommand: langDef.preScoringCommand
          ? interpolate(langDef.preScoringCommand, taskId)
          : undefined,
      };

      const scaffoldDir = path.join(scaffoldBase, langId);

      const trialDirs = fs.readdirSync(langDir, { withFileTypes: true })
        .filter(e => e.isDirectory() && e.name.startsWith("trial-"))
        .map(e => e.name)
        .sort();

      for (const trialName of trialDirs) {
        const trialNum = parseInt(trialName.split("-")[1]!);
        const trialDir = path.join(langDir, trialName);
        const transcriptPath = path.join(trialDir, "transcript.jsonl");

        if (!fs.existsSync(transcriptPath)) {
          console.warn(`  no transcript: ${taskId}/${langId}/${trialName}, skipping`);
          continue;
        }

        const key = trialKey({ taskId, language: langId, trial: trialNum });
        const prev = existing.get(key);

        console.log(`processing: ${taskId} / ${langId} (trial ${trialNum})`);

        // 1. extract info from transcript
        const info = extractFromTranscript(transcriptPath);

        // --fix-durations: only update durationMs, preserve everything else
        if (fixDurations && prev) {
          console.log(`  duration: ${prev.durationMs} -> ${info.durationMs}`);
          results.push({ ...prev, durationMs: info.durationMs });
          continue;
        }
        console.log(`  transcript: ${info.status} | ${info.turns} turns | $${info.costUsd.toFixed(4)}`);

        // 2. score (or preserve existing)
        let testsPassed = prev?.testsPassed ?? 0;
        let testsTotal = prev?.testsTotal ?? 0;
        let testOutput = prev?.testOutput ?? "";
        const hasScoring = prev && prev.testsTotal > 0;
        if (!skipScoring && !(onlyMissing && hasScoring)) {
          try {
            const scoreResult = await scoreTrialDir(trialDir, langConfig, testsPath);
            testsPassed = scoreResult.passed;
            testsTotal = scoreResult.total;
            testOutput = scoreResult.output;
            console.log(`  scored: ${testsPassed}/${testsTotal}`);
          } catch (err: unknown) {
            testOutput = `scoring failed: ${err instanceof Error ? err.message : String(err)}`;
            console.log(`  scoring failed: ${testOutput.slice(0, 200)}`);
          }
        } else if (prev) {
          console.log(`  scoring: preserved ${testsPassed}/${testsTotal}`);
        }

        // 3. review (or preserve existing)
        let reviewScore: number | undefined = prev?.reviewScore;
        let reviewText: string | undefined = prev?.reviewText;
        const hasReview = prev?.reviewScore != null;
        if (!skipReviews && !(onlyMissing && hasReview)) {
          try {
            const review = await reviewTrialDir(trialDir, specPath, rubricPath, "claude-sonnet-4-5-20250929", scaffoldDir);
            reviewScore = review.score;
            reviewText = review.review;
            console.log(`  review: ${reviewScore}/100`);
          } catch (err: unknown) {
            reviewText = `review failed: ${err instanceof Error ? err.message : String(err)}`;
            console.log(`  review failed: ${reviewText.slice(0, 200)}`);
          }
        } else if (prev?.reviewScore != null) {
          console.log(`  review: preserved ${reviewScore}/100`);
        }

        const durationMs = info.durationMs;

        results.push({
          taskId,
          language: langId,
          trial: trialNum,
          status: info.status,
          costUsd: info.costUsd,
          inputTokens: info.inputTokens,
          outputTokens: info.outputTokens,
          turns: info.turns,
          durationMs,
          testsPassed,
          testsTotal,
          testOutput,
          reviewScore,
          reviewText,
        });
      }
    }
  }

  const benchmarkRun: BenchmarkRun = {
    id: runId,
    timestamp: runId,
    config: {
      model: "claude-sonnet-4-5-20250929",
      maxTurns: 60,
      maxBudgetUsd: 5,
      trials: 3,
      allowedTools: ["Read", "Edit", "Write", "Bash", "Glob", "Grep"],
    },
    results,
  };

  fs.writeFileSync(outPath, JSON.stringify(benchmarkRun, null, 2));
  console.log(`\nwrote ${results.length} trial results to: ${outPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
