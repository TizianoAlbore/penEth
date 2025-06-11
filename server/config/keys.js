// module.exports = {
//   JWT_SECRET: "SecretKey",
// };
const fs   = require('fs');
const path = require('path');
const { generateKeyPairSync } = require('crypto');
const pem2jwk = require('pem2jwk');

/* ------------------------------------------------------------------
 *  Se le chiavi RSA non esistono le generiamo on-the-fly.
 *  In produzione converrebbe mantenerle in un secrets manager.
 * -----------------------------------------------------------------*/
const CERT_DIR = path.join(__dirname, '../certs');
const PRIV_PEM = path.join(CERT_DIR, 'private.pem');
const PUB_PEM  = path.join(CERT_DIR, 'public.pem');

if (!fs.existsSync(PRIV_PEM) || !fs.existsSync(PUB_PEM)) {
  fs.mkdirSync(CERT_DIR, { recursive: true });

  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding:  { type: 'pkcs1', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
  });

  fs.writeFileSync(PRIV_PEM, privateKey);
  fs.writeFileSync(PUB_PEM,  publicKey);
}

/* dominio “legittimo” del nostro issuer.
 * IMPORTANTE: nella PoC l’attaccante aggiungerà il proprio dominio
 * in un array per il claim `iss` → bypass.                    */
const ISSUER = 'https://valid-iss';

module.exports = {
  PRIVATE_KEY: fs.readFileSync(PRIV_PEM, 'utf8'),
  PUBLIC_KEY : fs.readFileSync(PUB_PEM,  'utf8'),
  JWK        : pem2jwk(fs.readFileSync(PUB_PEM, 'utf8')),
  ISSUER,
};

