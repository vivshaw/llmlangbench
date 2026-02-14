
/*
 * a single test case: input piped to stdin, expected stdout
 */
export interface TestCase {
  input: string;
  expected: string;
  approx?: boolean;
}

/*
 * the test bank for a task, loaded from tests.json
 */
export interface TestBank {
  tests: TestCase[];
}

/*
 * the benchmark is made up of several specs, which will each be run
 * against multiple languages.
 */
export interface TaskConfig {
  id: string;
  specPath: string;
  testsPath: string;
  languages: LanguageConfig[];
}

/*
 * each language has its own seed directory, run command, and setup command.
 */
export interface LanguageConfig {
  id: string;

  /* reads from stdin, writes to stdout */
  runCommand: string;

  /* runs before the trial agent starts (e.g. npm install, pip install) */
  preTrialCommand?: string;

  /* runs before scoring (e.g. cargo build, stack build) */
  preScoringCommand?: string;
  
  /* actual command for the agent to run tests */
  testCommand: string;

  /* English-language description of the test framework */
  testFramework: string;
}

/*
 * user-specified params for the benchmark.
 */
export interface RunConfig {
  /* which Claude will we run on? */
  model: string;

  /* turn limit- don't want to let Claude take unbounded time */
  maxTurns: number;

  /* cost limit- so you don't burn a hole in your wallet */
  maxBudgetUsd: number;

  /* how many times should each spec be run against each language? */
  trials: number;

  /* limit the set of tools the benchmark runs can access */
  allowedTools: string[];
}

/*
 * how'd Claude do?
 */
export interface TrialResult {
  taskId: string;
  language: string;
  trial: number;
  status: "success" | "error" | "max_turns" | "max_budget";
  costUsd: number;
  inputTokens: number;
  outputTokens: number;
  turns: number;
  durationMs: number;
  testsPassed: number;
  testsTotal: number;
  testOutput: string;
}

/*
 * each run will pop out a batch of trial results, `trials` for each `language`
 */
export interface BenchmarkRun {
  id: string;
  timestamp: string;
  config: RunConfig;
  results: TrialResult[];
}
