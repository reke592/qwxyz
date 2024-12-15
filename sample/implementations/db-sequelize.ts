import { DataTypes, Model, Sequelize, Transaction } from "@sequelize/core";
import {
  TaskId,
  TaskParams,
  Topic,
  ITask,
  ITaskFields,
  IQueueDb,
} from "../../src";

class QueueModel extends Model implements ITaskFields {
  public id!: number;
  public topic!: string;
  public params!: TaskParams;
  public result!: any;
  public locked!: boolean;
  public waiting!: boolean;
  public stalled!: boolean;
  public completed!: boolean;
  public failed!: boolean;
  public error: any;
}

export class SequelizeDB implements IQueueDb {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  async init(tableName?: string): Promise<IQueueDb> {
    QueueModel.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        topic: DataTypes.STRING,
        params: DataTypes.JSON,
        result: DataTypes.JSON,
        locked: DataTypes.BOOLEAN,
        waiting: DataTypes.BOOLEAN,
        stalled: DataTypes.BOOLEAN,
        completed: DataTypes.BOOLEAN,
        failed: DataTypes.BOOLEAN,
        error: DataTypes.STRING,
      },
      { tableName: tableName || "queues", sequelize: this.sequelize }
    );
    await QueueModel.sync();
    return this;
  }

  async startTransaction(): Promise<any> {
    return await this.sequelize.startUnmanagedTransaction();
  }

  async endTransaction(error: any, transaction: Transaction): Promise<void> {
    if (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    } else {
      await transaction.commit();
    }
  }

  async nextId(transaction: any): Promise<TaskId> {
    // this value is automatically created
    return null;
  }

  async onCreate(task: ITask, transaction: any): Promise<void> {
    await QueueModel.create(
      {
        // topic is permanent
        topic: task.topic,
        waiting: task.waiting,
        stalled: task.stalled,
        locked: task.locked,
        completed: task.completed,
        failed: task.failed,
        params: task.params,
        result: task.result,
        error: task.error,
      },
      { transaction }
    );
  }

  async onUpdate(task: ITask, transaction: any): Promise<void> {
    await QueueModel.update(
      {
        waiting: task.waiting,
        stalled: task.stalled,
        locked: task.locked,
        completed: task.completed,
        failed: task.failed,
        params: task.params,
        result: task.result,
        error: task.error,
      },
      {
        where: {
          id: task.id,
        },
        transaction,
      }
    );
  }

  async onDelete(topic: Topic, id: TaskId, transaction: any): Promise<void> {
    await QueueModel.destroy({
      where: {
        id,
      },
      transaction,
    });
  }

  async getQueues(
    topic: Topic,
    limit: number,
    transaction: any
  ): Promise<ITaskFields[]> {
    return await QueueModel.findAll({
      where: {
        topic: topic,
        waiting: true,
      },
      limit,
      transaction,
    });
  }
}
