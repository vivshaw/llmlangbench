# Review Rubric: Sudoku Solver

Evaluate the submitted code on the following dimensions:

- **Correctness** (0-25): Does it solve all valid Sudoku puzzles, including hard ones with few givens? Does it correctly enforce row, column, and box constraints?
- **Algorithm quality** (0-25): Does it use an efficient approach? A naive brute-force backtracker that tries all 9 digits in every cell is insufficient — expect at least basic constraint propagation (e.g. tracking candidates per cell, naked singles) combined with backtracking. Award full marks for well-implemented constraint propagation + backtracking.
- **Idiom usage** (0-25): Does it use language-appropriate patterns? For example: pattern matching in Haskell/Rust, iterators, proper data structures, idiomatic error handling.
- **Readability** (0-25): Is the code well-structured and understandable? Is the solver logic clearly separated from helpers? Are variable names descriptive? Is the code appropriately decomposed without being over-abstracted?

## Scoring

Score each dimension independently, then sum them for the total score (out of 100). A score of 100 is appropriate when all rubric criteria are fully met. Do not reserve points for hypothetical improvements not mentioned in the rubric.

## Deductions

Deduct points for:
- Brute-force-only approach with no pruning or constraint propagation
- Unnecessary complexity or over-engineering (e.g. implementing Dancing Links for a standard backtracking problem)
- Mutation-heavy style in functional languages, or overly functional style where mutation is idiomatic
- Dead code, excessive comments, or unused imports
- Poor separation of concerns (e.g. I/O mixed into solver logic)
