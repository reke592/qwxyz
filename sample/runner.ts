import * as readline from "readline";
import { Scenario, Scenarios } from "./scenarios";

const index = process.argv[2];
if (!index) {
  console.table(Scenarios);
  console.log("To run scenarios: npm run dev <index>");
} else {
  Scenarios[Number(index)].start();
}
