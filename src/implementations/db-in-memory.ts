import { TaskId, Topic } from "../types/dto";
import { Task } from "./task";
import { IQueueDb, ITask } from "../types/interface";
import { hashKey } from "../utils/keys";
import { delay } from "../utils/delay";
import { makeDebugger } from "../utils/debugger";

export class MemoryDb implements IQueueDb {
  private debug = makeDebugger("db:in-memory");

  next_id = 1;
  waiting = new Set<TaskId>();
  locked = new Set<TaskId>();
  stalled = new Set<TaskId>();
  failed = new Set<TaskId>();
  completed = new Set<TaskId>();
  records: Record<string, Task> = {};
  transaction: any = null;

  async getQueues(topic: Topic, limit: number): Promise<ITask[]> {
    this.debug("getQueues", topic, limit);
    let results: ITask[] = [];
    let i = 0;
    for (let id of this.waiting) {
      let task = this.records[id];
      if (task.tag === hashKey(topic, id)) {
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
    this.records[task.id] = task;
  }
  async onUpdate(task: ITask, transaction: any): Promise<void> {
    this.debug("onUpdate", task.id);
    this.records[task.id] = task;
  }
  async onWaiting(task: ITask, transaction: any): Promise<void> {
    this.debug("onWaiting", task.id);
    this.waiting.add(task.id);
  }
  async onLocked(task: ITask, transaction: any): Promise<void> {
    this.debug("onLocked", task.id);
    this.locked.add(task.id);
  }
  async onStalled(task: ITask, transaction: any): Promise<void> {
    this.debug("onStalled", task.id);
    this.stalled.add(task.id);
  }
  async onFailed(task: ITask, transaction: any): Promise<void> {
    this.debug("onFailed", task.id);
    this.failed.add(task.id);
  }
  async onCompleted(task: ITask, transaction: any): Promise<void> {
    this.debug("onCompleted", task.id);
    this.completed.add(task.id);
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
    let key = hashKey(topic, id);
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
