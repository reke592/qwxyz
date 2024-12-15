### QWXYZ

A queue library with batch processing. `Queue.getQueue` operates within a single transaction to lock tasks for processing by the consumer. The consumer uses atomic transactions for each task to ensure isolated commits and rollbacks. Task execution runs in parallel using `Promise.allSettled`.

### TODO

- Test script and Scenarios
- Pruning strategies
- IPC channel support

### Sample DB implementations

To create a custom database, implement the [IQueueDb](./src/interfaces/IQueueDb.ts). Refer to the following examples below for guidance.

- [MemoryDb](./src/implementations/db-in-memory.ts) - non-persistent storage. [sample](./sample/scenarios/q-consumer.ts)
- [SequelizeDb](./sample/implementations/db-sequelize.ts) - has concurrency when using sqlite dialect. [sample](./sample/scenarios/q-sequelize.ts)

### Usage

A Queue has a `topic` and `db` implementation

[Queue](./src/implementations/queue.ts),
[MemoryDb](./src/implementations/db-in-memory.ts),
[IQueueDb](./src/interfaces/IQueueDb.ts)

```js
const { MemoryDb, Queue, QueueEvent } = require("../src");

// create db implementation
const memDb = new MemoryDb();

// create the Queue instance
const Q = new Queue({
  topic: "A",
  db: memDb,
});
```

To initialize a Queue Consumer we need to call the `process` method with the following options.

- _autorun_ - this will trigger the `consume` command every `checkInterval`
- _checkInterval_ - in milliseconds defaults to 3s
- _batchSize_ - number of queue to run in parallel on `handleBulk`
- _handler_ - an Async Function that accepts a Task

[Consumer](./src/implementations/consumer.ts),
[Task](./src/implementations/task.ts)

```js
// initialize the Consumer
Q.process({
  autorun: true,
  batchSize: 5,
  handler: async (task) => {
    // do something with the task...
    // return any result
  },
});
```

We can also have multiple consumers sharing a single queue producer. This can be helpful when running consumers on different hosts or servers.

```js
// create consumers
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

// start consumers
C1.consume();
C2.consume();
```

Then we add a queue by calling the `add` method that requires a Queueable data which then became a Task.

- _params_ - required `Record<string, any>` to process by consumer
- _topic_ - optional, this will insert a new record in database, considered stalled or pending for other consumers.

[Queueable](./src/types/dto.ts),
[Task](./src/implementations/task.ts)

```js
// add task to process
await Q.add({
  params: {
    value,
  },
});
```

### Queue hooks

[QueueEvent](./src/types/enums.ts),
[QueueEventCallback](./src/interfaces/IQueue.ts)

```js
// Instance hooks to subscribe on Queue instance
Q.on(QueueEvent.waiting, (error, task, result) => {
  console.log(`topic: ${task.topic}, waiting: ${task.id}`);
});
Q.on(QueueEvent.completed, (error, task, result) => {
  console.log(`topic: ${task.topic}, completed: ${task.id}`);
});
Q.on(QueueEvent.locked, (error, task, result) => {
  console.log(`topic: ${task.topic}, locked: ${task.id}`);
});

// Static or Global hooks (all Queue instance)
Queue.on(QueueEvent.waiting, (error, task, result) => {
  console.log(`topic: ${task.topic}, waiting: ${task.id}`);
});
Queue.on(QueueEvent.completed, (error, task, result) => {
  console.log(`topic: ${task.topic}, completed: ${task.id}`);
});
Queue.on(QueueEvent.locked, (error, task, result) => {
  console.log(`topic: ${task.topic}, locked: ${task.id}`);
});
```
