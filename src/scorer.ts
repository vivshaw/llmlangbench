import { execSync } from "node:child_process";
import type { LanguageConfig } from "./types.js";

export interface ScoreResult {
  passed: number;
  total: number;
  output: string;
}

type TestParser = (output: string) => { passed: number; total: number } | null;

// Jest / Vitest: "Tests:  3 passed, 3 total" or " Tests  5 passed (5)"
const parseJestVitest: TestParser = (output) => {
  // Vitest: "      Tests  5 passed (5)" — note "Tests" at start-of-line (with spaces),
  // NOT "Test Files". The total is in parens.
  const vitestMatch = output.match(
    /^\s*Tests\s+(?:.*?)(\d+)\s+passed\s+\((\d+)\)/m,
  );
  if (vitestMatch) {
    return { passed: parseInt(vitestMatch[1]!), total: parseInt(vitestMatch[2]!) };
  }

  // Jest: "Tests:       3 passed, 3 total"
  const jestMatch = output.match(
    /Tests:\s+(?:.*?)(\d+)\s+passed,\s+(\d+)\s+total/,
  );
  if (jestMatch) {
    return { passed: parseInt(jestMatch[1]!), total: parseInt(jestMatch[2]!) };
  }

  return null;
};

// pytest: "3 passed" or "2 passed, 1 failed"
const parsePytest: TestParser = (output) => {
  const passed = output.match(/(\d+)\s+passed/);
  const failed = output.match(/(\d+)\s+failed/);
  const errors = output.match(/(\d+)\s+error/);

  if (!passed && !failed && !errors) return null;

  const p = passed ? parseInt(passed[1]!) : 0;
  const f = failed ? parseInt(failed[1]!) : 0;
  const e = errors ? parseInt(errors[1]!) : 0;
  return { passed: p, total: p + f + e };
};

// go test: verbose "--- PASS/FAIL" lines, or non-verbose "ok"/"FAIL" summary
const parseGoTest: TestParser = (output) => {
  // verbose mode: count "--- PASS:" and "--- FAIL:" lines
  const passLines = (output.match(/--- PASS:/g) || []).length;
  const failLines = (output.match(/--- FAIL:/g) || []).length;

  if (passLines > 0 || failLines > 0) {
    return { passed: passLines, total: passLines + failLines };
  }

  // non-verbose mode: "ok" means all passed, "FAIL" means some failed.
  // we can't get individual counts, so report 1/1 or 0/1.
  const okMatch = output.match(/^ok\s/m);
  const failMatch = output.match(/^FAIL\s/m);

  if (okMatch && !failMatch) {
    return { passed: 1, total: 1 };
  }
  if (failMatch) {
    return { passed: 0, total: 1 };
  }

  return null;
};

// cargo test: "test result: ok. 3 passed; 0 failed;"
const parseCargoTest: TestParser = (output) => {
  const match = output.match(
    /test result:.*?(\d+)\s+passed;\s+(\d+)\s+failed/,
  );
  if (!match) return null;
  const passed = parseInt(match[1]!);
  const failed = parseInt(match[2]!);
  return { passed, total: passed + failed };
};

// JUnit (Maven/Gradle): "Tests run: 3, Failures: 0, Errors: 0"
const parseJUnit: TestParser = (output) => {
  const match = output.match(
    /Tests run:\s*(\d+),\s*Failures:\s*(\d+),\s*Errors:\s*(\d+)/,
  );
  if (!match) return null;
  const total = parseInt(match[1]!);
  const failures = parseInt(match[2]!);
  const errors = parseInt(match[3]!);
  return { passed: total - failures - errors, total };
};

// HSpec: "3 examples, 0 failures"
const parseHSpec: TestParser = (output) => {
  const match = output.match(/(\d+)\s+examples?,\s+(\d+)\s+failures?/);
  if (!match) return null;
  const total = parseInt(match[1]!);
  const failures = parseInt(match[2]!);
  return { passed: total - failures, total };
};

const parsers: TestParser[] = [
  parseJestVitest,
  parsePytest,
  parseGoTest,
  parseCargoTest,
  parseJUnit,
  parseHSpec,
];

function parseTestOutput(output: string): { passed: number; total: number } {
  for (const parser of parsers) {
    const result = parser(output);
    if (result) return result;
  }
  // fallback: if the process exited 0 we assume 1/1, else 0/1
  return { passed: 0, total: 0 };
}

export async function scoreTrialDir(
  dir: string,
  language: LanguageConfig,
): Promise<ScoreResult> {
  let output = "";

  try {
    // run setup command if present
    if (language.setupCommand) {
      execSync(language.setupCommand, {
        cwd: dir,
        stdio: "pipe",
        timeout: 120_000,
      });
    }

    // run test command
    const result = execSync(language.testCommand, {
      cwd: dir,
      stdio: "pipe",
      timeout: 120_000,
      encoding: "utf-8",
    });
    output = result;
  } catch (err: unknown) {
    // test commands often exit non-zero on failures — that's expected
    if (err && typeof err === "object" && "stdout" in err) {
      const execErr = err as { stdout: string; stderr: string };
      output = (execErr.stdout || "") + "\n" + (execErr.stderr || "");
    } else {
      output = String(err);
    }
  }

  const { passed, total } = parseTestOutput(output);

  return { passed, total, output: output.slice(-5000) };
}
