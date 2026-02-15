# Review Rubric: HTTP Request Parser

Evaluate the submitted code on the following dimensions:

- **Correctness** (0-25): Does it correctly parse HTTP/1.1 requests? Does it handle Content-Length bodies, chunked transfer encoding, duplicate headers, case-insensitive header names, and whitespace trimming? Does it correctly exclude transport headers (Content-Length, Transfer-Encoding) from output?
- **Architecture** (0-25): Is the parser well-structured? Expect clear separation between request line parsing, header parsing, and body decoding. Chunked decoding should be a distinct function/method. Deduct for monolithic string manipulation that mixes concerns.
- **Idiom usage** (0-25): Does it use language-appropriate patterns? For example: proper string handling, appropriate data structures for headers (maps/dicts), clean iteration patterns, idiomatic error handling.
- **Readability** (0-25): Is the code understandable? Are functions and variables well-named? Is the chunked decoding logic clear? Is the code appropriately decomposed?

Deduct points for:
- Using HTTP parsing libraries (this should score 0 for correctness)
- Fragile parsing that relies on fixed positions rather than proper delimiter scanning
- Not handling edge cases (empty bodies, missing headers, hex chunk sizes)
- Over-engineering (e.g. building a full HTTP server framework for a parser task)
- Dead code, excessive comments, or unused imports
