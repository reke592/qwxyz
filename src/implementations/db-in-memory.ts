import { QueueTag, TaskId, Topic } from "../types/dto";
import { Task } from "./task";
import { IQueueDb } from "../interfaces/IQueueDb";
import { ITask } from "../interfaces/ITask";
import { delay } from "../utils/delay";
import { makeDebugger } from "../utils/debugger";

export class MemoryDb implements IQueueDb {
  private debug = makeDebugger("db:in-memory");

  // engine
  next_id = 1;
  transaction: any = null;
  // row
  records: Record<string, Task> = {};
  // index
  waiting = new Set<TaskId>();
  locked = new Set<TaskId>();
  stalled = new Set<TaskId>();
  failed = new Set<TaskId>();
  completed = new Set<TaskId>();

  async getQueues(topic: Topic, limit: number): Promise<ITask[]> {
    this.debug("getQueues", topic, limit);
    let results: ITask[] = [];
    let i = 0;
    for (let id of this.waiting) {
      let task = this.records[id];
      if (task.tag === QueueTag(topic, id)) {
        results.push(task);
        if (++i === limit) break;
      }
    }
    this.debug(results);
    return results;
  }

  async nextId(transaction: any): Promise<TaskId> {
    this.debug("nextId", this.next_id);
    let id = this.next_id;
    this.next_id++;
    return id;
  }

  async onCreate(task: ITask, transaction: any): Promise<void> {
    this.debug("onCreate", task.id);
    if (task.waiting) {
      this.waiting.add(task.id);
    } else if (task.stalled) {
      this.stalled.add(task.id);
    }
    this.records[task.id] = task;
  }

  async onUpdate(task: ITask, transaction: any): Promise<void> {
    this.debug("onUpdate", task.id);
    if (task.waiting) {
      this.waiting.add(task.id);
    } else if (task.locked) {
      this.waiting.delete(task.id);
      this.locked.add(task.id);
    } else if (task.completed) {
      this.locked.delete(task.id);
      this.completed.add(task.id);
    } else if (task.stalled) {
      this.stalled.add(task.id);
    }
    this.records[task.id] = task;
  }

  async startTransaction(): Promise<any> {
    if (this.transaction) {
      return await delay(() => this.startTransaction(), 0);
    }
    this.transaction = +new Date();
    this.debug("startTransaction", this.transaction);
  }

  async endTransaction(error: any): Promise<void> {
    this.debug("endTransaction", this.transaction, error);
    this.transaction = null;
  }

  async onDelete(topic: Topic, id: TaskId, transaction: any): Promise<void> {
    this.debug("onDelete", topic, id);
    let key = QueueTag(topic, id);
    delete this.records[key];
  }

  async onRemoveWaiting(task: ITask, transaction: any): Promise<void> {
    this.debug("onRemoveWaiting", task.id);
    this.waiting.delete(task.id);
  }

  async onRemoveLocked(task: ITask, transaction: any): Promise<void> {
    this.debug("onRemoveLocked", task.id);
    this.locked.delete(task.id);
  }
}
