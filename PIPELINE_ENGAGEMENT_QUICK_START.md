# 🚀 Guia de Início Rápido - Análise de Engajamento

## ⚡ Acesso Rápido

### 1. Acessar o Dashboard
```
URL: http://192.168.77.3:5000/pipeline-engagement
Menu: Análise de Engajamento
```

### 2. Primeira Visualização
- **Cards de Resumo**: Métricas principais no topo
- **Gráficos**: Tempo médio e conversão por etapa
- **Alertas**: SLA estourado e candidatos parados
- **Produtividade**: Performance dos recrutadores

## 📊 Interpretação Rápida dos Dados

### 🟢 Verde = Bom
- SLA dentro do prazo
- Candidatos ativos
- Alta taxa de conversão

### 🟡 Amarelo = Atenção
- 1-3 dias excedidos
- Candidatos parados há 3-5 dias
- Taxa de conversão média

### 🟠 Laranja = Alto
- 4-7 dias excedidos
- Candidatos parados há 6-10 dias
- Baixa produtividade

### 🔴 Vermelho = Crítico
- Mais de 7 dias excedidos
- Candidatos parados há mais de 10 dias
- SLA estourado

## 🎯 Ações Imediatas

### 1. SLA Estourado
```
✅ Priorizar candidatos com SLA estourado
✅ Contatar responsável pela etapa
✅ Mover candidato para próxima etapa
```

### 2. Candidatos Parados
```
✅ Entrar em contato com candidato
✅ Verificar se ainda tem interesse
✅ Atualizar status no sistema
```

### 3. Baixa Conversão
```
✅ Analisar etapa problemática
✅ Revisar critérios de avaliação
✅ Treinar recrutador responsável
```

## 🔧 Filtros Essenciais

### Por Vaga
- Selecione vaga específica para análise detalhada
- Compare performance entre vagas

### Por Período
- **7 dias**: Análise semanal
- **30 dias**: Análise mensal
- **90 dias**: Tendências de longo prazo

### Por Status
- **Crítico**: Ação imediata necessária
- **Alto**: Atenção prioritária
- **Atenção**: Monitoramento
- **Normal**: Funcionando bem

## 📈 Métricas Importantes

### Tempo Médio por Etapa
- **Ideal**: 2-5 dias por etapa
- **Atenção**: 5-10 dias
- **Crítico**: Mais de 10 dias

### Taxa de Conversão
- **Excelente**: 80%+
- **Boa**: 60-80%
- **Atenção**: 40-60%
- **Crítico**: Menos de 40%

### Produtividade Recrutador
- **Alta**: 80%+
- **Média**: 60-80%
- **Baixa**: Menos de 60%

## 🚨 Alertas Automáticos

### SLA Estourado
- Sistema detecta automaticamente
- Indicadores visuais no dashboard
- Lista priorizada por urgência

### Candidatos Parados
- Configurável por empresa
- Padrão: 3 dias sem movimentação
- Notificação visual e por email

## 📋 Checklist Diário

### ✅ Manhã (9h)
- [ ] Verificar SLA estourado
- [ ] Revisar candidatos parados
- [ ] Priorizar ações do dia

### ✅ Tarde (14h)
- [ ] Atualizar status de candidatos
- [ ] Verificar produtividade da equipe
- [ ] Analisar tendências do dia

### ✅ Fim do Dia (17h)
- [ ] Finalizar movimentações pendentes
- [ ] Registrar observações
- [ ] Planejar ações do próximo dia

## 🔄 Integração com Pipeline

### Movimentação Automática
- Cada mudança de etapa é registrada
- Tempo na etapa é calculado automaticamente
- Métricas são atualizadas em tempo real

### Logs de Auditoria
- Histórico completo de movimentações
- Responsável por cada ação
- Motivo da movimentação

## 📊 Exportação de Dados

### Relatório CSV
1. Clique em "Exportar"
2. Selecione período desejado
3. Baixe arquivo CSV
4. Use em Excel/Google Sheets

### Dados Incluídos
- Métricas por etapa
- Candidatos com SLA estourado
- Produtividade por recrutador
- Taxas de conversão

## 🛠️ Configuração Inicial

### 1. Definir SLAs
```sql
-- Exemplo de configuração
INSERT INTO slas_etapas (etapa, limite_dias, empresa_id) VALUES
('Triagem', 3, 'sua_empresa_id'),
('Entrevista', 7, 'sua_empresa_id'),
('Teste', 5, 'sua_empresa_id'),
('Decisão', 3, 'sua_empresa_id');
```

### 2. Configurar Alertas
- Dias mínimos para candidatos parados
- Limites de SLA por etapa
- Notificações por email

### 3. Treinar Equipe
- Como interpretar métricas
- Ações baseadas em alertas
- Uso dos filtros

## 🎯 Objetivos SMART

### Semana 1
- [ ] Configurar SLAs para todas as etapas
- [ ] Treinar equipe no uso do dashboard
- [ ] Estabelecer rotina de verificação

### Semana 2
- [ ] Reduzir SLA estourado em 50%
- [ ] Contatar todos os candidatos parados
- [ ] Analisar gargalos identificados

### Mês 1
- [ ] Aumentar taxa de conversão em 20%
- [ ] Reduzir tempo médio por etapa em 30%
- [ ] Implementar melhorias baseadas em dados

## 📞 Suporte Rápido

### Problemas Comuns
1. **Dashboard não carrega**: Verificar login e permissões
2. **Dados desatualizados**: Aguardar 5 minutos para atualização
3. **Erro de exportação**: Verificar filtros aplicados

### Contatos
- **Técnico**: Verificar logs do servidor
- **Funcional**: Consultar documentação completa
- **Urgente**: Reiniciar aplicação se necessário

---

**💡 Dica**: Use o dashboard diariamente para identificar tendências e tomar ações preventivas antes que problemas se tornem críticos.

**🎯 Meta**: Transformar dados em ações que melhorem a eficiência do recrutamento e a experiência dos candidatos. 