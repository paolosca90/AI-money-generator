FROM node:18-alpine

WORKDIR /app

COPY backend/package*.json ./backend/
RUN npm ci --prefix backend

COPY backend/ ./backend/
RUN npm run build --prefix backend

EXPOSE 3000

CMD ["node", "backend/dist/server.js"]
