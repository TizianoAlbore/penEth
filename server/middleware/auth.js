// middleware/auth.js – versione “bug-fixed” ma ancora vulnerabile by design
const buildJwks        = require('get-jwks');
const { createVerifier } = require('fast-jwt');
const { ISSUER }       = require('../config/keys');

/* ------------------------------------------------------------------
 *  Costruzione robusta della JWKS URI
 * -----------------------------------------------------------------*/
function composeJwksUri(rawDomain) {
  const origin = /^https?:\/\//i.test(rawDomain)
    ? rawDomain          // già con schema
    : `http://${rawDomain}`;
  const base   = origin.replace(/\/+$/, '');          // niente slash finale
  // new URL assicura che il separatore “/” sia presente
  return new URL('/.well-known/jwks.json', `${base}/`).href;
}

/* ----------------------- Key-Fetcher ----------------------------- */
const keyFetcher = async (jwt) => {
  console.log('[keyFetcher] Received JWT:', jwt);

  const domain  = Array.isArray(jwt.payload.iss)
    ? jwt.payload.iss[0]  // If array, take the first entry (this is a potential vulnerability)
    : jwt.payload.iss;
  console.log('[keyFetcher] Determined domain:', domain);

  const jwksUri = composeJwksUri(domain);
  console.log('[keyFetcher] Composed JWKS URI:', jwksUri);

  const jwks = buildJwks({ jwksUri });
  console.log('[keyFetcher] JWKS client built:', jwks);

  const args = { kid: jwt.header.kid, alg: jwt.header.alg };
  console.log('[keyFetcher] Arguments:', args);

  if (typeof jwks.getPublicKey === 'function') {
    const key = await jwks.getPublicKey(args);
    console.log('[keyFetcher] Retrieved public key:', key);
    return key;
  }

  if (typeof jwks.getSecret === 'function') {
    const secret = await jwks.getSecret(args);
    console.log('[keyFetcher] Retrieved secret:', secret);
    return secret;
  }
  
  throw new Error('Unsupported get-jwks client version');
};

/* ---------------------- Verificatore JWT ------------------------- */
const jwtVerifier = createVerifier({
  key        : keyFetcher,
  algorithms : ['RS256'],
  allowedIss : ISSUER,
});

/* ----------------------- Middleware ------------------------------ */
exports.loginCheck = async (req, res, next) => {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '') ||
                  req.headers.token;
    if (!token) throw new Error('Token mancante');

    req.userDetails = await jwtVerifier(token);       // payload nel request
    return next();
  } catch (err) {
    console.error('[loginCheck]', err);
    return res.status(401).json({ error: 'You must be logged in' });
  }
};

/* L’ID nel body deve combaciare con quello del token               */
exports.isAuth = (req, _res, next) => {
  const { loggedInUserId } = req.body;
  if (!loggedInUserId || loggedInUserId !== req.userDetails._id) {
    return next({ status: 403, message: 'You are not authenticate' });
  }
  next();
};

/* Vulnerabilità voluta: ci fidiamo del claim role nel JWT          */
exports.isAdmin = (_req, res, next) => {
  if (res.req.userDetails.role !== 1) {               // 0 = user, 1 = admin
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};
