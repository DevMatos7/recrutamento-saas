# Módulo Quadro Ideal — Frontend

## Visão Geral

Este módulo permite a gestão estratégica do quadro ideal de colaboradores por empresa, departamento e cargo, com dashboard visual, cadastro/edição, importação, alertas, solicitações de vaga, histórico e exportação de relatórios.

---

## Funcionalidades

- Dashboard visual com cards, gráficos e filtros dinâmicos
- Cadastro e edição de quadro ideal
- Importação via CSV (ideal e real)
- Visualização e aprovação de solicitações de vaga
- Histórico de alterações
- Exportação de relatórios (.xlsx, .pdf)

---

## Estrutura de Páginas/Componentes

```
/pages
  QuadroIdealDashboard.tsx      # Dashboard principal
  QuadroIdealForm.tsx           # Cadastro/edição
  SolicitacoesVaga.tsx          # Solicitações de vaga
  QuadroIdealHistorico.tsx      # Histórico de alterações
/components/quadroIdeal
  DashboardCard.tsx             # Card visual
  FiltrosQuadroIdeal.tsx        # Filtros dinâmicos
  QuadroIdealBarChart.tsx       # Gráfico de barras
  QuadroIdealLineChart.tsx      # Gráfico de linha
  ImportCSVModal.tsx            # Modal de importação CSV
  ExportButtons.tsx             # Botões de exportação
  QuadroIdealForm.tsx           # Formulário reutilizável
/hooks
  useAlertasQuadroIdeal.ts      # Hook para alertas/gaps
```

---

## Fluxo de Uso

1. **Dashboard**: `/quadro-ideal` — Visualize cards, gráficos e filtros.
2. **Cadastro**: Clique em “+ Adicionar Quadro Ideal” ou “Editar” para criar/editar registros.
3. **Importação**: Use os botões “Importar Quadro Ideal/Real (CSV)” para importar dados em massa.
4. **Solicitações de Vaga**: Acesse `/solicitacoes-vaga` para aprovar/reprovar solicitações.
5. **Histórico**: Clique em “Histórico” em cada card para ver alterações.
6. **Exportação**: Use os botões de exportação para baixar relatórios em Excel ou PDF.

---

## Exemplos de Testes Automatizados (Jest + React Testing Library)

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardCard } from './components/quadroIdeal/DashboardCard';

describe('DashboardCard', () => {
  it('exibe dados corretamente', () => {
    render(<DashboardCard title="Vendedor - Vendas" ideal={10} atual={8} gap={-2} status="crítico" cor="vermelho" />);
    expect(screen.getByText('Vendedor - Vendas')).toBeInTheDocument();
    expect(screen.getByText('Ideal:')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('Status: crítico')).toBeInTheDocument();
  });
});
```

---

## Dicas de Teste Manual

- Use Postman/Insomnia para testar endpoints da API.
- Faça login no sistema e navegue até `/quadro-ideal` para testar o fluxo completo.
- Importe arquivos CSV de exemplo para validar a importação.
- Aprove/reprove solicitações de vaga e verifique o status.
- Exporte relatórios e abra os arquivos gerados.

---

## Observações

- Para integração real, troque os mocks de empresas/departamentos por fetch da API.
- O módulo é responsivo e pronto para uso em desktop e mobile.

---

Dúvidas? Consulte a equipe de desenvolvimento. 