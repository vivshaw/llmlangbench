package main

import (
	"bufio"
	"fmt"
	"os"

	typechecker "mini-typechecker"
)

func main() {
	scanner := bufio.NewScanner(os.Stdin)
	scanner.Scan()
	line := scanner.Text()
	fmt.Println(typechecker.Infer(line))
}
