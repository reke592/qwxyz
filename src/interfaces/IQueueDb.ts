import { TaskId, Topic } from "../types/dto";
import { ITask } from "./ITask";

/**
 * database implementation
 */

export interface IQueueDb {
  transaction: any;
  startTransaction(): Promise<any>;
  endTransaction(error?: any): Promise<void>;
  nextId(transaction: any): Promise<TaskId>;
  onCreate(task: ITask, transaction: any): Promise<void>;
  onUpdate(task: ITask, transaction: any): Promise<void>;
  onDelete(topic: Topic, id: TaskId, transaction: any): Promise<void>;
  getQueues(topic: Topic, limit: number, transaction: any): Promise<ITask[]>;
}
