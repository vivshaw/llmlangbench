package main

import (
	"fmt"
	"io"
	"os"

	database "sql-database"
)

func main() {
	data, _ := io.ReadAll(os.Stdin)
	fmt.Println(database.Execute(string(data)))
}
