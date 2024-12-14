import { Queueable, Topic } from "../types/dto";
import { QueueEvent } from "../types/enums";
import { IQueueDb } from "../interfaces/IQueueDb";
import { IQueue, QueueEventCallback, QueueOptions } from "../interfaces/IQueue";
import { ConsumerProcessOptions, IConsumer } from "../interfaces/IConsumer";
import { ITask } from "../interfaces/ITask";
import { Consumer } from "./consumer";
import { Task } from "./task";

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
    return await this.db
      .getQueues(this.topic, limit)
      .then(async (results) =>
        results.map(
          (record) => new Task(this, record.id, record.topic, record.params)
        )
      );
  }

  async add(data: Queueable): Promise<ITask> {
    let transaction;
    try {
      transaction = await this.db.startTransaction();
      let id = await this.db.nextId(transaction);
      let task = new Task(this, id, data.topic || this.topic, data.params);
      task.waiting = true;
      await this.db.onCreate(task, transaction);
      await this.db.onWaiting(task, transaction);
      await this.db.endTransaction();
      this.callHooks(QueueEvent.waiting, null, task, null);
      return task;
    } catch (e) {
      await this.db.endTransaction(e);
      throw e;
    }
  }

  async remove(task: ITask): Promise<void> {
    let transaction;
    try {
      transaction = await this.db.startTransaction();
      await this.db.onDelete(task.topic, task.id, transaction);
      await this.db.endTransaction();
    } catch (e) {
      await this.db.endTransaction(e);
      throw e;
    }
  }

  async lock(task: ITask): Promise<void> {
    let transaction;
    let updates: ITask = {
      ...task,
      waiting: false,
      locked: true,
    };
    try {
      transaction = await this.db.startTransaction();
      await this.db.onLocked(updates, transaction);
      await this.db.onRemoveWaiting(updates, transaction);
      await this.db.onUpdate(updates, transaction);
      await this.db.endTransaction();
      this.callHooks(QueueEvent.locked, null, task, null);
    } catch (e) {
      await this.db.endTransaction(e);
      throw e;
    }
  }

  async complete(task: ITask, result: any): Promise<void> {
    let transaction;
    let updates: ITask = {
      ...task,
      locked: false,
      completed: true,
      result: result,
    };
    try {
      transaction = await this.db.startTransaction();
      task.completed = true;
      await this.db.onRemoveLocked(updates, transaction);
      await this.db.onCompleted(updates, transaction);
      await this.db.onUpdate(task, transaction);
      await this.db.endTransaction();
      this.callHooks(QueueEvent.completed, null, task, task.result);
    } catch (e) {
      await this.db.endTransaction(e);
      throw e;
    }
  }

  async failed(task: ITask, error: Error): Promise<void> {
    let transaction;
    let updates: ITask = {
      ...task,
      error: error.message,
    };
    try {
      transaction = await this.db.startTransaction();
      await this.db.onFailed(updates, transaction);
      await this.db.onUpdate(updates, transaction);
      await this.db.endTransaction();
      this.callHooks(QueueEvent.failed, task.error, task, null);
    } catch (e) {
      await this.db.endTransaction(e);
      throw e;
    }
  }

  async process(options: ConsumerProcessOptions): Promise<IConsumer> {
    let handle;
    if (typeof options.handler === "function") {
      handle = options.handler;
    } else {
      handle = require(options.handler);
    }
    this.consumer = new Consumer(this, handle, options);
    return this.consumer;
  }
}
