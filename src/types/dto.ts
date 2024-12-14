export type Topic = string;
export type TaskId = string | number;
export type TaskParams = Record<string, any>;
export type Queueable = {
  topic?: Topic;
  params: TaskParams;
};
