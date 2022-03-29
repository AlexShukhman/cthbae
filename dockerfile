# Use Node 16 on minimal Linux distro (Alpine)
FROM node:16-alpine
WORKDIR /usr/src/app
# Includes package-lock
COPY package*.json ./
# Installs only prod modules
RUN npm i --only=production
# Copy only the distributable folder
COPY dist .
# Copy Prod ENV
ADD .env.prod .env

EXPOSE 3000

ENTRYPOINT [ "node", "index.js" ]
