# Dockerfile para GentePRO (Opcional)
# Use apenas se preferir executar com Docker

FROM node:20-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    postgresql-client \
    curl \
    bash

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Copiar código fonte
COPY . .

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S gentepro -u 1001

# Alterar propriedade dos arquivos
RUN chown -R gentepro:nodejs /app
USER gentepro

# Expor porta
EXPOSE 5000

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=5000

# Comando de inicialização
CMD ["npm", "start"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1