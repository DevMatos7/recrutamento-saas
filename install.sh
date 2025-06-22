#!/bin/bash

# GentePRO - Script de Instalação Automática para Ubuntu
# Execute com: chmod +x install.sh && sudo ./install.sh

set -e

echo "=================================="
echo "   GentePRO - Instalação Ubuntu   "
echo "=================================="
echo ""

# Verificar se é root ou sudo
if [[ $EUID -eq 0 ]]; then
   echo "Este script não deve ser executado como root. Use um usuário com sudo."
   exit 1
fi

# Função para logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Função para verificar comando
check_command() {
    if command -v "$1" &> /dev/null; then
        log "✓ $1 está instalado"
        return 0
    else
        log "✗ $1 não está instalado"
        return 1
    fi
}

log "Iniciando instalação do GentePRO..."

# Atualizar sistema
log "Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
log "Instalando dependências básicas..."
sudo apt install -y curl wget git build-essential software-properties-common

# Instalar Node.js 18
if ! check_command node || [[ $(node --version | cut -d'v' -f2 | cut -d'.' -f1) -lt 18 ]]; then
    log "Instalando Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
else
    log "Node.js já está instalado na versão adequada"
fi

# Instalar PostgreSQL
if ! check_command psql; then
    log "Instalando PostgreSQL..."
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
else
    log "PostgreSQL já está instalado"
fi

# Instalar Nginx
if ! check_command nginx; then
    log "Instalando Nginx..."
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
else
    log "Nginx já está instalado"
fi

# Instalar PM2
if ! check_command pm2; then
    log "Instalando PM2..."
    sudo npm install -g pm2
else
    log "PM2 já está instalado"
fi

# Criar diretórios necessários
log "Criando diretórios..."
sudo mkdir -p /opt/gentepro
sudo mkdir -p /opt/backups/gentepro
sudo mkdir -p /opt/scripts
sudo mkdir -p /var/log/gentepro

# Configurar PostgreSQL
log "Configurando PostgreSQL..."
read -p "Digite a senha para o usuário 'gentepro' do banco de dados: " -s DB_PASSWORD
echo ""

# Verificar se usuário já existe
if sudo -u postgres psql -c "SELECT 1 FROM pg_roles WHERE rolname='gentepro'" | grep -q 1; then
    log "Usuário 'gentepro' já existe no PostgreSQL"
else
    sudo -u postgres psql -c "CREATE USER gentepro WITH PASSWORD '$DB_PASSWORD';"
    log "Usuário 'gentepro' criado no PostgreSQL"
fi

# Verificar se banco já existe
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw gentepro_db; then
    log "Banco 'gentepro_db' já existe"
else
    sudo -u postgres psql -c "CREATE DATABASE gentepro_db OWNER gentepro;"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE gentepro_db TO gentepro;"
    log "Banco 'gentepro_db' criado"
fi

# Clonar repositório (se não existir)
if [ ! -d "/opt/gentepro/.git" ]; then
    read -p "Digite a URL do repositório Git: " REPO_URL
    if [ ! -z "$REPO_URL" ]; then
        log "Clonando repositório..."
        sudo git clone "$REPO_URL" /opt/gentepro
        sudo chown -R $USER:$USER /opt/gentepro
    else
        log "URL do repositório não fornecida. Criando diretório vazio..."
        sudo mkdir -p /opt/gentepro
        sudo chown -R $USER:$USER /opt/gentepro
        echo "Você precisará copiar os arquivos do projeto manualmente para /opt/gentepro"
    fi
else
    log "Repositório já existe em /opt/gentepro"
fi

cd /opt/gentepro

# Instalar dependências Node.js (se package.json existir)
if [ -f "package.json" ]; then
    log "Instalando dependências Node.js..."
    npm install
else
    log "package.json não encontrado. Pule esta etapa se ainda não copiou os arquivos."
fi

# Criar arquivo .env
log "Configurando variáveis de ambiente..."
if [ ! -f ".env" ]; then
    cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://gentepro:$DB_PASSWORD@localhost:5432/gentepro_db

# Session Configuration
SESSION_SECRET=$(openssl rand -base64 32)

# Application Environment
NODE_ENV=production

# Server Configuration
PORT=5000
HOST=0.0.0.0

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=

# Security Settings
BCRYPT_ROUNDS=12
CORS_ORIGIN=*

# File Upload Settings
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=/var/log/gentepro/app.log
EOF
    log "Arquivo .env criado"
else
    log "Arquivo .env já existe"
fi

# Criar configuração PM2
log "Criando configuração PM2..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'gentepro',
    script: 'dist/index.js',
    cwd: '/opt/gentepro',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/gentepro/err.log',
    out_file: '/var/log/gentepro/out.log',
    log_file: '/var/log/gentepro/combined.log',
    time: true,
    max_memory_restart: '1G'
  }]
};
EOF

# Criar configuração Nginx
log "Configurando Nginx..."
read -p "Digite seu domínio (ou pressione Enter para usar localhost): " DOMAIN
if [ -z "$DOMAIN" ]; then
    DOMAIN="localhost"
fi

sudo tee /etc/nginx/sites-available/gentepro > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Ativar site Nginx
sudo ln -sf /etc/nginx/sites-available/gentepro /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Criar script de backup
log "Criando script de backup..."
sudo tee /opt/scripts/backup_gentepro.sh > /dev/null << EOF
#!/bin/bash
BACKUP_DIR="/opt/backups/gentepro"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# Backup do banco
pg_dump -h localhost -U gentepro -d gentepro_db > \$BACKUP_DIR/db_backup_\$DATE.sql

# Backup dos arquivos
if [ -d "/opt/gentepro/uploads" ]; then
    tar -czf \$BACKUP_DIR/files_backup_\$DATE.tar.gz /opt/gentepro/uploads
fi

# Manter apenas últimos 7 backups
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

sudo chmod +x /opt/scripts/backup_gentepro.sh

# Configurar firewall
log "Configurando firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Aplicar schema do banco (se possível)
if [ -f "package.json" ] && grep -q "db:push" package.json; then
    log "Aplicando schema do banco de dados..."
    npm run db:push || log "Erro ao aplicar schema. Execute 'npm run db:push' manualmente."
fi

# Build da aplicação (se possível)
if [ -f "package.json" ] && grep -q "build" package.json; then
    log "Fazendo build da aplicação..."
    npm run build || log "Erro no build. Execute 'npm run build' manualmente."
fi

# Configurar permissões
sudo chown -R $USER:$USER /opt/gentepro
sudo chmod -R 755 /opt/gentepro
sudo mkdir -p /opt/gentepro/uploads
sudo chmod 777 /opt/gentepro/uploads

log "=================================="
log "   Instalação Concluída!          "
log "=================================="
echo ""
echo "Próximos passos:"
echo "1. Copie os arquivos do projeto para /opt/gentepro (se ainda não fez)"
echo "2. Execute: cd /opt/gentepro && npm install"
echo "3. Execute: npm run build"
echo "4. Execute: npm run db:push"
echo "5. Inicie a aplicação: pm2 start ecosystem.config.js"
echo "6. Salve configuração PM2: pm2 save && pm2 startup"
echo ""
echo "Acesse o sistema em: http://$DOMAIN"
echo "Logs: pm2 logs gentepro"
echo "Status: pm2 status"
echo ""
echo "Banco de dados:"
echo "- Host: localhost"
echo "- Porta: 5432"
echo "- Banco: gentepro_db"
echo "- Usuário: gentepro"
echo "- Senha: [a que você definiu]"
echo ""
echo "Para SSL (opcional): sudo certbot --nginx -d $DOMAIN"
EOF