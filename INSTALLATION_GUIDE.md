# Guia de Instalação Local - GentePRO

## Pré-requisitos

### 1. Node.js e npm
- **Node.js versão 18 ou superior** (recomendado: 20.x LTS)
- **npm versão 9 ou superior**

**Instalação:**
```bash
# Verificar versões instaladas
node --version
npm --version

# Para instalar Node.js, visite: https://nodejs.org/
# Ou use um gerenciador de versões como nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### 2. PostgreSQL
- **PostgreSQL versão 13 ou superior**

**Instalação por Sistema Operacional:**

**Windows:**
1. Baixe o instalador em: https://www.postgresql.org/download/windows/
2. Execute o instalador e siga as instruções
3. Anote a senha do usuário `postgres`

**macOS:**
```bash
# Usando Homebrew
brew install postgresql@15
brew services start postgresql@15

# Ou baixe o instalador em: https://www.postgresql.org/download/macosx/
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Linux (CentOS/RHEL):**
```bash
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3. Git
```bash
# Verificar se o Git está instalado
git --version

# Para instalar: https://git-scm.com/downloads
```

## Instalação do Projeto

### 1. Clonar o Repositório
```bash
git clone [URL_DO_REPOSITORIO]
cd gentepro
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configuração do Banco de Dados

#### A. Criar o Banco de Dados
```bash
# Conectar ao PostgreSQL (pode ser necessário sudo -u postgres)
psql -U postgres

# Dentro do psql, criar o banco de dados
CREATE DATABASE gentepro;

# Criar usuário específico (opcional mas recomendado)
CREATE USER gentepro_user WITH ENCRYPTED PASSWORD 'sua_senha_aqui';
GRANT ALL PRIVILEGES ON DATABASE gentepro TO gentepro_user;

# Sair do psql
\q
```

#### B. Configurar Variáveis de Ambiente
```bash
# Copiar o arquivo de exemplo
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Configuração do Banco de Dados
DATABASE_URL="postgresql://gentepro_user:sua_senha_aqui@localhost:5432/gentepro"

# Configuração de Sessão
SESSION_SECRET="sua_chave_secreta_muito_forte_aqui_123456789"

# Configuração OpenAI (para funcionalidades de IA)
OPENAI_API_KEY="sua_chave_openai_aqui"

# Configuração SendGrid (para emails - opcional)
SENDGRID_API_KEY="sua_chave_sendgrid_aqui"

# Ambiente
NODE_ENV="development"
```

### 4. Configurar o Schema do Banco
```bash
# Fazer push do schema para o banco de dados
npm run db:push
```

### 5. Popular o Banco com Dados Iniciais
```bash
# Iniciar o servidor (que automaticamente popula dados iniciais)
npm run dev
```

## Executar o Projeto

### Desenvolvimento
```bash
npm run dev
```

O servidor estará disponível em: `http://localhost:5000`

### Produção
```bash
# Fazer build do projeto
npm run build

# Iniciar em modo produção
npm start
```

## Estrutura de Portas

- **Frontend + Backend:** `http://localhost:5000`
- **Banco PostgreSQL:** `localhost:5432` (padrão)

## Dados de Acesso Inicial

Após a primeira execução, os seguintes usuários são criados automaticamente:

### Administrador Principal
- **Email:** admin@gentepro.com
- **Senha:** admin123
- **Perfil:** Administrador

### Usuário Recrutador
- **Email:** recrutador@gentepro.com
- **Senha:** recrutador123
- **Perfil:** Recrutador

### Usuário Gestor
- **Email:** gestor@gentepro.com
- **Senha:** gestor123
- **Perfil:** Gestor

## Funcionalidades Principais

### 1. Sistema de Autenticação
- Login baseado em sessão
- Controle de acesso por perfil (Admin, Recrutador, Gestor, Candidato)

### 2. Gestão Multiempresa
- Empresas, departamentos e usuários
- Isolamento de dados por empresa

### 3. Gestão de Vagas
- Criação e gestão de vagas
- Sistema de pipeline de seleção (6 etapas)

### 4. Gestão de Candidatos
- Portal público para candidatos
- Sistema completo de currículo
- Aplicação para vagas

### 5. Avaliações DISC
- Teste comportamental obrigatório
- Cálculo automático do perfil DISC
- Resultados detalhados

### 6. Sistema de Matching
- Compatibilidade automática candidato-vaga
- Pontuação baseada em múltiplos critérios
- Recomendações inteligentes com IA

### 7. Gestão de Entrevistas
- Agendamento e controle de status
- Calendário integrado

### 8. Comunicações
- Templates de email e WhatsApp
- Histórico de mensagens

### 9. Analytics e Relatórios
- Dashboard completo
- Métricas de recrutamento
- Análise por departamento

## Troubleshooting

### Erro de Conexão com Banco
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Testar conexão
psql -U gentepro_user -d gentepro -h localhost
```

### Erro de Porta em Uso
```bash
# Verificar processos na porta 5000
lsof -i :5000

# Matar processo se necessário
kill -9 [PID]
```

### Erro de Dependências
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Problemas com Migrations
```bash
# Resetar banco (CUIDADO: apaga todos os dados)
npm run db:reset

# Ou recriar manualmente
DROP DATABASE gentepro;
CREATE DATABASE gentepro;
npm run db:push
```

## Configurações Opcionais

### API Keys Externas

#### OpenAI (para funcionalidades de IA)
1. Acesse: https://platform.openai.com/api-keys
2. Crie uma nova chave
3. Adicione no `.env`: `OPENAI_API_KEY="sua_chave"`

#### SendGrid (para emails)
1. Acesse: https://sendgrid.com/
2. Crie conta e gere API key
3. Adicione no `.env`: `SENDGRID_API_KEY="sua_chave"`

### Configuração de SMTP (alternativa ao SendGrid)
No sistema, vá em Configurações > Credenciais para configurar:
- Host SMTP
- Porta
- Usuário
- Senha
- Segurança (TLS/SSL)

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Iniciar em modo desenvolvimento
npm run build            # Fazer build para produção
npm start               # Iniciar em modo produção

# Banco de Dados
npm run db:push         # Atualizar schema do banco
npm run db:studio       # Abrir interface visual do banco

# Utilitários
npm run type-check      # Verificar tipos TypeScript
npm run lint            # Verificar código
```

## Próximos Passos

1. **Configurar empresa inicial** - Acesse Configurações > Empresas
2. **Criar departamentos** - Acesse Configurações > Departamentos  
3. **Adicionar usuários** - Acesse Configurações > Usuários
4. **Criar vagas** - Acesse Vagas > Gerenciar Vagas
5. **Configurar avaliações** - Acesse Avaliações > Editor DISC

## Suporte

Para dúvidas ou problemas:
1. Verifique este guia primeiro
2. Consulte os logs do console
3. Verifique o arquivo `.env`
4. Teste a conexão com o banco de dados