# Review Rubric: Regex Matcher

Evaluate the submitted code on the following dimensions:

- **Correctness** (0-25): Does it correctly handle all supported regex features? Literals, `.`, `*`, `+`, `?`, `|`, grouping, character classes (including ranges and negation), escape sequences, counted repetition (`{n}`, `{n,}`, `{n,m}`), and shorthand classes (`\d`, `\w`, `\s` and negations)? Does it enforce full-match semantics?
- **Architecture** (0-25): Is the engine well-structured? Expect a clear separation between parsing (pattern → AST/IR) and matching (AST × string → bool). An NFA-based approach, recursive descent parser, or clean backtracking matcher are all acceptable. Deduct for ad-hoc string manipulation that doesn't generalize.
- **Idiom usage** (0-25): Does it use language-appropriate patterns? For example: algebraic data types for the AST in Haskell/Rust, enums in Java, clean OOP or functional decomposition where appropriate.
- **Readability** (0-25): Is the code understandable? Are the regex AST nodes clearly named? Is the matching logic followable? Is the code appropriately decomposed without being over-abstracted?

## Scoring

Score each dimension independently, then sum them for the total score (out of 100). A score of 100 is appropriate when all rubric criteria are fully met. Do not reserve points for hypothetical improvements not mentioned in the rubric.

## Deductions

Deduct points for:
- Using built-in regex libraries or functions (this should score 0 for correctness)
- Monolithic functions that mix parsing and matching
- Missing or broken backtracking (greedy quantifiers that don't backtrack)
- Over-engineering (e.g. full DFA minimization for this scope)
- Dead code, excessive comments, or unused imports
