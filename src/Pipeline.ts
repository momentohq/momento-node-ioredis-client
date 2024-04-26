import Commander from 'ioredis/built/utils/Commander';
import {Command} from 'ioredis';
import {MomentoRedisAdapter} from './momento-redis-adapter';
import {ArgumentType} from 'ioredis/built/Command';
import {CommandParameter} from 'ioredis/built/types';

interface Pipeline {
  length: number;
}

class Pipeline extends Commander<{type: 'pipeline'}> {
  promise: Promise<[error: Error | null, result: unknown][] | null>;
  resolve: (result: [error: Error | null, result: unknown][] | null) => void;
  reject: (error: Error) => void;

  private _queue: Array<Command> = [];
  private _result: Array<unknown> = [];

  momentoAdapter: MomentoRedisAdapter;

  constructor(public redis: MomentoRedisAdapter) {
    super();
    this.momentoAdapter = redis;

    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this;
    Object.defineProperty(this, 'length', {
      get: function () {
        return _this._queue.length;
      },
    });
  }

  sendCommand(command: Command): unknown {
    command.pipelineIndex = this._queue.length;
    command.promise = this.invokeMomentoRedisClient(command.name, command.args);
    this._queue.push(command);
    return this;
  }

  addBatch(commands: Array<Array<unknown>>) {
    for (let i = 0; i < commands.length; ++i) {
      // Parse input cmd in Array format ex: ["get", "foo"]
      const command = commands[i];
      const commandName = command[0] as string;
      const args = command.slice(1) as ArgumentType[];

      // Invoke Command
      const cmdToQueue = new Command(commandName, args);
      cmdToQueue.promise = this.invokeMomentoRedisClient(
        cmdToQueue.name,
        cmdToQueue.args
      );

      // Push command with promise to queue
      cmdToQueue.pipelineIndex = this._queue.length;
      this._queue.push(cmdToQueue);
    }
    return this;
  }

  // Invoke function on momento adaptor
  invokeMomentoRedisClient(
    name: string,
    args: CommandParameter[]
  ): Promise<unknown> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (this.momentoAdapter[`${name}`] === undefined) {
      throw new Error(`Un-Supported Command Passed: ${name}`);
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return this.momentoAdapter[`${name}`](...args); // eslint-disable-line @typescript-eslint/no-unsafe-return
  }

  exec(): Promise<[error: Error | null, result: unknown][] | null> {
    if (!this._queue.length) {
      this.resolve([]);
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    execPipeline();
    return this.promise;

    async function execPipeline() {
      for (let i = 0; i < _this._queue.length; ++i) {
        _this._result.push([null, await _this._queue[i].promise]);
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      _this.resolve(_this._result);
      return _this.promise;
    }
  }
}

export default Pipeline;
