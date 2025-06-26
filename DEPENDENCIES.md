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
- **express:** ^4.18.0 - Servidor web
- **react:** ^18.2.0 - Interface do usuário  
- **react-dom:** ^18.2.0 - Renderização React
- **typescript:** ^5.0.0 - Tipagem estática

### Banco de Dados
- **drizzle-orm:** ^0.29.0 - ORM principal
- **@neondatabase/serverless:** ^0.7.0 - Driver PostgreSQL
- **drizzle-kit:** ^0.20.0 - Migrations e schema

### Autenticação e Segurança
- **passport:** ^0.7.0 - Sistema de autenticação
- **passport-local:** ^1.0.0 - Estratégia local
- **bcrypt:** ^5.1.0 - Hash de senhas
- **express-session:** ^1.17.3 - Gerenciamento de sessões
- **connect-pg-simple:** ^9.0.0 - Store de sessões PostgreSQL

### Interface do Usuário
- **@radix-ui/react-*:** ^1.0.0 - Componentes primitivos
- **tailwindcss:** ^3.3.0 - Framework CSS
- **lucide-react:** ^0.292.0 - Ícones
- **framer-motion:** ^10.16.0 - Animações

### Validação e Formulários
- **zod:** ^3.22.0 - Validação de schemas
- **react-hook-form:** ^7.47.0 - Formulários
- **@hookform/resolvers:** ^3.3.0 - Resolvers Zod

### Estado e API
- **@tanstack/react-query:** ^5.0.0 - Cache e estado server
- **wouter:** ^3.0.0 - Roteamento client-side

### Integrações Externas
- **openai:** ^4.20.0 - API OpenAI para IA
- **@sendgrid/mail:** ^8.0.0 - Envio de emails
- **nodemailer:** ^6.9.0 - SMTP alternativo

### Utilitários
- **date-fns:** ^2.30.0 - Manipulação de datas
- **nanoid:** ^5.0.0 - IDs únicos
- **clsx:** ^2.0.0 - Manipulação classes CSS

## Dependências de Desenvolvimento

### Build e Bundle
- **vite:** ^5.0.0 - Build tool e dev server
- **@vitejs/plugin-react:** ^4.1.0 - Plugin React para Vite
- **esbuild:** ^0.19.0 - Bundler JavaScript

### TypeScript
- **@types/node:** ^20.8.0 - Tipos Node.js
- **@types/react:** ^18.2.0 - Tipos React
- **@types/react-dom:** ^18.2.0 - Tipos React DOM
- **@types/express:** ^4.17.0 - Tipos Express
- **@types/passport:** ^1.0.0 - Tipos Passport
- **@types/bcrypt:** ^5.0.0 - Tipos bcrypt

### CSS e Styling
- **@tailwindcss/typography:** ^0.5.0 - Plugin tipografia
- **autoprefixer:** ^10.4.0 - Prefixos CSS automáticos
- **postcss:** ^8.4.0 - Processador CSS

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
- **Processador:** Dual-core 2.0GHz
- **Armazenamento:** 2GB livres
- **Rede:** Conexão à internet (para APIs externas)

### Recomendado
- **RAM:** 8GB+
- **Processador:** Quad-core 2.5GHz+
- **Armazenamento:** 5GB+ livres
- **SSD:** Para melhor performance do banco

## Troubleshooting Comum

### Erro: "node: command not found"
- Reinicie o terminal após instalar Node.js
- Verifique se Node.js está no PATH
- No Windows, pode ser necessário reiniciar o computador

### Erro: "psql: command not found"
- PostgreSQL não está no PATH
- No Windows, adicione `C:\Program Files\PostgreSQL\xx\bin` ao PATH
- No Linux, instale com o gerenciador de pacotes

### Erro: "npm install" falha
- Limpe o cache: `npm cache clean --force`
- Delete `node_modules` e `package-lock.json`
- Execute `npm install` novamente

### Erro de conexão com banco
- Verifique se PostgreSQL está rodando
- Confirme credenciais no arquivo `.env`
- Teste conexão: `psql -U user -d database -h localhost`

## APIs Externas (Opcionais)

### OpenAI
- **Necessário para:** Recomendações inteligentes e análises IA
- **Como obter:** https://platform.openai.com/api-keys
- **Custo:** Pay-per-use (aproximadamente $0.001-0.03 por requisição)

### SendGrid
- **Necessário para:** Envio de emails em produção
- **Como obter:** https://sendgrid.com/
- **Alternativas:** Configuração SMTP personalizada (gratuita)

## Performance e Otimização

### Desenvolvimento
- Use SSD para melhor performance do banco
- Feche outras aplicações pesadas durante desenvolvimento
- Considere aumentar limite de arquivos abertos no sistema

### Produção
- Configure pooling de conexões do banco
- Use cache Redis para sessões (opcional)
- Configure reverse proxy (nginx) para servir arquivos estáticos