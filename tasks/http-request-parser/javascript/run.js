const { parseRequest } = require("./parser.js");

let data = "";
process.stdin.setEncoding("utf-8");
process.stdin.on("data", (chunk) => (data += chunk));
process.stdin.on("end", () => {
  console.log(parseRequest(data));
});
