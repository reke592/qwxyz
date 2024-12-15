import { Sequelize } from "@sequelize/core";
import { MySqlDialect } from "@sequelize/mysql";
import { SequelizeDB } from "../implementations/db-sequelize";
import * as scenario from "./q-multi-consumer";

export const title = "IQueueDB implementation using Sequelize ORM";
export async function start() {
  const connection = new Sequelize({
    dialect: MySqlDialect,
    database: "qwxyz",
    user: "root",
    password: "dev",
    host: "localhost",
    port: 3306,
  });
  scenario.start(await new SequelizeDB(connection).init());
}
