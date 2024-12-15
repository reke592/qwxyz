import { Consumer, MemoryDb, Queue, QueueEvent } from "../../src";

export const title = "Multiple consumers sharing a single Queue producer";

export async function start() {
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

  const DB = new MemoryDb();
  const Q = new Queue({
    topic: "A",
    db: DB,
  });

  const C1 = new Consumer(Q, {
    autorun: true,
    batchSize: 3,
    async handler(task) {},
  });

  const C2 = new Consumer(Q, {
    autorun: true,
    batchSize: 10,
    async handler(task) {},
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
