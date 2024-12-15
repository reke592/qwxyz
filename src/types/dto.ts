export type Topic = string;
export type TaskId = string | number | null;
export type TaskParams = Record<string, any>;
export type Queueable = {
  topic?: Topic;
  params: TaskParams;
};
export function QueueTag(topic: Topic, id: TaskId) {
  return `q:${topic}:${id}`;
}
