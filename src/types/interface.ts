import { Queueable, TaskId, TaskParams, Topic } from "./dto";

type LocalProcessorOptions = {
  handler(task: ITask): Promise<any> | any;
};

type ScriptProcessorOptions = {
  handler: string;
};

export enum QueueEvent {
  "waiting",
  "locked",
  "completed",
  "failed",
  "stalled",
}

export type QueueEventCallback = (
  error: any,
  task: ITask,
  result: any
) => Promise<void> | void;

export type QueueOptions = {
  topic: Topic;
  db: IQueueDb;
};

export const DEFAULT_CHECK_INTERVAL = 3000;
export type ConsumerProcessOptions = {
  batchSize: number;
  autorun: boolean;
  /**
   * milliseconds delay to check database for queue. default: 3s
   */
  checkInterval?: number;
} & (LocalProcessorOptions | ScriptProcessorOptions);

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
  onWaiting(task: ITask, transaction: any): Promise<void>;
  onRemoveWaiting(task: ITask, transaction: any): Promise<void>;
  onLocked(task: ITask, transaction: any): Promise<void>;
  onRemoveLocked(task: ITask, transaction: any): Promise<void>;
  onStalled(task: ITask, transaction: any): Promise<void>;
  onFailed(task: ITask, transaction: any): Promise<void>;
  onCompleted(task: ITask, transaction: any): Promise<void>;
  getQueues(topic: Topic, limit: number): Promise<ITask[]>;
}

export interface ITask {
  id: TaskId;
  topic: Topic;
  params: TaskParams;
  result: any;
  locked: boolean;
  waiting: boolean;
  stalled: boolean;
  completed: boolean;
  error: any;
  queue: IQueue;
  tag: string;
  lock(): void;
  complete(result: any): void;
  failed(error: any): void;
  remove(): void;
}

export interface IConsumer {
  running: boolean;
  options: ConsumerProcessOptions;
  queue: IQueue;
  handle(task: ITask): Promise<any>;
  handleBulk(tasks: ITask[]): Promise<any[]>;
  consume(batchSize?: number): Promise<void>;
}

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
