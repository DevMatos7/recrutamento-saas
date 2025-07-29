# 🔍 Guia de Análise de Engajamento no Pipeline

## 📋 Visão Geral

A funcionalidade de **Análise de Engajamento no Pipeline** permite monitorar e analisar o comportamento dos candidatos ao longo das etapas do processo de recrutamento, fornecendo insights valiosos para otimizar a eficiência da equipe recrutadora.

## 🎯 Funcionalidades Principais

### 1. **Tempo Médio por Etapa**
- Calcula quantos dias, em média, os candidatos permanecem em cada etapa
- Identifica gargalos no processo de recrutamento
- Ajuda a otimizar fluxos de trabalho

### 2. **Etapas com Maior Desistência**
- Identifica etapas com maior taxa de abandono/reprovação
- Permite ajustar estratégias de retenção
- Analisa padrões de desistência

### 3. **Taxa de Movimentação**
- Monitora quantos candidatos foram movimentados entre etapas
- Acompanha a atividade da equipe recrutadora
- Identifica períodos de baixa atividade

### 4. **SLA Estourado**
- Alertas para candidatos que excederam o tempo limite
- Configuração de prazos por etapa
- Notificações automáticas

### 5. **Conversão por Etapa**
- Taxa de sucesso entre etapas consecutivas
- Identifica pontos de perda de candidatos
- Otimiza fluxo de aprovação

### 6. **Candidatos Parados**
- Lista de candidatos sem movimentação há mais de X dias
- Alertas visuais por nível de urgência
- Ações recomendadas

### 7. **Produtividade por Recrutador**
- Tempo médio de resposta por recrutador
- Número de triagens realizadas
- Entrevistas marcadas
- Taxa de produtividade

## 🚀 Como Implementar

### 1. **Executar Migração do Banco de Dados**

```bash
# Navegar para o diretório do projeto
cd /caminho/do/projeto

# Executar script de migração
node scripts/run-pipeline-engagement-migration.js
```

### 2. **Verificar Instalação**

Após a migração, as seguintes tabelas devem ser criadas:
- `logs_movimentacao_pipeline`
- `metricas_engajamento`
- `candidatos_parados`

### 3. **Reiniciar o Servidor**

```bash
# Parar o servidor atual (Ctrl+C)
# Reiniciar o servidor
npm run dev
```

## 📊 Como Usar o Dashboard

### **Acessando o Dashboard**

1. Faça login no sistema
2. Navegue para `/pipeline-engagement`
3. O dashboard será carregado automaticamente

### **Filtros Disponíveis**

- **Empresa**: Filtra por empresa específica
- **Vaga**: Filtra por vaga específica
- **Período**: Últimos 7, 15, 30, 60 ou 90 dias
- **Alertas**: Mostrar/ocultar SLA estourado e candidatos parados

### **Interpretando os Dados**

#### **Cards de Resumo**
- **Total Candidatos**: Número total de candidatos no pipeline
- **SLA Estourado**: Candidatos que excederam prazos
- **Candidatos Parados**: Candidatos sem movimentação há 3+ dias
- **Tempo Médio**: Tempo médio geral no pipeline
- **Taxa Movimentação**: Percentual de movimentações recentes

#### **Gráficos**
- **Tempo Médio por Etapa**: Barras mostrando tempo em cada etapa
- **Taxa de Conversão**: Percentual de avanço entre etapas
- **Taxa de Movimentação**: Linha temporal de movimentações

#### **Alertas**
- **SLA Estourado**: Lista de candidatos com prazos vencidos
- **Candidatos Parados**: Candidatos que precisam de atenção

## 🔧 Configurações Avançadas

### **Configurando SLAs por Etapa**

```sql
-- Exemplo: Configurar SLA de 5 dias para etapa 'triagem'
INSERT INTO slas_etapas (etapa_id, vaga_id, limite_dias, alerta_antes_dias)
VALUES ('triagem', 'vaga_id', 5, 2);
```

### **Personalizando Alertas**

```javascript
// No arquivo pipeline-engagement-service.ts
private calcularNivelUrgencia(diasNaEtapa: number, limiteSla: number): string {
  const diasExcedidos = diasNaEtapa - limiteSla;
  if (diasExcedidos <= 0) return "normal";
  if (diasExcedidos <= 2) return "atencao";  // Personalizar
  if (diasExcedidos <= 5) return "alto";     // Personalizar
  return "critico";
}
```

### **Exportando Dados**

O dashboard permite exportar dados em CSV:
1. Clique no botão "Exportar"
2. O arquivo será baixado automaticamente
3. Formato: `engajamento-pipeline-YYYY-MM-DD.csv`

## 📈 Métricas e KPIs

### **Métricas Principais**

| Métrica | Descrição | Meta |
|---------|-----------|------|
| Tempo Médio por Etapa | Dias em cada etapa | < 7 dias |
| Taxa de Conversão | % de avanço entre etapas | > 70% |
| SLA Estourado | Candidatos com prazo vencido | < 5% |
| Candidatos Parados | Sem movimentação há 3+ dias | < 10% |

### **Alertas por Nível**

- **🟢 Normal**: Dentro do prazo
- **🟡 Atenção**: 1-3 dias excedidos
- **🟠 Alto**: 4-7 dias excedidos
- **🔴 Crítico**: Mais de 7 dias excedidos

## 🔄 Integração com Sistema Existente

### **Logs Automáticos**

O sistema registra automaticamente:
- Movimentações de candidatos
- Tempo em cada etapa
- Responsável pela movimentação
- Motivo da movimentação

### **Triggers Automáticos**

- Atualização de candidatos parados
- Cálculo de métricas
- Notificações de SLA

### **APIs Disponíveis**

```javascript
// Dashboard completo
GET /api/analytics/pipeline-engajamento

// Métricas específicas
GET /api/analytics/pipeline-engajamento/tempo-medio
GET /api/analytics/pipeline-engajamento/desistencia
GET /api/analytics/pipeline-engajamento/movimentacao
GET /api/analytics/pipeline-engajamento/sla-estourado
GET /api/analytics/pipeline-engajamento/conversao
GET /api/analytics/pipeline-engajamento/candidatos-parados
GET /api/analytics/pipeline-engajamento/produtividade
```

## 🛠️ Manutenção

### **Limpeza de Dados**

```sql
-- Limpar logs antigos (mais de 90 dias)
DELETE FROM logs_movimentacao_pipeline 
WHERE data_movimentacao < CURRENT_DATE - INTERVAL '90 days';

-- Recalcular candidatos parados
SELECT calcular_candidatos_parados();

-- Gerar métricas para período específico
SELECT gerar_metricas_engajamento('empresa_id', 'mensal', '2024-01-01', '2024-01-31');
```

### **Monitoramento**

- Verificar logs de erro no console
- Monitorar performance das consultas
- Acompanhar uso de memória

## 🎯 Melhores Práticas

### **Para Recrutadores**

1. **Revisar alertas diariamente**
2. **Priorizar candidatos com SLA estourado**
3. **Contatar candidatos parados**
4. **Analisar etapas com baixa conversão**

### **Para Gestores**

1. **Monitorar métricas semanais**
2. **Identificar gargalos no processo**
3. **Ajustar SLAs conforme necessário**
4. **Treinar equipe em pontos críticos**

### **Para Administradores**

1. **Configurar SLAs adequados**
2. **Monitorar performance do sistema**
3. **Fazer backup regular dos dados**
4. **Atualizar métricas conforme necessário**

## 🆘 Solução de Problemas

### **Problemas Comuns**

#### **Dashboard não carrega**
- Verificar se a migração foi executada
- Confirmar se as rotas estão registradas
- Verificar logs do servidor

#### **Dados não atualizam**
- Verificar triggers do banco de dados
- Confirmar integração com pipeline-service
- Verificar logs de erro

#### **Performance lenta**
- Verificar índices do banco de dados
- Otimizar consultas complexas
- Considerar paginação para grandes volumes

### **Logs Úteis**

```bash
# Verificar logs do servidor
tail -f server.log

# Verificar erros de banco
SELECT * FROM logs_movimentacao_pipeline ORDER BY data_movimentacao DESC LIMIT 10;

# Verificar candidatos parados
SELECT * FROM candidatos_parados ORDER BY dias_parado DESC;
```

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar esta documentação
2. Consultar logs do sistema
3. Verificar configurações do banco de dados
4. Contatar equipe de desenvolvimento

---

**Versão**: 1.0  
**Data**: Janeiro 2024  
**Autor**: Equipe de Desenvolvimento GentePRO 