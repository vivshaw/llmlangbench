import { execSync } from "node:child_process";
import * as fs from "node:fs";
import type { LanguageConfig, TestBank, TestCase } from "./types.js";

export interface ScoreResult {
  passed: number;
  total: number;
  output: string;
}

const FLOAT_EPSILON = 1e-9;

function compareOutput(actual: string, expected: string, approx?: boolean): boolean {
  const trimmedActual = actual.trim();
  const trimmedExpected = expected.trim();

  if (approx) {
    const a = parseFloat(trimmedActual);
    const e = parseFloat(trimmedExpected);
    if (isNaN(a) || isNaN(e)) return false;
    return Math.abs(a - e) < FLOAT_EPSILON;
  }

  return trimmedActual === trimmedExpected;
}

function runOneTest(
  dir: string,
  runCommand: string,
  testCase: TestCase,
): { pass: boolean; actual: string; error?: string } {
  try {
    const actual = execSync(runCommand, {
      cwd: dir,
      input: testCase.input,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 30_000,
      encoding: "utf-8",
    });

    const pass = compareOutput(actual, testCase.expected, testCase.approx);
    return { pass, actual: actual.trim() };
  } catch (err: unknown) {
    let msg = String(err);
    if (err && typeof err === "object" && "stderr" in err) {
      msg = (err as { stderr: string }).stderr || msg;
    }
    return { pass: false, actual: "", error: msg.slice(0, 500) };
  }
}

export async function scoreTrialDir(
  dir: string,
  language: LanguageConfig,
  testsPath: string,
): Promise<ScoreResult> {
  const raw = fs.readFileSync(testsPath, "utf-8");
  const testBank: TestBank = JSON.parse(raw);

  // run setup command if present
  if (language.setupCommand) {
    try {
      execSync(language.setupCommand, {
        cwd: dir,
        stdio: "pipe",
        timeout: 120_000,
      });
    } catch (err: unknown) {
      let msg = String(err);
      if (err && typeof err === "object" && "stderr" in err) {
        msg = (err as { stderr: string }).stderr || msg;
      }
      return {
        passed: 0,
        total: testBank.tests.length,
        output: `Setup failed: ${msg.slice(0, 2000)}`,
      };
    }
  }

  let passed = 0;
  const lines: string[] = [];

  for (let i = 0; i < testBank.tests.length; i++) {
    const tc = testBank.tests[i]!;
    const result = runOneTest(dir, language.runCommand, tc);

    if (result.pass) {
      passed++;
      lines.push(`  PASS [${i + 1}]: input=${JSON.stringify(tc.input)} expected=${JSON.stringify(tc.expected)} got=${JSON.stringify(result.actual)}`);
    } else if (result.error) {
      lines.push(`  FAIL [${i + 1}]: input=${JSON.stringify(tc.input)} expected=${JSON.stringify(tc.expected)} error=${result.error}`);
    } else {
      lines.push(`  FAIL [${i + 1}]: input=${JSON.stringify(tc.input)} expected=${JSON.stringify(tc.expected)} got=${JSON.stringify(result.actual)}`);
    }
  }

  const total = testBank.tests.length;
  const summary = `${passed}/${total} tests passed`;
  const output = [summary, ...lines].join("\n");

  return { passed, total, output: output.slice(-5000) };
}
