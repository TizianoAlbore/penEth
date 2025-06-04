FROM node:20-alpine AS build
# toolchain per pacchetti nativi

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

WORKDIR /app
COPY package.json ./
# ⤵️  ignora i peer-deps conflict
RUN npm install --silent --legacy-peer-deps

COPY /src ./src
COPY /public ./public

EXPOSE 3000

CMD ["npm", "run", "start"]

