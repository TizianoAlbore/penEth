# ---------- build stage ----------
FROM node:16-slim AS build             
WORKDIR /app

# velocizza install se hai il lockfile
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY . .
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
RUN npm run build                         

# ---------- runtime stage ----------
FROM nginx:1.25-alpine
COPY --from=build /app/build /usr/share/nginx/html

# nuova configurazione SPA + root dichiarata
# RUN printf '%s\n' \
#   'server {' \
#   '    listen 80;' \
#   '    listen [::]:80;' \
#   '    server_name _;' \
#   '    root /usr/share/nginx/html;' \
#   '' \
#   '    # React SPA fallback' \
#   '    location / {' \
#   '        try_files $uri /index.html;' \
#   '    }' \
#   '}' > 
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
