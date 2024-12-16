export type Topic = string;
export type TaskId = string | number | null;
export type TaskParams = Record<string, any>;

export type Queueable = {
  /**
   * the Queue topic. The task will be stalled if added in different Queue instance.
   */
  topic?: Topic;
  /**
   * the parameters for consumer handler process
   */
  params: TaskParams;
};

/**
 * we only use this in memory database implementation
 * @param topic
 * @param id
 * @returns a unique string value based on the topic and id.
 * @see MemoryDb
 */
export function QueueTag(topic: Topic, id: TaskId) {
  return `q:${topic}:${id}`;
}
