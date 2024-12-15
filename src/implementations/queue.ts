import { Queueable, Topic } from "../types/dto";
import { QueueEvent } from "../types/enums";
import { IQueueDb } from "../interfaces/IQueueDb";
import { IQueue, QueueEventCallback, QueueOptions } from "../interfaces/IQueue";
import { ConsumerProcessOptions, IConsumer } from "../interfaces/IConsumer";
import { ITask, ITaskFields } from "../interfaces/ITask";
import { Consumer } from "./consumer";
import { Task } from "./task";
import { delay } from "../utils/delay";

export class Queue implements IQueue {
  static queues: IQueue[] = [];
  static hooks: Record<QueueEvent, QueueEventCallback[]> = {
    [QueueEvent.waiting]: [],
    [QueueEvent.locked]: [],
    [QueueEvent.stalled]: [],
    [QueueEvent.completed]: [],
    [QueueEvent.failed]: [],
  };
  static on(event: QueueEvent, callback: QueueEventCallback) {
    Queue.hooks[event] = Queue.hooks[event] || [];
    Queue.hooks[event].push(callback);
    for (let queue of Queue.queues) {
      queue.recomputeHooks(event);
    }
  }
  static register(queue: IQueue) {
    Queue.queues.push(queue);
  }

  /**
   * prevents concurrency on getQueues when having multiple consumers
   */
  private lockGetQueues = false;

  private hooks: Record<QueueEvent, QueueEventCallback[]> = {
    [QueueEvent.waiting]: [],
    [QueueEvent.locked]: [],
    [QueueEvent.stalled]: [],
    [QueueEvent.completed]: [],
    [QueueEvent.failed]: [],
  };
  private allHooks: Record<QueueEvent, QueueEventCallback[]> = {
    [QueueEvent.waiting]: [],
    [QueueEvent.locked]: [],
    [QueueEvent.stalled]: [],
    [QueueEvent.completed]: [],
    [QueueEvent.failed]: [],
  };

  topic: Topic;
  consumer?: IConsumer;
  db: IQueueDb;

  constructor(options: QueueOptions) {
    this.topic = options.topic;
    this.db = options.db;
    this.allHooks = Queue.hooks;
    Queue.register(this);
  }

  on(event: QueueEvent, callback: QueueEventCallback): IQueue {
    this.hooks[event] = this.hooks[event] || [];
    this.hooks[event].push(callback);
    return this;
  }

  recomputeHooks(event: QueueEvent) {
    this.allHooks[event] = [...this.hooks[event], ...Queue.hooks[event]];
  }

  private async callHooks(
    event: QueueEvent,
    error: any,
    task: ITask,
    result: any
  ) {
    return await Promise.all(
      this.allHooks[event].map(async (cb) => await cb(error, task, result))
    );
  }

  async getQueues(limit: number): Promise<ITask[]> {
    if (this.lockGetQueues) {
      return await delay(() => this.getQueues(limit), 100);
    }
    this.lockGetQueues = true;
    let transaction: any;
    try {
      transaction = await this.db.startTransaction();
      let list = await this.db.getQueues(this.topic, limit, transaction);
      let locked = await Promise.all(
        list.map(
          async (item) =>
            await this.lock(item, transaction).then((value) => {
              return new Task(this, value.id, value.topic, value.params);
            })
        )
      );
      await this.db.endTransaction(null, transaction);
      locked.map((task) => this.callHooks(QueueEvent.locked, null, task, null));
      return locked;
    } catch (e) {
      await this.db.endTransaction(e, transaction);
      return [];
    } finally {
      this.lockGetQueues = false;
    }
  }

  async add(data: Queueable): Promise<ITask> {
    let transaction;
    try {
      transaction = await this.db.startTransaction();
      let id = await this.db.nextId(transaction);
      let task = new Task(this, id, data.topic || this.topic, data.params);
      if (data.topic && data.topic !== this.topic) {
        task.stalled = true;
      } else {
        task.waiting = true;
      }
      await this.db.onCreate(task, transaction);
      await this.db.endTransaction(null, transaction);
      this.callHooks(QueueEvent.waiting, null, task, null);
      return task;
    } catch (e) {
      await this.db.endTransaction(e, transaction);
      throw e;
    }
  }

  async remove(task: ITask): Promise<void> {
    let transaction;
    try {
      transaction = await this.db.startTransaction();
      await this.db.onDelete(task.topic, task.id, transaction);
      await this.db.endTransaction(null, transaction);
    } catch (e) {
      await this.db.endTransaction(e, transaction);
      throw e;
    }
  }

  async lock(task: ITaskFields, transaction: any): Promise<ITaskFields> {
    let updates: ITaskFields = {
      id: task.id,
      topic: task.topic,
      error: task.error,
      params: task.params,
      result: task.result,
      waiting: false,
      stalled: false,
      locked: true,
      completed: false,
      failed: false,
    };

    if (!transaction) {
      throw new Error("queue.lock needs a transaction");
    }
    await this.db.onUpdate(updates, transaction);
    return updates;
  }

  async complete(task: ITask, result: any): Promise<void> {
    let transaction;
    let updates: ITaskFields = {
      id: task.id,
      topic: task.topic,
      error: task.error,
      params: task.params,
      result: result,
      waiting: false,
      stalled: false,
      locked: false,
      completed: true,
      failed: false,
    };
    try {
      transaction = await this.db.startTransaction();
      await this.db.onUpdate(updates, transaction);
      await this.db.endTransaction(null, transaction);
      this.callHooks(QueueEvent.completed, null, task, task.result);
    } catch (e) {
      await this.db.endTransaction(e, transaction);
      throw e;
    }
  }

  async failed(task: ITask, error: Error): Promise<void> {
    let transaction;
    let updates: ITaskFields = {
      id: task.id,
      topic: task.topic,
      params: task.params,
      result: task.result,
      waiting: false,
      stalled: false,
      locked: false,
      completed: false,
      failed: true,
      error: error.message,
    };
    try {
      transaction = await this.db.startTransaction();
      await this.db.onUpdate(updates, transaction);
      await this.db.endTransaction(null, transaction);
      this.callHooks(QueueEvent.failed, task.error, task, null);
    } catch (e) {
      await this.db.endTransaction(e, transaction);
      throw e;
    }
  }

  async process(options: ConsumerProcessOptions): Promise<IConsumer> {
    this.consumer = new Consumer(this, options);
    return this.consumer;
  }
}
