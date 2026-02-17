import sys
from database import execute

sql = sys.stdin.read()
print(execute(sql))
