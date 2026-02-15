const { infer } = require("./typechecker.js");

let data = "";
process.stdin.setEncoding("utf-8");
process.stdin.on("data", (chunk) => (data += chunk));
process.stdin.on("end", () => {
  console.log(infer(data.trim()));
});
