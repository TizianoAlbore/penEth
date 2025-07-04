const redis = require('redis');

const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

client.on('error', (err) => console.error('❌ Redis Error:', err));
client.on('connect', () => console.log('✅ Redis connected'));

async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
  }
}

module.exports = {
  client,
  connectRedis,
};