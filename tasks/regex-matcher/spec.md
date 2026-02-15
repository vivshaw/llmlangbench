# Task: Regex Matcher

## Description

Implement a regular expression engine **from scratch**. Your `match` function takes a regex pattern and a string, and returns whether the **entire** string matches the pattern.

**You must not use any built-in regex libraries, functions, or modules.** No `re`, `Regex`, `Pattern`, `RegExp`, `/pattern/`, `=~`, or equivalent. The entire matching engine must be your own code — this is an exercise in building an NFA/DFA or recursive backtracking matcher, not in calling library functions.

## Supported Syntax

Your engine must support the following regex features:

| syntax | meaning | example |
|---|---|---|
| literal chars | match themselves | `abc` matches `"abc"` |
| `.` | match any single character | `a.c` matches `"abc"`, `"axc"` |
| `*` | zero or more of the previous element | `ab*c` matches `"ac"`, `"abc"`, `"abbc"` |
| `+` | one or more of the previous element | `ab+c` matches `"abc"`, `"abbc"` but not `"ac"` |
| `?` | zero or one of the previous element | `ab?c` matches `"ac"`, `"abc"` but not `"abbc"` |
| `\|` | alternation | `cat\|dog` matches `"cat"` or `"dog"` |
| `()` | grouping | `(ab)+` matches `"ab"`, `"abab"` |
| `[abc]` | character class — match any listed char | `[aeiou]` matches any vowel |
| `[a-z]` | character range | `[a-z]` matches any lowercase letter |
| `[^abc]` | negated character class | `[^0-9]` matches any non-digit |
| `\\` | escape next character | `a\\.b` matches `"a.b"` literally |

## Semantics

- **Full match**: the pattern must match the entire input string, as if anchored with `^` and `$`. `a` matches `"a"` but not `"ab"` or `"ba"`.
- **Greedy quantifiers**: `*`, `+`, and `?` are greedy (match as much as possible), but must backtrack to allow overall match success.
- **Nested groups**: `((a|b)c)+` should work.
- **Empty string**: the pattern `a*` should match `""`.
- **Quantifiers on groups**: `(ab)*` matches `""`, `"ab"`, `"abab"`, etc.
- **Quantifiers on character classes**: `[a-z]+` matches one or more lowercase letters.

## I/O Format

The runner handles I/O. Your `match` function receives two string arguments (pattern, text) and returns a boolean.

## Examples

```
match("abc", "abc")           => true
match("a.c", "axc")           => true
match("a*", "")               => true
match("a*", "aaa")            => true
match("ab+c", "ac")           => false
match("ab+c", "abbc")         => true
match("cat|dog", "dog")       => true
match("(ab)+", "abab")        => true
match("[a-z]+", "hello")      => true
match("[^0-9]+", "abc")       => true
match("[^0-9]+", "abc123")    => false
match("a\\.b", "a.b")         => true
match("a\\.b", "axb")         => false
```
