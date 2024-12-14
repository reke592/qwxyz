import { TaskId, Topic } from "../types/dto";
import { Task } from "../implementations/task";

export function hashKey(topic: Topic, id: TaskId) {
  return `q:${topic}:${id}`;
}
