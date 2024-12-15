import * as readline from "readline";
import { Scenario, Scenarios } from "./scenarios";

// console.clear();
console.table(Scenarios);

let rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let scene: Scenario;
rl.question("Enter index to run the sample: ", async (answer) => {
  scene = Scenarios[Number(answer)];
  rl.close();
  await scene.start();
});
