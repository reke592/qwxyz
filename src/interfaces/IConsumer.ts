import { IQueue } from "./IQueue";
import { ITask } from "./ITask";

type LocalProcessorOptions = {
  handler(task: ITask): Promise<any> | any;
};

type ScriptProcessorOptions = {
  handler: string;
};

export type ConsumerProcessOptions = {
  batchSize: number;
  autorun: boolean;
  /**
   * milliseconds delay to check database for queue. default: 3s
   */
  checkInterval?: number;
} & (LocalProcessorOptions | ScriptProcessorOptions);

export interface IConsumer {
  running: boolean;
  options: ConsumerProcessOptions;
  queue: IQueue;
  handle(task: ITask): Promise<any>;
  handleBulk(tasks: ITask[]): Promise<any[]>;
  consume(batchSize?: number): Promise<void>;
}
