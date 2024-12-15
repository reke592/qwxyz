import { MemoryDb, Queue, QueueEvent } from "../../src";

export const title = "Queue - Consumer";

export async function start() {
  const db = new MemoryDb();
  const a = new Queue({
    topic: "A",
    db,
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
