// routes/jwks.js
const express = require("express");
const router  = express.Router();
const { RSA_PUBLIC_KEY } = require("../config/keys");
const { pem2jwk } = require("pem-jwk");

// 1. Converte il PEM in JWK
const publicJwk = pem2jwk(RSA_PUBLIC_KEY);

// 2. Completa i campi consigliati da RFC 7517/7518
const jwkWithMeta = {
  ...publicJwk,            // kty, n, e
  kid: "peneth-key-1",     // key ID (arbitrario, ma univoco)
  alg: "RS256",            // algoritmo previsto
  use: "sig"               // uso: signature
};

// 3. Espone la JWKS
router.get("/.well-known/jwks.json", (req, res) => {
  res.json({ keys: [jwkWithMeta] });
});

module.exports = router;
