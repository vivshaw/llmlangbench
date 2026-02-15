import { match } from "./src/matcher.js";

const input = await new Promise<string>((resolve) => {
  let data = "";
  process.stdin.setEncoding("utf-8");
  process.stdin.on("data", (chunk) => (data += chunk));
  process.stdin.on("end", () => resolve(data));
});

const [pattern, text] = input.split("\n", 2);
console.log(match(pattern ?? "", text ?? "") ? "true" : "false");
