require_relative "add"

a, b = gets.split.map(&:to_f)
puts add(a, b)
