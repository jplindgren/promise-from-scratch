const fs = require("fs");
const { promisify } = require("util");

fs.readFile("./dummy.txt", "utf8", (err, data) => {
  if (err) console.err(err);

  console.log("callback -> ", data);
});

const manualPromisified = new Promise((resolve, reject) => {
  fs.readFile("./dummy.txt", "utf8", (err, data) => {
    if (err) reject(err);
    resolve(data);
  });
});

manualPromisified.then((data) => console.log("manual promisified -> ", data));

const utilPromisify = promisify(fs.readFile);
utilPromisify("./dummy.txt", "utf8").then((data) => console.log("util promisified -> ", data));
