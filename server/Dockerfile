# server/Dockerfile
FROM node:20-slim

WORKDIR /usr/src/app
ENV TZ=Europe/Rome \
    NODE_ENV=production \
    PORT=8000

#  Solo i manifest - install dipendenze
COPY package.json ./
RUN npm install 

COPY /config ./config
COPY /controller ./controller
COPY /middleware ./middleware
COPY /models ./models
COPY /routes ./routes
COPY ./app.js ./
COPY ./.env ./.env 


EXPOSE 8000
CMD ["npm", "run", "start:dev"]
