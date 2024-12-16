import { TaskId, Topic } from "../types/dto";
import { ITaskFields } from "./ITask";

/**
 * Database storage for Queue (task fields).
 * @see ITaskFields
 */
export interface IQueueDb {
  /**
   * optional method to support concrete implementation usecase.
   * @param options
   */
  init(options: any): Promise<IQueueDb>;
  /**
   * @returns a new database transaction
   */
  startTransaction(): Promise<any>;
  /**
   * commit or rollback the transaction
   * @param error if given, this method will rollback the transaction.
   * @param transaction
   */
  endTransaction(error: any, transaction: any): Promise<void>;
  /**
   * this method is optional if the concrete implementation use auto-increment value, this method returns null.
   * @param transaction
   * @returns new task id or null
   */
  nextId(transaction: any): Promise<TaskId>;
  /**
   * insert new task
   * @param task
   * @param transaction
   */
  onCreate(task: ITaskFields, transaction: any): Promise<void>;
  /**
   * update existing task
   * @param task
   * @param transaction
   */
  onUpdate(task: ITaskFields, transaction: any): Promise<void>;
  /**
   * delete existing task
   * @param topic
   * @param id
   * @param transaction
   */
  onDelete(topic: Topic, id: TaskId, transaction: any): Promise<void>;
  /**
   * Get waiting task based on topic
   * @param topic - query filter
   * @param limit
   * @param transaction
   */
  getQueues(
    topic: Topic,
    limit: number,
    transaction: any
  ): Promise<ITaskFields[]>;
}
