import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKResultMessage } from "@anthropic-ai/claude-agent-sdk";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
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
  language: LanguageConfig,
  runConfig: RunConfig,
  trial: number,
): Promise<TrialResult> {
  const tmpDir = fs.mkdtempSync(
    path.join(os.tmpdir(), `llmlangbench-${taskId}-${language.id}-`),
  );

  const startMs = Date.now();

  try {
    // copy scaffold into temp dir
    copyDirSync(language.scaffoldDir, tmpDir);

    // read the task spec
    const spec = fs.readFileSync(specPath, "utf-8");

    // build prompt
    const prompt = [
      `You are working in ${tmpDir}.`,
      `Your task is to implement a solution in ${language.id}.`,
      "",
      "## Task Specification",
      "",
      spec,
      "",
      "## Instructions",
      "",
      "1. Read the existing files in the working directory to understand the scaffold.",
      "2. Implement the solution in the stub file(s). Do NOT modify the runner entrypoint.",
      `3. Your code will be tested by piping input to \`${language.runCommand}\` and comparing stdout.`,
      `4. You can test manually by running: \`echo "1 2" | ${language.runCommand}\``,
      language.setupCommand
        ? `5. If you need to build first, run: \`${language.setupCommand}\``
        : "",
    ].filter(Boolean).join("\n");

    let resultMessage: SDKResultMessage | undefined;

    for await (const message of query({
      prompt,
      options: {
        model: runConfig.model,
        cwd: tmpDir,
        allowedTools: runConfig.allowedTools,
        maxTurns: runConfig.maxTurns,
        maxBudgetUsd: runConfig.maxBudgetUsd,
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        systemPrompt: {
          type: "preset",
          preset: "claude_code",
          append:
            "focus on implementing the solution in the stub file. Do not modify the runner. Be efficient.",
        },
      },
    })) {
      if (message.type === "result") {
        resultMessage = message;
      }
    }

    const durationMs = Date.now() - startMs;

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
        durationMs,
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
    const scoreResult = await scoreTrialDir(tmpDir, language, testsPath);

    return {
      taskId,
      language: language.id,
      trial,
      status,
      costUsd: resultMessage.total_cost_usd,
      inputTokens: resultMessage.usage.input_tokens,
      outputTokens: resultMessage.usage.output_tokens,
      turns: resultMessage.num_turns,
      durationMs,
      testsPassed: scoreResult.passed,
      testsTotal: scoreResult.total,
      testOutput: scoreResult.output,
    };
  } catch (err: unknown) {
    // SDK process crash — record the error and continue the run
    const durationMs = Date.now() - startMs;
    return {
      taskId,
      language: language.id,
      trial,
      status: "error",
      costUsd: 0,
      inputTokens: 0,
      outputTokens: 0,
      turns: 0,
      durationMs,
      testsPassed: 0,
      testsTotal: 0,
      testOutput: `SDK error: ${err instanceof Error ? err.message : String(err)}`,
    };
  } finally {
    // clean up temp dir
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
