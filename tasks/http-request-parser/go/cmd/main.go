package main

import (
	"fmt"
	"io"
	"os"

	parser "http-request-parser"
)

func main() {
	data, _ := io.ReadAll(os.Stdin)
	fmt.Println(parser.ParseRequest(string(data)))
}
