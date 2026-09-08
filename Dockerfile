FROM node:22-bookworm-slim

# Instala o Chromium e dependências para renderização perfeita de PDFs no Puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-dejavu-core \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Configuração de ambiente do Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PORT=3001

WORKDIR /app

# Copia manifests de pacotes
COPY package*.json ./

# Instala todas as dependências (incluindo Vite e TypeScript necessárias para o build)
RUN npm install

# Copia código fonte da aplicação
COPY . .

# Compila o frontend React (Vite) e o backend TypeScript (tsc)
RUN npm run build

# Define NODE_ENV para produção em runtime
ENV NODE_ENV=production

# Cria pasta de dados persistentes para SQLite e PDFs
RUN mkdir -p /app/data /app/data/contracts

EXPOSE 3001

CMD ["npm", "start"]
