const isFunction = (func: any) => typeof func === "function";

const isObject = (supposedObject: any) =>
  typeof supposedObject === "object" &&
  supposedObject !== null &&
  !Array.isArray(supposedObject);

const isThenable = (obj: any) => isObject(obj) && isFunction(obj.then);

const identity = (co: any) => co;

export { identity, isFunction, isObject, isThenable };

enum States {
  PENDING = "PENDING",
  RESOLVED = "RESOLVED",
  REJECTED = "REJECTED",
}

interface Handler<T, U> {
  onSuccess: HandlerOnSuccess<T, U>;
  onFail: HandlerOnFail<U>;
}

type HandlerOnSuccess<T, U = any> = (value: T) => U | Thenable<U>;
type HandlerOnFail<U = any> = (reason: any) => U | Thenable<U>;
type Finally<U> = () => U | Thenable<U>;

interface Thenable<T> {
  then<U>(
    onSuccess?: HandlerOnSuccess<T, U>,
    onFail?: HandlerOnFail<U>,
  ): Thenable<U>;
  then<U>(
    onSuccess?: HandlerOnSuccess<T, U>,
    onFail?: (reason: any) => void,
  ): Thenable<U>;
}

type Resolve<R> = (value?: R | Thenable<R>) => void;
type Reject = (value?: any) => void;

export class SyncPromise<T> {
  private state: States = States.PENDING;
  private handlers: Handler<T, any>[] = [];
  private value: T | any;

  public constructor(callback: (resolve: Resolve<T>, reject: Reject) => void) {
    try {
      callback(this.resolve as Resolve<T>, this.reject);
    } catch (e) {
      this.reject(e);
    }
  }

  private resolve = (value: T) => {
    return this.setResult(value, States.RESOLVED);
  };

  private reject = (reason: any) => {
    return this.setResult(reason, States.REJECTED);
  };

  private setResult = (value: T | any, state: States) => {
    const set = () => {
      if (this.state !== States.PENDING) {
        return null;
      }

      if (isThenable(value)) {
        return (value as Thenable<T>).then(this.resolve, this.reject);
      }

      this.value = value;
      this.state = state;

      return this.executeHandlers();
    };

    void set();
  };

  private executeHandlers = () => {
    if (this.state === States.PENDING) {
      return null;
    }

    for (const handler of this.handlers) {
      if (this.state === States.REJECTED) {
        handler.onFail(this.value);
      } else {
        handler.onSuccess(this.value);
      }
    }

    this.handlers = [];
  };

  private attachHandler = (handler: Handler<T, any>) => {
    this.handlers = [...this.handlers, handler];

    this.executeHandlers();
  };

  // biome-ignore lint/suspicious/noThenProperty: TODO(JAZZ-561): Review
  public then<U>(onSuccess: HandlerOnSuccess<T, U>, onFail?: HandlerOnFail<U>) {
    return new SyncPromise<U>((resolve, reject) => {
      return this.attachHandler({
        onSuccess: (result) => {
          try {
            return resolve(onSuccess(result));
          } catch (e) {
            return reject(e);
          }
        },
        onFail: (reason) => {
          if (!onFail) {
            return reject(reason);
          }

          try {
            return resolve(onFail(reason));
          } catch (e) {
            return reject(e);
          }
        },
      });
    });
  }

  public catch<U>(onFail: HandlerOnFail<U>) {
    return this.then<U>(identity, onFail);
  }

  // methods

  public toString() {
    return "[object SyncPromise]";
  }

  public finally<U>(cb: Finally<U>) {
    return new SyncPromise<U>((resolve, reject) => {
      let co: U | any;
      let isRejected: boolean;

      return this.then(
        (value) => {
          isRejected = false;
          co = value;
          return cb();
        },
        (reason) => {
          isRejected = true;
          co = reason;
          return cb();
        },
      ).then(() => {
        if (isRejected) {
          return reject(co);
        }

        return resolve(co);
      });
    });
  }

  public spread<U>(handler: (...args: any[]) => U) {
    return this.then<U>((collection) => {
      if (Array.isArray(collection)) {
        return handler(...collection);
      }

      return handler(collection);
    });
  }

  // static

  public static resolve<U = any>(value?: U | Thenable<U>) {
    return new SyncPromise<U>((resolve) => {
      return resolve(value);
    });
  }

  public static reject<U>(reason?: any) {
    return new SyncPromise<U>((_resolve, reject) => {
      return reject(reason);
    });
  }

  public static all<U = any>(collection: (U | Thenable<U>)[]) {
    return new SyncPromise<U[]>((resolve, reject) => {
      if (!Array.isArray(collection)) {
        return reject(new TypeError("An array must be provided."));
      }

      if (collection.length === 0) {
        return resolve([]);
      }

      let counter = collection.length;
      const resolvedCollection: U[] = [];

      const tryResolve = (value: U, index: number) => {
        counter -= 1;
        resolvedCollection[index] = value;

        if (counter !== 0) {
          return null;
        }

        return resolve(resolvedCollection);
      };

      return collection.forEach((item, index) => {
        return SyncPromise.resolve(item)
          .then((value) => {
            return tryResolve(value, index);
          })
          .catch(reject);
      });
    });
  }
}
