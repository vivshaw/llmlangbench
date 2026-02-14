# llmlangbench

benchmark LLM coding performance across programming languages.

> **status**: early development. everything below is subject to change.

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

## TBD

- how tasks work
- how scoring works
- ow to run benchmarks
- how to add new tasks
