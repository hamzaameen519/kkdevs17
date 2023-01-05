FROM node:14-slim

WORKDIR /usr/app

COPY package*.json .
RUN npm install
COPY . .

# RUN npm ci --only=production


EXPOSE 5000

CMD [ "npm","run","dev"]
