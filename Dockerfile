FROM node:20-alpine

WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install root dependencies
RUN npm ci --production

# Install backend dependencies
WORKDIR /app/backend  
RUN npm ci --production

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm ci

# Copy all source code
WORKDIR /app
COPY . .

# Build the frontend
WORKDIR /app/frontend
RUN npx vite build --outDir=../backend/frontend/dist

# Go back to app root
WORKDIR /app

# Install express for serving (if not already installed)
RUN npm install express --save

# Expose port 3000 for Railway
EXPOSE 3000

# Set environment variables
ENV PORT=3000
ENV NODE_ENV=production

# Start the application
# Note: This serves the frontend. For full Encore.dev functionality, use `encore build docker`
CMD ["node", "-e", "\
const express = require('express'); \
const path = require('path'); \
const app = express(); \
const PORT = process.env.PORT || 3000; \
\
console.log('🚀 Starting AI Money Generator...'); \
console.log('📝 Note: This is a static frontend server.'); \
console.log('⚠️  For full backend functionality, deploy with Encore.dev:'); \
console.log('   encore build docker --output=container'); \
console.log('📚 Documentation: https://encore.dev/docs/self-host/docker-build'); \
console.log(''); \
\
app.use(express.static(path.join(__dirname, 'backend/frontend/dist'))); \
\
app.get('*', (req, res) => { \
  res.sendFile(path.join(__dirname, 'backend/frontend/dist/index.html')); \
}); \
\
app.listen(PORT, '0.0.0.0', () => { \
  console.log(`✅ Server running on port ${PORT}`); \
  console.log('🌐 Frontend available at: http://localhost:' + PORT); \
});"]