# GentePRO - Sistema de Gestão de RH

Uma plataforma SaaS completa de recrutamento e seleção que combina gestão avançada de candidatos, rastreamento inteligente de pipeline e ferramentas abrangentes de perfilagem para otimizar processos de contratação.

## Funcionalidades Principais

- 🏢 **Gestão Multiempresa** - Isolamento completo de dados por empresa
- 👥 **Portal do Candidato** - Interface pública para candidaturas e testes
- 📊 **Teste DISC Obrigatório** - Avaliação comportamental automática
- 🤖 **Recomendações IA** - Matching inteligente candidato-vaga com OpenAI
- 📋 **Pipeline de Seleção** - Kanban personalizável com drag & drop
- 🎨 **Etapas Customizáveis** - Cores, responsáveis e campos obrigatórios
- 📅 **Gestão de Entrevistas** - Agendamento e controle completo
- 📧 **Comunicações** - WhatsApp e Email automatizados com templates
- 📈 **Analytics** - Relatórios e métricas detalhadas com KPIs
- 👤 **Gestão de Status** - Ativação/desativação de usuários pelo admin
- 🛡️ **Rate Limiting** - Proteção contra spam e ataques

### Tecnologias

#### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- TanStack Query (estado)
- Wouter (roteamento)
- React Hook Form + Zod (formulários)
- @hello-pangea/dnd (drag & drop)
- React Color (seletor de cores)

#### Backend
- Node.js + Express + TypeScript
- Passport.js (autenticação)
- Express Session (sessões)
- Drizzle ORM (banco de dados)
- PostgreSQL (Neon Database)
- Express Rate Limit (proteção)

## Instalação Rápida

### Pré-requisitos
- Node.js 18+ 
- PostgreSQL 13+
- Git

### Instalação Automatizada (Recomendado)
```bash
# Clonar repositório
git clone [URL_DO_REPOSITORIO]
cd gentepro

# Executar script de instalação
chmod +x install.sh
./install.sh
```

### Instalação Manual
```bash
# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env
# Editar .env com suas configurações

# Configurar banco de dados
npm run db:push

# Iniciar aplicação
npm run dev
```

**Acesse:** `http://localhost:5000`

## Usuários Padrão

Após a primeira execução, os seguintes usuários são criados automaticamente:

- **Admin:** admin@gentepro.com / admin123
- **Recrutador:** recrutador@gentepro.com / recrutador123  
- **Gestor:** gestor@gentepro.com / gestor123

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

## Documentação

- 📖 [Guia de Instalação Completo](INSTALLATION_GUIDE.md) - Instruções detalhadas passo-a-passo
- 📦 [Dependências Detalhadas](DEPENDENCIES.md) - Lista completa de requisitos
- ⚙️ [Configurações e Arquitetura](replit.md) - Documentação técnica
- 🚀 [Script de Instalação](install.sh) - Instalação automatizada

## Configurações Opcionais

### APIs Externas
- **OpenAI:** Para recomendações inteligentes (https://platform.openai.com/api-keys)
- **SendGrid:** Para envio de emails (https://sendgrid.com/)

### Configuração SMTP Personalizada
Alternativamente ao SendGrid, configure SMTP em Configurações > Credenciais

## Novas Funcionalidades - v1.2.0

### Pipeline de Candidatos
- **🎨 Etapas Personalizáveis**: Configure cores, responsáveis e campos obrigatórios
- **🖱️ Drag & Drop**: Interface Kanban intuitiva para movimentação de candidatos
- **👥 Responsáveis por Etapa**: Atribua usuários específicos para cada etapa
- **📝 Campos Obrigatórios**: Defina observações e scores obrigatórios por etapa
- **🛡️ Rate Limiting**: Proteção contra spam e ataques com limites configuráveis

### Melhorias Técnicas
- **⚡ Performance**: Rate limiting otimizado para desenvolvimento
- **🔧 Debugging**: Logs detalhados para troubleshooting
- **📱 Responsividade**: Interface adaptável para diferentes dispositivos
- **🎯 UX**: Interface mais intuitiva e moderna

## Suporte

Para suporte técnico:
1. Consulte [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)
2. Verifique [DEPENDENCIES.md](DEPENDENCIES.md) 
3. Execute `./install.sh` para diagnóstico automático