// index.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const redis = require('redis');
const app = express();

app.use(bodyParser.json());

// ----------------------------------------------------
// 1. Prototype Pollution
// ----------------------------------------------------
app.get('/check', (req, res) => {
  res.json({ admin: {}.admin });
});

app.post('/pollute', (req, res) => {
  if (req.body.__proto__) {
    Object.assign(Object.prototype, req.body.__proto__);
  }
  res.json({ message: "Valori aggiornati" });
});

// ----------------------------------------------------
// 2. SSRF Vulnerabile
// ----------------------------------------------------
app.get('/ssrf', async (req, res) => {
  const target = req.query.url;
  if (!target) {
    return res.status(400).json({ error: "Parametro 'url' mancante" });
  }
  try {
    // Effettua una richiesta HTTP al target specificato
    const response = await axios.get(target);
    res.json({ data: response.data });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// ----------------------------------------------------
// 3. Attacco a Redis e Distribuzione di Task
// ----------------------------------------------------
// Creazione del client Redis (collega al servizio 'redis' definito in docker-compose)
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'redis',
  port: 6379
});

redisClient.on('error', (err) => {
  console.error('Errore di connessione a Redis:', err);
});

// Endpoint vulnerabile per l'esecuzione di comandi remoti su Redis.
// L'attaccante può inviare comandi arbitrari che Redis eseguirà.
app.post('/task', (req, res) => {
  const { command, args } = req.body;
  if (!command || !Array.isArray(args)) {
    return res.status(400).json({ error: "Parametro 'command' o 'args' mancante o non valido" });
  }
  redisClient.send_command(command, args, (err, reply) => {
    if (err) {
      return res.status(500).json({ error: err.toString() });
    }
    res.json({ reply });
  });
});

// Avvio del server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});
