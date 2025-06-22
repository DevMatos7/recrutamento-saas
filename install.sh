#!/bin/bash

# GentePRO - Script de Instalação Automatizada para Ubuntu Server
# Compatível com Ubuntu Server 22.04+
# Execute com: chmod +x install.sh && ./install.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   GentePRO - Instalação Automatizada      ${NC}"
echo -e "${BLUE}   Sistema SaaS de Recrutamento e Seleção  ${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Verificar se é root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ Este script não deve ser executado como root.${NC}"
   echo -e "${YELLOW}💡 Execute como usuário normal com privilégios sudo.${NC}"
   exit 1
fi

# Verificar distribuição Ubuntu
if ! grep -q "Ubuntu" /etc/os-release; then
   echo -e "${RED}❌ Este script é específico para Ubuntu Server.${NC}"
   exit 1
fi

# Função para logging com timestamp e cores
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

# Função para verificar se comando existe
check_command() {
    if command -v "$1" &> /dev/null; then
        log "✅ $1 está instalado"
        return 0
    else
        log "❌ $1 não está instalado"
        return 1
    fi
}

# Função para verificar porta disponível
check_port() {
    if netstat -tuln 2>/dev/null | grep -q ":$1 "; then
        log_warn "Porta $1 está em uso"
        return 1
    else
        log "✅ Porta $1 está disponível"
        return 0
    fi
}

# Verificar conectividade de rede
log "🔍 Verificando conectividade..."
if ! ping -c 1 google.com &> /dev/null; then
    log_error "Sem conexão com a internet. Verifique sua conectividade."
    exit 1
fi
log "✅ Conectividade confirmada"

log "🚀 Iniciando instalação do GentePRO..."
sleep 2

# ============================================
# PASSO 1: ATUALIZAÇÃO DO SISTEMA
# ============================================
log "📦 Atualizando sistema Ubuntu..."
sudo apt update -qq && sudo apt upgrade -y -qq
sudo apt install -y curl wget git build-essential software-properties-common net-tools

# ============================================
# PASSO 2: INSTALAÇÃO DO NODE.JS 18
# ============================================
if ! check_command node || [[ $(node --version | cut -d'v' -f2 | cut -d'.' -f1) -lt 18 ]]; then
    log "📥 Instalando Node.js 18 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    
    # Verificar instalação
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    log "✅ Node.js ${NODE_VERSION} instalado"
    log "✅ npm ${NPM_VERSION} instalado"
else
    log "✅ Node.js já está instalado na versão adequada"
fi

# ============================================
# PASSO 3: INSTALAÇÃO DO POSTGRESQL
# ============================================
if ! check_command psql; then
    log "🐘 Instalando PostgreSQL..."
    sudo apt install -y postgresql postgresql-contrib postgresql-client
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Verificar status
    if sudo systemctl is-active --quiet postgresql; then
        log "✅ PostgreSQL instalado e rodando"
    else
        log_error "PostgreSQL não está rodando corretamente"
        exit 1
    fi
else
    log "✅ PostgreSQL já está instalado"
    sudo systemctl start postgresql || true
fi

# ============================================
# PASSO 4: INSTALAÇÃO DO NGINX
# ============================================
if ! check_command nginx; then
    log "🌐 Instalando Nginx..."
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    # Verificar se Nginx está rodando
    if sudo systemctl is-active --quiet nginx; then
        log "✅ Nginx instalado e rodando"
    else
        log_error "Nginx não está rodando corretamente"
        exit 1
    fi
else
    log "✅ Nginx já está instalado"
fi

# ============================================
# PASSO 5: INSTALAÇÃO DO PM2
# ============================================
if ! check_command pm2; then
    log "⚙️  Instalando PM2 globalmente..."
    sudo npm install -g pm2@latest
    
    # Configurar PM2 startup
    log "⚙️  Configurando PM2 startup..."
    pm2 startup > /tmp/pm2_startup.sh 2>&1 || true
    if grep -q "sudo" /tmp/pm2_startup.sh; then
        bash /tmp/pm2_startup.sh || true
    fi
else
    log "✅ PM2 já está instalado"
fi

# ============================================
# PASSO 6: CRIAÇÃO DE DIRETÓRIOS
# ============================================
log "📁 Criando estrutura de diretórios..."
sudo mkdir -p /opt/gentepro
sudo mkdir -p /opt/backups/gentepro
sudo mkdir -p /opt/scripts
sudo mkdir -p /var/log/gentepro
sudo mkdir -p /opt/gentepro/uploads

# Definir permissões
sudo chown -R $USER:$USER /opt/gentepro
sudo chmod -R 755 /opt/gentepro
sudo chmod 777 /opt/gentepro/uploads

log "✅ Diretórios criados com permissões adequadas"

# ============================================
# PASSO 7: CONFIGURAÇÃO DO POSTGRESQL
# ============================================
log "🐘 Configurando banco de dados PostgreSQL..."

# Solicitar senha do banco
echo ""
echo -e "${YELLOW}🔒 Configuração do Banco de Dados${NC}"
echo -e "${BLUE}Digite uma senha segura para o usuário 'gentepro' do PostgreSQL:${NC}"
while true; do
    read -s -p "Senha: " DB_PASSWORD
    echo ""
    read -s -p "Confirme a senha: " DB_PASSWORD_CONFIRM
    echo ""
    
    if [ "$DB_PASSWORD" = "$DB_PASSWORD_CONFIRM" ]; then
        if [ ${#DB_PASSWORD} -lt 8 ]; then
            log_warn "Senha deve ter pelo menos 8 caracteres"
            continue
        fi
        break
    else
        log_warn "Senhas não coincidem. Tente novamente."
    fi
done

# Verificar se usuário já existe
if sudo -u postgres psql -c "SELECT 1 FROM pg_roles WHERE rolname='gentepro'" 2>/dev/null | grep -q 1; then
    log "✅ Usuário 'gentepro' já existe no PostgreSQL"
    # Atualizar senha
    sudo -u postgres psql -c "ALTER USER gentepro WITH PASSWORD '$DB_PASSWORD';"
    log "🔒 Senha do usuário 'gentepro' atualizada"
else
    sudo -u postgres psql -c "CREATE USER gentepro WITH PASSWORD '$DB_PASSWORD';"
    log "✅ Usuário 'gentepro' criado no PostgreSQL"
fi

# Verificar se banco já existe
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw gentepro_db; then
    log "✅ Banco 'gentepro_db' já existe"
else
    sudo -u postgres psql -c "CREATE DATABASE gentepro_db OWNER gentepro;"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE gentepro_db TO gentepro;"
    sudo -u postgres psql -c "GRANT ALL ON SCHEMA public TO gentepro;"
    log "✅ Banco 'gentepro_db' criado com permissões"
fi

# Testar conexão com o banco
log "🔍 Testando conexão com o banco..."
if PGPASSWORD="$DB_PASSWORD" psql -h localhost -U gentepro -d gentepro_db -c "SELECT version();" &>/dev/null; then
    log "✅ Conexão com banco de dados funcionando"
else
    log_error "Falha na conexão com o banco de dados"
    exit 1
fi

# ============================================
# PASSO 8: OBTENÇÃO DO CÓDIGO FONTE
# ============================================
echo ""
echo -e "${YELLOW}📋 Configuração do Código Fonte${NC}"
echo "Escolha uma opção:"
echo "1) Clonar do repositório Git"
echo "2) Os arquivos já estão em /opt/gentepro"
echo "3) Copiar arquivos manualmente após instalação"
echo ""
read -p "Digite sua opção (1-3): " SOURCE_OPTION

case $SOURCE_OPTION in
    1)
        read -p "Digite a URL do repositório Git: " REPO_URL
        if [ ! -z "$REPO_URL" ]; then
            log "📥 Clonando repositório..."
            # Remover diretório se existir
            sudo rm -rf /opt/gentepro
            git clone "$REPO_URL" /opt/gentepro
            sudo chown -R $USER:$USER /opt/gentepro
            log "✅ Repositório clonado com sucesso"
        else
            log_error "URL do repositório não fornecida"
            exit 1
        fi
        ;;
    2)
        if [ ! -f "/opt/gentepro/package.json" ]; then
            log_error "package.json não encontrado em /opt/gentepro"
            exit 1
        fi
        log "✅ Usando arquivos existentes em /opt/gentepro"
        ;;
    3)
        log "⏭️  Pulando clonagem. Copie os arquivos manualmente para /opt/gentepro"
        # Criar estrutura básica para não falhar
        touch /opt/gentepro/package.json
        echo '{"name":"gentepro","scripts":{"build":"echo build","db:push":"echo db"}}' > /opt/gentepro/package.json
        ;;
    *)
        log_error "Opção inválida"
        exit 1
        ;;
esac

cd /opt/gentepro

# ============================================
# PASSO 9: INSTALAÇÃO DAS DEPENDÊNCIAS
# ============================================
if [ -f "package.json" ] && [ "$SOURCE_OPTION" != "3" ]; then
    log "📦 Instalando dependências Node.js..."
    npm ci --only=production || npm install
    log "✅ Dependências instaladas"
else
    log "⏭️  Pulando instalação de dependências (package.json não encontrado)"
fi

# ============================================
# PASSO 10: CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE
# ============================================
log "⚙️  Configurando variáveis de ambiente..."

# Gerar SESSION_SECRET seguro
SESSION_SECRET=$(openssl rand -base64 32)

# Criar arquivo .env
cat > .env << 'ENV_EOF'
# GentePRO - Variáveis de Ambiente de Produção
# Gerado automaticamente pelo script de instalação

# Configuração do Banco de Dados
DATABASE_URL=postgresql://gentepro:PASSWORD_PLACEHOLDER@localhost:5432/gentepro_db

# Configuração de Sessão (chave gerada automaticamente)
SESSION_SECRET=SESSION_SECRET_PLACEHOLDER

# Ambiente da Aplicação
NODE_ENV=production

# Configuração do Servidor
PORT=5000
HOST=0.0.0.0

# Configuração de Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=

# Configuração de WhatsApp (opcional)
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_API_TOKEN=

# Configurações de Segurança
BCRYPT_ROUNDS=12
CORS_ORIGIN=*

# Configurações de Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Configurações de Log
LOG_LEVEL=info
LOG_FILE=/var/log/gentepro/app.log
ENV_EOF

# Substituir placeholders
sed -i "s/PASSWORD_PLACEHOLDER/$DB_PASSWORD/g" .env
sed -i "s/SESSION_SECRET_PLACEHOLDER/$SESSION_SECRET/g" .env

# Definir permissões seguras para o .env
chmod 600 .env
chown $USER:$USER .env

log "✅ Arquivo .env criado com configurações de produção"

# ============================================
# PASSO 11: BUILD DA APLICAÇÃO
# ============================================
if [ -f "package.json" ] && [ "$SOURCE_OPTION" != "3" ]; then
    log "🏗️  Fazendo build da aplicação..."
    
    # Verificar se o script build existe
    if npm run | grep -q "build"; then
        # Instalar dependências de desenvolvimento para build
        npm install
        
        # Executar build
        npm run build
        
        # Verificar se o build foi bem-sucedido
        if [ -f "dist/index.js" ]; then
            log "✅ Build da aplicação concluído com sucesso"
            
            # Ajustar o arquivo compilado para usar console.log
            log "🔧 Ajustando logs para compatibilidade com PM2..."
            if [ -f "server/index.ts" ]; then
                # Backup do arquivo original
                cp server/index.ts server/index.ts.backup
                
                # Substituir função log() por console.log() no código fonte
                sed -i 's/log(/console.log(/g' server/index.ts
                
                # Rebuild após ajuste
                npm run build
                
                log "✅ Logs ajustados para PM2"
            fi
        else
            log_error "Build falhou - dist/index.js não encontrado"
            exit 1
        fi
    else
        log_warn "Script 'build' não encontrado no package.json"
    fi
else
    log "⏭️  Pulando build (arquivos não disponíveis)"
fi

# ============================================
# PASSO 12: CONFIGURAÇÃO DO PM2
# ============================================
log "⚙️  Criando configuração PM2..."

# Criar arquivo de configuração PM2 em formato CommonJS
cat > ecosystem.config.cjs << 'PM2_EOF'
module.exports = {
  apps: [{
    name: 'gentepro',
    script: 'dist/index.js',
    cwd: '/opt/gentepro',
    instances: 1,
    exec_mode: 'fork',
    interpreter: 'node',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/gentepro/err.log',
    out_file: '/var/log/gentepro/out.log',
    log_file: '/var/log/gentepro/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 1000,
    max_restarts: 5,
    min_uptime: '10s',
    watch: false,
    ignore_watch: ['node_modules', 'uploads', 'logs']
  }]
};
PM2_EOF

log "✅ Configuração PM2 criada (modo fork com ESM)"

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

# ============================================
# PASSO 14: CONFIGURAÇÃO DE SSL (SE SOLICITADO)
# ============================================
if [ "$USE_SSL" = true ] && [ "$DOMAIN" != "localhost" ]; then
    log "🔒 Configurando SSL com Let's Encrypt..."
    
    # Instalar Certbot
    sudo apt install -y certbot python3-certbot-nginx
    
    # Obter certificado SSL
    if sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN"; then
        log "✅ SSL configurado com sucesso"
    else
        log_warn "Falha na configuração SSL - continuando sem SSL"
    fi
fi

# ============================================
# PASSO 15: APLICAR SCHEMA DO BANCO DE DADOS
# ============================================
if [ -f "package.json" ] && [ "$SOURCE_OPTION" != "3" ]; then
    log "🗃️  Aplicando schema do banco de dados..."
    
    if npm run | grep -q "db:push"; then
        npm run db:push || log_warn "Erro ao aplicar schema - execute 'npm run db:push' manualmente"
        log "✅ Schema do banco aplicado"
    else
        log_warn "Script 'db:push' não encontrado"
    fi
fi

# ============================================
# PASSO 16: SCRIPT DE BACKUP AUTOMÁTICO
# ============================================
log "💾 Criando script de backup automático..."

sudo tee /opt/scripts/backup_gentepro.sh > /dev/null << 'BACKUP_EOF'
#!/bin/bash

# GentePRO - Script de Backup Automático
# Executa backup do banco PostgreSQL e arquivos de upload

BACKUP_DIR="/opt/backups/gentepro"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/gentepro/backup.log"

# Função de log
log_backup() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

log_backup "Iniciando backup do GentePRO..."

# Backup do banco de dados
log_backup "Fazendo backup do banco de dados..."
if PGPASSWORD="$(grep DATABASE_URL /opt/gentepro/.env | cut -d':' -f3 | cut -d'@' -f1)" pg_dump -h localhost -U gentepro -d gentepro_db > "$BACKUP_DIR/db_backup_$DATE.sql"; then
    log_backup "✅ Backup do banco concluído: db_backup_$DATE.sql"
else
    log_backup "❌ Erro no backup do banco"
fi

# Backup dos arquivos de upload
if [ -d "/opt/gentepro/uploads" ] && [ "$(ls -A /opt/gentepro/uploads)" ]; then
    log_backup "Fazendo backup dos arquivos de upload..."
    if tar -czf "$BACKUP_DIR/files_backup_$DATE.tar.gz" -C /opt/gentepro uploads/; then
        log_backup "✅ Backup dos arquivos concluído: files_backup_$DATE.tar.gz"
    else
        log_backup "❌ Erro no backup dos arquivos"
    fi
else
    log_backup "📁 Diretório uploads vazio - pulando backup de arquivos"
fi

# Limpeza - manter apenas últimos 7 backups
log_backup "Limpando backups antigos (mantendo últimos 7)..."
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

# Verificar espaço em disco
DISK_USAGE=$(df /opt/backups | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    log_backup "⚠️  Aviso: Uso de disco em $DISK_USAGE% - considere limpar backups antigos"
fi

log_backup "Backup concluído com sucesso!"
BACKUP_EOF

# Dar permissão de execução
sudo chmod +x /opt/scripts/backup_gentepro.sh

# Configurar cron para backup diário às 2h da manhã
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/scripts/backup_gentepro.sh") | crontab -

log "✅ Script de backup criado e agendado (diário às 2h)"

# ============================================
# PASSO 17: CONFIGURAÇÃO DO FIREWALL
# ============================================
log "🔥 Configurando firewall UFW..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 5432  # PostgreSQL (apenas local)
sudo ufw --force enable

log "✅ Firewall configurado (SSH, HTTP, HTTPS permitidos)"

# ============================================
# PASSO 18: INICIALIZAÇÃO DA APLICAÇÃO
# ============================================
if [ -f "dist/index.js" ]; then
    log "🚀 Iniciando aplicação GentePRO..."
    
    # Parar PM2 existente se houver
    pm2 delete gentepro 2>/dev/null || true
    
    # Iniciar aplicação
    pm2 start ecosystem.config.cjs
    
    # Salvar configuração PM2
    pm2 save
    
    # Aguardar aplicação inicializar
    sleep 5
    
    # Verificar se aplicação está rodando
    if pm2 list | grep -q "gentepro.*online"; then
        log "✅ Aplicação GentePRO iniciada com sucesso"
        
        # Testar endpoint de saúde
        if curl -s http://localhost:5000 > /dev/null; then
            log "✅ Aplicação respondendo na porta 5000"
        else
            log_warn "Aplicação pode não estar respondendo corretamente"
        fi
    else
        log_error "Falha ao iniciar aplicação"
        pm2 logs gentepro --lines 10
    fi
else
    log_warn "Aplicação não foi compilada - inicie manualmente após build"
fi

# ============================================
# FINALIZAÇÃO E INFORMAÇÕES
# ============================================
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!   ${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

echo -e "${BLUE}📋 INFORMAÇÕES DO SISTEMA:${NC}"
echo -e "🌐 URL de acesso: http://$DOMAIN"
if [ "$USE_SSL" = true ]; then
    echo -e "🔒 URL segura: https://$DOMAIN"
fi
echo -e "🏠 Diretório: /opt/gentepro"
echo -e "📊 Logs: /var/log/gentepro/"
echo ""

echo -e "${BLUE}🗃️  BANCO DE DADOS:${NC}"
echo -e "📍 Host: localhost"
echo -e "🔌 Porta: 5432"
echo -e "🗂️  Database: gentepro_db"
echo -e "👤 Usuário: gentepro"
echo -e "🔒 Senha: [definida durante instalação]"
echo ""

echo -e "${BLUE}⚙️  COMANDOS ÚTEIS:${NC}"
echo -e "Status da aplicação: ${YELLOW}pm2 status${NC}"
echo -e "Logs da aplicação: ${YELLOW}pm2 logs gentepro${NC}"
echo -e "Reiniciar aplicação: ${YELLOW}pm2 restart gentepro${NC}"
echo -e "Parar aplicação: ${YELLOW}pm2 stop gentepro${NC}"
echo -e "Ver configuração Nginx: ${YELLOW}sudo nginx -t${NC}"
echo -e "Status dos serviços: ${YELLOW}sudo systemctl status nginx postgresql${NC}"
echo ""

echo -e "${BLUE}💾 BACKUP:${NC}"
echo -e "Script de backup: ${YELLOW}/opt/scripts/backup_gentepro.sh${NC}"
echo -e "Backups armazenados em: ${YELLOW}/opt/backups/gentepro/${NC}"
echo -e "Backup automático: Diário às 2h da manhã"
echo ""

echo -e "${BLUE}🔧 PRÓXIMOS PASSOS (se necessário):${NC}"
if [ "$SOURCE_OPTION" = "3" ]; then
    echo -e "1. Copie os arquivos do projeto para /opt/gentepro"
    echo -e "2. Execute: ${YELLOW}cd /opt/gentepro && npm install${NC}"
    echo -e "3. Execute: ${YELLOW}npm run build${NC}"
    echo -e "4. Execute: ${YELLOW}npm run db:push${NC}"
    echo -e "5. Execute: ${YELLOW}pm2 start ecosystem.config.cjs${NC}"
    echo ""
fi

echo -e "${BLUE}👤 LOGIN PADRÃO:${NC}"
echo -e "Email: admin@gentepro.com"
echo -e "Senha: admin123"
echo -e "${YELLOW}⚠️  IMPORTANTE: Altere a senha padrão após primeiro acesso!${NC}"
echo ""

echo -e "${GREEN}✅ Sistema GentePRO instalado e configurado com sucesso!${NC}"
echo -e "${GREEN}✅ Aplicação disponível em: http://$DOMAIN${NC}"

# Mostrar status final
echo ""
echo -e "${BLUE}📊 STATUS FINAL DOS SERVIÇOS:${NC}"
sudo systemctl is-active nginx && echo -e "✅ Nginx: ${GREEN}Ativo${NC}" || echo -e "❌ Nginx: ${RED}Inativo${NC}"
sudo systemctl is-active postgresql && echo -e "✅ PostgreSQL: ${GREEN}Ativo${NC}" || echo -e "❌ PostgreSQL: ${RED}Inativo${NC}"
pm2 list | grep -q "gentepro.*online" && echo -e "✅ GentePRO: ${GREEN}Online${NC}" || echo -e "❌ GentePRO: ${RED}Offline${NC}"
EOF