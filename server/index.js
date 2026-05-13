require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');

const routes = require('./routes');
const { attach } = require('./websocket');
const { getRedis, getSubscriber, initRedis } = require('./redisClient');

const app = express();
const port = process.env.PORT || 3000;


app.use(bodyParser.json());
app.use(cors());
app.use('/', routes);


const server = http.createServer(app);


async function start() {
  console.log("🔄 Starting server...");
  await initRedis()
  const redisClient = await getRedis();
  const redisSubscriber = await getSubscriber();

  console.log(" Redis ready");

  await attach(server, redisClient, redisSubscriber);

  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

start();