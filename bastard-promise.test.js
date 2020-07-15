const BastardPromise = require("./bastard-promise");

const getErrorObject = (message = "Promise has been rejected") => new Error(message);

describe("Bastard Promises", () => {
  describe("Initialization", () => {
    it("should be created in a pending state", () => {
      const promise = new BastardPromise(() => {});
      expect(promise.state).toBe("pending");
    });

    it("should be created with empty chained array", () => {
      const promise = new BastardPromise(() => {});
      expect(promise.chainQueue).toEqual([]);
    });

    it("should be created with undefned value", () => {
      const promise = new BastardPromise(() => {});
      expect(promise._innerValue).toBeUndefined();
    });

    it("should throw exception if executor is not a function", () => {
      expect(() => new BastardPromise({ data: "hi" })).toThrow(TypeError);
    });
  });

  describe("behavior", () => {
    describe("when fulFilled", () => {
      it("should throw exception if then onFulFill is not a function", () => {
        expect(() => new BastardPromise((resolve) => resolve("data")).then(null)).toThrow(
          new TypeError("onFulFill is not a function")
        );
      });

      it("should resolved value be passed to then", (done) => {
        return new BastardPromise((resolve) => resolve({ data: 777 })).then(({ data }) => {
          expect(data).toBe(777);
          done();
        });
      });

      it("should thennable methods be chained", (done) => {
        return new BastardPromise((resolve) => resolve({ data: 777 }))
          .then(({ data }) => {
            expect(data).toBe(777);
            return 1000;
          })
          .then((res) => {
            expect(res).toBe(1000);
            done();
          });
      });

      it("should async resolved value be passed to then", (done) => {
        return new BastardPromise((resolve) => setTimeout(() => resolve({ data: 777 }), 5)).then(
          ({ data }) => {
            expect(data).toBe(777);
            done();
          }
        );
      });

      it("should allow more than one then", (done) => {
        const p1 = new BastardPromise((resolve) => setTimeout(() => resolve({ data: 777 }), 5));
        p1.then(({ data }) => {
          expect(data).toBe(777);
        });
        p1.then(({ data }) => {
          expect(data).toBe(777);
          done();
        });
      });

      it("should support chain of promises on which outside promises are returned", (done) => {
        const outsidePromise = new Promise((resolve) =>
          setTimeout(() => resolve({ file: "photo.jpg" }), 10)
        );
        return new BastardPromise((resolve) => {
          setTimeout(() => resolve({ data: "promise1" }), 10);
        })
          .then((response) => {
            expect(response.data).toBe("promise1");
            return outsidePromise;
          })
          .then((response) => {
            expect(response.file).toBe("photo.jpg");
            done();
          });
      });

      it("should then and call finally afterall", (done) => {
        new BastardPromise((resolve) => setTimeout(() => resolve({ data: 777 }), 5))
          .then(({ data }) => expect(data).toBe(777))
          .finally((res) => {
            expect(res).toBeUndefined();
            done();
          });
      });
    });

    describe("when rejected", () => {
      it("should catch", (done) => {
        new BastardPromise((resolve, reject) => reject("just an error")).catch((err) => {
          expect(err).toBe("just an error");
          done();
        });
      });

      it("should catch and then", (done) => {
        new BastardPromise((resolve, reject) => reject("just an error"))
          .catch((err) => {
            expect(err).toBe("just an error");
            return { data: "aData" };
          })
          .then(({ data }) => {
            expect(data).toBe("aData");
            done();
          });
      });

      it("should allow catch after a then with sync resolved promise", (done) => {
        const thenFn = jest.fn();
        const actualError = getErrorObject();
        return new BastardPromise((_, reject) => {
          return reject(actualError);
        })
          .then(thenFn)
          .catch(({ message }) => {
            expect(message).toBe(actualError.message);
            expect(thenFn).toHaveBeenCalledTimes(0);
            done();
          });
      });

      it("should allow catch after a then with async resolved promise", (done) => {
        const errorMessage = "Promise has been rejected";
        const thenFn = jest.fn();

        return new BastardPromise((resolve, reject) => {
          setTimeout(() => reject(new Error(errorMessage)), 10);
        })
          .then(thenFn)
          .catch((error) => {
            expect(error.message).toBe(errorMessage);
            expect(thenFn).toHaveBeenCalledTimes(0);
            done();
          });
      });

      it("should catch if returned inner promise is rejected", (done) => {
        const errorMessage = "an error ocorred";
        const anotherPromise = new BastardPromise((resolve, reject) =>
          reject(new Error(errorMessage))
        );
        return new BastardPromise((resolve) => {
          resolve("promise1");
        })
          .then((response) => {
            expect(response).toBe("promise1");
            return anotherPromise;
          })
          .catch(({ message }) => {
            expect(message).toBe(errorMessage);
            done();
          });
      });

      it("should catch and call finally afterall", (done) => {
        new BastardPromise((resolve, reject) => reject("just an error"))
          .catch((err) => expect(err).toBe("just an error"))
          .finally((res) => {
            expect(res).toBeUndefined();
            done();
          });
      });

      it("should catch on then reject callback", (done) => {
        const thenResolveFn = jest.fn();
        const renewedData = { year: 1984 };
        new Promise((resolve, reject) => reject("just an error"))
          .then(thenResolveFn, (err) => {
            expect(err).toBe("just an error");
            return renewedData;
          })
          .then((res) => {
            expect(thenResolveFn).toHaveBeenCalledTimes(0), done();
            expect(res).toBe(renewedData);
            done();
          });
      });
    });
  });

  describe("static methods", () => {
    describe("promise all", () => {
      it("should wait untill all promise are resolved and pass array of results to then", (done) => {
        const p1 = new BastardPromise((resolve) => resolve({ data: "syncData" }));
        const p2 = new BastardPromise((resolve) => setTimeout(resolve({ data: "async" }), 100));
        return BastardPromise.all([p1, p2]).then((results) => {
          expect(results).toContainEqual({ data: "syncData" });
          expect(results).toContainEqual({ data: "async" });
          done();
        });
      });

      it("should reject if one promise fail", (done) => {
        const thenFn = jest.fn();
        const p1 = new BastardPromise((_, reject) => setTimeout(() => reject("error"), 10));
        const p2 = new BastardPromise((resolve) => resolve("async"), null, "p2");
        return BastardPromise.all([p1, p2])
          .then(thenFn)
          .catch((err) => {
            expect(err).toBe("error");
            expect(thenFn).toHaveBeenCalledTimes(0);
            done();
          });
      });
    }); //all

    describe("promise race", () => {
      it("should return first promise to resolve", (done) => {
        const p1 = new BastardPromise((resolve) => resolve({ data: "syncData" }));
        const p2 = new BastardPromise((resolve) => setTimeout(resolve({ data: "async" }), 10));
        return BastardPromise.race([p1, p2]).then((result) => {
          expect(result).toEqual({ data: "syncData" });
          done();
        });
      });

      it("should fulfill if the first promise is resolved despite other errors", (done) => {
        const resolvedObject = { data: "resolvedWithSuccess" };
        const promise1 = new BastardPromise((resolve) =>
          setTimeout(() => resolve(resolvedObject), 5)
        );
        const promise2 = new BastardPromise((resolve, reject) =>
          setTimeout(() => reject({ data: "async2" }), 20)
        );

        return BastardPromise.race([promise1, promise2]).then((result) => {
          expect(result).toEqual(resolvedObject);
          done();
        });
      });

      it("should reject if the first promise is rejected", (done) => {
        const actualError = getErrorObject();
        const promise1 = new Promise((resolve) => setTimeout(() => resolve("resolve"), 20));
        const promise2 = new Promise((_, reject) => setTimeout(() => reject(actualError), 5));

        return Promise.race([promise1, promise2]).catch((error) => {
          expect(error.message).toBe(actualError.message);
          done();
        });
      });
    }); // race
  }); // static methods
});
