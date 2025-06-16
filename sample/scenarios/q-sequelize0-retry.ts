import { Sequelize } from "@sequelize/core";
import { QueueModel, SequelizeDB } from "../implementations/db-sequelize";
import { Consumer, Queue, QueueEvent } from "../../src";
import { delay } from "../../src/utils/delay";

export const title =
  "IQueueDB implementation using Sequelize ORM with retry logic";
export async function start() {
  const connection = new Sequelize({
    dialect: "sqlite3",
  });
  const DB = await new SequelizeDB(connection).init("tbl_queues");
  const Q = new Queue({
    topic: "A",
    db: DB,
  });

  Queue.on(QueueEvent.waiting, (error, task, result) => {
    console.log(`topic: ${task.topic}, waiting: #${task.id}`);
  });
  Queue.on(QueueEvent.locked, (error, task, result) => {
    console.log(`topic: ${task.topic}, locked: #${task.id}`);
  });
  Q.on(QueueEvent.completed, (error, task, result) => {
    console.log(
      `topic: ${task.topic}, completed: #${task.id}, by: consumer-${task.consumerId}, result: ${result}`
    );
  });
  Q.on(QueueEvent.failed, async (error, task, result) => {
    console.log(
      `topic: ${task.topic}, failed: #${task.id}, by: consumer-${task.consumerId}, error: ${error}`
    );
    let data = await QueueModel.findOne({ where: { id: task.id } });
    if (data != null) {
      if (data.retries >= 3) {
        console.log(`task #${task.id} has reached max retries, consider removing it.`);
      } else {
        console.log(`task #${task.id} retries: ${data.retries}`);
        await data.increment('retries',
          {
            by: 1,
            where: {
              id: task.id,
            },
          }
        );
        await data.update({
          waiting: true,
          stalled: false,
          locked: false,
          completed: false,
          failed: false,
        });
      }
    }
  });

  const C1 = new Consumer(Q, {
    autorun: true,
    batchSize: 1,
    async handler(task) {
      await delay(() => {
        throw new Error(`failed by consumer 1`);
      }, 1000);
    },
  });

  await Promise.all(
    Array(5)
      .fill(1)
      .map(async (value) => {
        await Q.add({
          params: {
            value,
          },
        });
      })
  );

  C1.consume();
}
