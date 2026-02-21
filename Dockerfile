FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache fontconfig && \
    fc-cache -f -v || true

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p uploads output

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server.js"]
