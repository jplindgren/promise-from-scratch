const BastardPromise = require("./bastard-promise");

describe("Bastard Promises", () => {
  describe("Initialization", () => {
    it("should be created with pending state", () => {
      const promise = new BastardPromise(() => {});
      expect(promise.state).toBe("pending");
    });

    it("should be created with empty chained array", () => {
      const promise = new BastardPromise(() => {});
      expect(promise.onCompletedChain).toEqual([]);
      expect(promise.onFailedChain).toEqual([]);
    });

    it("should be created with undefned value", () => {
      const promise = new BastardPromise(() => {});
      expect(promise.internalValue).toBeUndefined();
    });

    it("should throw exception if argument is not a function", () => {
      expect(() => new BastardPromise({ greeting: "hi" })).toThrow("Argument should be a function");
    });
  });

  describe("chain instance methods", () => {
    describe("when onCompleted", () => {
      it("should resolved value be passed to then", (done) => {
        return new BastardPromise((resolve) => resolve({ data: 777 })).then(({ data }) => {
          expect(data).toBe(777);
          done();
        });
      });

      it("should resolved value be passed to then", (done) => {
        return new BastardPromise((resolve) => resolve({ data: 777 })).then(({ data }) => {
          expect(data).toBe(777);
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

      it("should then and call finally afterall", (done) => {
        new BastardPromise((resolve) => setTimeout(() => resolve({ data: 777 }), 5))
          .then(({ data }) => expect(data).toBe(777))
          .finally((res) => {
            expect(res).toBeUndefined();
            done();
          });
      });
    });

    describe("when fail", () => {
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
        const errorMessage = "Promise has been rejected";
        const thenFn = jest.fn();

        return new BastardPromise((resolve, reject) => {
          return reject(new Error(errorMessage));
        })
          .then(thenFn)
          .catch((error) => {
            expect(error.message).toBe(errorMessage);
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

      it("should catch and call finally afterall", (done) => {
        new BastardPromise((resolve, reject) => reject("just an error"))
          .catch((err) => expect(err).toBe("just an error"))
          .finally((res) => {
            expect(res).toBeUndefined();
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
        const p1 = new BastardPromise((resolve, reject) => reject("error"));
        const p2 = new BastardPromise((resolve) => setTimeout(resolve({ data: "async" }), 100));
        return BastardPromise.all([p1, p2])
          .then((results) => {
            console.log("not called");
          })
          .catch((err) => {
            console.log(err);
            expect(err).toBe("error");
            done();
          });
      });
    });
  });
});
