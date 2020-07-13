const state = require("./promise-states");

// http://www.ecma-international.org/ecma-262/6.0/#sec-promise-constructor
class BastardPromise {
  constructor(executor) {
    if (typeof executor !== "function")
      throw new TypeError(`Promise resolver ${executor} is not a function`);

    this.state = state.PENDING;
    this.chainQueue = [];
    this.onFinallyChain = [];
    this._innerValue = undefined;

    executor(this.resolve, this.reject);
  }

  resolve = (value) => {
    if (this.state !== state.PENDING) return;

    if (value != null && value instanceof BastardPromise) {
      const result = value.then(this.resolve.bind(this), this.reject.bind(this), "intermediateP");
      return result;
    }

    this.state = state.FULFILLED;
    this._innerValue = value;

    for (const { onFulFilled } of this.chainQueue) onFulFilled(this._innerValue);
    for (const onFinalized of this.onFinallyChain) onFinalized();
  };

  reject = (error) => {
    if (this.state !== state.PENDING) return;

    this.state = state.REJECTED;
    this._innerValue = error;

    for (const { onRejected } of this.chainQueue) onRejected(this._innerValue);
    for (const onFinalized of this.onFinallyChain) onFinalized();
  };

  then = (onFulFill, onReject) => {
    if (typeof onFulFill !== "function") throw TypeError("onFulFill is not a function");

    return new BastardPromise((resolve, reject) => {
      const onRejected = this.getOnRejectedAction(resolve, reject, onReject);
      const onFulFilled = this.getOnFulFilledAction(resolve, reject, onFulFill);

      if (this.state == state.FULFILLED) onFulFilled(this._innerValue);
      else if (this.state == state.REJECTED) onRejected(this._innerValue);
      else this.chainQueue.push({ onFulFilled, onRejected });
    });
  };

  catch = (onReject) => this.then(() => {}, onReject);

  finally = (onFinally) => {
    return new BastardPromise((resolve) => {
      const onFinalized = () => resolve(onFinally());
      if (this.state == state.FULFILLED) onFinalized();
      else this.onFinallyChain.push(onFinalized);
    });
  };

  resolveOrFallback(resolve, reject) {
    try {
      resolve();
    } catch (err) {
      reject(err);
    }
  }

  getOnRejectedAction = (resolve, reject, onReject) => {
    return (value) => {
      this.resolveOrFallback(
        () => (onReject != null ? resolve(onReject(value)) : reject(value)),
        reject
      );
    };
  };

  getOnFulFilledAction = (resolve, reject, onFulFill) => {
    return (value) => {
      this.resolveOrFallback(() => resolve(onFulFill(value)), reject);
    };
  };

  static all = (promises) => {
    let results = [];
    const reducedPromise = promises.reduce(
      (prev, curr) => prev.then(() => curr).then((p) => results.push(p)),
      new BastardPromise((resolve) => resolve(null))
    );
    return reducedPromise.then(() => results);
  };

  static race = (promises) =>
    new Promise((res, rej) => {
      promises.forEach((p) => p.then(res).catch(rej));
    });

  static resolve = (value) => new Promise((resolve) => resolve(value));
}

module.exports = BastardPromise;
