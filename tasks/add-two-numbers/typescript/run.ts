import { add } from "./src/add.js";

const line = await new Promise<string>((resolve) => {
  let data = "";
  process.stdin.setEncoding("utf-8");
  process.stdin.on("data", (chunk) => (data += chunk));
  process.stdin.on("end", () => resolve(data.trim()));
});

const [a, b] = line.split(" ").map(Number);
console.log(add(a!, b!));
