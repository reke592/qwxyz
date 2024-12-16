import { QueueTag, TaskId, TaskParams, Topic } from "../types/dto";
import { IQueue } from "../interfaces/IQueue";
import { ITask } from "../interfaces/ITask";

/**
 * Task for Queue consumers
 */
export class Task implements ITask {
  id: TaskId;
  topic: Topic;
  params: TaskParams;
  result: any;
  waiting: boolean = false;
  stalled: boolean = false;
  locked: boolean = false;
  completed: boolean = false;
  failed: boolean = false;
  error: any;
  tag: string;
  queue: IQueue;
  consumerId?: number;

  constructor(queue: IQueue, id: TaskId, topic: Topic, params: TaskParams) {
    this.queue = queue;
    this.id = id;
    this.topic = topic;
    this.params = params;
    this.tag = QueueTag(topic, id);
  }

  remove(): void {
    this.queue.remove(this);
  }

  complete(result: any): void {
    this.queue.complete(this, result);
  }

  fail(error: any): void {
    this.queue.failed(this, error);
  }
}
