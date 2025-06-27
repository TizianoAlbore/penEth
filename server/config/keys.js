const fs   = require("fs");
const path = require("path");

module.exports = {
  RSA_PRIVATE_KEY: fs.readFileSync(
    path.join(__dirname, "crypto/priv.pem"),
    "utf8"
  ),

  RSA_PUBLIC_KEY: fs.readFileSync(
    path.join(__dirname, "crypto/pub.pem"),
    "utf8"
  ),

  JWT_LEGACY_SECRET: fs.readFileSync(
    path.join(__dirname, "crypto/secret"),
    "utf8"
  ),

  ISSUER_DOMAIN   : process.env.ISSUER_DOMAIN,
  ISSUER_WHITELIST: process.env.ISSUER_WHITELIST.split(","),
};

