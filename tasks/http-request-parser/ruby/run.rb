require_relative "parser"

raw = $stdin.read
puts parse_request(raw)
