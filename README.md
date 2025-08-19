# PenEth: Intentionally Vulnerable E‑Commerce

This repository contains a small e‑commerce platform purposely designed for an
university ethical hacking course. The goal is to study common web
vulnerabilities by providing a realistic but insecure environment.

**Do not deploy this project on the public Internet. It is intentionally
insecure and should be used only for educational or testing purposes.**

## Architecture

The application is split into two main parts and is orchestrated with
`docker-compose`:

- **Backend** – A Node.js/Express server located in `server/`. It exposes REST
  APIs for authentication, product management and orders. MongoDB is used as a
  database and Redis is available for future features. The server publishes a
  JSON Web Key Set at `/.well-known/jwks.json`.
- **Frontend** – A React application under `client/`. It is built and served by
  an Nginx container that also proxies API calls to the backend.

```
 client ─► Nginx ─► /api/... ─► Express (server) ─► MongoDB / Redis
```

To start the entire stack simply run:

```bash
docker-compose up --build
```

The frontend will be available on port **3000** while the backend listens on
port **8000**.

## Implemented Vulnerability – JWT Algorithm Confusion

At the moment the main vulnerability intentionally included is a weakness in the
JWT authentication flow. The backend verifies tokens with both `RS256` and
`HS256` algorithms using the same RSA **public key**:

```javascript
const decode = jwt.verify(token, RSA_PUBLIC_KEY, {
  algorithms: ["RS256", "HS256"],
});
```

Since the public key is also exposed via the JWKS endpoint, an attacker can forge
an `HS256` token by using that key as the HMAC secret. The `exploits/jwtForge.py`
script demonstrates the attack: it downloads the public key, signs a token with
`HS256`, and accesses admin‑only endpoints【F:server/middleware/auth.js†L1-L20】【F:exploits/jwtForge.py†L1-L57】.

### Work in Progress

Other insecure configurations are being prepared (SSRF, Redis takeover and
privilege escalation) and will be documented in future versions.

## Directory Overview

- `client/` – React application and Nginx configuration
- `server/` – Express API, models and routes
- `exploits/` – Proof‑of‑concept scripts (currently JWT forging)
- `docker-compose.yml` – Development environment with MongoDB and Redis

Feel free to explore the code and experiment with the provided vulnerabilities.
