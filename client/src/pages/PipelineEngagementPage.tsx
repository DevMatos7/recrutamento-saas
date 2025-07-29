import React, { useState, useEffect } from 'react';
import { PipelineEngagementDashboard } from '../components/PipelineEngagementDashboard';
import { useAuth } from '../hooks/use-auth';
import { 
  BarChart3, 
  Settings, 
  RefreshCw, 
  Calendar,
  Building,
  Briefcase
} from 'lucide-react';

interface Vaga {
  id: string;
  titulo: string;
  status: string;
}

const PipelineEngagementPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedVaga, setSelectedVaga] = useState<string>('');
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [loading, setLoading] = useState(false);
  const [periodoDias, setPeriodoDias] = useState(30);

  useEffect(() => {
    if (user?.empresaId) {
      fetchVagas();
    }
  }, [user?.empresaId]);

  const fetchVagas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vagas');
      if (response.ok) {
        const vagasData = await response.json();
        setVagas(vagasData.filter((vaga: Vaga) => vaga.status !== 'encerrada'));
      }
    } catch (error) {
      console.error('Erro ao carregar vagas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header da página */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Análise de Engajamento
                </h1>
                <p className="text-gray-600">
                  Monitoramento e métricas do pipeline de recrutamento
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <select
                  value={periodoDias}
                  onChange={(e) => setPeriodoDias(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={7}>Últimos 7 dias</option>
                  <option value={15}>Últimos 15 dias</option>
                  <option value={30}>Últimos 30 dias</option>
                  <option value={60}>Últimos 60 dias</option>
                  <option value={90}>Últimos 90 dias</option>
                </select>
              </div>
              
              <button
                onClick={fetchVagas}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Empresa:</span>
                <span className="text-sm text-gray-900">{user.empresaNome || 'N/A'}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Briefcase className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Vaga:</span>
                <select
                  value={selectedVaga}
                  onChange={(e) => setSelectedVaga(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas as vagas</option>
                  {vagas.map((vaga) => (
                    <option key={vaga.id} value={vaga.id}>
                      {vaga.titulo}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Settings className="h-4 w-4" />
              <span>Configurações avançadas</span>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        <PipelineEngagementDashboard 
          empresaId={user.empresaId} 
          vagaId={selectedVaga || undefined}
        />

        {/* Informações adicionais */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Como interpretar os dados</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-900">Tempo Médio por Etapa</p>
                <p>Indica quantos dias os candidatos permanecem em cada etapa do processo.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Taxa de Conversão</p>
                <p>Percentual de candidatos que avançam de uma etapa para a próxima.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">SLA Estourado</p>
                <p>Candidatos que excederam o tempo limite definido para cada etapa.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas e Notificações</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Crítico: Mais de 7 dias excedidos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Alto: 4-7 dias excedidos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Atenção: 1-3 dias excedidos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Normal: Dentro do prazo</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Recomendadas</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-900">SLA Estourado</p>
                <p>Priorize candidatos com SLA estourado para evitar perda de talentos.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Candidatos Parados</p>
                <p>Entre em contato com candidatos parados há mais de 3 dias.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Baixa Conversão</p>
                <p>Analise etapas com baixa conversão para identificar gargalos.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer com informações técnicas */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              <p>Dados atualizados em tempo real • Última atualização: {new Date().toLocaleString('pt-BR')}</p>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Período: {periodoDias} dias</span>
              <span>•</span>
              <span>Vagas ativas: {vagas.length}</span>
              <span>•</span>
              <span>Usuário: {user.nome}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineEngagementPage; 