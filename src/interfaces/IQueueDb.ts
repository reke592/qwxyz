import { TaskId, Topic } from "../types/dto";
import { ITaskFields } from "./ITask";

/**
 * database implementation
 */

export interface IQueueDb {
  init(): Promise<IQueueDb>;
  startTransaction(): Promise<any>;
  endTransaction(error: any, transaction: any): Promise<void>;
  nextId(transaction: any): Promise<TaskId>;
  onCreate(task: ITaskFields, transaction: any): Promise<void>;
  onUpdate(task: ITaskFields, transaction: any): Promise<void>;
  onDelete(topic: Topic, id: TaskId, transaction: any): Promise<void>;
  getQueues(
    topic: Topic,
    limit: number,
    transaction: any
  ): Promise<ITaskFields[]>;
}
