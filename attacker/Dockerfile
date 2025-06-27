# attacker/Dockerfile
FROM node:18-alpine

WORKDIR /app

# copiamo le sole dipendenze necessarie
COPY package*.json ./
RUN npm install --production

# copiamo il codice
COPY . .

EXPOSE 3001
CMD ["npm", "start"]
