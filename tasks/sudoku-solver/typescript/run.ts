import { solve } from "./src/solver.js";

const input = await new Promise<string>((resolve) => {
  let data = "";
  process.stdin.setEncoding("utf-8");
  process.stdin.on("data", (chunk) => (data += chunk));
  process.stdin.on("end", () => resolve(data.trim()));
});

const grid = input.split("\n").map((line) =>
  line.trim().split(/\s+/).map(Number)
);

const result = solve(grid);

for (const row of result) {
  console.log(row.join(" "));
}
