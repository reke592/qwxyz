import { MemoryDb, Queue, QueueEvent } from "../../src";
import { IQueueDb } from "../../src/interfaces/IQueueDb";

export const title = "Queue - Consumer";

export async function start(db: IQueueDb) {
  const DB = new MemoryDb();
  const a = new Queue({
    topic: "A",
    db: db || DB,
  });

  Queue.on(QueueEvent.waiting, (error, task, result) => {
    console.log(`topic: ${task.topic}, waiting: ${task.id}`);
  });
  Queue.on(QueueEvent.completed, (error, task, result) => {
    console.log(`topic: ${task.topic}, completed: ${task.id}`);
  });
  Queue.on(QueueEvent.locked, (error, task, result) => {
    console.log(`topic: ${task.topic}, locked: ${task.id}`);
  });

  a.process({
    autorun: true,
    batchSize: 5,
    handler: async (task) => {},
  });

  await Promise.all(
    Array(27)
      .fill(1)
      .map(async (value) => {
        await a.add({
          params: {
            value,
          },
        });
      })
  );
}
