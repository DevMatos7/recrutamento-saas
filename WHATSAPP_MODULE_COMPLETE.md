# 📱 Módulo WhatsApp Completo - GentePRO

## 🎯 Visão Geral

Este módulo implementa um sistema completo de integração WhatsApp para o GentePRO, permitindo comunicação automatizada com candidatos durante todo o processo de recrutamento e seleção.

## ✨ Funcionalidades Implementadas

### 🔐 Autenticação e Sessões
- **QR Code**: Autenticação via QR Code para conectar WhatsApp
- **Sessões Múltiplas**: Suporte a múltiplas sessões por empresa
- **Persistência**: Sessões salvas em arquivo `auth.json`
- **Reconexão Automática**: Reconecta sessões automaticamente na inicialização

### 📨 Envio de Mensagens
- **Mensagens Diretas**: Envio manual de mensagens para candidatos
- **Templates**: Sistema de templates com variáveis personalizáveis
- **Eventos Automáticos**: Disparo automático por eventos do sistema
- **Controle de Horário**: Evita envio fora do horário comercial

### 🤖 Chatbot Inteligente
- **NLP**: Análise de intenção usando OpenAI ou Hugging Face
- **Respostas Rápidas**: Sistema de múltipla escolha (1, 2, 3...)
- **Ações Automáticas**: Execução de ações baseadas na resposta
- **Fallback**: Respostas quando não entende a mensagem

### 📊 Histórico e Estatísticas
- **Histórico Completo**: Todas as mensagens salvas no banco
- **Filtros**: Por evento, status, data
- **Estatísticas**: Taxa de entrega, mensagens enviadas/recebidas
- **Exportação**: Histórico em CSV

### 🔄 Webhooks e WebSocket
- **Webhooks**: Endpoint para eventos externos
- **WebSocket**: Comunicação em tempo real
- **Notificações**: Atualizações instantâneas na interface

## 🏗️ Arquitetura

### Backend (Node.js + TypeScript)

```
server/
├── whatsapp/
│   ├── session.ts      # Gerenciamento de sessões Baileys
│   ├── service.ts      # Serviços de envio/recebimento
│   ├── dispatcher.ts   # Lógica de ações por evento
│   └── bot.ts          # Chatbot com NLP
├── nlp/
│   └── analyzer.ts     # Análise de intenção
├── cron/
│   └── filaEnvio.ts    # Agendamento de mensagens
├── webhooks.ts         # Sistema de webhooks
└── websocket.ts        # Comunicação em tempo real
```

### Frontend (React + TypeScript)

```
client/src/
├── components/
│   ├── WhatsAppDashboard.tsx      # Dashboard principal
│   ├── WhatsAppConversation.tsx   # Interface de conversação
│   └── WhatsAppTemplates.tsx      # Gerenciamento de templates
└── pages/
    ├── whatsapp.tsx               # Página principal
    ├── whatsapp-conversation.tsx  # Conversação em tempo real
    └── whatsapp-templates.tsx     # Templates de mensagem
```

### Banco de Dados (PostgreSQL)

```sql
-- Sessões WhatsApp
whatsapp_sessoes (id, empresa_id, nome, numero, status, dados_sessao)

-- Templates de mensagem
templates_mensagem (id, empresa_id, titulo, evento, corpo, ativo)

-- Respostas rápidas
respostas_rapidas (id, empresa_id, evento, opcao, texto, acao)

-- Mensagens
mensagens_whatsapp (id, candidato_id, sessao_id, tipo, mensagem, status)

-- Fila de envio
fila_envio (id, candidato_id, sessao_id, evento, mensagem, data_agendada)

-- Configurações de horário
configuracoes_horario (id, empresa_id, evento, hora_inicio, hora_fim)

-- Intenções do chatbot
intencoes_chatbot (id, empresa_id, nome, palavras_chave, acao)

-- Logs NLP
logs_nlp (id, candidato_id, mensagem_original, intencao_detectada)
```

## 🚀 Como Usar

### 1. Configuração Inicial

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Configurar banco de dados
npm run db:push

# Executar seed inicial
npm run dev
```

### 2. Conectar WhatsApp

1. Acesse `/whatsapp` no sistema
2. Clique em "Nova Sessão"
3. Preencha nome e número
4. Clique em "Conectar"
5. Escaneie o QR Code com seu WhatsApp

### 3. Criar Templates

1. Acesse `/whatsapp/templates`
2. Clique em "Novo Template"
3. Defina título, evento e mensagem
4. Use variáveis como `{{nome}}`, `{{vaga}}`, etc.

### 4. Conversação em Tempo Real

1. Acesse `/whatsapp/conversation`
2. Selecione uma sessão conectada
3. Escolha um candidato
4. Envie e receba mensagens

## 📋 Eventos Disponíveis

| Evento | Descrição | Variáveis |
|--------|-----------|-----------|
| `triagem_aprovada` | Candidato aprovado na triagem | `{{nome}}`, `{{vaga}}`, `{{empresa}}` |
| `entrevista_agendada` | Entrevista agendada | `{{nome}}`, `{{vaga}}`, `{{data}}`, `{{hora}}`, `{{local}}` |
| `solicitar_documentos` | Solicitação de documentos | `{{nome}}`, `{{documentos}}`, `{{prazo}}` |
| `feedback_aprovado` | Candidato aprovado | `{{nome}}`, `{{vaga}}`, `{{observacoes}}` |
| `feedback_reprovado` | Candidato reprovado | `{{nome}}`, `{{vaga}}`, `{{motivo}}` |
| `mudanca_etapa` | Mudança de etapa no pipeline | `{{nome}}`, `{{etapa}}`, `{{descricao}}` |
| `mensagem_direta` | Mensagem direta do RH | `{{mensagem}}` |
| `link_vaga` | Envio de link da vaga | `{{nome}}`, `{{vaga}}`, `{{link}}` |

## 🔧 API Endpoints

### Sessões
- `GET /api/whatsapp/sessoes` - Listar sessões
- `POST /api/whatsapp/sessoes` - Criar sessão
- `POST /api/whatsapp/sessoes/:id/conectar` - Conectar sessão
- `GET /api/whatsapp/sessoes/:id/qrcode` - Obter QR Code
- `POST /api/whatsapp/sessoes/:id/desconectar` - Desconectar sessão

### Templates
- `GET /api/whatsapp/templates` - Listar templates
- `POST /api/whatsapp/templates` - Criar template
- `PUT /api/whatsapp/templates/:id` - Atualizar template
- `DELETE /api/whatsapp/templates/:id` - Deletar template

### Mensagens
- `GET /api/whatsapp/mensagens/:candidatoId` - Histórico do candidato
- `POST /api/whatsapp/mensagens/enviar` - Enviar mensagem
- `POST /api/whatsapp/mensagens/template` - Enviar com template
- `POST /api/whatsapp/eventos/disparar` - Disparar por evento

### Chatbot
- `POST /api/whatsapp/chatbot/processar` - Processar mensagem
- `POST /api/whatsapp/chatbot/resposta-rapida` - Processar resposta rápida

### Webhooks
- `POST /api/webhook/evento-recrutamento` - Receber eventos externos

## 🌐 WebSocket

### Tipos de Mensagem

```typescript
// Conectar à sessão
{
  type: 'subscribe_session',
  data: { sessionId, empresaId, userId }
}

// Enviar mensagem
{
  type: 'send_message',
  data: { sessionId, candidatoId, mensagem }
}

// Status da sessão
{
  type: 'session_status',
  data: { sessionId, connected, qrCode, session }
}

// Nova mensagem
{
  type: 'new_message',
  data: { candidatoId, mensagem, timestamp }
}
```

## 🤖 Chatbot

### Intenções Reconhecidas

- `confirmar_entrevista` - Confirmar presença em entrevista
- `remarcar_entrevista` - Remarcar ou adiar entrevista
- `solicitar_documentos` - Perguntar sobre documentos
- `falar_com_rh` - Quer falar com alguém do RH
- `enviar_link_vaga` - Pedir link da vaga
- `agendar_entrevista` - Agendar entrevista
- `duvida_processo` - Dúvidas sobre o processo
- `desistir_processo` - Desistir do processo
- `agradecer` - Agradecimento
- `saudacao` - Apenas saudação

### Respostas Rápidas

```typescript
// Exemplo de configuração
{
  evento: 'entrevista_agendada',
  opcoes: [
    { opcao: '1', texto: 'Confirmar entrevista', acao: 'confirmar_entrevista' },
    { opcao: '2', texto: 'Remarcar', acao: 'remarcar_entrevista' },
    { opcao: '3', texto: 'Falar com RH', acao: 'falar_com_rh' }
  ]
}
```

## ⚙️ Configurações

### Variáveis de Ambiente

```env
# WhatsApp
WHATSAPP_API_URL=
WHATSAPP_API_TOKEN=

# NLP
OPENAI_API_KEY=your_openai_key
HUGGINGFACE_API_KEY=your_huggingface_key

# Webhook
WEBHOOK_SECRET=your_webhook_secret

# Frontend
FRONTEND_URL=http://localhost:5000
```

### Configurações de Horário

```typescript
// Exemplo de configuração
{
  evento: 'entrevista_agendada',
  horaInicio: '08:00',
  horaFim: '18:00',
  diasSemana: [1, 2, 3, 4, 5] // Segunda a sexta
}
```

## 📊 Monitoramento

### Logs Importantes

```bash
# Sessão conectada
✅ Sessão WhatsApp conectada: RH Principal

# Mensagem enviada
📨 Mensagem enviada para João Silva: Sua entrevista está confirmada

# Chatbot
🤖 Intenção detectada: confirmar_entrevista (confiança: 0.95)

# Erro
❌ Erro ao enviar mensagem: Sessão desconectada
```

### Métricas

- Total de mensagens enviadas/recebidas
- Taxa de entrega
- Tempo médio de resposta
- Intenções mais comuns
- Templates mais utilizados

## 🔒 Segurança

- Validação de webhooks com assinatura HMAC
- Autenticação JWT para APIs
- Rate limiting nas APIs
- Logs de auditoria
- Controle de acesso por empresa

## 🚨 Troubleshooting

### Problemas Comuns

1. **QR Code não aparece**
   - Verificar se a sessão foi criada corretamente
   - Verificar logs do Baileys

2. **Mensagens não são enviadas**
   - Verificar se a sessão está conectada
   - Verificar horário permitido
   - Verificar número do telefone

3. **Chatbot não responde**
   - Verificar configuração de intenções
   - Verificar API do OpenAI/Hugging Face
   - Verificar logs NLP

4. **WebSocket não conecta**
   - Verificar se o servidor está rodando
   - Verificar configuração CORS
   - Verificar firewall

## 🔄 Atualizações Futuras

- [ ] Suporte a mídia (imagens, documentos)
- [ ] Grupos de WhatsApp
- [ ] Integração com outros canais (Telegram, SMS)
- [ ] Analytics avançados
- [ ] IA para sugestão de respostas
- [ ] Integração com calendário
- [ ] Notificações push
- [ ] Backup automático de sessões

## 📞 Suporte

Para dúvidas ou problemas:

1. Verificar logs do sistema
2. Consultar esta documentação
3. Verificar configurações
4. Contatar equipe de desenvolvimento

---

**Desenvolvido para GentePRO** 🚀
**Versão**: 1.0.0
**Última atualização**: Dezembro 2024 