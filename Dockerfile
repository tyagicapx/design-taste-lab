FROM node:20-slim

# Install build tools for native modules (better-sqlite3) + Chromium for Puppeteer
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json ./

# Install ALL deps (including devDeps for build) and rebuild native modules
RUN npm ci && npm rebuild better-sqlite3

# Copy rest of the app
COPY . .

# Build Next.js
RUN npm run build

# Create data directory for SQLite
RUN mkdir -p /data

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "start"]
