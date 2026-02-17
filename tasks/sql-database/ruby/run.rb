require_relative "database"

sql = $stdin.read
puts execute(sql)
