# Task: Sudoku Solver

## Description

Implement a function called `solve` that takes a 9x9 Sudoku grid and returns the solved grid. The input grid uses `0` for empty cells and digits `1-9` for pre-filled cells.

## Requirements

- Accept a 9x9 grid represented as a list/array of 9 rows, each row being a list/array of 9 integers
- Return the completed grid with all cells filled in
- The solution must satisfy standard Sudoku constraints:
  - Each row contains the digits 1-9 exactly once
  - Each column contains the digits 1-9 exactly once
  - Each of the nine 3x3 sub-boxes contains the digits 1-9 exactly once
- The puzzle is guaranteed to have exactly one valid solution
- Must handle "hard" puzzles that require advanced techniques (naked pairs, hidden singles, etc.) or backtracking — brute force alone may be too slow
- Must handle puzzles with very few givens (17 is the minimum for a unique solution)

## I/O Format

The runner handles I/O. Your `solve` function receives a 2D array/list of integers and returns a 2D array/list of integers. Zeros represent empty cells.

## Examples

Input:
```
5 3 0 0 7 0 0 0 0
6 0 0 1 9 5 0 0 0
0 9 8 0 0 0 0 6 0
8 0 0 0 6 0 0 0 3
4 0 0 8 0 3 0 0 1
7 0 0 0 2 0 0 0 6
0 6 0 0 0 0 2 8 0
0 0 0 4 1 9 0 0 5
0 0 0 0 8 0 0 7 9
```

Output:
```
5 3 4 6 7 8 9 1 2
6 7 2 1 9 5 3 4 8
1 9 8 3 4 2 5 6 7
8 5 9 7 6 1 4 2 3
4 2 6 8 5 3 7 9 1
7 1 3 9 2 4 8 5 6
9 6 1 5 3 7 2 8 4
2 8 7 4 1 9 6 3 5
3 4 5 2 8 6 1 7 9
```
