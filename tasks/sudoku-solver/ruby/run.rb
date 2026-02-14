require_relative "solver"

grid = 9.times.map { gets.split.map(&:to_i) }

result = solve(grid)

result.each { |row| puts row.join(" ") }
