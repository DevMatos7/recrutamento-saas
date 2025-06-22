# GentePRO - Dependências do Projeto

## Informações do Projeto
- **Nome**: GentePRO
- **Versão**: 1.0.0
- **Tipo**: Sistema SaaS de Recrutamento e Seleção
- **Runtime**: Node.js
- **Gerenciador de Pacotes**: npm

## Requisitos do Sistema
- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL (via Neon Database)

## Dependências de Produção

### Frontend Core
- react@^18.2.0
- react-dom@^18.2.0
- wouter@^3.0.0 (Roteamento)
- @tanstack/react-query@^5.60.5 (Gerenciamento de Estado)

### UI Components
- @radix-ui/react-* (Componentes primitivos)
- tailwindcss@^3.4.0 (CSS Framework)
- tailwindcss-animate@^1.0.7
- class-variance-authority@^0.7.1
- clsx@^2.1.1
- lucide-react@^0.364.0 (Ícones)

### Formulários e Validação
- react-hook-form@^7.49.0
- @hookform/resolvers@^3.10.0
- zod@^3.22.4
- zod-validation-error@^3.0.0

### Backend Core
- express@^4.18.2
- express-session@^1.17.3
- connect-pg-simple@^9.0.1

### Autenticação
- passport@^0.7.0
- passport-local@^1.0.0
- bcrypt@^6.0.0

### Banco de Dados
- @neondatabase/serverless@^0.10.4
- drizzle-orm@^0.29.0
- drizzle-kit@^0.20.14
- drizzle-zod@^0.5.1

### Comunicação
- nodemailer@^6.4.17
- ws@^8.16.0

### Utilitários
- date-fns@^3.0.0
- nanoid@^5.0.6
- memorystore@^1.6.7

## Dependências de Desenvolvimento

### TypeScript
- typescript@^5.3.3
- @types/node@^20.11.5
- @types/react@^18.2.48
- @types/react-dom@^18.2.18
- @types/express@^4.17.21
- @types/express-session@^1.17.10
- @types/passport@^1.0.16
- @types/passport-local@^1.0.38
- @types/bcrypt@^5.0.2
- @types/nodemailer@^6.4.17
- @types/ws@^8.5.10
- @types/react-beautiful-dnd@^13.1.8

### Build Tools
- vite@^5.0.12
- @vitejs/plugin-react@^4.2.1
- esbuild@^0.20.0
- tsx@^4.7.0

### CSS Tools
- postcss@^8.4.33
- autoprefixer@^10.4.17

### Replit Plugins
- @replit/vite-plugin-cartographer@^1.0.0
- @replit/vite-plugin-runtime-error-modal@^1.0.0

## Variáveis de Ambiente Necessárias
```
DATABASE_URL=<url_do_postgresql>
SESSION_SECRET=<chave_secreta_sessao>
NODE_ENV=<development|production>
```

## Scripts Disponíveis
```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Servidor de produção
npm run check        # Verificação TypeScript
npm run db:push      # Aplicar schema do banco
```

## Estrutura Tecnológica

### Frontend
- **Framework**: React 18 com TypeScript
- **Build Tool**: Vite
- **Roteamento**: Wouter
- **Estado**: TanStack Query
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **Formulários**: React Hook Form + Zod

### Backend
- **Runtime**: Node.js + Express
- **Linguagem**: TypeScript
- **Autenticação**: Passport.js (estratégia local)
- **Sessões**: Express Session + PostgreSQL store
- **ORM**: Drizzle ORM

### Banco de Dados
- **SGBD**: PostgreSQL
- **Hosting**: Neon Database
- **Migrações**: Drizzle Kit

## Instalação
1. Clone o repositório
2. Execute: `npm install`
3. Configure as variáveis de ambiente
4. Execute: `npm run db:push`
5. Execute: `npm run dev`

## Funcionalidades Principais
- Gestão de Empresas e Departamentos
- Gestão de Usuários com controle de acesso
- Gestão de Vagas de Emprego
- Gestão de Candidatos
- Pipeline de Seleção (Kanban)
- Testes DISC e Técnicos
- Agendamento de Entrevistas
- Comunicação via WhatsApp e Email
- Analytics e Relatórios
- Portal do Candidato