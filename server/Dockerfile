# ---------- base layer ----------
FROM node:20-slim AS base
WORKDIR /usr/src/app
ENV TZ=Europe/Rome

COPY package*.json ./

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    curl \
    libcurl4\
    libcurl4-openssl-dev \
    && rm -rf /var/lib/apt/lists/*

RUN npm install --omit=dev --legacy-peer-deps

# ai fini della SSRF
RUN apt-get update && apt-get install -y curl

COPY . .

# ---------- production layer ----------
FROM node:20-slim AS production
WORKDIR /usr/src/app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y \
    libcurl4 \
    && rm -rf /var/lib/apt/lists/*

# ai fini della SSRF
RUN apt-get update && apt-get install -y curl

COPY --from=base /usr/src/app/node_modules ./node_modules
COPY --from=base /usr/src/app .

EXPOSE 8000

CMD ["node", "app.js"]