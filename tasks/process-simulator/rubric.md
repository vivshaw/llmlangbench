# Review Rubric: Process Simulator

Evaluate the submitted code on the following dimensions:

- **Correctness** (0-25): Does it correctly simulate the scheduling algorithm? Does it handle channels (capacity 1, blocking on full/empty), locks (exclusive, blocking), worker limits, alphabetical scheduling with provisional state, and deadlock detection? Does it produce the correct output format?
- **Architecture** (0-25): Is the simulator well-structured? Expect clear separation between: input parsing, process/instruction representation, scheduler loop, state management (channels, locks), and output formatting. The core scheduling loop should be identifiable and clean.
- **Idiom usage** (0-25): Does it use language-appropriate patterns? For example: enums/ADTs for instruction types, appropriate data structures for the ready queue and state, clean iteration patterns, proper use of the language's concurrency or state management idioms.
- **Readability** (0-25): Is the code understandable? Are the scheduling rules clearly implemented? Are data structures and variables well-named? Is the provisional state update logic followable?

## Scoring

Score each dimension independently, then sum them for the total score (out of 100). A score of 100 is appropriate when all rubric criteria are fully met. Do not reserve points for hypothetical improvements not mentioned in the rubric.

## Deductions

Deduct points for:
- Incorrect greedy alphabetical scheduling (e.g. not updating provisional state between process checks)
- Missing or broken deadlock detection
- Incorrect channel semantics (wrong capacity, not blocking on full)
- Monolithic functions that mix parsing, scheduling, and output
- Over-engineering (e.g. implementing actual threads/goroutines when a simulation loop suffices)
- Dead code, excessive comments, or unused imports
