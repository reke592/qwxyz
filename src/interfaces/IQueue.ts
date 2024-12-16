import { Topic, Queueable } from "../types/dto";
import { QueueEvent } from "../types/enums";
import { ConsumerProcessOptions, IConsumer } from "./IConsumer";
import { IQueueDb } from "./IQueueDb";
import { ITask, ITaskFields } from "./ITask";

export type QueueEventCallback = (
  error: any,
  task: ITask,
  result: any
) => Promise<void> | void;

export type QueueOptions = {
  /**
   * topic of the queue
   */
  topic: Topic;
  /**
   * database implementation where to save the records.
   * @see ITaskFields
   */
  db: IQueueDb;
};

export interface IQueue {
  /**
   * the topic of this producer
   */
  topic: Topic;
  /**
   * consumer implementation
   */
  consumer?: IConsumer;
  /**
   * queue database imlementation
   */
  db: IQueueDb;
  /**
   * @param topic
   * @param limit
   * @returns a list of locked tasks
   */
  getQueues(limit: number): Promise<ITask[]>;
  /**
   * add task
   * @param data
   */
  add(data: Queueable): Promise<ITask>;
  /**
   * lock task
   * @param task
   */
  lock(task: ITaskFields, transaction: any): Promise<ITaskFields>;
  /**
   * complete
   * @param task
   * @param result
   */
  complete(task: ITaskFields, result: any): Promise<void>;
  /**
   * failed task
   * @param task
   * @param error
   */
  failed(task: ITaskFields, error: Error): Promise<void>;
  /**
   * remove task
   * @param task
   */
  remove(task: ITaskFields): Promise<void>;
  /**
   * start queue consumer
   * @param option
   */
  process(option: ConsumerProcessOptions): Promise<IConsumer>;
  /**
   * register hooks to this instance, for global hooks use the static `Queue.on`
   * @param event
   * @param callback
   */
  on(event: QueueEvent, callback: QueueEventCallback): IQueue;
  /**
   * re-compute, allHooks = hooks + Queue.hooks
   */
  recomputeHooks(event: QueueEvent): void;
}
