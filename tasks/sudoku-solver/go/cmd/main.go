package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"

	solver "sudoku-solver"
)

func main() {
	scanner := bufio.NewScanner(os.Stdin)
	var grid [9][9]int

	for i := 0; i < 9 && scanner.Scan(); i++ {
		parts := strings.Fields(scanner.Text())
		for j, s := range parts {
			grid[i][j], _ = strconv.Atoi(s)
		}
	}

	result := solver.Solve(grid)

	for _, row := range result {
		parts := make([]string, 9)
		for j, v := range row {
			parts[j] = strconv.Itoa(v)
		}
		fmt.Println(strings.Join(parts, " "))
	}
}
