# Task: Mini Typechecker

## Description

Implement a type inference engine for a small expression language. Your `infer` function takes a string containing an expression and returns its inferred type as a string, or `"type error"` if the expression is ill-typed.

The type system is based on Hindley-Milner, supporting type inference for lambdas and let-polymorphism.

## Expression Language

| syntax | meaning | example |
|---|---|---|
| integer literals | `0`, `1`, `42` | `42` has type `Int` |
| boolean literals | `true`, `false` | `true` has type `Bool` |
| variables | identifiers | `x` refers to a bound variable |
| arithmetic | `e1 + e2`, `e1 - e2`, `e1 * e2` | both operands must be `Int`, result is `Int` |
| comparison | `e1 == e2` | both operands must be `Int`, result is `Bool` |
| if-then-else | `if e1 then e2 else e3` | `e1` must be `Bool`, `e2` and `e3` must have the same type |
| let binding | `let x = e1 in e2` | binds `x` to `e1` in `e2`; the type of `x` is generalized (let-polymorphism) |
| recursive let | `let rec f = e1 in e2` | like `let`, but `f` is in scope within `e1` (for recursive definitions) |
| lambda | `fn x => e` | creates a function; the parameter type is inferred |
| application | `f x` | applies function `f` to argument `x`; juxtaposition, left-associative |
| parentheses | `(e)` | grouping |

## Operator Precedence (low to high)

1. `let ... = ... in ...`, `if ... then ... else ...`, `fn ... => ...` — extend as far right as possible
2. `==`
3. `+`, `-` (left-associative)
4. `*` (left-associative)
5. function application (juxtaposition, left-associative)
6. atoms: literals, variables, parenthesized expressions

## Type System

Types are:
- `Int` — integer type
- `Bool` — boolean type
- `T1 -> T2` — function type (right-associative: `a -> b -> c` means `a -> (b -> c)`)

### Rules

- Integer literals have type `Int`
- Boolean literals have type `Bool`
- `+`, `-`, `*`: both operands must be `Int`, result is `Int`
- `==`: both operands must be `Int`, result is `Bool`
- `if c then t else e`: `c` must be `Bool`; `t` and `e` must have the same type; result has that type
- `let x = e1 in e2`: infer the type of `e1`, **generalize** it (quantify free type variables not in the environment), then bind `x` to that polymorphic type while inferring `e2`
- `let rec f = e1 in e2`: like `let`, but `f` is bound to a **fresh type variable** in the environment while inferring `e1`. After inferring `e1`, unify the fresh variable with the result, then generalize and bind `f` for `e2`. This allows recursive definitions like `let rec fact = fn n => if n == 0 then 1 else n * fact (n - 1) in fact 5`
- `fn x => body`: creates a function type `T1 -> T2` where `T1` is a fresh type variable for `x` and `T2` is the type of `body`
- `f x` (application): `f` must have type `T1 -> T2` where `T1` matches the type of `x`; result is `T2`
- Unbound variables are a type error

### Let-Polymorphism

In `let id = fn x => x in ...`, the type of `id` is generalized to `forall a. a -> a`. Each use of `id` gets a **fresh instantiation**, so `id 42` and `id true` can both be valid in the same expression.

## Output Format

- Concrete types: `Int`, `Bool`, `Int -> Int`, `Int -> Bool`, `(Int -> Bool) -> Int`
- Type variables (when the result is polymorphic): use `a`, `b`, `c`, ... in order of first appearance reading left to right. For example, the identity function is `a -> a`, and `fn f => fn x => f x` is `(a -> b) -> a -> b`.
- Function arrows are right-associative: `Int -> Int -> Int` means `Int -> (Int -> Int)`
- Parenthesize the left side of `->` when it is itself a function type: `(Int -> Int) -> Int`
- If the expression is ill-typed, output exactly `type error`

## I/O Format

The runner handles I/O. Your `infer` function receives a string (the expression) and returns a string (the type or `"type error"`).

## Examples

```
infer("42")                                         => "Int"
infer("true")                                       => "Bool"
infer("1 + 2")                                      => "Int"
infer("1 + true")                                   => "type error"
infer("if true then 1 else 2")                      => "Int"
infer("if true then 1 else false")                  => "type error"
infer("let x = 5 in x + 1")                        => "Int"
infer("fn x => x + 1")                              => "Int -> Int"
infer("(fn x => x + 1) 5")                          => "Int"
infer("fn x => x")                                  => "a -> a"
infer("let id = fn x => x in id 42")               => "Int"
infer("let id = fn x => x in if id true then id 42 else 0") => "Int"
infer("let rec fact = fn n => if n == 0 then 1 else n * fact (n - 1) in fact 5") => "Int"
infer("let rec f = fn x => f x in f")                      => "a -> b"
```
