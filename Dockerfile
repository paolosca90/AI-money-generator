FROM node:20-alpine

WORKDIR /app/backend

# Copy the server script
COPY server.js ./server.js

EXPOSE 3000

CMD ["node", "server.js"]