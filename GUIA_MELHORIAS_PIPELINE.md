# 🚀 Guia das Melhorias do Pipeline - GentePRO

## 📍 **Onde Encontrar as Melhorias**

### **1. Página Principal de Configurações**
**URL:** `/pipeline-config`
**Menu:** Configurações → Configurações do Pipeline

Esta é a página central onde você pode gerenciar todas as melhorias implementadas.

---

## 🎯 **1. Motivos de Reprovação**

### **O que é:**
- Sistema de motivos padrão de reprovação por empresa
- **Validação obrigatória** ao reprovar candidatos
- Histórico completo de reprovações
- Templates por categoria

### **Como usar:**

#### **A. Configurar Motivos para sua Empresa**
1. Vá para `/pipeline-config`
2. Selecione sua empresa
3. Clique na aba **"Motivos de Reprovação"**
4. Clique em **"Criar a partir de Template"**
5. Escolha uma categoria (Geral, Técnico, Comportamental, etc.)
6. Os motivos padrão serão criados automaticamente

#### **B. Criar Motivos Personalizados**
1. Na aba "Motivos de Reprovação"
2. Clique em **"Novo Motivo"**
3. Preencha:
   - **Nome:** Ex: "Experiência insuficiente"
   - **Descrição:** Explicação detalhada
   - **Categoria:** Geral, Técnico, etc.
   - **Obrigatório:** Se deve sempre aparecer na lista

#### **C. Reprovar um Candidato**
1. Vá para `/pipeline`
2. Clique em um candidato
3. Mova para etapa "Reprovado"
4. **Obrigatório:** Selecione um motivo de reprovação
5. Adicione observações (opcional)
6. Confirme a reprovação

### **Categorias Disponíveis:**
- **Geral:** Motivos comuns (perfil não adequado, etc.)
- **Técnico:** Falta de habilidades técnicas
- **Comportamental:** Problemas de comportamento
- **Documental:** Documentação incompleta
- **Outros:** Motivos específicos da empresa

---

## ⏰ **2. SLAs e Alertas**

### **O que é:**
- Prazos configuráveis para cada etapa do pipeline
- Alertas automáticos quando candidatos estão atrasados
- Notificações por email, push, SMS
- Ações automáticas configuráveis

### **Como usar:**

#### **A. Configurar SLAs para uma Etapa**
1. Vá para `/pipeline-config`
2. Selecione empresa e etapa
3. Clique na aba **"SLAs e Alertas"**
4. Clique em **"Criar a partir de Template"**
5. Escolha um tipo de SLA:
   - **Triagem:** 24-48 horas
   - **Entrevista:** 3-5 dias
   - **Documentação:** 7 dias
   - **Exames:** 10 dias
   - **Integração:** 15 dias

#### **B. Configurar SLA Personalizado**
1. Clique em **"Novo SLA"**
2. Preencha:
   - **Nome:** Ex: "SLA Entrevista Técnica"
   - **Prazo:** 72 horas
   - **Alerta Antes:** 24 horas (alerta preventivo)
   - **Alerta Após:** 12 horas (alerta de atraso)
   - **Notificações:** Email, push, etc.

#### **C. Monitorar Alertas**
1. Na aba "SLAs e Alertas"
2. Clique em **"Alertas Pendentes"**
3. Veja candidatos atrasados
4. Clique em **"Resolver"** quando o problema for resolvido

### **Tipos de SLA Disponíveis:**
- **Triagem:** Análise inicial de currículos
- **Entrevista:** Agendamento e realização
- **Documentação:** Recebimento de documentos
- **Exames:** Exames médicos e psicológicos
- **Integração:** Processo de onboarding

---

## ⚡ **3. Automatizações**

### **O que é:**
- Regras automáticas para mover candidatos
- Notificações automáticas
- Webhooks para integrações
- Ações baseadas em condições

### **Como usar:**

#### **A. Configurar Automatização**
1. Vá para `/pipeline-config`
2. Selecione empresa e etapa
3. Clique na aba **"Automatizações"**
4. Clique em **"Criar a partir de Template"**
5. Escolha um tipo:
   - **Movimento:** Mover candidato automaticamente
   - **Notificação:** Enviar alerta
   - **Webhook:** Integrar com sistema externo

#### **B. Exemplos de Automatizações**
1. **"Mover para Entrevista após Agendamento"**
   - Condição: Entrevista agendada
   - Ação: Mover para etapa "Entrevista"

2. **"Notificar Gestor sobre Candidato Aprovado"**
   - Condição: Candidato aprovado
   - Ação: Enviar email para gestor

3. **"Integrar com Sistema de RH"**
   - Condição: Candidato contratado
   - Ação: Webhook para sistema de RH

#### **C. Monitorar Execução**
1. Na aba "Automatizações"
2. Veja logs de execução
3. Execute manualmente se necessário
4. Monitore tentativas e erros

---

## ✅ **4. Checklists**

### **O que é:**
- Listas de verificação por etapa
- Progresso automático do candidato
- Templates por tipo de etapa
- Validação de documentos

### **Como usar:**

#### **A. Configurar Checklist para uma Etapa**
1. Vá para `/pipeline-config`
2. Selecione empresa e etapa
3. Clique na aba **"Checklists"**
4. Clique em **"Criar a partir de Template"**
5. Escolha um tipo:
   - **Documentação:** RG, CPF, comprovantes
   - **Exames Médicos:** Exames obrigatórios
   - **Tarefas Administrativas:** Formulários, contratos
   - **Validações:** Verificações de background

#### **B. Exemplos de Checklists**
1. **"Documentação Admissional"**
   - RG e CPF
   - Comprovante de residência
   - Certidão de nascimento
   - PIS/PASEP

2. **"Exames Médicos"**
   - Exame admissional
   - Exame psicológico
   - Exames complementares

3. **"Integração"**
   - Contrato assinado
   - Apresentação da empresa
   - Configuração de acesso
   - Uniforme entregue

#### **C. Progresso Automático**
- Quando 100% dos itens estiverem completos
- Candidato avança automaticamente para próxima etapa
- Notificação é enviada para responsável

---

## 📊 **5. Dashboard de Estatísticas**

### **O que é:**
- Visão geral de SLAs ativos
- Alertas pendentes
- Automatizações em execução
- Checklists configurados

### **Como usar:**
1. Vá para `/pipeline-config`
2. Selecione sua empresa
3. Veja as estatísticas no final da página
4. Monitore:
   - Quantos SLAs estão ativos
   - Quantos alertas precisam de atenção
   - Quantas automatizações estão funcionando
   - Quantos checklists estão configurados

---

## 🔧 **6. Integração com Pipeline Existente**

### **Melhorias Automáticas:**
- **Validação de Reprovação:** Agora é obrigatório informar motivo
- **Preenchimento de Vaga:** Automaticamente quando número de contratados atinge a quantidade
- **Visibilidade:** Vagas encerradas/preenchidas não aparecem nos filtros ativos

### **Como Aproveitar:**
1. **No Pipeline (`/pipeline`):**
   - Ao mover candidato para "Reprovado", será obrigatório selecionar motivo
   - Vagas preenchidas automaticamente não aparecerão mais nos filtros

2. **Nas Vagas (`/vagas`):**
   - Campo "Quantidade" para definir quantas posições estão abertas
   - Campo "Visível" para controlar manualmente a visibilidade

---

## 🎯 **7. Fluxo de Trabalho Recomendado**

### **Setup Inicial (1x por empresa):**
1. Vá para `/pipeline-config`
2. Configure motivos de reprovação (usar templates)
3. Configure SLAs para etapas principais (usar templates)
4. Configure automatizações básicas (usar templates)
5. Configure checklists para etapas finais (usar templates)

### **Uso Diário:**
1. **Pipeline:** Mover candidatos normalmente
2. **Alertas:** Verificar alertas de SLA pendentes
3. **Reprovações:** Sempre informar motivo obrigatório
4. **Checklists:** Marcar itens conforme completados

### **Monitoramento Semanal:**
1. Verificar estatísticas em `/pipeline-config`
2. Resolver alertas de SLA pendentes
3. Revisar logs de automatizações
4. Ajustar configurações conforme necessário

---

## 🚨 **8. Troubleshooting**

### **Problema: Não consigo reprovar candidato**
**Solução:** Verifique se há motivos de reprovação configurados para sua empresa

### **Problema: Alertas não aparecem**
**Solução:** Verifique se há SLAs configurados para a etapa

### **Problema: Candidato não avança automaticamente**
**Solução:** Verifique se o checklist está 100% completo

### **Problema: Automatização não executa**
**Solução:** Verifique os logs na aba "Automatizações"

---

## 📞 **9. Suporte**

Para dúvidas ou problemas:
1. Verifique este guia
2. Teste com dados de exemplo
3. Consulte os logs de erro
4. Entre em contato com o suporte técnico

---

**🎉 Agora você tem um sistema de pipeline completo e automatizado!** 