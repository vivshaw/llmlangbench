const { add } = require("./add.js");

let data = "";
process.stdin.setEncoding("utf-8");
process.stdin.on("data", (chunk) => (data += chunk));
process.stdin.on("end", () => {
  const [a, b] = data.trim().split(" ").map(Number);
  console.log(add(a, b));
});
