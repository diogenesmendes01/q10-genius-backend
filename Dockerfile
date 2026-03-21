FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=3140

EXPOSE 3140

USER node

CMD ["node", "server.js"]
