const { match } = require("./matcher.js");

let data = "";
process.stdin.setEncoding("utf-8");
process.stdin.on("data", (chunk) => (data += chunk));
process.stdin.on("end", () => {
  const [pattern, text] = data.split("\n", 2);
  console.log(match(pattern ?? "", text ?? "") ? "true" : "false");
});
