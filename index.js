// index.js
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

// Endpoint per esporre il valore della proprietà "admin" (atteso undefined)
app.get('/check', (req, res) => {
  res.json({ admin: {}.admin });
});

// Endpoint vulnerabile alla prototype pollution
app.post('/pollute', (req, res) => {
  // Se il payload contiene __proto__, modifichiamo Object.prototype
  if (req.body.__proto__) {
    Object.assign(Object.prototype, req.body.__proto__);
  }
  res.json({ message: "Valori aggiornati" });
});

// Avvio del server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});
