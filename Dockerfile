FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies with npm config to handle SSL issues
RUN npm config set strict-ssl false
RUN npm ci
RUN npm install --prefix frontend

# Copy source code
COPY . .

# Install express for the production server
RUN npm install express

# Install bun for building frontend
RUN npm install -g bun

# Build frontend
RUN npm run build --prefix backend

# Copy the server script
COPY server.js backend/server.js

WORKDIR /app/backend

EXPOSE 3000

CMD ["node", "server.js"]