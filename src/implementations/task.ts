import { TaskId, TaskParams, Topic } from "../types/dto";
import { IQueue, ITask } from "../types/interface";
import { hashKey } from "../utils/keys";

export class Task implements ITask {
  id: TaskId;
  topic: Topic;
  params: TaskParams;
  result: any;
  waiting: boolean = false;
  stalled: boolean = false;
  locked: boolean = false;
  completed: boolean = false;
  error: any;
  queue: IQueue;
  tag: string;

  constructor(queue: IQueue, id: TaskId, topic: Topic, params: TaskParams) {
    this.queue = queue;
    this.id = id;
    this.topic = topic;
    this.params = params;
    this.tag = hashKey(topic, id);
  }

  remove(): void {
    this.queue.remove(this);
  }

  lock(): void {
    this.queue.lock(this);
  }

  complete(result: any): void {
    this.queue.complete(this, result);
  }

  failed(error: any): void {
    this.queue.failed(this, error);
  }
}
