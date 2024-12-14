import { Topic, Queueable } from "../types/dto";
import { QueueEvent } from "../types/enums";
import { ConsumerProcessOptions, IConsumer } from "./IConsumer";
import { IQueueDb } from "./IQueueDb";
import { ITask } from "./ITask";

export type QueueEventCallback = (
  error: any,
  task: ITask,
  result: any
) => Promise<void> | void;

export type QueueOptions = {
  topic: Topic;
  db: IQueueDb;
};

export interface IQueue {
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
   * get queues
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
  lock(task: ITask): Promise<void>;
  /**
   * complete
   * @param task
   * @param result
   */
  complete(task: ITask, result: any): Promise<void>;
  /**
   * failed task
   * @param task
   * @param error
   */
  failed(task: ITask, error: Error): Promise<void>;
  /**
   * remove task
   * @param task
   */
  remove(task: ITask): Promise<void>;
  /**
   * start queue consumer
   * @param option
   */
  process(option: ConsumerProcessOptions): Promise<IConsumer>;
  on(event: QueueEvent, callback: QueueEventCallback): IQueue;
  recomputeHooks(event: QueueEvent): void;
}
