import { IQueue } from "../interfaces/IQueue";
import {
  ConsumerHander,
  ConsumerProcessOptions,
  IConsumer,
} from "../interfaces/IConsumer";
import { ITask } from "../interfaces/ITask";
import { makeDebugger } from "../utils/debugger";
import { delay } from "../utils/delay";

export const DEFAULT_CHECK_INTERVAL = 3000;

export class Consumer implements IConsumer {
  private static nextId = 1;
  private debug: debug.Debugger;
  private id: number;

  queue: IQueue;
  options: ConsumerProcessOptions;
  running: boolean = false;
  handle: ConsumerHander;

  constructor(queue: IQueue, options: ConsumerProcessOptions) {
    this.id = Consumer.nextId++;
    this.debug = makeDebugger(`consumer#${this.id}:${queue.topic}`);
    this.queue = queue;
    this.options = options;
    this.handle = this.options.handler!;
    if (this.options.autorun) {
      this.consume();
    }
  }

  get Id(): number {
    return this.id;
  }

  async handleBulk(tasks: ITask[]): Promise<any[]> {
    return await Promise.allSettled(
      tasks.map(async (task) => {
        task.consumerId = this.Id;
        await this.handle(task)
          .then(async (result) => {
            await task.complete(result);
          })
          .catch(async (error) => {
            await task.fail(error);
          });
      })
    );
  }

  async consume(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.debug("check waiting");
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
        await delay(
          async () => await this.consume(),
          this.options.checkInterval || DEFAULT_CHECK_INTERVAL
        );
      }
    }
  }
}
