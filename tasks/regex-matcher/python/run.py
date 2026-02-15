import sys
from matcher import match

lines = sys.stdin.read().split("\n", 1)
pattern = lines[0] if len(lines) > 0 else ""
text = lines[1] if len(lines) > 1 else ""
print("true" if match(pattern, text) else "false")
