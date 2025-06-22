# GentePRO - Sistema SaaS de Recrutamento e Seleção

Sistema completo de gestão de recrutamento e seleção para empresas, desenvolvido como SaaS multiempresa.

## Funcionalidades

### Módulos Principais
- **Gestão de Empresas e Departamentos**
- **Gestão de Usuários** com controle de acesso baseado em perfis
- **Gestão de Vagas** com publicação e controle de status
- **Gestão de Candidatos** com perfis completos
- **Pipeline de Seleção** visual em formato Kanban
- **Testes DISC e Técnicos** com avaliação automática
- **Agendamento de Entrevistas** com controle de status
- **Comunicação Automatizada** via WhatsApp e Email
- **Analytics e Relatórios** com dashboards e KPIs
- **Portal do Candidato** público para candidaturas

### Tecnologias

#### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- TanStack Query (estado)
- Wouter (roteamento)
- React Hook Form + Zod (formulários)

#### Backend
- Node.js + Express + TypeScript
- Passport.js (autenticação)
- Express Session (sessões)
- Drizzle ORM (banco de dados)
- PostgreSQL (Neon Database)

## Configuração

### Pré-requisitos
- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL

### Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Configure o banco de dados:
```bash
npm run db:push
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

### Variáveis de Ambiente

Consulte o arquivo `.env.example` para todas as variáveis necessárias:
- `DATABASE_URL`: URL de conexão PostgreSQL
- `SESSION_SECRET`: Chave secreta para sessões
- `NODE_ENV`: Ambiente (development/production)
- `SMTP_*`: Configurações de email
- `WHATSAPP_*`: Configurações WhatsApp (opcional)

## Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Servidor de produção
npm run check        # Verificação TypeScript
npm run db:push      # Aplicar schema do banco
```

## Estrutura do Projeto

```
├── client/          # Frontend React
├── server/          # Backend Express
├── shared/          # Código compartilhado (tipos, schemas)
├── attached_assets/ # Assets anexados
└── docs/           # Documentação
```

## Perfis de Usuário

- **Admin**: Acesso completo ao sistema
- **Recrutador**: Gestão de vagas, candidatos e pipeline
- **Gestor**: Visualização de dados do departamento
- **Candidato**: Acesso ao portal público

## Licença

MIT

## Suporte

Para suporte técnico, consulte a documentação em `DEPENDENCIES.md` ou entre em contato com a equipe de desenvolvimento.