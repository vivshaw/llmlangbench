import type { BenchmarkRun, TrialResult } from "./types.js";

interface LangSummary {
  language: string;
  trials: number;
  avgPassRate: number;
  avgCostUsd: number;
  avgTurns: number;
  avgDurationMs: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  avgReviewScore?: number;
}

interface TaskSummary {
  taskId: string;
  language: string;
  trials: number;
  passRate: number;
  avgCostUsd: number;
  avgReviewScore?: number;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const group = map.get(k);
    if (group) {
      group.push(item);
    } else {
      map.set(k, [item]);
    }
  }
  return map;
}

function passRate(results: TrialResult[]): number {
  const rates = results.map((r) =>
    r.testsTotal > 0 ? r.testsPassed / r.testsTotal : 0,
  );
  return avg(rates);
}

function avgReviewScore(results: TrialResult[]): number | undefined {
  const scores = results
    .map((r) => r.reviewScore)
    .filter((s): s is number => s != null);
  return scores.length > 0 ? avg(scores) : undefined;
}

function buildLanguageSummaries(results: TrialResult[]): LangSummary[] {
  const byLang = groupBy(results, (r) => r.language);
  const summaries: LangSummary[] = [];

  for (const [language, trials] of byLang) {
    summaries.push({
      language,
      trials: trials.length,
      avgPassRate: passRate(trials),
      avgCostUsd: avg(trials.map((t) => t.costUsd)),
      avgTurns: avg(trials.map((t) => t.turns)),
      avgDurationMs: avg(trials.map((t) => t.durationMs)),
      avgInputTokens: avg(trials.map((t) => t.inputTokens)),
      avgOutputTokens: avg(trials.map((t) => t.outputTokens)),
      avgReviewScore: avgReviewScore(trials),
    });
  }

  return summaries.sort((a, b) => b.avgPassRate - a.avgPassRate);
}

function buildTaskSummaries(results: TrialResult[]): TaskSummary[] {
  const byCombo = groupBy(results, (r) => `${r.taskId}:${r.language}`);
  const summaries: TaskSummary[] = [];

  for (const [, trials] of byCombo) {
    const first = trials[0]!;
    summaries.push({
      taskId: first.taskId,
      language: first.language,
      trials: trials.length,
      passRate: passRate(trials),
      avgCostUsd: avg(trials.map((t) => t.costUsd)),
      avgReviewScore: avgReviewScore(trials),
    });
  }

  return summaries.sort((a, b) => {
    if (a.taskId !== b.taskId) return a.taskId.localeCompare(b.taskId);
    return b.passRate - a.passRate;
  });
}

function pad(s: string, len: number): string {
  return s.padEnd(len);
}

function rpad(s: string, len: number): string {
  return s.padStart(len);
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function printReport(run: BenchmarkRun): void {
  console.log(`\nbenchmark Run: ${run.id}`);
  console.log(`model: ${run.config.model}`);
  console.log(
    `config: ${run.config.trials} trials, max ${run.config.maxTurns} turns, $${run.config.maxBudgetUsd} budget`,
  );
  console.log(`total results: ${run.results.length}`);

  // language summary table
  const langSummaries = buildLanguageSummaries(run.results);

  console.log("\n## per-language summary\n");
  console.log(
    `${pad("language", 14)} ${rpad("trials", 7)} ${rpad("pass%", 7)} ${rpad("avg cost", 10)} ${rpad("avg turns", 10)} ${rpad("avg time", 10)} ${rpad("review", 8)}`,
  );
  console.log("-".repeat(72));

  for (const s of langSummaries) {
    console.log(
      `${pad(s.language, 14)} ${rpad(String(s.trials), 7)} ${rpad((s.avgPassRate * 100).toFixed(1) + "%", 7)} ${rpad("$" + s.avgCostUsd.toFixed(4), 10)} ${rpad(s.avgTurns.toFixed(1), 10)} ${rpad(formatDuration(s.avgDurationMs), 10)} ${rpad(s.avgReviewScore != null ? s.avgReviewScore.toFixed(0) : "-", 8)}`,
    );
  }

  // task breakdown table
  const taskSummaries = buildTaskSummaries(run.results);

  console.log("\n## per-task breakdown\n");
  console.log(
    `${pad("task", 20)} ${pad("language", 14)} ${rpad("trials", 7)} ${rpad("pass%", 7)} ${rpad("avg cost", 10)} ${rpad("review", 8)}`,
  );
  console.log("-".repeat(70));

  for (const s of taskSummaries) {
    console.log(
      `${pad(s.taskId, 20)} ${pad(s.language, 14)} ${rpad(String(s.trials), 7)} ${rpad((s.passRate * 100).toFixed(1) + "%", 7)} ${rpad("$" + s.avgCostUsd.toFixed(4), 10)} ${rpad(s.avgReviewScore != null ? s.avgReviewScore.toFixed(0) : "-", 8)}`,
    );
  }

  console.log("");
}
