require_relative "typechecker"

line = gets.chomp
puts infer(line)
