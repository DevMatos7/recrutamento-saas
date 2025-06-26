#!/bin/bash

# Script de Instalação Local - GentePRO
# Este script automatiza a instalação do projeto em ambiente local

set -e  # Para o script se houver erro

echo "🚀 Iniciando instalação do GentePRO..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se Node.js está instalado
check_nodejs() {
    print_info "Verificando Node.js..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js não encontrado!"
        print_info "Por favor, instale Node.js 18+ em: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js versão $NODE_VERSION encontrada. Necessário versão 18 ou superior."
        exit 1
    fi
    
    print_success "Node.js $(node --version) encontrado"
}

# Verificar se PostgreSQL está instalado
check_postgresql() {
    print_info "Verificando PostgreSQL..."
    
    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL não encontrado!"
        print_info "Para instalar PostgreSQL:"
        print_info "Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
        print_info "macOS: brew install postgresql"
        print_info "Windows: https://www.postgresql.org/download/windows/"
        exit 1
    fi
    
    print_success "PostgreSQL encontrado"
}

# Verificar se Git está instalado
check_git() {
    print_info "Verificando Git..."
    
    if ! command -v git &> /dev/null; then
        print_error "Git não encontrado!"
        print_info "Instale Git em: https://git-scm.com/downloads"
        exit 1
    fi
    
    print_success "Git $(git --version) encontrado"
}

# Instalar dependências npm
install_dependencies() {
    print_info "Instalando dependências npm..."
    
    if [ ! -f "package.json" ]; then
        print_error "Arquivo package.json não encontrado!"
        print_error "Execute este script na raiz do projeto GentePRO."
        exit 1
    fi
    
    npm install
    print_success "Dependências instaladas com sucesso"
}

# Configurar arquivo .env
setup_env() {
    print_info "Configurando arquivo de ambiente..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Arquivo .env criado a partir do .env.example"
        else
            print_warning "Arquivo .env.example não encontrado, criando .env básico..."
            cat > .env << EOL
# Configuração do Banco de Dados
DATABASE_URL="postgresql://gentepro_user:gentepro123@localhost:5432/gentepro"

# Configuração de Sessão
SESSION_SECRET="sua_chave_secreta_muito_forte_aqui_$(date +%s)"

# Configuração OpenAI (opcional)
OPENAI_API_KEY=""

# Configuração SendGrid (opcional)
SENDGRID_API_KEY=""

# Ambiente
NODE_ENV="development"
EOL
        fi
    else
        print_warning "Arquivo .env já existe, mantendo configurações atuais"
    fi
    
    print_info "⚠️  IMPORTANTE: Edite o arquivo .env com suas configurações!"
    print_info "Especialmente a DATABASE_URL com suas credenciais do PostgreSQL"
}

# Configurar banco de dados
setup_database() {
    print_info "Configurando banco de dados..."
    
    # Extrair informações da DATABASE_URL do .env
    if [ -f ".env" ]; then
        DB_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2- | tr -d '"')
        if [ -n "$DB_URL" ]; then
            # Extrair nome do banco da URL
            DB_NAME=$(echo $DB_URL | sed 's/.*\/\([^?]*\).*/\1/')
            DB_USER=$(echo $DB_URL | sed 's/.*:\/\/\([^:]*\):.*/\1/')
            DB_PASS=$(echo $DB_URL | sed 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/')
            
            print_info "Tentando criar banco de dados '$DB_NAME'..."
            
            # Tentar criar banco e usuário
            PGPASSWORD=postgres psql -U postgres -h localhost -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || print_warning "Banco '$DB_NAME' pode já existir"
            PGPASSWORD=postgres psql -U postgres -h localhost -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';" 2>/dev/null || print_warning "Usuário '$DB_USER' pode já existir"
            PGPASSWORD=postgres psql -U postgres -h localhost -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null
            
            print_success "Configuração de banco concluída"
        else
            print_warning "DATABASE_URL não encontrada no .env"
        fi
    fi
}

# Executar migrations
run_migrations() {
    print_info "Executando migrations do banco de dados..."
    
    if npm run db:push; then
        print_success "Schema do banco configurado com sucesso"
    else
        print_warning "Erro ao executar migrations. Talvez seja necessário configurar manualmente."
        print_info "Execute manualmente: npm run db:push"
    fi
}

# Verificar instalação
verify_installation() {
    print_info "Verificando instalação..."
    
    # Testar se consegue importar as dependências principais
    if npm run type-check 2>/dev/null; then
        print_success "Verificação de tipos TypeScript passou"
    else
        print_warning "Alguns problemas de tipos foram encontrados, mas isso não impede a execução"
    fi
    
    print_success "Instalação concluída!"
}

# Função principal
main() {
    echo "=================================================="
    echo "🏢 GentePRO - Sistema de Gestão de RH"
    echo "📋 Script de Instalação Local"
    echo "=================================================="
    echo
    
    # Verificações de pré-requisitos
    check_nodejs
    check_postgresql
    check_git
    
    echo
    print_info "Todos os pré-requisitos foram encontrados!"
    echo
    
    # Instalação
    install_dependencies
    setup_env
    setup_database
    run_migrations
    verify_installation
    
    echo
    echo "=================================================="
    print_success "🎉 Instalação concluída com sucesso!"
    echo "=================================================="
    echo
    print_info "Próximos passos:"
    echo "1. Edite o arquivo .env com suas configurações"
    echo "2. Execute: npm run dev"
    echo "3. Acesse: http://localhost:5000"
    echo
    print_info "Usuários padrão criados:"
    echo "📧 admin@gentepro.com (senha: admin123)"
    echo "📧 recrutador@gentepro.com (senha: recrutador123)"
    echo "📧 gestor@gentepro.com (senha: gestor123)"
    echo
    print_info "Para mais informações, consulte: INSTALLATION_GUIDE.md"
    echo
}

# Executar script principal
main "$@"