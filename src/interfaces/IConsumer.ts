import { IQueue } from "./IQueue";
import { ITask } from "./ITask";

export type ConsumerHander = (task: ITask) => Promise<any>;

export type ConsumerProcessOptions = {
  /**
   * the number of queues to process per consume
   */
  batchSize: number;
  /**
   * check queue every checkInterval
   */
  autorun: boolean;
  /**
   * milliseconds delay to check database for queue. default: 3s
   */
  checkInterval?: number;
  /**
   * the handler for consumer process
   * @param task
   */
  handler?: ConsumerHander;
};

export interface IConsumer {
  /**
   * @return {number} consumer id
   */
  get Id(): number;
  /**
   * a flag that throttles the `consume` method
   */
  running: boolean;
  /**
   * consumer process options to control the consumer behavior
   */
  options: ConsumerProcessOptions;
  /**
   * the Queue instance to consume
   */
  queue: IQueue;
  /**
   * equivalent to this consumer options.handler
   */
  handle: ConsumerHander;
  /**
   * run tasks in parallel using `Promise.allSettled`
   * @param tasks
   */
  handleBulk(tasks: ITask[]): Promise<any[]>;
  /**
   * start requesting queues
   */
  consume(): Promise<void>;
}
