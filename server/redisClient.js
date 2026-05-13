const { createClient } = require('redis');

let client;
let subscriber;

async function initRedis() {
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL || 'redis://redis:6379',
    });

    client.on('error', (err) => console.error('Redis Client Error', err));
    await client.connect();
  }

  if (!subscriber) {
    subscriber = createClient({
      url: process.env.REDIS_URL || 'redis://redis:6379',
    });

    subscriber.on('error', (err) => console.error('Redis Subscriber Error', err));
    await subscriber.connect();
  }

  console.log(' Redis initialized');
}

function getRedis() {
  if (!client) throw new Error("Redis not initialized");
  return client;
}

function getSubscriber() {
  if (!subscriber) throw new Error("Redis subscriber not initialized");
  return subscriber;
}

module.exports = {
  initRedis,
  getRedis,
  getSubscriber
};