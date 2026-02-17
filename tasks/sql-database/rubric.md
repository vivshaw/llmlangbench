# Review Rubric: SQL Database

Evaluate the submitted code on the following dimensions:

- **Correctness** (0-25): Does it correctly implement the full SQL subset? This includes: parsing SQL statements (CREATE TABLE, INSERT, SELECT, UPDATE, DELETE), expression evaluation with correct operator precedence, NULL three-valued logic, INNER/LEFT JOIN, GROUP BY with HAVING and aggregate functions (COUNT/SUM/AVG/MIN/MAX), ORDER BY with ASC/DESC and NULL ordering, LIMIT/OFFSET, DISTINCT, LIKE with wildcards, IN/EXISTS with subqueries, type handling (INTEGER/TEXT/BOOLEAN/FLOAT with correct display formatting), and proper pipe-separated output format.
- **Architecture** (0-25): Is the implementation well-structured with clear separation of concerns? Expect identifiable subsystems: SQL parser/lexer, AST/IR representation, schema/catalog management, storage engine, expression evaluator, query executor (scan, join, aggregation, sorting). Deduct for monolithic functions that mix parsing with execution, or ad-hoc string manipulation instead of proper parsing.
- **Idiom usage** (0-25): Does it use language-appropriate patterns? For example: enums/ADTs for AST nodes and SQL types, proper data structures for table storage and indexes, pattern matching where appropriate, iterators/streams for result processing, proper error handling idioms.
- **Readability** (0-25): Is the code understandable and well-decomposed? Are components clearly named? Is the query execution flow followable? Is the code appropriately modularized without being over-abstracted?

Deduct points for:
- Missing or broken NULL three-valued logic (NULL propagation in expressions, WHERE filtering, aggregate behavior)
- Missing or broken JOIN support (especially LEFT JOIN NULL filling)
- Missing or broken aggregation (GROUP BY/HAVING, correct COUNT(*) vs COUNT(col) semantics)
- Missing or broken subquery support
- Incorrect output formatting (wrong pipe separation, wrong FLOAT decimal places, wrong column headers for aggregates)
- SQL parser that relies on regex pattern matching rather than proper tokenization and parsing
- Monolithic functions that combine parsing, planning, and execution
- Over-engineering (e.g., building a full query optimizer or B-tree index for this scope)
- Dead code, excessive comments, or unused imports
- I/O logic mixed into the query engine core
