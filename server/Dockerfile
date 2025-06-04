# ---------- base layer ----------
FROM node:20-slim AS base
WORKDIR /usr/src/app
ENV TZ=Europe/Rome
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# ---------- production layer ----------
FROM node:20-slim AS production
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=base /usr/src/app/node_modules ./node_modules
COPY . .                                   
EXPOSE 8000
CMD ["node", "app.js"]
