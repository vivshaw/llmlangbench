# Task: SQL Database

## Description

Implement an in-memory relational database engine that processes a sequence of SQL statements. Your engine reads SQL from stdin, executes each statement, and prints query results to stdout.

The database supports table creation, data insertion, updates, deletes, and queries with joins, aggregation, subqueries, sorting, and pagination.

## SQL Statements

### CREATE TABLE

```sql
CREATE TABLE name (col1 TYPE, col2 TYPE, ...);
```

Column types: `INTEGER`, `TEXT`, `BOOLEAN`, `FLOAT`.

### INSERT INTO

```sql
INSERT INTO name VALUES (v1, v2, ...);
INSERT INTO name (col1, col2) VALUES (v1, v2, ...);
```

The first form inserts values in column-definition order. The second form maps values to named columns; unmentioned columns receive `NULL`.

### SELECT

```sql
SELECT [DISTINCT] select_list
  FROM table_ref [join_clause ...]
  [WHERE condition]
  [GROUP BY col1, col2, ...]
  [HAVING condition]
  [ORDER BY col1 [ASC|DESC], ...]
  [LIMIT n]
  [OFFSET n];
```

`select_list` is a comma-separated list of expressions, `*` (all columns), or a mix. Expressions can be aliased with `AS name`.

### UPDATE

```sql
UPDATE name SET col1 = expr [, col2 = expr, ...] [WHERE condition];
```

Without `WHERE`, updates all rows.

### DELETE

```sql
DELETE FROM name [WHERE condition];
```

Without `WHERE`, deletes all rows.

## Joins

```sql
FROM t1 [INNER] JOIN t2 ON condition
FROM t1 LEFT JOIN t2 ON condition
```

- `INNER JOIN`: returns rows where the ON condition is true in both tables
- `LEFT JOIN`: returns all rows from the left table; unmatched right columns are `NULL`
- Multiple joins chain left to right: `FROM a JOIN b ON ... JOIN c ON ...`
- Table aliases: `FROM employees AS e JOIN departments AS d ON e.dept_id = d.id`

Without `ORDER BY`, join results follow left-table insertion order, with matching right-table rows in their insertion order.

## Expressions

### Literals

| syntax | type | examples |
|---|---|---|
| integers | `INTEGER` | `0`, `42`, `-3` |
| decimals | `FLOAT` | `3.14`, `0.5`, `-2.7` |
| strings | `TEXT` | `'hello'`, `'O''Brien'` (doubled single quote for escaping) |
| booleans | `BOOLEAN` | `TRUE`, `FALSE` |
| null | `NULL` | `NULL` |

### Column References

- `col_name` — unqualified column reference
- `table.col_name` or `alias.col_name` — qualified column reference

### Arithmetic

`+`, `-`, `*`, `/` — operate on `INTEGER` and `FLOAT` values.

- `INTEGER op INTEGER` produces `INTEGER` (division truncates toward zero)
- Any `FLOAT` operand promotes the result to `FLOAT`
- Any `NULL` operand produces `NULL`

### Comparison

`=`, `!=`, `<>`, `<`, `>`, `<=`, `>=`

- Numeric types are mutually comparable (integer promoted to float)
- Text is compared lexicographically
- Any comparison involving `NULL` yields `NULL` (not true, not false)

### Logical Operators

`AND`, `OR`, `NOT` — follow SQL three-valued logic (see NULL Handling below).

### IS NULL / IS NOT NULL

```sql
expr IS NULL
expr IS NOT NULL
```

These are the only operators that can definitively test for `NULL`. Unlike `=`, they return `TRUE` or `FALSE`, never `NULL`.

### LIKE

```sql
expr LIKE pattern
```

- `%` matches any sequence of zero or more characters
- `_` matches exactly one character
- Comparison is case-sensitive
- Only operates on text values

### IN

```sql
expr IN (val1, val2, ...)
expr IN (subquery)
expr NOT IN (val1, val2, ...)
expr NOT IN (subquery)
```

Returns `TRUE` if the value matches any element. For subqueries, the subquery must return exactly one column.

### EXISTS

```sql
EXISTS (subquery)
NOT EXISTS (subquery)
```

Returns `TRUE` if the subquery returns at least one row.

### Aggregate Functions

| function | description |
|---|---|
| `COUNT(*)` | counts all rows (including NULLs) |
| `COUNT(col)` | counts non-NULL values in the column |
| `SUM(col)` | sum of non-NULL values; `NULL` if no non-NULL values |
| `AVG(col)` | average of non-NULL values; always returns `FLOAT`; `NULL` if no non-NULL values |
| `MIN(col)` | minimum non-NULL value; `NULL` if no non-NULL values |
| `MAX(col)` | maximum non-NULL value; `NULL` if no non-NULL values |

Aggregates without `GROUP BY` treat the entire result set as one group. When used with `GROUP BY`, non-aggregated columns in the select list must appear in the `GROUP BY` clause.

### Subqueries

Subqueries can appear in:
- `WHERE` clause: `WHERE col = (SELECT ...)`, `WHERE col IN (SELECT ...)`
- `SELECT` list: `SELECT (SELECT ...) AS alias FROM ...`
- Scalar subqueries (returning one row, one column) can be used anywhere an expression is expected

## Expression Precedence (low to high)

1. `OR`
2. `AND`
3. `NOT`
4. `=`, `!=`, `<>`, `<`, `>`, `<=`, `>=`, `IS NULL`, `IS NOT NULL`, `IN`, `NOT IN`, `LIKE`, `EXISTS`
5. `+`, `-`
6. `*`, `/`
7. Unary `-`
8. Function calls, column references, literals, parenthesized expressions, subqueries

## Data Types

| type | description | display format |
|---|---|---|
| `INTEGER` | whole number | `42`, `-3`, `0` |
| `FLOAT` | floating-point number | `3.50`, `-2.70`, `0.00` (always 2 decimal places) |
| `TEXT` | string | displayed without quotes: `Alice`, `hello world` |
| `BOOLEAN` | true/false | `true`, `false` (lowercase) |
| `NULL` | absent value | `NULL` (uppercase) |

Type promotion in arithmetic: if either operand is `FLOAT`, the result is `FLOAT`. Integer division truncates toward zero.

`AVG()` always returns `FLOAT`, regardless of input type.

## NULL Handling

SQL uses three-valued logic: `TRUE`, `FALSE`, `NULL`.

| expression | result |
|---|---|
| `NULL = NULL` | `NULL` (not `TRUE`) |
| `NULL != 1` | `NULL` (not `TRUE`) |
| `NULL AND TRUE` | `NULL` |
| `NULL AND FALSE` | `FALSE` |
| `NULL OR TRUE` | `TRUE` |
| `NULL OR FALSE` | `NULL` |
| `NOT NULL` | `NULL` |
| `NULL + 1` | `NULL` |
| `NULL IS NULL` | `TRUE` |

`WHERE` filters keep only rows where the condition is `TRUE` — rows where the condition is `FALSE` or `NULL` are excluded.

Additional NULL rules:
- `GROUP BY` treats all `NULL` values as equal (they group together)
- `DISTINCT` treats `NULL` values as equal
- `ORDER BY`: `NULL` sorts before all non-NULL values in ascending order, after all non-NULL values in descending order
- `COUNT(*)` counts all rows; `COUNT(col)` excludes `NULL`
- `SUM`, `AVG`, `MIN`, `MAX` ignore `NULL` values; return `NULL` on empty input

## SQL Parsing Rules

- Keywords are case-insensitive: `SELECT`, `select`, `Select` are all valid
- Identifiers (table/column names) are case-insensitive
- Column names in output preserve the case from `CREATE TABLE`
- String literals use single quotes with `''` for escaping: `'O''Brien'`
- Statements are terminated by `;`
- Without `ORDER BY`, rows are returned in insertion order

## Output Format

Only `SELECT` statements produce output. Other statements (`CREATE TABLE`, `INSERT`, `UPDATE`, `DELETE`) produce no output.

Each `SELECT` result set consists of:
1. A header row with column names, pipe-separated
2. Data rows, pipe-separated, one per line
3. If the result set is empty, only the header row is printed

When a query has multiple `SELECT` statements, separate their result sets with a blank line.

Column names in the header:
- For plain column references: the column name as defined in `CREATE TABLE`
- For expressions with `AS`: the alias name
- For aggregate functions without `AS`: the function call text, e.g. `COUNT(*)`, `SUM(amount)`
- For `*`: all columns from the table(s) in definition order

## I/O Format

- **Input**: one or more SQL statements on stdin, each terminated by `;`. Whitespace (spaces, newlines, tabs) separates tokens; newlines within a statement are allowed.
- **Output**: result sets for `SELECT` statements, separated by blank lines, followed by a trailing newline.

The runner entrypoint handles I/O. Your `execute` function receives the full SQL input string and returns the output string.

## Examples

```
execute("CREATE TABLE t (id INTEGER, name TEXT); INSERT INTO t VALUES (1, 'Alice'); INSERT INTO t VALUES (2, 'Bob'); SELECT * FROM t;")
=>
id|name
1|Alice
2|Bob
```

```
execute("CREATE TABLE t (x INTEGER, y INTEGER); INSERT INTO t VALUES (1, 10); INSERT INTO t VALUES (2, 20); INSERT INTO t VALUES (3, 30); SELECT x, y FROM t WHERE y > 15 ORDER BY x DESC;")
=>
x|y
3|30
2|20
```

```
execute("CREATE TABLE t (name TEXT, score INTEGER); INSERT INTO t VALUES ('Alice', 90); INSERT INTO t VALUES ('Bob', 80); INSERT INTO t VALUES ('Alice', 95); SELECT name, AVG(score) FROM t GROUP BY name ORDER BY name;")
=>
name|AVG(score)
Alice|92.50
Bob|80.00
```

```
execute("CREATE TABLE t (id INTEGER, val INTEGER); INSERT INTO t VALUES (1, NULL); INSERT INTO t VALUES (2, 5); SELECT * FROM t WHERE val IS NULL;")
=>
id|val
1|NULL
```

```
execute("CREATE TABLE emp (id INTEGER, name TEXT, dept_id INTEGER); CREATE TABLE dept (id INTEGER, name TEXT); INSERT INTO dept VALUES (1, 'Engineering'); INSERT INTO dept VALUES (2, 'Sales'); INSERT INTO emp VALUES (1, 'Alice', 1); INSERT INTO emp VALUES (2, 'Bob', 1); INSERT INTO emp VALUES (3, 'Carol', NULL); SELECT e.name, d.name AS department FROM emp AS e LEFT JOIN dept AS d ON e.dept_id = d.id ORDER BY e.name;")
=>
name|department
Alice|Engineering
Bob|Engineering
Carol|NULL
```
