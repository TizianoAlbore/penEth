// index.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const redis = require('redis');
const Docker = require('dockerode'); // Importa la libreria per interagire con Docker
const app = express();

app.use(bodyParser.json());

// ----------------------------------------------------
// 1. Prototype Pollution
// ----------------------------------------------------

// QUI DEVE AVVENIRE IL CAMBIO DI PERMESSI
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

/* QUI SOLO GLI ADMIN POSSONO FARE curl "http://localhost:3000/ssrf?url=http://example.com"
  -> Abuso via SSRF per invocare Redis:
    curl "http://localhost:3000/ssrf?url=http://localhost:3000/task" \
    -X POST -H "Content-Type: application/json" \
    -d '{"command":"PING", "args":[]}'
*/
app.get('/ssrf', async (req, res) => {
  const target = req.query.url;
  if (!target) {
    return res.status(400).json({ error: "Parametro 'url' mancante" });
  }
  try {
    // SE L'URL VIENE INSERITO CORRETTAMENTE, CI INDIRIZZA LI'
    // L'IDEA E' DI CHIAMARE /TASK CON BODY CONTENENTE I COMANDI DA FAR ESEGUIRE A REDIS
    const response = await axios.get(target);
    res.json({ data: response.data });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// ----------------------------------------------------
// 3. Attacco a Redis e Distribuzione di Task
// ----------------------------------------------------

// FUNZIONE CHE CHIAMA REDIS
// DOVREBBE ESSERE FATTA ESCLUSIVAMENTE DAL SERVER, MA VERRA' CHIAMATA
// IN MANIERA FRAUDOLENTA TRAMITE ENDPOINT /SSRF
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'redis',
  port: 6379
});

redisClient.on('error', (err) => {
  console.error('Errore di connessione a Redis:', err);
});

// QUESTO ENDPOINT RICHIEDE NEL CORPO DELLA POST DEI COMANDI DA FAR ESEGUIRE A REDIS
// NOTA CHE NON CI SONO CONTROLLI MA DOVREBBE ESSERE NON ACCESSIBILE A TUTTI
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

// ----------------------------------------------------
// 4. Privilege Escalation
// ----------------------------------------------------
// Inizializza la connessione con Docker tramite il socket montato
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

/*
  Quando questo endpoint viene invocato, l'applicazione crea un nuovo container in modalità privilegiata per ottenere un accesso più elevato al sistema host.
*/
app.get('/escalate', async (req, res) => {
  try {
    // esempio di creazione container vulnerabile
    const container = await docker.createContainer({
      Image: 'node:14',
      Cmd: ['sh', '-c', 'sleep 600'], // Il container resterà in esecuzione per 10 minuti
      HostConfig: {
        Privileged: true,          // Modalità privilegiata
        AutoRemove: true           // Rimuove automaticamente il container al termine
      }
    });
    await container.start();
    res.json({ message: "Container privilegiato avviato", containerId: container.id });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// Avvio del server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});
