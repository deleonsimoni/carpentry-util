FROM node:18-alpine

WORKDIR /usr/src/app

# Copiar apenas os arquivos do servidor
COPY server/package.json ./
RUN npm install --omit=dev

COPY server/ ./

EXPOSE 4040

CMD ["node", "index.js"]
