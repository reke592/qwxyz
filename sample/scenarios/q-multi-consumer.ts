import { Consumer, MemoryDb, Queue, QueueEvent } from "../../src";
import { IQueueDb } from "../../src/interfaces/IQueueDb";
import { delay } from "../../src/utils/delay";

export const title = "Multiple consumers sharing a single Queue producer";

export async function start(db: IQueueDb) {
  Queue.on(QueueEvent.waiting, (error, task, result) => {
    console.log(`topic: ${task.topic}, waiting: #${task.id}`);
  });
  Queue.on(QueueEvent.locked, (error, task, result) => {
    console.log(`topic: ${task.topic}, locked: #${task.id}`);
  });
  Queue.on(QueueEvent.completed, (error, task, result) => {
    console.log(
      `topic: ${task.topic}, completed: #${task.id}, by: consumer-${task.consumerId}`
    );
  });
  Queue.on(QueueEvent.failed, (error, task, result) => {
    console.log(
      `topic: ${task.topic}, failed: #${task.id}, by: consumer-${task.consumerId}`
    );
  });

  const DB = db || new MemoryDb();
  const Q = new Queue({
    topic: "A",
    db: DB,
  });

  const C1 = new Consumer(Q, {
    autorun: true,
    batchSize: 3,
    async handler(task) {
      await delay(() => {
        throw new Error(`failed by consumer 1`);
      }, 1000);
    },
  });

  const C2 = new Consumer(Q, {
    autorun: true,
    batchSize: 10,
    async handler(task) {
      return await delay(() => "success", 1000);
    },
  });

  await Promise.all(
    Array(20)
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
  C2.consume();
}
