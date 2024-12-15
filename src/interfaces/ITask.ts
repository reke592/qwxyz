import { TaskId, Topic, TaskParams } from "../types/dto";
import { IQueue } from "./IQueue";

export interface ITaskFields {
  id: TaskId;
  topic: Topic;
  params: TaskParams;
  result: any;
  locked: boolean;
  waiting: boolean;
  stalled: boolean;
  completed: boolean;
  failed: boolean;
  error: any;
}

export interface ITask extends ITaskFields {
  tag: string;
  queue: IQueue;
  consumerId?: number;
  complete(result: any): void;
  fail(error: any): void;
  remove(): void;
}
