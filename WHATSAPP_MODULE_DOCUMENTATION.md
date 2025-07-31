# 📱 Módulo WhatsApp - GentePRO

## 📋 Visão Geral

O módulo WhatsApp do GentePRO é uma solução completa de comunicação automatizada para processos de recrutamento e seleção. Ele permite enviar e receber mensagens via WhatsApp, gerenciar templates, configurar respostas automáticas e integrar com o pipeline de recrutamento.

## 🚀 Funcionalidades Principais

### 1. 📱 Integração com WhatsApp via Baileys
- **Autenticação via QR Code**: Conecte múltiplas sessões WhatsApp
- **Envio de mensagens**: Para números com formato internacional
- **Recebimento de mensagens**: Processamento automático de respostas
- **Sessão persistente**: Salva em arquivo `auth.json`

### 2. 📨 Envio de Mensagens Automáticas por Evento
- **Eventos suportados**:
  - `triagem_aprovada` - Candidato aprovado na triagem
  - `entrevista_agendada` - Entrevista foi agendada
  - `solicitacao_documentos` - Solicitação de documentos
  - `candidato_aprovado` - Candidato aprovado no processo
  - `candidato_reprovado` - Candidato reprovado
  - `link_vaga` - Envio de link da vaga

- **Variáveis disponíveis**:
  - `{{nome}}` - Nome do candidato
  - `{{vaga}}` - Título da vaga
  - `{{data}}` - Data do evento
  - `{{hora}}` - Horário do evento
  - `{{local}}` - Local do evento
  - `{{link}}` - Link da vaga

### 3. 📋 Templates de Mensagens Gerenciáveis
- **CRUD completo** no banco de dados
- **Título, corpo, evento, status** configuráveis
- **Pré-visualização** com valores fictícios
- **Ativação/desativação** de templates

### 4. ✅ Respostas Rápidas por Múltipla Escolha
- **Detecção automática** de respostas numéricas (1, 2, 3, etc.)
- **Ações configuráveis** por evento
- **Exemplos**:
  - `1` → Confirmar entrevista
  - `2` → Remarcar entrevista
  - `3` → Falar com RH

### 5. 💬 Chatbot Inteligente
- **Detecção de intenções** com NLP
- **Palavras-chave** configuráveis
- **Fallback** para mensagens não entendidas
- **Integração com OpenAI/Hugging Face**

### 6. 🕒 Controle de Horário
- **Configuração de horários** por empresa e evento
- **Evita envio** fora do horário comercial
- **Fila de envio** para mensagens pendentes
- **Agendamento automático** com `node-cron`

### 7. 🧾 Histórico Completo
- **Todas as mensagens** salvas no banco
- **Filtros** por evento, status, data
- **Exportação** em CSV
- **Estatísticas** detalhadas

## 🏗️ Arquitetura

### Estrutura de Arquivos
```
server/
├── whatsapp/
│   ├── session.ts      # Gerenciamento de sessões Baileys
│   ├── service.ts      # Serviço principal do WhatsApp
│   ├── dispatcher.ts   # Execução de ações por evento
│   └── bot.ts          # Chatbot e processamento de mensagens
├── nlp/
│   └── analyzer.ts     # Análise de intenções com NLP
├── cron/
│   └── filaEnvio.ts    # Agendamento de mensagens pendentes
└── seed-whatsapp.ts    # Dados iniciais do módulo

client/src/components/
└── WhatsAppDashboard.tsx  # Interface do usuário
```

### Tabelas do Banco de Dados
- `whatsapp_sessoes` - Sessões do WhatsApp
- `templates_mensagem` - Templates de mensagens
- `respostas_rapidas` - Respostas rápidas por evento
- `mensagens_whatsapp` - Histórico de mensagens
- `fila_envio` - Fila de mensagens pendentes
- `configuracoes_horario` - Configurações de horário
- `intencoes_chatbot` - Intenções do chatbot
- `logs_nlp` - Logs de análise NLP

## 🚀 Instalação e Configuração

### 1. Instalar Dependências
```bash
npm install @whiskeysockets/baileys qrcode-terminal @types/qrcode-terminal
```

### 2. Executar Migração do Banco
```bash
npm run db:push
```

### 3. Executar Seed do WhatsApp
```bash
npx tsx server/seed-whatsapp.ts
```

### 4. Configurar Variáveis de Ambiente
```env
# OpenAI (opcional - para NLP avançado)
OPENAI_API_KEY=sua_chave_openai

# Hugging Face (opcional - alternativa ao OpenAI)
HUGGINGFACE_API_KEY=sua_chave_huggingface

# URL do Frontend (para links de vagas)
FRONTEND_URL=http://localhost:3000
```

## 📖 Como Usar

### 1. Criar Sessão WhatsApp
```typescript
// Via API
POST /api/whatsapp/sessoes
{
  "empresaId": "uuid-da-empresa",
  "nome": "RH Principal",
  "numero": "+55 11 99999-9999"
}
```

### 2. Conectar Sessão
```typescript
// Via API
POST /api/whatsapp/sessoes/{id}/conectar

// QR Code aparecerá no terminal
```

### 3. Enviar Mensagem Direta
```typescript
// Via API
POST /api/whatsapp/mensagens/enviar
{
  "sessaoId": "uuid-da-sessao",
  "candidatoId": "uuid-do-candidato",
  "mensagem": "Olá! Sua entrevista foi confirmada."
}
```

### 4. Disparar por Evento
```typescript
// Via API
POST /api/whatsapp/eventos/disparar
{
  "sessaoId": "uuid-da-sessao",
  "candidatoId": "uuid-do-candidato",
  "evento": "entrevista_agendada",
  "variables": {
    "nome": "João Silva",
    "vaga": "Desenvolvedor Full Stack",
    "data": "15/12/2024",
    "hora": "14:00",
    "local": "Sala de Reuniões"
  }
}
```

### 5. Webhook para Eventos
```typescript
// Via API
POST /api/webhook/evento-recrutamento
{
  "evento": "triagem_aprovada",
  "candidatoId": "uuid-do-candidato",
  "variables": {
    "nome": "João Silva",
    "vaga": "Desenvolvedor Full Stack"
  }
}
```

## 🤖 Chatbot e NLP

### Configuração de Intenções
```typescript
// Via API
POST /api/whatsapp/intencoes/treinar
{
  "empresaId": "uuid-da-empresa",
  "nome": "confirmar_entrevista",
  "descricao": "Candidato confirma presença em entrevista",
  "palavrasChave": ["confirmo", "confirmar", "sim", "ok"],
  "acao": "confirmar_entrevista"
}
```

### Análise de Intenção
```typescript
// Via API
POST /api/nlp/analisar
{
  "mensagem": "Sim, confirmo minha presença na entrevista"
}

// Resposta
{
  "intencao": "confirmar_entrevista",
  "confianca": 0.95,
  "sentimento": "positivo"
}
```

## 📊 Estatísticas e Monitoramento

### Obter Estatísticas
```typescript
// Via API
GET /api/whatsapp/estatisticas/{empresaId}

// Resposta
{
  "mensagens": {
    "total": 150,
    "enviadas": 100,
    "recebidas": 50,
    "entregues": 95,
    "lidas": 80
  },
  "chatbot": {
    "totalMensagens": 50,
    "mensagensProcessadas": 40,
    "mensagensFallback": 10,
    "taxaSucesso": 80,
    "topIntencoes": [
      { "intencao": "confirmar_entrevista", "count": 15 },
      { "intencao": "remarcar_entrevista", "count": 10 }
    ]
  }
}
```

### Fila de Envio
```typescript
// Estatísticas da fila
GET /api/whatsapp/fila/estatisticas

// Reprocessar mensagens com erro
POST /api/whatsapp/fila/reprocessar

// Limpar mensagens antigas
POST /api/whatsapp/fila/limpar
```

## 🎨 Interface do Usuário

### Dashboard WhatsApp
O componente `WhatsAppDashboard.tsx` oferece:

- **Visão geral** das sessões e status
- **Estatísticas** em tempo real
- **Envio de mensagens** diretas
- **Gerenciamento de templates**
- **Configurações do chatbot**
- **Monitoramento da fila**

### Abas Disponíveis
1. **Sessões** - Gerenciar conexões WhatsApp
2. **Mensagens** - Enviar mensagens diretas
3. **Templates** - Criar e editar templates
4. **Chatbot** - Configurar intenções e respostas

## 🔧 Configurações Avançadas

### Horários de Envio
```typescript
// Via API
POST /api/whatsapp/configuracoes/horario
{
  "empresaId": "uuid-da-empresa",
  "evento": "entrevista_agendada",
  "horaInicio": "09:00",
  "horaFim": "17:00",
  "diasSemana": [1, 2, 3, 4, 5] // Segunda a sexta
}
```

### Respostas Rápidas
```typescript
// Via API
POST /api/whatsapp/respostas-rapidas
{
  "empresaId": "uuid-da-empresa",
  "evento": "entrevista_agendada",
  "opcao": "1",
  "texto": "Confirmar entrevista",
  "acao": "confirmar_entrevista"
}
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Sessão não conecta**
   - Verifique se o número está correto
   - Aguarde o QR Code aparecer no terminal
   - Certifique-se de que o WhatsApp está ativo

2. **Mensagens não são enviadas**
   - Verifique se a sessão está conectada
   - Confirme se o candidato tem telefone cadastrado
   - Verifique os logs de erro

3. **Chatbot não responde**
   - Configure as intenções no banco
   - Verifique se o NLP está funcionando
   - Monitore os logs de análise

4. **Fila de envio não processa**
   - Verifique se o cron está rodando
   - Confirme as configurações de horário
   - Monitore os logs do agendamento

### Logs Importantes
- `🕒 Processando fila de envio...` - Agendamento funcionando
- `📱 QR Code disponível para sessão` - Autenticação necessária
- `✅ Mensagem enviada com sucesso` - Envio funcionando
- `🤖 Intenção detectada: confirmar_entrevista` - NLP funcionando

## 📈 Melhorias Futuras

- [ ] **WebSocket** para atualizações em tempo real
- [ ] **Múltiplos provedores** de WhatsApp (Twilio, etc.)
- [ ] **Análise de sentimento** avançada
- [ ] **Relatórios** detalhados de engajamento
- [ ] **Integração** com calendário para agendamentos
- [ ] **Notificações push** para recrutadores
- [ ] **API pública** para candidatos
- [ ] **Multi-idioma** nos templates

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do servidor
2. Consulte a documentação da API
3. Teste as funcionalidades via Postman/Insomnia
4. Monitore as estatísticas do dashboard

---

**Desenvolvido para o sistema GentePRO** 🚀