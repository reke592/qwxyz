import fs from "fs";
import { basename } from "path";

export type Scenario = { file: string; title: string; start(): any };
export const Scenarios: Scenario[] = [];

for (let file of fs.readdirSync(__dirname)) {
  if (file !== basename(__filename)) {
    const mod = require(`./${file}`);
    Scenarios.push({
      file,
      title: mod.title,
      start: mod.start,
    });
  }
}
