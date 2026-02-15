# Review Rubric: Mini Typechecker

Evaluate the submitted code on the following dimensions:

- **Correctness** (0-25): Does it correctly infer types for all supported expressions? Does it handle type unification, let-polymorphism (generalization and instantiation), `let rec` (recursive bindings), and error detection? Does it produce correctly formatted type output?
- **Architecture** (0-25): Is the implementation well-structured? Expect clear separation between parsing, AST representation, and type inference. The type inference engine should have identifiable components: environment/context, unification, generalization/instantiation. Deduct for ad-hoc approaches that conflate parsing with inference.
- **Idiom usage** (0-25): Does it use language-appropriate patterns? For example: algebraic data types for the AST and types in Haskell/Rust, sum types or sealed classes in other languages, proper use of the language's abstraction mechanisms.
- **Readability** (0-25): Is the code understandable? Are AST nodes, type constructors, and inference functions clearly named? Is the unification algorithm followable? Is the code well-decomposed without being over-abstracted?

Deduct points for:
- Missing or broken unification (e.g. no occurs check, no proper substitution)
- Missing let-polymorphism (no generalization/instantiation)
- Missing or broken `let rec` support (recursive bindings)
- Monolithic functions that mix parsing, inference, and unification
- Over-engineering (e.g. full constraint-based inference with solver for this scope)
- Dead code, excessive comments, or unused imports
- I/O logic mixed into the type inference core
