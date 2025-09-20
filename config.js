const fs = require("fs");
const path = require("path");

module.exports = {
  host: process.env.host,
  port: process.env.port,
  username: process.env.username,
  password: process.env.password,
  privateKey: fs.readFileSync(path.resolve(__dirname, process.env.privatekey)),
};
