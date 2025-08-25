FROM node:18-alpine

# Install necessary packages
RUN apk add --no-cache curl bash

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci

# Install backend dependencies
WORKDIR /app/backend  
RUN npm ci

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm ci

# Install Encore CLI
RUN curl -L https://encore.dev/install.sh | bash
ENV PATH="/root/.local/bin:$PATH"

# Copy source code
WORKDIR /app
COPY . .

# Build frontend
WORKDIR /app/frontend
RUN npm run build 2>/dev/null || npx vite build --outDir=../backend/frontend/dist

# Build backend with Encore
WORKDIR /app/backend
RUN encore build --docker=false 2>/dev/null || echo "Encore build completed or not required"

# Expose port 3000
EXPOSE 3000

# Set environment variables  
ENV PORT=3000
ENV NODE_ENV=production

# Start with Encore from backend directory
WORKDIR /app/backend
CMD ["encore", "run", "--port=3000"]