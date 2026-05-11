FROM node:20-alpine

# Instala dependências de sistema:
# - python3 / make / g++  → compilar better-sqlite3 (módulo nativo)
# - netcat-openbsd        → esperar o banco estar pronto no entrypoint
RUN apk add --no-cache python3 make g++ netcat-openbsd

WORKDIR /app

# Copia manifests e instala dependências primeiro (aproveita cache de camadas)
COPY package*.json ./
RUN npm ci --omit=dev

# Copia o restante do projeto
COPY . .

# Remove arquivos que não devem estar na imagem
RUN rm -f biblioteca.db biblioteca.db-shm biblioteca.db-wal

# Cria o entrypoint diretamente (sem risco de CRLF do Windows)
RUN printf '#!/bin/sh\nset -e\nif [ -n "$DATABASE_URL" ]; then\n  DB_HOST=$(echo "$DATABASE_URL" | sed -E "s|.*@([^:/]+).*|\\1|")\n  DB_PORT=$(echo "$DATABASE_URL" | sed -E "s|.*:([0-9]+)/.*|\\1|")\n  DB_PORT=${DB_PORT:-3306}\n  echo "Aguardando banco em $DB_HOST:$DB_PORT..."\n  RETRIES=30\n  until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do\n    RETRIES=$((RETRIES-1))\n    [ "$RETRIES" -le 0 ] && echo "Banco indisponivel." && exit 1\n    echo "  tentativa $RETRIES..."\n    sleep 2\n  done\n  echo "Banco pronto!"\nfi\nexec "$@"\n' > /usr/local/bin/docker-entrypoint.sh \
  && chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
