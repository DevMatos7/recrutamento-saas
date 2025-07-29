# 📊 Sistema de Análise de Engajamento no Pipeline

## 📋 Visão Geral

O **Sistema de Análise de Engajamento no Pipeline** é uma funcionalidade avançada do GentePRO que permite monitorar e analisar o comportamento dos candidatos ao longo das etapas do processo de recrutamento. O sistema fornece insights valiosos sobre eficiência, gargalos e oportunidades de melhoria no pipeline de recrutamento.

## 🎯 Objetivos

- **Monitorar performance**: Acompanhar tempo médio em cada etapa
- **Identificar gargalos**: Detectar etapas com maior abandono
- **Alertar SLA**: Notificar quando candidatos excedem prazos
- **Medir produtividade**: Avaliar eficiência dos recrutadores
- **Otimizar processo**: Fornecer dados para melhorias contínuas

## 🏗️ Arquitetura

### Backend (FastAPI + PostgreSQL)

#### Tabelas Principais

```sql
-- Logs de movimentação no pipeline
logs_movimentacao_pipeline
├── id (UUID)
├── vaga_candidato_id (UUID)
├── etapa_anterior (VARCHAR)
├── etapa_nova (VARCHAR)
├── tempo_na_etapa (INTEGER)
├── responsavel_id (UUID)
├── motivo_movimentacao (VARCHAR)
├── comentarios (TEXT)
├── data_movimentacao (TIMESTAMP)
└── dados_adicionais (JSONB)

-- Métricas agregadas de engajamento
metricas_engajamento
├── id (UUID)
├── vaga_id (UUID)
├── empresa_id (UUID)
├── etapa (VARCHAR)
├── periodo (VARCHAR)
├── data_inicio (DATE)
├── data_fim (DATE)
├── tempo_medio (DECIMAL)
├── total_candidatos (INTEGER)
├── candidatos_aprovados (INTEGER)
├── candidatos_reprovados (INTEGER)
├── candidatos_desistiram (INTEGER)
├── sla_estourado (INTEGER)
└── data_calculo (TIMESTAMP)

-- Candidatos parados/estagnados
candidatos_parados
├── id (UUID)
├── vaga_candidato_id (UUID)
├── etapa (VARCHAR)
├── dias_parado (INTEGER)
├── limite_sla (INTEGER)
├── status_alerta (VARCHAR)
├── responsavel_id (UUID)
├── ultima_atividade (TIMESTAMP)
├── data_calculo (TIMESTAMP)
├── notificado (BOOLEAN)
└── data_notificacao (TIMESTAMP)
```

#### Serviços

**PipelineEngagementService** (`server/services/pipeline-engagement-service.ts`)

```typescript
class PipelineEngagementService {
  // Métricas principais
  getTempoMedioPorEtapa(empresaId: string, vagaId?: string)
  getEtapasComMaiorDesistencia(empresaId: string, periodoDias: number)
  getTaxaMovimentacao(empresaId: string, periodoDias: number)
  getSlaEstourado(empresaId: string)
  getConversaoPorEtapa(empresaId: string, vagaId?: string)
  getCandidatosParados(empresaId: string, diasMinimo: number)
  getProdutividadeRecrutadores(empresaId: string, periodoDias: number)
  
  // Dashboard completo
  getDashboardEngajamento(empresaId: string, vagaId?: string)
  
  // Logs e auditoria
  registrarMovimentacao(params: MovimentacaoParams)
  atualizarCandidatosParados(vagaCandidatoId?: string)
}
```

#### APIs REST

```typescript
// Endpoints principais
GET /api/analytics/pipeline-engajamento          // Dashboard completo
GET /api/analytics/pipeline-engajamento/tempo-medio
GET /api/analytics/pipeline-engajamento/desistencia
GET /api/analytics/pipeline-engajamento/movimentacao
GET /api/analytics/pipeline-engajamento/sla-estourado
GET /api/analytics/pipeline-engajamento/conversao
GET /api/analytics/pipeline-engajamento/candidatos-parados
GET /api/analytics/pipeline-engajamento/produtividade
```

### Frontend (React + Tailwind CSS)

#### Componentes Principais

**PipelineEngagementPage** (`client/src/pages/PipelineEngagementPage.tsx`)
- Página principal com filtros e estrutura
- Integração com autenticação
- Seleção de vagas e períodos

**PipelineEngagementDashboard** (`client/src/components/PipelineEngagementDashboard.tsx`)
- Dashboard interativo com gráficos
- Cards de resumo
- Tabelas de alertas
- Exportação CSV

#### Bibliotecas Utilizadas

- **Recharts**: Gráficos interativos
- **Lucide React**: Ícones
- **Tailwind CSS**: Estilização
- **Wouter**: Roteamento

## 📊 Métricas e Indicadores

### 1. Tempo Médio por Etapa
- **Descrição**: Tempo médio que candidatos permanecem em cada etapa
- **Cálculo**: `AVG(data_movimentacao - data_entrada_etapa)`
- **Unidade**: Dias
- **Visualização**: Gráfico de barras

### 2. Taxa de Conversão por Etapa
- **Descrição**: Percentual de candidatos que avançam para próxima etapa
- **Cálculo**: `(candidatos_proxima_etapa / candidatos_etapa_atual) * 100`
- **Unidade**: Percentual (%)
- **Visualização**: Gráfico de barras

### 3. SLA Estourado
- **Descrição**: Candidatos que excederam o tempo limite da etapa
- **Cálculo**: `dias_na_etapa > limite_sla`
- **Níveis**: Normal, Atenção, Alto, Crítico
- **Visualização**: Lista com indicadores visuais

### 4. Candidatos Parados
- **Descrição**: Candidatos sem movimentação há X dias
- **Cálculo**: `data_atual - ultima_atividade > dias_minimo`
- **Configuração**: Dias mínimos configuráveis
- **Visualização**: Lista com status de alerta

### 5. Taxa de Movimentação
- **Descrição**: Volume de movimentações por período
- **Cálculo**: `COUNT(movimentacoes) / periodo_dias`
- **Unidade**: Movimentações/dia
- **Visualização**: Gráfico de área temporal

### 6. Produtividade por Recrutador
- **Descrição**: Eficiência individual dos recrutadores
- **Métricas**:
  - Total de candidatos responsável
  - Candidatos movimentados
  - Tempo médio de resposta
  - Taxa de produtividade
- **Visualização**: Tabela com indicadores

## 🚨 Sistema de Alertas

### Tipos de Alerta

1. **SLA Estourado**
   - 🟢 Normal: Dentro do prazo
   - 🟡 Atenção: 1-3 dias excedidos
   - 🟠 Alto: 4-7 dias excedidos
   - 🔴 Crítico: Mais de 7 dias excedidos

2. **Candidatos Parados**
   - 🟢 Normal: Menos de 3 dias
   - 🟡 Atenção: 3-5 dias parados
   - 🟠 Alto: 6-10 dias parados
   - 🔴 Crítico: Mais de 10 dias parados

### Notificações

- **Visual**: Indicadores coloridos no dashboard
- **Email**: Notificações automáticas (configurável)
- **Painel**: Alertas em tempo real
- **Configuração**: Limites personalizáveis por empresa

## 🎨 Interface do Usuário

### Dashboard Principal

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Análise de Engajamento no Pipeline                      │
├─────────────────────────────────────────────────────────────┤
│ [Filtros] [SLA] [Parados] [Exportar]                       │
├─────────────────────────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                    │
│ │ 👥  │ │ 🚨  │ │ ⏰  │ │ 📈  │ │ 📊  │                    │
│ │Total│ │ SLA │ │Par. │ │Tempo│ │Taxa │                    │
│ │ 150 │ │  5  │ │ 12  │ │ 4.2 │ │ 85% │                    │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                    │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐ ┌─────────────────────┐            │
│ │ Tempo Médio         │ │ Taxa de Conversão   │            │
│ │ [Gráfico de Barras] │ │ [Gráfico de Barras] │            │
│ └─────────────────────┘ └─────────────────────┘            │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐ ┌─────────────────────┐            │
│ │ SLA Estourado       │ │ Candidatos Parados  │            │
│ │ [Lista de Alertas]  │ │ [Lista de Candidatos]│            │
│ └─────────────────────┘ └─────────────────────┘            │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Produtividade dos Recrutadores                         │ │
│ │ [Tabela com Métricas]                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Filtros Disponíveis

- **Vaga**: Filtrar por vaga específica
- **Período**: Últimos 7, 15, 30, 60, 90 dias
- **Etapa**: Filtrar por etapa específica
- **Recrutador**: Filtrar por responsável
- **Status**: Normal, Atenção, Alto, Crítico

## 🔧 Configuração e Instalação

### Pré-requisitos

- Node.js 18+
- PostgreSQL 12+
- Drizzle ORM
- React 18+
- Tailwind CSS

### Instalação

1. **Executar Migração**
```bash
node scripts/run-pipeline-engagement-migration.js
```

2. **Verificar Tabelas**
```sql
-- Verificar se as tabelas foram criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%pipeline%';
```

3. **Configurar SLAs**
```sql
-- Inserir configurações de SLA por etapa
INSERT INTO slas_etapas (etapa, limite_dias, empresa_id) 
VALUES ('Triagem', 3, 'empresa_id');
```

### Variáveis de Ambiente

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/gente_pro

# API Configuration
NODE_ENV=development
PORT=5000
```

## 📈 Uso e Funcionalidades

### Acessando o Dashboard

1. **Login**: Acesse o sistema com perfil admin, recrutador ou gestor
2. **Navegação**: Menu → "Análise de Engajamento"
3. **URL**: `http://localhost:5000/pipeline-engagement`

### Interpretando os Dados

#### Cards de Resumo
- **Total Candidatos**: Número total de candidatos ativos
- **SLA Estourado**: Candidatos com prazo excedido
- **Candidatos Parados**: Candidatos sem movimentação
- **Tempo Médio**: Tempo médio geral no pipeline
- **Taxa Movimentação**: Percentual de movimentações

#### Gráficos
- **Tempo Médio por Etapa**: Identificar gargalos
- **Taxa de Conversão**: Avaliar eficiência das etapas
- **Taxa de Movimentação**: Monitorar atividade temporal

#### Alertas
- **SLA Estourado**: Priorizar candidatos urgentes
- **Candidatos Parados**: Identificar candidatos esquecidos
- **Produtividade**: Avaliar performance dos recrutadores

### Exportação de Dados

1. **CSV**: Clique em "Exportar" para baixar relatório
2. **Filtros**: Exportação respeita filtros aplicados
3. **Formato**: Dados estruturados para análise externa

## 🔄 Integração com Sistema Existente

### Pipeline Service

O sistema se integra automaticamente com o pipeline existente:

```typescript
// Em pipeline-service.ts
async moverCandidatoPipeline(params) {
  // Lógica existente...
  
  // Integração com engajamento
  try {
    await engagementService.registrarMovimentacao({
      vagaCandidatoId: params.vagaCandidatoId,
      etapaAnterior: etapaAnterior,
      etapaNova: params.novaEtapa,
      responsavelId: params.responsavelId,
      motivoMovimentacao: params.motivo
    });
  } catch (error) {
    console.error('Erro ao registrar movimentação:', error);
  }
}
```

### Triggers Automáticos

```sql
-- Trigger para atualizar candidatos parados
CREATE TRIGGER trigger_candidatos_parados_update
AFTER UPDATE ON vaga_candidatos
FOR EACH ROW
EXECUTE FUNCTION trigger_atualizar_candidatos_parados();
```

## 🛠️ Manutenção e Troubleshooting

### Problemas Comuns

#### 1. Erro de Coluna não Encontrada
```sql
-- Verificar se as colunas existem
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'logs_movimentacao_pipeline';
```

#### 2. Dados não Atualizando
```sql
-- Verificar triggers
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'vaga_candidatos';
```

#### 3. Performance Lenta
```sql
-- Verificar índices
SELECT indexname, tablename FROM pg_indexes 
WHERE tablename LIKE '%pipeline%';
```

### Logs e Monitoramento

```typescript
// Logs importantes
console.log('Movimentação registrada:', movimentacao);
console.log('SLA estourado detectado:', candidato);
console.log('Candidato parado:', candidato);
```

### Backup e Recuperação

```sql
-- Backup das tabelas de engajamento
pg_dump -t logs_movimentacao_pipeline -t metricas_engajamento -t candidatos_parados database_name > backup_engajamento.sql
```

## 📚 Melhores Práticas

### Configuração de SLAs

1. **Definir Limites Realistas**
   - Triagem: 2-3 dias
   - Entrevista: 5-7 dias
   - Teste: 3-5 dias
   - Decisão: 2-3 dias

2. **Monitorar Regularmente**
   - Revisar métricas semanalmente
   - Ajustar limites conforme necessário
   - Treinar equipe sobre alertas

### Uso do Dashboard

1. **Filtros Estratégicos**
   - Usar filtros por vaga para análises específicas
   - Comparar períodos diferentes
   - Focar em etapas problemáticas

2. **Ações Baseadas em Dados**
   - Priorizar candidatos com SLA estourado
   - Contatar candidatos parados
   - Treinar recrutadores com baixa produtividade

### Performance

1. **Otimização de Queries**
   - Usar índices adequados
   - Limitar períodos de análise
   - Implementar cache quando necessário

2. **Manutenção Regular**
   - Limpar logs antigos
   - Atualizar estatísticas
   - Monitorar crescimento das tabelas

## 🔮 Roadmap e Melhorias Futuras

### Próximas Funcionalidades

1. **Notificações Push**
   - Alertas em tempo real
   - Integração com WhatsApp/Email
   - Configuração personalizada

2. **Relatórios Avançados**
   - Relatórios PDF
   - Gráficos interativos
   - Comparação entre períodos

3. **Machine Learning**
   - Predição de abandono
   - Recomendações de otimização
   - Análise de padrões

4. **Integração Externa**
   - Webhooks para sistemas externos
   - API para terceiros
   - Exportação para BI tools

### Melhorias Técnicas

1. **Cache Redis**
   - Cache de métricas frequentes
   - Melhoria de performance
   - Redução de carga no banco

2. **Background Jobs**
   - Processamento assíncrono
   - Cálculo de métricas em background
   - Notificações em lote

3. **Monitoramento Avançado**
   - Métricas de performance
   - Alertas de sistema
   - Logs estruturados

## 📞 Suporte e Contato

### Documentação Técnica
- **Schema**: `shared/schema.ts`
- **Serviços**: `server/services/pipeline-engagement-service.ts`
- **APIs**: `server/routes.ts`
- **Frontend**: `client/src/pages/PipelineEngagementPage.tsx`

### Logs de Erro
- **Backend**: Console do servidor
- **Frontend**: Console do navegador
- **Database**: Logs do PostgreSQL

### Troubleshooting
1. Verificar conectividade com banco
2. Confirmar permissões de usuário
3. Validar dados de entrada
4. Revisar logs de erro

---

**Versão**: 1.0.0  
**Última Atualização**: Julho 2025  
**Autor**: Equipe GentePRO  
**Status**: ✅ Produção 