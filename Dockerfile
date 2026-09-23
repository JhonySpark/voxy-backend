FROM node:22-alpine

# Necessário para o Prisma no Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala as dependências
RUN npm ci

# Copia o restante do código
COPY . .

# Gera o cliente do Prisma
RUN npx prisma generate

# Faz o build da aplicação NestJS
RUN npm run build

# Expõe a porta que a API vai rodar internamente no container
EXPOSE 3000

# O entrypoint roda as migrations no banco Neon e inicia o app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
