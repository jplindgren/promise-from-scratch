const state = require("./promise-states");

// http://www.ecma-international.org/ecma-262/6.0/#sec-promise-constructor
class BastardPromise {
  constructor(executor) {
    if (typeof executor !== "function") throw new Error("Argument should be a function");

    this.state = state.PENDING;
    this.onFulFilledChain = [];
    this.onRejectedChain = [];
    this.onFinallyChain = [];
    this._innerValue = undefined;

    executor(this.resolve, this.reject);
  }

  resolve = (value) => {
    if (this.state !== state.PENDING) return;

    if (value != null && typeof value.then === "function") {
      const result = value.then(this.resolve.bind(this), this.reject.bind(this), "intermediateP");
      return result;
    }

    this.state = state.FULFILLED;
    this._innerValue = value;

    for (const { onCompleted } of this.onFulFilledChain) onCompleted(this._innerValue);
    for (const onFinalized of this.onFinallyChain) onFinalized();

    // console.log(
    //   `Promise id: ${this.id}, resolved --- status-> ${this.state}, value-> ${this.internalValue}`
    // );
  };

  reject = (error) => {
    if (this.state !== state.PENDING) return;

    this.state = state.REJECTED;
    this._innerValue = error;

    for (const onFailed of this.onRejectedChain) onFailed(this._innerValue);
    for (const { onFailed } of this.onFulFilledChain) onFailed(error);
    for (const onFinalized of this.onFinallyChain) onFinalized();
  };

  then = (onComplete, onFail, id) => {
    return new BastardPromise((resolve, reject) => {
      //const onCompleted = (value) => resolve(onComplete(value));

      const onCompleted = (value) => {
        try {
          resolve(onComplete(value));
        } catch (err) {
          reject(err);
        }
      };

      //const onFailed = (res) => (onFail != null ? reject(onFail(res)) : reject(res)); // first implementation
      const onFailed = (res) => (onFail != null ? resolve(onFail(res)) : reject(res));
      // const onFailed = (value) => {
      //   try {
      //     resolve(onFail(value));
      //   } catch (err) {
      //     reject(err);
      //   }
      // };

      if (this.state == state.FULFILLED) onCompleted(this._innerValue);
      else if (this.state == state.REJECTED) onFailed(this._innerValue);
      else this.onFulFilledChain.push({ onCompleted, onFailed });
    }, id);
  };

  catch = (onFail, id) => {
    return new BastardPromise((resolve, reject) => {
      const onFailed = (value) => {
        try {
          resolve(onFail(value));
        } catch (err) {
          reject(err);
        }
      };

      if (this.state == state.REJECTED) onFailed(this._innerValue);
      else if (this.state == state.FULFILLED) resolve(this._innerValue);
      //call when the previous promises are completed without error.
      else this.onRejectedChain.push(onFailed);
    }, id);
  };

  finally = (onFinally) => {
    return new BastardPromise((resolve) => {
      const onFinalized = (value) => resolve(onFinally());
      if (this.state == state.FULFILLED) onFinalized();
      else this.onFinallyChain.push(onFinalized);
    });
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
}

module.exports = BastardPromise;
