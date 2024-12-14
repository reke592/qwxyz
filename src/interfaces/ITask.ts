import { TaskId, Topic, TaskParams } from "../types/dto";
import { IQueue } from "./IQueue";


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
