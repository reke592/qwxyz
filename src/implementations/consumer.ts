import {
  ConsumerProcessOptions,
  DEFAULT_CHECK_INTERVAL,
  IConsumer,
  IQueue,
  ITask,
} from "../types/interface";
import { makeDebugger } from "../utils/debugger";
import { delay } from "../utils/delay";

export class Consumer implements IConsumer {
  private debug: debug.Debugger;
  queue: IQueue;
  options: ConsumerProcessOptions;
  running: boolean = false;
  handle: (task: ITask) => Promise<any>;

  constructor(
    queue: IQueue,
    handle: (task: ITask) => Promise<any>,
    options: ConsumerProcessOptions
  ) {
    this.debug = makeDebugger(`consumer:${queue.topic}`);
    this.queue = queue;
    this.handle = handle;
    this.options = options;
    if (this.options.autorun) {
      this.consume();
    }
  }

  async handleBulk(tasks: ITask[]): Promise<any[]> {
    return await Promise.allSettled(
      tasks.map(async (task) => {
        await task.lock();
        await this.handle(task)
          .then(async (result) => {
            await task.complete(result);
          })
          .catch(async (error) => {
            await task.failed(error);
          });
      })
    );
  }

  async consume(): Promise<void> {
    if (this.running) return;
    this.running = true;
    let tasks = await this.queue.getQueues(this.options.batchSize);
    if (tasks.length) {
      this.debug(`consume count: ${tasks.length}`);
      await this.handleBulk(tasks);
      this.running = false;
      if (this.options.autorun) {
        await delay(async () => await this.consume(), 100);
      }
    } else {
      this.running = false;
      if (this.options.autorun) {
        this.debug("waiting for queues");
        await delay(
          async () => await this.consume(),
          this.options.checkInterval || DEFAULT_CHECK_INTERVAL
        );
      }
    }
  }
}
