package main

import (
	"fmt"
	"io"
	"os"

	simulator "process-simulator"
)

func main() {
	data, _ := io.ReadAll(os.Stdin)
	fmt.Println(simulator.Simulate(string(data)))
}
