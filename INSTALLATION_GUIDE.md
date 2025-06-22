# Guia de Instalação - GentePRO Ubuntu Server

Este guia descreve como instalar o sistema GentePRO em um servidor Ubuntu local com migração completa do banco de dados.

## Pré-requisitos

### Sistema Operacional
- Ubuntu 20.04 LTS ou superior
- Usuário com privilégios sudo
- Conexão com internet

### Softwares Necessários
1. **Node.js** (versão 18 ou superior)
2. **PostgreSQL** (versão 12 ou superior)
3. **Nginx** (opcional, para proxy reverso)
4. **PM2** (para gerenciamento de processos)
5. **Git** (para clonagem do repositório)

## Passo 1: Preparação do Servidor

### Atualizar Sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### Instalar Dependências Básicas
```bash
sudo apt install -y curl wget git build-essential
```

### Instalar Node.js 18
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Verificar Instalações
```bash
node --version  # Deve ser v18.x.x ou superior
npm --version   # Deve ser 9.x.x ou superior
```

## Passo 2: Instalação do PostgreSQL

### Instalar PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
```

### Configurar PostgreSQL
```bash
# Iniciar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Acessar como usuário postgres
sudo -u postgres psql

# Dentro do psql, criar usuário e banco
CREATE USER gentepro WITH PASSWORD 'sua_senha_segura';
CREATE DATABASE gentepro_db OWNER gentepro;
GRANT ALL PRIVILEGES ON DATABASE gentepro_db TO gentepro;

# Sair do psql
\q
```

### Configurar Acesso Remoto (se necessário)
```bash
# Editar postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf

# Adicionar/modificar linha:
listen_addresses = '*'

# Editar pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Adicionar linha para acesso local:
host    all             all             192.168.0.0/16          md5

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

## Passo 3: Clonagem e Configuração do Projeto

### Clonar Repositório
```bash
cd /opt
sudo git clone [URL_DO_SEU_REPOSITORIO] gentepro
sudo chown -R $USER:$USER gentepro
cd gentepro
```

### Instalar Dependências
```bash
npm install
```

### Configurar Variáveis de Ambiente
```bash
cp .env.example .env
nano .env
```

**Configure o arquivo .env:**
```bash
# Database Configuration
DATABASE_URL=postgresql://gentepro:sua_senha_segura@localhost:5432/gentepro_db

# Session Configuration
SESSION_SECRET=sua_chave_secreta_muito_segura_com_32_caracteres_ou_mais

# Application Environment
NODE_ENV=production

# Server Configuration
PORT=5000
HOST=0.0.0.0

# Email Configuration (configure com seu provedor)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app

# Security Settings
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://seu_dominio.com

# File Upload Settings
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

## Passo 4: Migração do Banco de Dados

### Opção A: Migração do Replit (Neon Database)

#### Exportar dados do Neon
```bash
# No ambiente Replit/Neon, conecte e exporte
pg_dump $DATABASE_URL > gentepro_backup.sql

# Baixe o arquivo para seu servidor local
```

#### Importar dados localmente
```bash
# Criar schema
npm run db:push

# Importar dados
psql -h localhost -U gentepro -d gentepro_db < gentepro_backup.sql
```

### Opção B: Migração Limpa

```bash
# Aplicar schema
npm run db:push

# O sistema criará dados de seed automaticamente
npm run dev  # Execute uma vez para criar dados iniciais
```

## Passo 5: Build da Aplicação

### Build de Produção
```bash
npm run build
```

### Instalar PM2 (Gerenciador de Processos)
```bash
sudo npm install -g pm2
```

### Criar arquivo de configuração PM2
```bash
nano ecosystem.config.js
```

**Conteúdo do ecosystem.config.js:**
```javascript
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
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### Iniciar aplicação com PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Passo 6: Configuração do Nginx (Opcional)

### Instalar Nginx
```bash
sudo apt install -y nginx
```

### Configurar Virtual Host
```bash
sudo nano /etc/nginx/sites-available/gentepro
```

**Conteúdo da configuração:**
```nginx
server {
    listen 80;
    server_name seu_dominio.com www.seu_dominio.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Ativar configuração
```bash
sudo ln -s /etc/nginx/sites-available/gentepro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Passo 7: Configuração SSL (Opcional)

### Instalar Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obter certificado SSL
```bash
sudo certbot --nginx -d seu_dominio.com -d www.seu_dominio.com
```

## Passo 8: Configuração de Firewall

```bash
# Permitir SSH, HTTP e HTTPS
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 5000  # Apenas se não usar Nginx
sudo ufw enable
```

## Passo 9: Configuração de Backup Automático

### Criar script de backup
```bash
sudo nano /opt/scripts/backup_gentepro.sh
```

**Conteúdo do script:**
```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/gentepro"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup do banco
pg_dump -h localhost -U gentepro -d gentepro_db > $BACKUP_DIR/db_backup_$DATE.sql

# Backup dos arquivos
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /opt/gentepro/uploads

# Manter apenas últimos 7 backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### Configurar cron para backup diário
```bash
sudo chmod +x /opt/scripts/backup_gentepro.sh
sudo crontab -e

# Adicionar linha para backup diário às 2h
0 2 * * * /opt/scripts/backup_gentepro.sh
```

## Passo 10: Monitoramento

### Verificar status da aplicação
```bash
pm2 status
pm2 logs gentepro
```

### Verificar status do banco
```bash
sudo systemctl status postgresql
```

### Verificar logs do sistema
```bash
tail -f /opt/gentepro/logs/combined.log
```

## Comandos Úteis

### Reiniciar aplicação
```bash
pm2 restart gentepro
```

### Atualizar aplicação
```bash
cd /opt/gentepro
git pull
npm install
npm run build
pm2 restart gentepro
```

### Verificar conexão com banco
```bash
psql -h localhost -U gentepro -d gentepro_db -c "SELECT COUNT(*) FROM usuarios;"
```

## Solução de Problemas

### Problema: Aplicação não inicia
```bash
# Verificar logs
pm2 logs gentepro

# Verificar variáveis de ambiente
cat /opt/gentepro/.env

# Testar conexão com banco
npm run db:push
```

### Problema: Banco não conecta
```bash
# Verificar status PostgreSQL
sudo systemctl status postgresql

# Verificar configuração
sudo -u postgres psql -c "\l"
```

### Problema: Porta em uso
```bash
# Verificar processos na porta
sudo netstat -tulpn | grep :5000

# Matar processo se necessário
sudo kill -9 [PID]
```

## Acesso ao Sistema

Após instalação completa:
- **URL**: http://seu_dominio.com ou http://IP_DO_SERVIDOR:5000
- **Login padrão**: admin@gentepro.com
- **Senha padrão**: admin123 (altere imediatamente)

## Segurança Recomendada

1. Alterar senha padrão do admin
2. Configurar firewall adequadamente
3. Manter sistema atualizado
4. Configurar backups automáticos
5. Monitorar logs regularmente
6. Usar HTTPS em produção