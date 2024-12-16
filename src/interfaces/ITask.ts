import { TaskId, Topic, TaskParams } from "../types/dto";
import { IQueue } from "./IQueue";

export interface ITaskFields {
  /**
   * unique id for this task
   */
  id: TaskId;
  /**
   * topic to group tasks in database
   */
  topic: Topic;
  /**
   * the parameters for consumer handler
   */
  params: TaskParams;
  /**
   * the value returned from consumer handler
   */
  result: any;
  /**
   * when the task is newly created
   */
  waiting: boolean;
  /**
   * when the task is created using different Queue producer instance
   */
  stalled: boolean;
  /**
   * when the task is assigned to a consumer
   */
  locked: boolean;
  /**
   * when the consumer process was successful
   */
  completed: boolean;
  /**
   * when the consumer handler got an error
   */
  failed: boolean;
  /**
   * the error thrown from consumer handler
   */
  error: any;
}

export interface ITask extends ITaskFields {
  /**
   * a unique value result when calling QueueTag function.
   * @returns `q:${topic}:${id}`
   */
  tag: string;
  /**
   * the queue instance
   */
  queue: IQueue;
  /**
   * the consumer id where the task was assigned
   */
  consumerId?: number;
  /**
   * triggers queue to update the record in database with the result value
   * @param result
   */
  complete(result: any): void;
  /**
   * triggers queue to update the record in database with the error value
   * @param error
   */
  fail(error: any): void;
  /**
   * triggers queue to remove this record in database
   */
  remove(): void;
}
