import Anthropic from "@anthropic-ai/sdk";
import * as fs from "node:fs";
import * as path from "node:path";

export interface ReviewResult {
  score: number;
  review: string;
}

const SKIP_DIRS = new Set([
  "node_modules",
  ".venv",
  "venv",
  "__pycache__",
  ".mypy_cache",
  "target",
  ".stack-work",
  "dist",
  "build",
  ".gradle",
  "gradle",
  ".git",
  "vendor",
]);

const SKIP_EXTENSIONS = new Set([
  ".jar",
  ".class",
  ".o",
  ".so",
  ".dylib",
  ".exe",
  ".pyc",
  ".lock",
]);

export function collectSourceFiles(dir: string): Map<string, string> {
  const files = new Map<string, string>();

  function walk(current: string, relPrefix: string): void {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const relPath = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".") && !SKIP_DIRS.has(entry.name)) {
          walk(path.join(current, entry.name), relPath);
        }
      } else {
        // skip run.* entrypoints and binary/lock files
        if (/^run\./.test(entry.name)) continue;
        if (SKIP_EXTENSIONS.has(path.extname(entry.name))) continue;

        try {
          const content = fs.readFileSync(
            path.join(current, entry.name),
            "utf-8",
          );
          files.set(relPath, content);
        } catch {
          // skip files that can't be read as utf-8
        }
      }
    }
  }

  walk(dir, "");
  return files;
}

export async function reviewTrialDir(
  dir: string,
  specPath: string,
  rubricPath: string,
  model = "claude-sonnet-4-5-20250929",
  scaffoldDir?: string,
): Promise<ReviewResult> {
  const client = new Anthropic();

  const spec = fs.readFileSync(specPath, "utf-8");
  const rubric = fs.readFileSync(rubricPath, "utf-8");

  let sourceFiles = collectSourceFiles(dir);

  // only review files the agent wrote or modified (exclude unchanged scaffold)
  if (scaffoldDir) {
    const scaffold = collectSourceFiles(scaffoldDir);
    sourceFiles = new Map(
      Array.from(sourceFiles).filter(
        ([relPath, content]) => !scaffold.has(relPath) || scaffold.get(relPath) !== content,
      ),
    );
  }

  if (sourceFiles.size === 0) {
    return { score: 0, review: "No source files found in trial directory." };
  }

  const filesSection = Array.from(sourceFiles.entries())
    .map(([relPath, content]) => `### ${relPath}\n\`\`\`\n${content}\n\`\`\``)
    .join("\n\n");

  const prompt = `You are a code reviewer evaluating AI-generated code. Review the following code that was written to satisfy a task specification.

## Task Specification

${spec}

## Review Rubric

${rubric}

## Source Files

${filesSection}

## Instructions

Evaluate the code against the rubric and specification. Respond with a JSON object containing:
- "score": a number from 0 to 100 (0 = terrible, 100 = perfect)
- "review": a brief written review (1-2 paragraphs) explaining the score

Respond ONLY with the JSON object, no other text.`;

  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    temperature: 0,
    messages: [{ role: "user", content: prompt }],
  });

  // extract text from response
  const textBlock = response.content.find((b) => b.type === "text");
  const raw = textBlock?.text ?? "";

  // parse JSON, handling optional markdown code fences
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, raw];
  const jsonStr = (jsonMatch[1] ?? raw).trim();

  const parsed = JSON.parse(jsonStr) as { score: number; review: string };

  return {
    score: Math.max(0, Math.min(100, parsed.score)),
    review: parsed.review,
  };
}
