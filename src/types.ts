
/*
 * each task has a JSON spec that we'll use to load up the relevant 
 */
export interface TaskJsonFile {
  id: string;
  spec: string;
  languages: Record<
    string,
    { testCommand: string; setupCommand?: string }
  >;
}


/*
 * the benchmark is made up of several specs, which will each be run
 * against multiple languages.
 */
export interface TaskConfig {
  id: string;
  specPath: string;
  languages: LanguageConfig[];
}

/*
 * each language has its own seed directory (including a test suite),
 * test command, and setup command. a working dev env will be provided, so the agent
 * only needs to worry about implementation
 */
export interface LanguageConfig {
  id: string;
  scaffoldDir: string;
  testCommand: string;
  setupCommand?: string;
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
