FROM node:18-alpine

WORKDIR /app

RUN apk update && apk add --no-cache python3 g++ openjdk17

COPY . .

RUN npm install

EXPOSE 3001

CMD ["node", "index.js"]
