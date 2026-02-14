from solver import solve

grid = []
for _ in range(9):
    grid.append(list(map(int, input().split())))

result = solve(grid)

for row in result:
    print(" ".join(str(x) for x in row))
