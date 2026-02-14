const { solve } = require("./solver.js");

let data = "";
process.stdin.setEncoding("utf-8");
process.stdin.on("data", (chunk) => (data += chunk));
process.stdin.on("end", () => {
  const grid = data.trim().split("\n").map((line) =>
    line.trim().split(/\s+/).map(Number)
  );

  const result = solve(grid);

  for (const row of result) {
    console.log(row.join(" "));
  }
});
