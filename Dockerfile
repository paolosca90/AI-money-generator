FROM node:18-alpine

WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install root dependencies
RUN npm ci

# Install backend dependencies
WORKDIR /app/backend  
RUN npm ci

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm ci

# Copy all source code
WORKDIR /app
COPY . .

# Build the frontend using the build script defined in backend/package.json
WORKDIR /app/backend
RUN npm run build

# Expose port 3000 for Railway
EXPOSE 3000

# Environment variables
ENV PORT=3000
ENV NODE_ENV=production

# Create a minimal server.js for Railway deployment
# Since this is an Encore.dev app, we create a fallback server
RUN echo 'const express = require("express"); \
const path = require("path"); \
const app = express(); \
const PORT = process.env.PORT || 3000; \
\
console.log("🚀 AI Money Generator - Railway Deployment"); \
console.log("📍 Port:", PORT); \
console.log(""); \
console.log("⚠️  IMPORTANT: This is a frontend-only deployment."); \
console.log("   For full backend functionality, use Encore.dev:"); \
console.log("   encore build docker --output=container"); \
console.log(""); \
\
app.use(express.static(path.join(__dirname, "frontend/dist"))); \
\
app.get("*", (req, res) => { \
  res.sendFile(path.join(__dirname, "frontend/dist/index.html")); \
}); \
\
app.listen(PORT, "0.0.0.0", () => { \
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`); \
});' > dist/server.js && mkdir -p dist

# Install express for the server
RUN npm install express

# Start the server from dist directory as requested
CMD ["node", "dist/server.js"]