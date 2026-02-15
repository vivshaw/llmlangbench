package main

import (
	"fmt"
	"io"
	"os"
	"strings"

	matcher "regex-matcher"
)

func main() {
	data, _ := io.ReadAll(os.Stdin)
	parts := strings.SplitN(string(data), "\n", 2)
	pattern := ""
	text := ""
	if len(parts) > 0 {
		pattern = parts[0]
	}
	if len(parts) > 1 {
		text = parts[1]
	}
	if matcher.Match(pattern, text) {
		fmt.Println("true")
	} else {
		fmt.Println("false")
	}
}
