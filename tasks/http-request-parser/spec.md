# Task: HTTP Request Parser

## Description

Implement an HTTP/1.1 request parser. Your `parse_request` function takes a raw HTTP request as a string and returns a structured result containing the method, path, version, headers, and decoded body.

**You must not use any HTTP parsing libraries.** Build the parser from raw string manipulation.

## Input

A raw HTTP/1.1 request as a string. Line endings are `\r\n` (CRLF) as per the HTTP specification. The header section ends with a blank line (`\r\n\r\n`).

## Supported Features

Your parser must handle:

| feature | description |
|---|---|
| request line | `METHOD /path HTTP/1.1\r\n` — extract method, URI, and version |
| headers | `Key: Value\r\n` — extract header name and value; names are case-insensitive |
| duplicate headers | multiple headers with the same name are combined with `, ` |
| Content-Length body | if `Content-Length` header is present, read that many bytes after the header block |
| chunked transfer encoding | if `Transfer-Encoding: chunked`, decode the chunked body format |
| no body | requests with no `Content-Length` and no chunked encoding have an empty body |

### Chunked Transfer Encoding

Chunked encoding format:
```
<chunk-size-in-hex>[;chunk-extension]\r\n
<chunk-data>\r\n
<chunk-size-in-hex>[;chunk-extension]\r\n
<chunk-data>\r\n
0\r\n
\r\n
```

The final chunk has size `0` and signals the end of the body. Your parser must reassemble the chunks into the complete body.

### Chunk Extensions

Chunk sizes may optionally be followed by a semicolon and one or more chunk extensions (e.g., `5;ext=val\r\n`). Chunk extensions must be **parsed and ignored** — only the hex size before the semicolon determines the chunk data length. Multiple extensions may be chained with semicolons (e.g., `5;name=value;other\r\n`).

## Output Format

The `parse_request` function should return a structured object. The runner will format it as follows:

```
<METHOD> <URI> <VERSION>
<header-name>: <header-value>
<header-name>: <header-value>
...

<decoded-body>
```

Rules for the output:
- Line 1: method, URI, and HTTP version, space-separated
- Lines 2-N: headers, one per line as `name: value`
  - Header names must be **lowercased**
  - Headers must be **sorted alphabetically** by name
  - Duplicate headers combined into one line with values joined by `, `
  - Leading/trailing whitespace in header values must be trimmed
- A blank line separates headers from the body
- The decoded body follows (may be empty, may contain newlines)
- `Transfer-Encoding` and `Content-Length` headers should be **excluded** from the output (they are transport-level, not application-level)

## Examples

### Simple GET

Input:
```
GET /hello HTTP/1.1\r\n
Host: example.com\r\n
\r\n
```

Output:
```
GET /hello HTTP/1.1
host: example.com

```

### POST with body

Input:
```
POST /submit HTTP/1.1\r\n
Host: example.com\r\n
Content-Type: application/json\r\n
Content-Length: 13\r\n
\r\n
{"key":"val"}
```

Output:
```
POST /submit HTTP/1.1
content-type: application/json
host: example.com

{"key":"val"}
```

### Chunked encoding

Input:
```
POST /data HTTP/1.1\r\n
Host: example.com\r\n
Transfer-Encoding: chunked\r\n
\r\n
5\r\n
Hello\r\n
6\r\n
 World\r\n
0\r\n
\r\n
```

Output:
```
POST /data HTTP/1.1
host: example.com

Hello World
```

### Chunked encoding with extensions

Input:
```
POST /data HTTP/1.1\r\n
Host: example.com\r\n
Transfer-Encoding: chunked\r\n
\r\n
5;ext=val\r\n
Hello\r\n
6;name=value;other\r\n
 World\r\n
0\r\n
\r\n
```

Output:
```
POST /data HTTP/1.1
host: example.com

Hello World
```

Chunk extensions after the semicolons are ignored — only the hex size matters.
