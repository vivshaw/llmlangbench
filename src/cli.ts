import { Command } from "commander";
import * as fs from "node:fs";
import * as path from "node:path";
import { glob } from "node:fs/promises";
import { runTrial } from "./runner.js";
import { scoreTrialDir } from "./scorer.js";
import { buildReport } from "./reporter.js";
import type {
  BenchmarkRun,
  LanguageConfig,
  RunConfig,
  TaskConfig,
} from "./types.js";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const TASKS_DIR = path.join(ROOT_DIR, "tasks");
const RESULTS_DIR = path.join(ROOT_DIR, "results");
const LANGUAGES_PATH = path.join(ROOT_DIR, "languages.json");

function interpolate(template: string, taskId: string): string {
  return template.replaceAll("{taskId}", taskId);
}

function loadLanguages(): Record<string, Omit<LanguageConfig, "id">> {
  const raw = fs.readFileSync(LANGUAGES_PATH, "utf-8");
  return JSON.parse(raw);
}

async function discoverTasks(): Promise<TaskConfig[]> {
  const languageDefs = loadLanguages();
  const tasks: TaskConfig[] = [];

  for await (const specPath of glob(path.join(TASKS_DIR, "*/spec.md"))) {
    const taskDir = path.dirname(specPath);
    const taskId = path.basename(taskDir);

    // skip directories starting with _ (e.g. _template)
    if (taskId.startsWith("_")) continue;
    const testsPath = path.join(taskDir, "tests.json");
    const rubricPath = path.join(taskDir, "rubric.md");

    if (!fs.existsSync(testsPath)) {
      console.warn(`warning: task "${taskId}" has no tests.json, skipping`);
      continue;
    }

    if (!fs.existsSync(rubricPath)) {
      console.warn(`warning: task "${taskId}" has no rubric.md, skipping`);
      continue;
    }

    // discover languages by matching subdirectories to languages.json keys
    const entries = fs.readdirSync(taskDir, { withFileTypes: true });
    const languages: LanguageConfig[] = entries
      .filter((e) => e.isDirectory() && e.name in languageDefs)
      .map((e) => {
        const langId = e.name;
        const def = languageDefs[langId]!;
        return {
          id: langId,
          runCommand: interpolate(def.runCommand, taskId),
          preTrialCommand: def.preTrialCommand
            ? interpolate(def.preTrialCommand, taskId)
            : undefined,
          preScoringCommand: def.preScoringCommand
            ? interpolate(def.preScoringCommand, taskId)
            : undefined,
          testCommand: interpolate(def.testCommand, taskId),
          testFramework: def.testFramework,
        };
      });

    tasks.push({ id: taskId, specPath, testsPath, rubricPath, languages });
  }

  return tasks;
}

const program = new Command();

program
  .name("llmlangbench")
  .description("benchmark LLM coding performance across programming languages")
  .version("0.1.0");

program
  .command("run")
  .description("run benchmarks against discovered tasks")
  .option("-m, --model <model>", "Claude model to use", "claude-sonnet-4-5-20250929")
  .option("-t, --trials <n>", "number of trials per combo", "3")
  .option("--max-turns <n>", "max turns per trial", "30")
  .option("--max-budget <usd>", "max budget per trial in USD", "5")
  .option(
    "--task <id>",
    "run only a specific task (by ID)",
  )
  .option(
    "--language <id>",
    "run only a specific language",
  )
  .option(
    "--review-model <model>",
    "Claude model for AI code review and analysis",
    "claude-sonnet-4-5-20250929",
  )
  .action(async (opts) => {
    const runConfig: RunConfig = {
      model: opts.model,
      maxTurns: parseInt(opts.maxTurns),
      maxBudgetUsd: parseFloat(opts.maxBudget),
      trials: parseInt(opts.trials),
      allowedTools: ["Read", "Edit", "Write", "Bash", "Glob", "Grep"],
    };

    const runId = new Date().toISOString().replace(/[:.]/g, "-");
    const runDir = path.join(RESULTS_DIR, runId);
    fs.mkdirSync(runDir, { recursive: true });

    const benchmarkRun: BenchmarkRun = {
      id: runId,
      timestamp: new Date().toISOString(),
      config: runConfig,
      results: [],
    };

    let tasks = await discoverTasks();

    if (opts.task) {
      tasks = tasks.filter((t) => t.id === opts.task);
      if (tasks.length === 0) {
        console.error(`no task found with id "${opts.task}"`);
        process.exit(1);
      }
    }

    if (tasks.length === 0) {
      console.error("no tasks discovered. add tasks to the tasks/ directory.");
      process.exit(1);
    }

    console.log(`starting benchmark run: ${runId}`);
    console.log(`model: ${runConfig.model}`);
    console.log(`tasks: ${tasks.map((t) => t.id).join(", ")}`);
    console.log(`trials per combo: ${runConfig.trials}\n`);

    for (const task of tasks) {
      let languages = task.languages;
      if (opts.language) {
        languages = languages.filter((l) => l.id === opts.language);
      }

      for (const lang of languages) {
        for (let trial = 1; trial <= runConfig.trials; trial++) {
          console.log(
            `running: ${task.id} / ${lang.id} (trial ${trial}/${runConfig.trials})`,
          );

          const scaffoldDir = path.join(path.dirname(task.specPath), lang.id);
          const trialDir = path.join(runDir, task.id, lang.id, `trial-${trial}`);
          const result = await runTrial(
            task.id,
            task.specPath,
            task.testsPath,
            scaffoldDir,
            trialDir,
            lang,
            runConfig,
            trial,
            task.rubricPath,
            opts.reviewModel,
          );

          benchmarkRun.results.push(result);

          const reviewInfo = result.reviewScore != null
            ? ` | review: ${result.reviewScore}/100`
            : " | review: n/a";
          console.log(
            `  -> ${result.testsPassed}/${result.testsTotal} tests passed | $${result.costUsd.toFixed(4)} | ${result.turns} turns | ${(result.durationMs / 1000).toFixed(1)}s${reviewInfo}`,
          );
        }
      }
    }

    // write results
    const outPath = path.join(runDir, "run.json");
    fs.writeFileSync(outPath, JSON.stringify(benchmarkRun, null, 2));
    console.log(`\nresults written to: ${outPath}`);

    // build report, write to file, and print
    const report = await buildReport(benchmarkRun, opts.reviewModel);
    const reportPath = path.join(runDir, "report.md");
    fs.writeFileSync(reportPath, report);
    console.log(`report written to: ${reportPath}`);
    console.log(report);
  });

program
  .command("report")
  .description("print summary report from a run directory")
  .argument("<dir>", "path to run directory (contains run.json)")
  .option(
    "--review-model <model>",
    "Claude model for AI language analysis",
    "claude-sonnet-4-5-20250929",
  )
  .action(async (dir: string, opts: { reviewModel: string }) => {
    const runJsonPath = path.resolve(dir, "run.json");
    if (!fs.existsSync(runJsonPath)) {
      console.error(`run.json not found in: ${path.resolve(dir)}`);
      process.exit(1);
    }

    const raw = fs.readFileSync(runJsonPath, "utf-8");
    const run: BenchmarkRun = JSON.parse(raw);
    const report = await buildReport(run, opts.reviewModel);
    const reportPath = path.resolve(dir, "report.md");
    fs.writeFileSync(reportPath, report);
    console.log(`report written to: ${reportPath}`);
    console.log(report);
  });

program
  .command("score")
  .description("re-score an existing trial directory")
  .argument("<dir>", "path to trial directory")
  .requiredOption("--tests <path>", "path to tests.json file")
  .option("--run-command <cmd>", "run command", "npx tsx run.ts")
  .option("--pre-scoring-command <cmd>", "command to run before scoring (e.g. build step)")
  .action(async (dir: string, opts: { tests: string; runCommand: string; preScoringCommand?: string }) => {
    const result = await scoreTrialDir(
      path.resolve(dir),
      { runCommand: opts.runCommand, preScoringCommand: opts.preScoringCommand },
      path.resolve(opts.tests),
    );
    console.log(`passed: ${result.passed}/${result.total}`);
    console.log(`\noutput:\n${result.output}`);
  });

program
  .command("transcript")
  .description("display a trial transcript in human-readable format")
  .argument("<path>", "path to transcript.jsonl or trial directory")
  .action((inputPath: string) => {
    const resolved = path.resolve(inputPath);
    const jsonlPath = resolved.endsWith(".jsonl")
      ? resolved
      : path.join(resolved, "transcript.jsonl");

    if (!fs.existsSync(jsonlPath)) {
      console.error(`transcript not found: ${jsonlPath}`);
      process.exit(1);
    }

    const lines = fs.readFileSync(jsonlPath, "utf-8").trim().split("\n");

    const RESET = "\x1b[0m";
    const BOLD = "\x1b[1m";
    const DIM = "\x1b[2m";
    const CYAN = "\x1b[36m";
    const GREEN = "\x1b[32m";
    const YELLOW = "\x1b[33m";
    const MAGENTA = "\x1b[35m";
    const BLUE = "\x1b[34m";

    const SEP = `${DIM}${"─".repeat(80)}${RESET}`;

    for (const line of lines) {
      const msg = JSON.parse(line);

      if (msg.type === "system" && msg.subtype === "init") {
        console.log(SEP);
        console.log(`${BOLD}${CYAN}[system]${RESET} session started`);
        console.log(`  cwd: ${DIM}${msg.cwd}${RESET}`);
        console.log(`  tools: ${DIM}${msg.tools.join(", ")}${RESET}`);
        console.log(SEP);
      } else if (msg.type === "assistant") {
        const content = msg.message?.content ?? [];
        for (const block of content) {
          if (block.type === "text" && block.text) {
            console.log(`\n${BOLD}${GREEN}[assistant]${RESET} ${block.text}`);
          } else if (block.type === "tool_use") {
            const inputStr = typeof block.input === "object"
              ? JSON.stringify(block.input, null, 2)
                  .split("\n")
                  .map((l: string) => `  ${l}`)
                  .join("\n")
              : String(block.input);
            console.log(
              `\n${BOLD}${YELLOW}[tool]${RESET} ${BOLD}${block.name}${RESET}`,
            );
            console.log(`${DIM}${inputStr}${RESET}`);
          }
        }
      } else if (msg.type === "user") {
        const content = msg.message?.content ?? [];
        for (const block of content) {
          if (block.type === "tool_result") {
            const result = typeof block.content === "string"
              ? block.content
              : JSON.stringify(block.content);
            // truncate long outputs
            const maxLen = 500;
            const display = result.length > maxLen
              ? result.slice(0, maxLen) + `\n${DIM}... (${result.length} chars total)${RESET}`
              : result;
            console.log(`${MAGENTA}[result]${RESET} ${DIM}${display}${RESET}`);
          }
        }
      } else if (msg.type === "result") {
        console.log(SEP);
        console.log(
          `${BOLD}${BLUE}[done]${RESET} ${msg.subtype} | ${msg.num_turns} turns | ${(msg.duration_ms / 1000).toFixed(1)}s`,
        );
        if (msg.result) {
          console.log(`\n${msg.result}`);
        }
        console.log(SEP);
      }
    }
  });

program.parse();
