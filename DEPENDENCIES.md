# Dependências do Projeto GentePRO

## Resumo
Este documento lista todas as dependências necessárias para executar o projeto GentePRO em ambiente local, incluindo versões mínimas e instruções de instalação.

## Pré-requisitos do Sistema

### 1. Node.js e npm
- **Versão mínima:** Node.js 18.0.0+
- **Recomendado:** Node.js 20.x LTS
- **npm:** Versão 9.0.0+

**Verificação:**
```bash
node --version  # deve mostrar v18.0.0 ou superior
npm --version   # deve mostrar 9.0.0 ou superior
```

**Download:** https://nodejs.org/

### 2. PostgreSQL
- **Versão mínima:** PostgreSQL 13.0+
- **Recomendado:** PostgreSQL 15.x
- **Extensões necessárias:** uuid-ossp (geralmente incluída)

**Verificação:**
```bash
psql --version  # deve mostrar 13.0 ou superior
```

**Downloads:**
- Windows: https://www.postgresql.org/download/windows/
- macOS: https://www.postgresql.org/download/macosx/
- Linux: https://www.postgresql.org/download/linux/

### 3. Git
- **Versão mínima:** Git 2.20.0+
- **Recomendado:** Versão mais recente

**Verificação:**
```bash
git --version
```

**Download:** https://git-scm.com/downloads

## Dependências de Produção (package.json)

### Framework Principal
- **express:** ^4.21.2 - Servidor web
- **react:** ^18.3.1 - Interface do usuário  
- **react-dom:** ^18.3.1 - Renderização React
- **typescript:** ^5.6.3 - Tipagem estática

### Banco de Dados
- **drizzle-orm:** ^0.39.1 - ORM principal
- **@neondatabase/serverless:** ^0.10.4 - Driver PostgreSQL
- **drizzle-kit:** ^0.30.4 - Migrations e schema

### Autenticação e Segurança
- **passport:** ^0.7.0 - Sistema de autenticação
- **passport-local:** ^1.0.0 - Estratégia local
- **bcrypt:** ^6.0.0 - Hash de senhas
- **express-session:** ^1.18.1 - Gerenciamento de sessões
- **connect-pg-simple:** ^10.0.0 - Store de sessões PostgreSQL
- **express-rate-limit:** ^7.5.1 - Rate limiting para APIs

### Interface do Usuário
- **@radix-ui/react-*:** ^1.2.4 - Componentes primitivos
- **tailwindcss:** ^3.4.17 - Framework CSS
- **lucide-react:** ^0.453.0 - Ícones
- **framer-motion:** ^11.13.1 - Animações
- **react-color:** ^2.19.3 - Seletor de cores
- **react-select:** ^5.10.1 - Componente de seleção

### Drag and Drop e Interatividade
- **@hello-pangea/dnd:** ^18.0.1 - Drag and drop para pipeline
- **react-beautiful-dnd:** ^13.1.1 - Drag and drop (legacy)

### Validação e Formulários
- **zod:** ^3.25.69 - Validação de schemas
- **react-hook-form:** ^7.55.0 - Formulários
- **@hookform/resolvers:** ^3.10.0 - Resolvers Zod

### Estado e API
- **@tanstack/react-query:** ^5.60.5 - Cache e estado server
- **wouter:** ^3.3.5 - Roteamento client-side

### Integrações Externas
- **openai:** ^5.7.0 - API OpenAI para IA
- **@sendgrid/mail:** ^8.1.5 - Envio de emails
- **nodemailer:** ^7.0.3 - SMTP alternativo
- **@huggingface/inference:** ^4.3.2 - APIs de IA

### Processamento de Arquivos
- **multer:** ^2.0.1 - Upload de arquivos
- **pdf-parse:** ^1.1.1 - Extração de texto de PDFs
- **mammoth:** ^1.9.1 - Processamento de documentos Word
- **exceljs:** ^4.4.0 - Geração de relatórios Excel

### Utilitários
- **date-fns:** ^3.6.0 - Manipulação de datas
- **nanoid:** ^5.1.5 - IDs únicos
- **clsx:** ^2.1.1 - Manipulação classes CSS
- **class-variance-authority:** ^0.7.1 - Variantes de componentes
- **tailwind-merge:** ^2.6.0 - Merge de classes Tailwind

### Agendamento e Tarefas
- **node-cron:** ^4.2.0 - Agendamento de tarefas
- **ws:** ^8.18.0 - WebSockets

## Dependências de Desenvolvimento

### Build e Bundle
- **vite:** ^5.4.14 - Build tool e dev server
- **@vitejs/plugin-react:** ^4.3.2 - Plugin React para Vite
- **esbuild:** ^0.25.0 - Bundler JavaScript
- **tsx:** ^4.19.1 - Executor TypeScript

### TypeScript
- **@types/node:** ^20.16.11 - Tipos Node.js
- **@types/react:** ^18.3.11 - Tipos React
- **@types/react-dom:** ^18.3.1 - Tipos React DOM
- **@types/express:** ^4.17.21 - Tipos Express
- **@types/passport:** ^1.0.16 - Tipos Passport
- **@types/bcrypt:** ^5.0.2 - Tipos bcrypt
- **@types/express-session:** ^1.18.0 - Tipos Express Session
- **@types/connect-pg-simple:** ^7.0.3 - Tipos Connect PG Simple
- **@types/passport-local:** ^1.0.38 - Tipos Passport Local
- **@types/react-color:** ^3.0.13 - Tipos React Color
- **@types/react-big-calendar:** ^1.16.2 - Tipos React Big Calendar
- **@types/ws:** ^8.5.13 - Tipos WebSocket

### CSS e Styling
- **@tailwindcss/typography:** ^0.5.15 - Plugin tipografia
- **@tailwindcss/vite:** ^4.1.3 - Plugin Tailwind para Vite
- **autoprefixer:** ^10.4.20 - Prefixos CSS automáticos
- **postcss:** ^8.4.47 - Processador CSS
- **tailwindcss-animate:** ^1.0.7 - Animações Tailwind

### Testes e Debugging
- **axios:** ^1.10.0 - Cliente HTTP para testes

## Variáveis de Ambiente Necessárias

### Obrigatórias
```env
DATABASE_URL="postgresql://user:password@localhost:5432/gentepro"
SESSION_SECRET="chave_secreta_muito_forte_aqui"
NODE_ENV="development"
```

### Opcionais (para funcionalidades completas)
```env
OPENAI_API_KEY="sk-..."           # Para recomendações IA
SENDGRID_API_KEY="SG...."        # Para emails via SendGrid
HF_API_KEY="hf_..."              # Para APIs Hugging Face
```

## Portas Utilizadas

- **5000:** Aplicação principal (frontend + backend)
- **5432:** PostgreSQL (padrão)

## Comandos de Instalação Rápida

### Ubuntu/Debian
```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Instalar Git
sudo apt install git
```

### macOS (com Homebrew)
```bash
# Instalar Node.js
brew install node@20

# Instalar PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Git já vem instalado, ou:
brew install git
```

### Windows
1. **Node.js:** Baixe o instalador LTS em https://nodejs.org/
2. **PostgreSQL:** Baixe em https://www.postgresql.org/download/windows/
3. **Git:** Baixe em https://git-scm.com/download/win

## Verificação da Instalação

Execute o script de verificação:
```bash
# Tornar executável (Linux/macOS)
chmod +x install.sh

# Executar
./install.sh
```

Ou verificar manualmente:
```bash
# Verificar Node.js
node --version && npm --version

# Verificar PostgreSQL
psql --version

# Verificar Git
git --version

# Instalar dependências do projeto
npm install

# Configurar banco
npm run db:push

# Iniciar aplicação
npm run dev
```

## Requisitos de Hardware

### Mínimo
- **RAM:** 4GB
- **CPU:** 2 cores
- **Disco:** 10GB livre
- **Rede:** Conexão estável à internet

### Recomendado
- **RAM:** 8GB+
- **CPU:** 4 cores+
- **Disco:** 20GB+ livre (SSD)
- **Rede:** Conexão de alta velocidade

## Funcionalidades Adicionadas Recentemente

### Pipeline de Candidatos
- **Drag and Drop:** Interface Kanban para movimentação de candidatos
- **Etapas Personalizáveis:** Configuração de cores, responsáveis e campos obrigatórios
- **Rate Limiting:** Proteção contra spam e ataques
- **Seletor de Cores:** Interface visual para personalização de etapas

### Dependências Específicas do Pipeline
- **@hello-pangea/dnd:** Drag and drop moderno
- **react-color:** Seletor de cores para etapas
- **react-select:** Seleção múltipla de responsáveis
- **express-rate-limit:** Proteção da API

## Troubleshooting

### Problemas Comuns

1. **Erro de Rate Limiting (429)**
   - Ajuste os limites em `server/middleware/rate-limit.middleware.ts`
   - Reinicie o servidor após alterações

2. **Dependências não encontradas**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Erro de TypeScript**
   ```bash
   npm run check
   ```

4. **Problemas de banco de dados**
   ```bash
   npm run db:push
   ```

## Atualizações Recentes

### v1.2.0 - Pipeline de Candidatos
- ✅ Pipeline Kanban com drag and drop
- ✅ Etapas personalizáveis com cores
- ✅ Rate limiting configurável
- ✅ Seletor de cores integrado
- ✅ Responsáveis por etapa
- ✅ Campos obrigatórios por etapa

### Dependências Adicionadas
- `@hello-pangea/dnd`: ^18.0.1
- `react-color`: ^2.19.3
- `react-select`: ^5.10.1
- `express-rate-limit`: ^7.5.1
- `@types/react-color`: ^3.0.13