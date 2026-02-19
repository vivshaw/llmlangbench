import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKResultMessage } from "@anthropic-ai/claude-agent-sdk";
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { reviewTrialDir } from "./reviewer.js";
import { scoreTrialDir } from "./scorer.js";
import type { LanguageConfig, RunConfig, TrialResult } from "./types.js";

function copyDirSync(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export async function runTrial(
  taskId: string,
  specPath: string,
  testsPath: string,
  scaffoldDir: string,
  trialDir: string,
  language: LanguageConfig,
  runConfig: RunConfig,
  trial: number,
  rubricPath: string,
  reviewModel: string,
): Promise<TrialResult> {
  fs.mkdirSync(trialDir, { recursive: true });

  let resultMessage: SDKResultMessage | undefined;

  try {
    // copy scaffold into trial dir
    copyDirSync(scaffoldDir, trialDir);

    // install dependencies before handing off to the agent
    if (language.preTrialCommand) {
      execSync(language.preTrialCommand, {
        cwd: trialDir,
        stdio: "pipe",
        timeout: 120_000,
      });
    }

    // read the task spec
    const spec = fs.readFileSync(specPath, "utf-8");

    // build prompt
    const prompt = [
      `You are working in ${trialDir}.`,
      `Your task is to implement a solution in ${language.id}.`,
      "",
      "## Task Specification",
      "",
      spec,
      "",
      "## Development Environment",
      "",
      `- **Language**: ${language.id}`,
      `- **Test framework**: ${language.testFramework}`,
      `- **Run tests**: \`${language.testCommand}\``,
      language.preScoringCommand
        ? `- **Setup/build**: \`${language.preScoringCommand}\``
        : "",
      "",
      "## Instructions",
      "",
      "Follow a test-driven development (TDD) approach:",
      "",
      "1. Read the existing files in the working directory to understand the scaffold.",
      "2. Write a thorough test suite first, covering the requirements in the spec — including edge cases.",
      `3. Run your tests with \`${language.testCommand}\` to confirm they fail (since the implementation is a stub).`,
      "4. Implement the solution in the stub file(s). Do NOT modify the runner entrypoint (run.* file).",
      "5. Run your tests again and iterate until all tests pass.",
      "",
      "Your solution will be scored separately, so focus on writing good tests and a correct implementation.",
    ].filter(Boolean).join("\n");

    const transcriptPath = path.join(trialDir, "transcript.jsonl");
    const transcriptStream = fs.createWriteStream(transcriptPath);

    for await (const message of query({
      prompt,
      options: {
        model: runConfig.model,
        cwd: trialDir,
        allowedTools: runConfig.allowedTools,
        maxTurns: runConfig.maxTurns,
        maxBudgetUsd: runConfig.maxBudgetUsd,
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        systemPrompt: {
          type: "preset",
          preset: "claude_code",
          append:
            "Use TDD: write tests first, then implement. Do not modify the runner (run.* file). Be efficient.",
        },
      },
    })) {
      transcriptStream.write(JSON.stringify(message) + "\n");
      if (message.type === "result") {
        if (!resultMessage || (resultMessage.num_turns === 0 && message.num_turns > 0)) {
          resultMessage = message;
        }
      }
    }

    transcriptStream.end();
  } catch (err: unknown) {
    // SDK threw after emitting messages — if we captured a good result, continue with it
    if (!resultMessage) {
      return {
        taskId,
        language: language.id,
        trial,
        status: "error",
        costUsd: 0,
        inputTokens: 0,
        outputTokens: 0,
        turns: 0,
        durationMs: 0,
        testsPassed: 0,
        testsTotal: 0,
        testOutput: `SDK error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  if (!resultMessage) {
    return {
      taskId,
      language: language.id,
      trial,
      status: "error",
      costUsd: 0,
      inputTokens: 0,
      outputTokens: 0,
      turns: 0,
      durationMs: 0,
      testsPassed: 0,
      testsTotal: 0,
      testOutput: "no result message received from SDK",
    };
  }

  // map SDK subtype to our status
  let status: TrialResult["status"];
  switch (resultMessage.subtype) {
    case "success":
      status = "success";
      break;
    case "error_max_turns":
      status = "max_turns";
      break;
    case "error_max_budget_usd":
      status = "max_budget";
      break;
    default:
      status = "error";
      break;
  }

  // score the result
  const scoreResult = await scoreTrialDir(trialDir, language, testsPath);

  // AI code review (best-effort — failure shouldn't tank the trial)
  let reviewScore: number | undefined;
  let reviewText: string | undefined;

  try {
    const review = await reviewTrialDir(trialDir, specPath, rubricPath, reviewModel, scaffoldDir);
    reviewScore = review.score;
    reviewText = review.review;
  } catch (err: unknown) {
    reviewText = `review failed: ${err instanceof Error ? err.message : String(err)}`;
  }

  // sum cumulative tokens across all models used in the session
  let inputTokens = 0;
  let outputTokens = 0;
  for (const mu of Object.values(resultMessage.modelUsage)) {
    inputTokens += mu.inputTokens;
    outputTokens += mu.outputTokens;
  }

  return {
    taskId,
    language: language.id,
    trial,
    status,
    costUsd: resultMessage.total_cost_usd,
    inputTokens,
    outputTokens,
    turns: resultMessage.num_turns,
    durationMs: resultMessage.duration_ms,
    testsPassed: scoreResult.passed,
    testsTotal: scoreResult.total,
    testOutput: scoreResult.output,
    reviewScore,
    reviewText,
  };
}
