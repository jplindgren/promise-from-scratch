const science = require("scientist/console");
const BastardPromise = require("./bastard-promise");

const resolveSyncSimpleValue = (value) => {
  return science("sync resolve then", (experiment) => {
    experiment.async(true);
    experiment.use(() =>
      new BastardPromise((resolve) => resolve({ data: value })).then(({ data }) => data)
    );
    experiment.try(() =>
      new Promise((resolve) => resolve({ data: value })).then(({ data }) => data)
    );
  });
};

const resolveAsyncSimpleValue = (value) => {
  return science("async resolve then", (experiment) => {
    experiment.async(true);
    experiment.use(() =>
      new BastardPromise((resolve) => setTimeout(() => resolve({ data: value }), 10)).then(
        ({ data }) => data
      )
    );
    experiment.try(() =>
      new Promise((resolve) => setTimeout(() => resolve({ data: value }), 10)).then(
        ({ data }) => data
      )
    );
  });
};

const rejectSimpleValue = (value) => {
  return science("reject catch", (experiment) => {
    experiment.async(true);
    experiment.use(() => new BastardPromise((_, reject) => reject({ data: value })));
    experiment.try(() => new Promise((_, reject) => reject({ data: value })));
  });
};

const catchShouldRenewPromise = (value) => {
  return science("catch should renew promise", (experiment) => {
    experiment.async(true);
    experiment.use(() =>
      new BastardPromise((_, reject) => reject({ data: value }))
        .catch((err) => value)
        .then((x) => x)
    );
    experiment.try(() =>
      new Promise((_, reject) => reject({ data: value })).catch((err) => value).then((x) => x)
    );
  });
};

resolveSyncSimpleValue(10).then(console.log);
resolveSyncSimpleValue("package.json").then(console.log);
resolveSyncSimpleValue(null).then(console.log);
resolveSyncSimpleValue([]).then(console.log);
resolveSyncSimpleValue({}).then(console.log);

resolveAsyncSimpleValue(10).then(console.log);
resolveAsyncSimpleValue("package.json").then(console.log);
resolveAsyncSimpleValue(null).then(console.log);
resolveAsyncSimpleValue([]).then(console.log);
resolveAsyncSimpleValue({}).then(console.log);

rejectSimpleValue(10).then(console.log);
rejectSimpleValue("package.json").then(console.log);
rejectSimpleValue(null).then(console.log);
rejectSimpleValue([]).then(console.log);
rejectSimpleValue({}).then(console.log);

catchShouldRenewPromise(10).then(console.log);
catchShouldRenewPromise("package.json").then(console.log);
catchShouldRenewPromise(null).then(console.log);
catchShouldRenewPromise([]).then(console.log);
catchShouldRenewPromise({}).then(console.log);
