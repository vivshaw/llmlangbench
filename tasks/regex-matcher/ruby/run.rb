require_relative "matcher"

input = $stdin.read
parts = input.split("\n", 2)
pattern = parts[0] || ""
text = parts[1] || ""
puts regex_match(pattern, text) ? "true" : "false"
