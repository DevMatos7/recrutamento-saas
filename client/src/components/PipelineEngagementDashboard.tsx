import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Clock, 
  AlertTriangle, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Filter,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

interface DashboardData {
  resumo: {
    totalCandidatos: number;
    totalSlaEstourado: number;
    totalCandidatosParados: number;
    tempoMedioGeral: number;
    taxaMovimentacaoGeral: number;
  };
  tempoMedioPorEtapa: Array<{
    etapa: string;
    tempoMedio: number;
    totalCandidatos: number;
    candidatosAtivos: number;
    taxaEngajamento: string;
  }>;
  etapasComDesistencia: Array<{
    etapa: string;
    totalCandidatos: number;
    candidatosReprovados: number;
    candidatosDesistiram: number;
    taxaDesistencia: string;
  }>;
  taxaMovimentacao: {
    movimentacoes: Array<{
      data: string;
      total: number;
    }>;
    totalCandidatos: number;
    taxaMovimentacao: string;
  };
  slaEstourado: Array<{
    candidatoId: string;
    candidatoNome: string;
    vagaId: string;
    vagaTitulo: string;
    etapa: string;
    diasNaEtapa: number;
    limiteSla: number;
    diasExcedidos: number;
    nivelUrgencia: string;
    responsavelNome?: string;
  }>;
  conversaoPorEtapa: Array<{
    etapaAtual: string;
    proximaEtapa: string;
    candidatosEtapaAtual: number;
    candidatosProximaEtapa: number;
    taxaConversao: number;
  }>;
  candidatosParados: Array<{
    candidatoId: string;
    candidatoNome: string;
    candidatoEmail: string;
    vagaId: string;
    vagaTitulo: string;
    etapa: string;
    diasParado: number;
    statusAlerta: string;
    responsavelNome?: string;
  }>;
  produtividadeRecrutadores: Array<{
    recrutadorId: string;
    recrutadorNome: string;
    recrutadorEmail: string;
    empresaNome: string;
    totalCandidatosResponsavel: number;
    candidatosMovimentados: number;
    tempoMedioResposta: number;
    entrevistasMarcadas: number;
    taxaProdutividade: string;
  }>;
}

interface PipelineEngagementDashboardProps {
  empresaId: string;
  vagaId?: string;
}

const COLORS = {
  primary: '#3b82f6',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4'
};

const STATUS_COLORS = {
  normal: '#10b981',
  atencao: '#f59e0b',
  alto: '#f97316',
  critico: '#ef4444'
};

const URGENCY_COLORS = {
  normal: '#10b981',
  atencao: '#f59e0b',
  alto: '#f97316',
  critico: '#ef4444'
};

export const PipelineEngagementDashboard: React.FC<PipelineEngagementDashboardProps> = ({
  empresaId,
  vagaId
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    showSlaEstourado: true,
    showCandidatosParados: true,
    showProdutividade: true,
    periodoDias: 30
  });

  useEffect(() => {
    fetchDashboardData();
  }, [empresaId, vagaId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (vagaId) params.append('vagaId', vagaId);
      
      const response = await fetch(`/api/analytics/pipeline-engajamento?${params}`);
      if (!response.ok) throw new Error('Erro ao carregar dados');
      
      const dashboardData = await response.json();
      console.log('Dashboard Data:', dashboardData);
      console.log('Produtividade Recrutadores:', dashboardData.produtividadeRecrutadores);
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!data) return;
    
    const csvContent = generateCSVContent(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `engajamento-pipeline-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateCSVContent = (data: DashboardData): string => {
    const headers = [
      'Métrica',
      'Valor',
      'Detalhes'
    ];

    const rows = [
      ['Total de Candidatos', data.resumo.totalCandidatos.toString(), ''],
      ['SLA Estourado', data.resumo.totalSlaEstourado.toString(), ''],
      ['Candidatos Parados', data.resumo.totalCandidatosParados.toString(), ''],
      ['Tempo Médio Geral', `${data.resumo.tempoMedioGeral} dias`, ''],
      ['Taxa de Movimentação', `${data.resumo.taxaMovimentacaoGeral}%`, '']
    ];

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-red-800">Erro: {error}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Análise de Engajamento no Pipeline</h1>
          <p className="text-gray-600">Métricas e indicadores de performance do recrutamento</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilters(prev => ({ ...prev, showSlaEstourado: !prev.showSlaEstourado }))}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              filters.showSlaEstourado 
                ? 'bg-red-100 text-red-700' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {filters.showSlaEstourado ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            SLA
          </button>
          <button
            onClick={() => setFilters(prev => ({ ...prev, showCandidatosParados: !prev.showCandidatosParados }))}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              filters.showCandidatosParados 
                ? 'bg-yellow-100 text-yellow-700' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {filters.showCandidatosParados ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            Parados
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Candidatos</p>
              <p className="text-2xl font-bold text-gray-900">{data.resumo.totalCandidatos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">SLA Estourado</p>
              <p className="text-2xl font-bold text-red-600">{data.resumo.totalSlaEstourado}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Candidatos Parados</p>
              <p className="text-2xl font-bold text-yellow-600">{data.resumo.totalCandidatosParados}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
              <p className="text-2xl font-bold text-green-600">{data.resumo.tempoMedioGeral}d</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Taxa Movimentação</p>
              <p className="text-2xl font-bold text-purple-600">{data.resumo.taxaMovimentacaoGeral}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tempo médio por etapa */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tempo Médio por Etapa</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.tempoMedioPorEtapa}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="etapa" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="tempoMedio" fill={COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Taxa de conversão */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Taxa de Conversão por Etapa</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.conversaoPorEtapa}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="etapaAtual" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="taxaConversao" fill={COLORS.success} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alertas e listas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SLA Estourado */}
        {filters.showSlaEstourado && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">SLA Estourado</h3>
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                {data.slaEstourado.length} alertas
              </span>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {data.slaEstourado.map((item, index) => (
                <div key={index} className="border-l-4 border-red-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{item.candidatoNome}</p>
                      <p className="text-sm text-gray-600">{item.vagaTitulo}</p>
                      <p className="text-xs text-gray-500">Etapa: {item.etapa}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        item.nivelUrgencia === 'critico' ? 'text-red-600' :
                        item.nivelUrgencia === 'alto' ? 'text-orange-600' :
                        'text-yellow-600'
                      }`}>
                        {item.diasExcedidos} dias excedidos
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.responsavelNome || 'Sem responsável'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {data.slaEstourado.length === 0 && (
                <p className="text-gray-500 text-center py-4">Nenhum SLA estourado</p>
              )}
            </div>
          </div>
        )}

        {/* Candidatos Parados */}
        {filters.showCandidatosParados && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Candidatos Parados</h3>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                {data.candidatosParados.length} candidatos
              </span>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {data.candidatosParados.map((item, index) => (
                <div key={index} className={`border-l-4 pl-4 py-2 ${
                  item.statusAlerta === 'critico' ? 'border-red-500' :
                  item.statusAlerta === 'alto' ? 'border-orange-500' :
                  'border-yellow-500'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{item.candidatoNome}</p>
                      <p className="text-sm text-gray-600">{item.vagaTitulo}</p>
                      <p className="text-xs text-gray-500">Etapa: {item.etapa}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        item.statusAlerta === 'critico' ? 'text-red-600' :
                        item.statusAlerta === 'alto' ? 'text-orange-600' :
                        'text-yellow-600'
                      }`}>
                        {item.diasParado} dias parado
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.responsavelNome || 'Sem responsável'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {data.candidatosParados.length === 0 && (
                <p className="text-gray-500 text-center py-4">Nenhum candidato parado</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Produtividade dos Recrutadores */}
      {filters.showProdutividade && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Produtividade dos Recrutadores</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recrutador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Candidatos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Movimentados
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tempo Médio Resposta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taxa Produtividade
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.produtividadeRecrutadores && data.produtividadeRecrutadores.length > 0 ? (
                  data.produtividadeRecrutadores.map((recrutador, index) => (
                    <tr key={index}>
                                          <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{recrutador.recrutadorNome}</div>
                        <div className="text-sm text-gray-500">{recrutador.recrutadorEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {recrutador.empresaNome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {recrutador.totalCandidatosResponsavel}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {recrutador.candidatosMovimentados}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {recrutador.tempoMedioResposta.toFixed(1)} dias
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          Number(recrutador.taxaProdutividade) > 80 ? 'bg-green-100 text-green-800' :
                          Number(recrutador.taxaProdutividade) > 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {recrutador.taxaProdutividade}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Nenhum recrutador encontrado ou sem dados de produtividade
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Taxa de Movimentação */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Taxa de Movimentação (Últimos 7 dias)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.taxaMovimentacao.movimentacoes}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="data" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="total" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}; 