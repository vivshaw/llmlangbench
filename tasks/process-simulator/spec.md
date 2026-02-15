# Task: Process Simulator

## Description

Implement a simulator for concurrent processes that communicate via channels and synchronize via locks. Your `simulate` function takes a program description and returns a deterministic execution trace.

This combines three core concurrency concepts:
- **Channels** (bounded, capacity 1) for inter-process communication
- **Locks** for mutual exclusion on shared resources
- **Worker-limited scheduling** for simulating parallel execution

## Input Format

```
workers <N>
<name>: <instr>, <instr>, ...
<name>: <instr>, ...
```

- First line: number of workers (max processes executing per tick)
- Remaining lines: process definitions. Each has a name and a comma-separated list of instructions.

## Instructions

| instruction | behavior |
|---|---|
| `compute` | occupies a worker for 1 tick; always ready |
| `send <CH>` | sends a token to channel CH; ready if channel has space (capacity 1); blocks if channel is full |
| `recv <CH>` | receives a token from channel CH; ready if channel has a token; blocks if channel is empty |
| `lock <R>` | acquires exclusive lock on resource R; ready if R is not held; blocks if R is held by another process |
| `unlock <R>` | releases lock on resource R; always ready |

All instructions take exactly **1 tick** and consume **1 worker slot**.

## Scheduling Algorithm

Each tick, the scheduler assigns workers to processes using **greedy alphabetical scheduling with provisional state updates**:

1. Consider unfinished processes in **alphabetical order**
2. For each process, check if its next instruction is executable given the **current provisional state**
3. If executable and workers are available: assign the process, update provisional state, consume a worker
4. If not executable: skip (the process is blocked this tick)
5. After iterating all processes: if no process was assigned and unfinished processes remain → **deadlock**

**Provisional state updates** happen immediately during the scan. This means:
- If process A does `unlock R1` and process B (alphabetically later) does `lock R1` in the same tick, B can acquire R1 because A's unlock updated the provisional state
- If process A does `send ch1` and process B does `recv ch1`, B can receive in the same tick
- If process A does `recv ch1` (alphabetically before C) and the channel is empty, A is blocked — even if process C later does `send ch1` in the same tick. A already passed.

## Channel Semantics

- Channels have a **buffer capacity of 1** (one token max)
- `send CH` adds a token to the channel buffer (blocks if buffer is full)
- `recv CH` removes a token from the channel buffer (blocks if buffer is empty)
- A channel starts empty

## Lock Semantics

- `lock R` acquires exclusive ownership of resource R (blocks if held by another process)
- `unlock R` releases ownership of resource R
- A resource starts unheld

## Deadlock Detection

If at the start of a tick no unfinished process can execute (all are blocked), the system is in **deadlock**. Output `deadlock` followed by the blocked process names in alphabetical order.

## Output Format

One event per line, chronologically:

```
<tick> <process> <instruction>
```

Events at the same tick are sorted by process name (alphabetical). The last line is either:
- `done` — all processes finished
- `deadlock <P1> <P2> ...` — blocked processes listed alphabetically

## I/O Format

The runner handles I/O. Your `simulate` function receives the program text as a string and returns the execution trace as a string.

## Examples

### Two parallel processes (2 workers)

```
Input:
workers 2
A: compute, compute
B: compute, compute, compute

Output:
0 A compute
0 B compute
1 A compute
1 B compute
2 B compute
done
```

### Send/recv rendezvous in same tick

```
Input:
workers 2
A: compute, send ch1
B: recv ch1, compute

Output:
0 A compute
1 A send ch1
1 B recv ch1
2 B compute
done
```

### Lock-channel deadlock

```
Input:
workers 1
A: lock R1, recv ch1, unlock R1
B: lock R1, send ch1, unlock R1

Output:
0 A lock R1
deadlock A B
```

A holds R1 and waits for ch1. B needs R1 to send to ch1. Neither can proceed.
