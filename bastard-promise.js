const state = require("./promise-states");

// http://www.ecma-international.org/ecma-262/6.0/#sec-promise-constructor
class BastardPromise {
  constructor(executor) {
    if (typeof executor !== "function") throw new Error("Argument should be a function");

    this.state = state.PENDING;
    this.onCompletedChain = [];
    this.onFailedChain = [];
    this.onFinallyChain = [];
    this.internalValue = undefined;

    this.resolve = this.resolve.bind(this);
    this.reject = this.reject.bind(this);

    executor(this.resolve, this.reject);
  }

  resolve(value) {
    if (this.state !== state.PENDING) return;

    if (value != null && typeof value.then === "function")
      return value.then(this.resolve.bind(this));

    this.state = state.COMPLETED;
    this.internalValue = value;

    for (const { onCompleted } of this.onCompletedChain) onCompleted(this.internalValue);
    for (const onFinalized of this.onFinallyChain) onFinalized();
  }

  reject(error) {
    if (this.state !== state.PENDING) return;

    this.state = state.FAILED;
    this.internalValue = error;

    for (const onFailed of this.onFailedChain) onFailed(this.internalValue);
    for (const { onFailed } of this.onCompletedChain) onFailed(error);
    for (const onFinalized of this.onFinallyChain) onFinalized();
  }

  then = (onComplete) => {
    return new BastardPromise((resolve, reject) => {
      const onCompleted = (value) => resolve(onComplete(value));
      const onFailed = (res) => reject(res);

      if (this.state == state.COMPLETED) onCompleted(this.internalValue);
      else if (this.state == state.REJECTED) onRejected(this.value);
      else this.onCompletedChain.push({ onCompleted, onFailed });
    });
  };

  finally = (onFinally) => {
    return new BastardPromise((resolve) => {
      const onFinalized = (value) => resolve(onFinally());
      if (this.state == state.COMPLETED) onFinalized();
      else this.onFinallyChain.push(onFinalized);
    });
  };

  catch = (onFail) => {
    return new BastardPromise((resolve, reject) => {
      const onFailed = (value) => {
        try {
          resolve(onFail(value));
        } catch (err) {
          reject(err);
        }
      };

      if (this.state == state.FAILED) onFailed(this.internalValue);
      else this.onFailedChain.push(onFailed);
    });
  };

  static all(promises) {
    let results = [];
    const reducedPromise = promises.reduce(
      (prev, curr) => prev.then(() => curr).then((p) => results.push(p)),
      new BastardPromise((resolve) => resolve(null))
    );
    return reducedPromise.then(() => results);
  }
}

module.exports = BastardPromise;
