# llmlangbench

benchmark LLM coding performance across programming languages.

> **status**: early development. everything below is subject to change.

## languages

| language | why it's interesting |
|---|---|
| Python | the lingua franca of LLM training data — expected baseline |
| TypeScript | massively in-distribution, types to keep things in line |
| JavaScript | just like TypeScript, but no types- how important are types to agent success? |
| Ruby | elegant, concise, expressive, but smaller training corpus than Python/JS, and highly dynamic |
| Go | simple language with strict conventions — do LLMs thrive with less ambiguity? |
| Rust | borrow checker and ownership are hard for humans, but provide strong guarantees — how do LLMs fare? |
| Haskell | pure FP with a powerful type system — a real test of reasoning ability |
| Java | verbose and ceremony-heavy — can LLMs handle the boilerplate? |

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

to add a new language:
1. add an entry to `languages.json`
2. create a scaffold directory for each task that supports it

## results

each run is saved to `results/{runId}/` with the trial working directories preserved, so you can inspect the results:

```
results/2026-02-14T10-07-58-099Z/
  run.json                          # scores, costs, timing
  add-two-numbers/
    python/trial-1/                 # the agent's working directory
    typescript/trial-1/
    ...
```

## TBD

- how tasks work
- how scoring works
- how to run benchmarks
- how to add new tasks
