package main

import (
	"fmt"

	add "add-two-numbers"
)

func main() {
	var a, b float64
	fmt.Scan(&a, &b)
	fmt.Println(add.Add(a, b))
}
