import { Command } from "commander";
import * as fs from "node:fs";
import * as path from "node:path";
import { glob } from "node:fs/promises";
import { runTrial } from "./runner.js";
import { scoreTrialDir } from "./scorer.js";
import { printReport } from "./reporter.js";
import type {
  BenchmarkRun,
  LanguageConfig,
  RunConfig,
  TaskConfig,
  TaskJsonFile,
} from "./types.js";

const TASKS_DIR = path.resolve(import.meta.dirname, "..", "tasks");
const RESULTS_DIR = path.resolve(import.meta.dirname, "..", "results");

async function discoverTasks(): Promise<TaskConfig[]> {
  const tasks: TaskConfig[] = [];

  for await (const taskJsonPath of glob(path.join(TASKS_DIR, "*/task.json"))) {
    const raw = fs.readFileSync(taskJsonPath, "utf-8");
    const taskJson: TaskJsonFile = JSON.parse(raw);
    const taskDir = path.dirname(taskJsonPath);

    const languages: LanguageConfig[] = Object.entries(
      taskJson.languages,
    ).map(([langId, langConf]) => ({
      id: langId,
      scaffoldDir: path.join(taskDir, langId),
      runCommand: langConf.runCommand,
      setupCommand: langConf.setupCommand,
    }));

    tasks.push({
      id: taskJson.id,
      specPath: path.join(taskDir, taskJson.spec),
      testsPath: path.join(taskDir, taskJson.tests),
      languages,
    });
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
  .action(async (opts) => {
    const runConfig: RunConfig = {
      model: opts.model,
      maxTurns: parseInt(opts.maxTurns),
      maxBudgetUsd: parseFloat(opts.maxBudget),
      trials: parseInt(opts.trials),
      allowedTools: ["Read", "Edit", "Write", "Bash", "Glob", "Grep"],
    };

    const runId = new Date().toISOString().replace(/[:.]/g, "-");
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

          const result = await runTrial(
            task.id,
            task.specPath,
            task.testsPath,
            lang,
            runConfig,
            trial,
          );

          benchmarkRun.results.push(result);

          console.log(
            `  -> ${result.testsPassed}/${result.testsTotal} tests passed | $${result.costUsd.toFixed(4)} | ${result.turns} turns | ${(result.durationMs / 1000).toFixed(1)}s`,
          );
        }
      }
    }

    // Write results
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
    const outPath = path.join(RESULTS_DIR, `${runId}.json`);
    fs.writeFileSync(outPath, JSON.stringify(benchmarkRun, null, 2));
    console.log(`\nresults written to: ${outPath}`);

    // Print summary
    printReport(benchmarkRun);
  });

program
  .command("report")
  .description("print summary report from a results JSON file")
  .argument("<file>", "path to results JSON file")
  .action((file: string) => {
    const filePath = path.resolve(file);
    if (!fs.existsSync(filePath)) {
      console.error(`file not found: ${filePath}`);
      process.exit(1);
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const run: BenchmarkRun = JSON.parse(raw);
    printReport(run);
  });

program
  .command("score")
  .description("re-score an existing trial directory")
  .argument("<dir>", "path to trial directory")
  .requiredOption("--tests <path>", "path to tests.json file")
  .option("--run-command <cmd>", "run command", "npx tsx run.ts")
  .option("--setup-command <cmd>", "setup command to run first")
  .action(async (dir: string, opts: { tests: string; runCommand: string; setupCommand?: string }) => {
    const langConfig: LanguageConfig = {
      id: "manual",
      scaffoldDir: dir,
      runCommand: opts.runCommand,
      setupCommand: opts.setupCommand,
    };

    const result = await scoreTrialDir(path.resolve(dir), langConfig, path.resolve(opts.tests));
    console.log(`passed: ${result.passed}/${result.total}`);
    console.log(`\noutput:\n${result.output}`);
  });

program.parse();
