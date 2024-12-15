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
  get Id(): number;
  running: boolean;
  options: ConsumerProcessOptions;
  queue: IQueue;
  handle: ConsumerHander;
  handleBulk(tasks: ITask[]): Promise<any[]>;
  consume(batchSize?: number): Promise<void>;
}
