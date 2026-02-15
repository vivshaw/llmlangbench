# llmlangbench

benchmark LLM coding performance across programming languages.

## languages

| language | why it's interesting |
|---|---|
| Python | the lingua franca of LLM training data. expected baseline |
| TypeScript | massively in-distribution, types to keep things in line |
| JavaScript | just like TypeScript, but no types. how important are types to agent success? |
| Ruby | elegant, concise, expressive, but smaller training corpus than Python/JS, and highly dynamic |
| Go | simple language with strict conventions. do LLMs thrive with less ambiguity? |
| Rust | borrow checker and ownership are hard for humans, but provide strong guarantees. how do LLMs fare? |
| Haskell | pure FP with a powerful type system. a real test of reasoning ability |
| Java | verbose and ceremony-heavy. can LLMs handle the boilerplate? |

## prerequisites

run `./scripts/check-prereqs.sh` to verify your system is ready.

**harness:**
- [Node.js](https://nodejs.org/) (>= 18) — runs the benchmark harness itself
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) — the trial agents run via the Claude Agent SDK
- `ANTHROPIC_API_KEY` environment variable set

**languages:**
| language | requires |
|---|---|
| TypeScript | node, npm |
| JavaScript | node, npm |
| Python | python3, venv module (`apt install python3-venv` on Debian/Ubuntu) |
| Ruby | ruby, bundler |
| Rust | cargo |
| Go | go |
| Haskell | stack |
| Java | JDK (java, javac) |

## running benchmarks

```bash
npm install

# run all tasks across all languages
npx tsx src/cli.ts run

# run a specific task and language
npx tsx src/cli.ts run --task add-two-numbers --language python --trials 1

# use a different model or a different review model
npx tsx src/cli.ts run --model claude-sonnet-4-5-20250929 --review-model claude-haiku-4-5-20251001

# print a report from a previous run (regenerates AI analysis)
npx tsx src/cli.ts report results/{runId}

# use a different review model for the report
npx tsx src/cli.ts report results/{runId} --review-model claude-haiku-4-5-20251001

# view an agent's transcript from a trial
npx tsx src/cli.ts transcript results/{runId}/{task}/{lang}/trial-1

# re-score an existing trial directory
npx tsx src/cli.ts score results/{runId}/{task}/{lang}/trial-1 --tests tasks/{task}/tests.json
```

| flag | default | description |
|---|---|---|
| `-m, --model` | `claude-sonnet-4-5-20250929` | model for trial agents |
| `-t, --trials` | `3` | number of trials per task/language combo |
| `--max-turns` | `30` | max agent turns per trial |
| `--max-budget` | `5` | max USD per trial |
| `--task` | all | run only a specific task |
| `--language` | all | run only a specific language |
| `--review-model` | `claude-sonnet-4-5-20250929` | model for AI code review and analysis |

## scoring

trials are evaluated on two axes:

**test scoring:** black-box stdin/stdout testing. the harness pipes each test case's `input` to the runner entrypoint and compares stdout against `expected`. supports exact match and approximate float comparison.

**AI code review:** after tests, an LLM reads the agent's source files and evaluates them against the task's `rubric.md`. produces a score (0-100) and written review. this captures code quality, idiom usage, simplicity, and other things tests can't measure. the review model is configurable separately from the trial model.

## results

each run is saved to `results/{runId}/` with the trial working directories preserved, so you can inspect the results:

```
results/2026-02-14T10-07-58-099Z/
  run.json                          # scores, costs, timing
  report.md                         # markdown report (tables + AI analysis if --review-model was used)
  add-two-numbers/
    python/trial-1/                 # the agent's working directory
    typescript/trial-1/
    ...
```

## language configuration

languages are configured in `languages.json` at the project root. each entry defines how to install dependencies, run code, and run tests for that language:

```json
{
  "python": {
    "runCommand": "python3 run.py",
    "preTrialCommand": "python3 -m venv .venv && .venv/bin/pip install pytest",
    "testCommand": ".venv/bin/python -m pytest",
    "testFramework": "pytest"
  }
}
```

| field | purpose | when it runs |
|---|---|---|
| `preTrialCommand` | install dependencies (npm install, pip install, etc.) | before the trial agent starts |
| `preScoringCommand` | build/compile the project | before scoring |
| `testCommand` | run the test suite | by the trial agent during TDD |
| `testFramework` | human-readable name shown to the agent | in the agent prompt |
| `runCommand` | execute the runner entrypoint (reads stdin, writes stdout) | during scoring |

commands support `{taskId}` interpolation for languages where the binary name depends on the task (e.g. `"./target/release/{taskId}"` for Rust).

### adding a new language

1. add an entry to `languages.json`
2. create a scaffold directory for each task that supports it

## tasks

each task lives in `tasks/{taskId}/` and contains:

| file | purpose |
|---|---|
| `spec.md` | the task specification shown to the agent |
| `tests.json` | black-box test cases (input/expected pairs for stdin/stdout scoring) |
| `rubric.md` | criteria for AI code review scoring |
| `{language}/` | scaffold directory per language (stub files, runner entrypoint, config) |

the agent sees the spec and scaffold, then follows a TDD workflow: write tests, run them, implement, iterate until passing.

### current tasks

| task | difficulty | domain | description |
|---|---|---|---|
| `add-two-numbers` | trivial | arithmetic | add two numbers — baseline sanity check |
| `sudoku-solver` | hard | search/constraint | solve 9x9 sudoku puzzles using backtracking + constraint propagation, including hard puzzles with minimal givens |
| `regex-matcher` | hard | automata theory | build a regex engine from scratch (no built-in regex allowed) supporting literals, `.`, `*`, `+`, `?`, `\|`, groups, character classes, and escapes |
| `mini-typechecker` | hard | PL theory | infer and check types for an expression language with let-polymorphism, lambdas, and unification (Hindley-Milner lite) |

### planned tasks

| task | difficulty | domain | description |
|---|---|---|---|
| `git-object-parser` | hard | binary parsing | parse raw git objects (blob, tree, commit), reconstruct a commit log from a packfile-lite format |
| `http-request-parser` | hard | protocol parsing | parse raw HTTP/1.1 requests — chunked transfer encoding, multipart bodies, header folding — and output structured JSON |

### adding a new task

1. copy `tasks/_template/` to `tasks/{your-task-id}/`
2. write `spec.md` with the task description and requirements
3. write `tests.json` with stdin/stdout test cases:
   ```json
   {
     "tests": [
       { "input": "1 2\n", "expected": "3" },
       { "input": "0.1 0.2\n", "expected": "0.3", "approx": true }
     ]
   }
   ```
4. write `rubric.md` with task-specific review criteria
5. create a scaffold directory for each language you want to support (e.g. `python/`, `typescript/`), each containing:
   - a runner entrypoint (`run.py`, `run.ts`, etc.) that reads stdin and writes to stdout
   - stub implementation file(s) for the agent to fill in
   - any config files needed (package.json, Cargo.toml, etc.)
