import sys
from parser import parse_request

raw = sys.stdin.read()
print(parse_request(raw))
