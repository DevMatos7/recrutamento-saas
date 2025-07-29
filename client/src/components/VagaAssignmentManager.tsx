import React, { useState, useEffect } from 'react';
import { Briefcase, UserCheck, AlertCircle, Users, RefreshCw, CheckCircle, Zap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface Vaga {
  id: string;
  titulo: string;
  status: string;
  responsavelId?: string;
  responsavelNome?: string;
  responsavelEmail?: string;
  totalCandidatos: number;
  candidatosSemResponsavel: number;
}

interface Recrutador {
  id: string;
  nome: string;
  email: string;
  empresaNome: string;
}

const VagaAssignmentManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Usar useQuery para buscar vagas
  const { data: vagas = [], isLoading: loadingVagas, error: errorVagas, refetch: refetchVagas } = useQuery({
    queryKey: ['/api/vagas/with-responsavel'],
    queryFn: async () => {
      console.log('Iniciando busca de vagas via useQuery...');
      const response = await apiRequest('GET', '/api/vagas/with-responsavel');
      const data = await response.json();
      console.log('Vagas data recebida via useQuery:', data);
      console.log('Tipo de data:', typeof data);
      console.log('É array?', Array.isArray(data));
      console.log('Length:', data.length);
      return data;
    },
  });

  // Usar useQuery para buscar recrutadores
  const { data: recrutadores = [], isLoading: loadingRecrutadores, error: errorRecrutadores } = useQuery({
    queryKey: ['/api/usuarios'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/usuarios?perfil=recrutador,admin,gestor');
      return await response.json();
    },
  });

  const loading = loadingVagas || loadingRecrutadores;

  console.log('Dados carregados via useQuery:', { 
    vagas: vagas.length, 
    recrutadores: recrutadores.length 
  });

  const handleAssignResponsavelVaga = async (vagaId: string, responsavelId: string) => {
    try {
      setSaving(true);
      
      console.log('Atribuindo responsável à vaga:', { vagaId, responsavelId });
      
      const response = await apiRequest('PUT', `/api/vagas/${vagaId}/assign-responsavel`, { responsavelId });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Responsável atribuído com sucesso:', result);
        setMessage({ type: 'success', text: result.message });
        
        // Recarregar dados
        queryClient.invalidateQueries({ queryKey: ['/api/vagas/with-responsavel'] });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na resposta:', errorData);
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro ao atribuir responsável à vaga:', error);
      setMessage({ type: 'error', text: `Erro ao atribuir responsável: ${error instanceof Error ? error.message : 'Erro desconhecido'}` });
    } finally {
      setSaving(false);
    }
  };

  const handleAutoAssignCandidates = async (vagaId: string) => {
    try {
      setSaving(true);
      
      console.log('Executando atribuição automática para vaga:', vagaId);
      
      const response = await apiRequest('POST', `/api/vagas/${vagaId}/auto-assign-candidates`);

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Atribuição automática bem-sucedida:', result);
        setMessage({ type: 'success', text: result.message });
        
        // Recarregar dados
        queryClient.invalidateQueries({ queryKey: ['/api/vagas/with-responsavel'] });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na resposta:', errorData);
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro na atribuição automática:', error);
      setMessage({ type: 'error', text: `Erro na atribuição automática: ${error instanceof Error ? error.message : 'Erro desconhecido'}` });
    } finally {
      setSaving(false);
    }
  };

  const handleGlobalAutoAssign = async () => {
    try {
      setSaving(true);
      
      console.log('Executando atribuição automática global');
      
      const response = await apiRequest('POST', '/api/vagas/global-auto-assign');

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Atribuição global bem-sucedida:', result);
        setMessage({ type: 'success', text: result.message });
        
        // Recarregar dados
        queryClient.invalidateQueries({ queryKey: ['/api/vagas/with-responsavel'] });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na resposta:', errorData);
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro na atribuição global:', error);
      setMessage({ type: 'error', text: `Erro na atribuição global: ${error instanceof Error ? error.message : 'Erro desconhecido'}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const vagasComResponsavel = vagas.filter((v: Vaga) => v.responsavelId);
  const vagasSemResponsavel = vagas.filter((v: Vaga) => !v.responsavelId);
  const totalCandidatosSemResponsavel = vagas.reduce((sum: number, v: Vaga) => sum + v.candidatosSemResponsavel, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciador de Vagas</h2>
          <p className="text-gray-600">Atribua responsáveis às vagas para automatizar a distribuição de candidatos</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => refetchVagas()}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
          
          {totalCandidatosSemResponsavel > 0 && (
            <button
              onClick={handleGlobalAutoAssign}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Zap className="h-4 w-4" />
              <span>Atribuição Global</span>
            </button>
          )}
        </div>
      </div>

      {/* Mensagem de status */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-2">
            <Briefcase className="h-6 w-6 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Vagas</p>
              <p className="text-2xl font-bold text-gray-900">{vagas.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-2">
            <UserCheck className="h-6 w-6 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Com Responsável</p>
              <p className="text-2xl font-bold text-gray-900">{vagasComResponsavel.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-6 w-6 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Sem Responsável</p>
              <p className="text-2xl font-bold text-gray-900">{vagasSemResponsavel.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Candidatos Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{totalCandidatosSemResponsavel}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vagas sem responsável */}
      {vagasSemResponsavel.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Vagas sem Responsável</h3>
            <p className="text-sm text-gray-600">Atribua recrutadores responsáveis para automatizar a distribuição</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vaga</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidatos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsável</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vagasSemResponsavel.map((vaga: Vaga) => (
                  <tr key={vaga.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{vaga.titulo}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        vaga.status === 'aberta' ? 'bg-green-100 text-green-800' :
                        vaga.status === 'encerrada' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {vaga.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {vaga.totalCandidatos} total
                        {vaga.candidatosSemResponsavel > 0 && (
                          <span className="text-orange-600 ml-2">
                            ({vaga.candidatosSemResponsavel} sem responsável)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        onChange={(e) => handleAssignResponsavelVaga(vaga.id, e.target.value)}
                        disabled={saving}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecionar responsável...</option>
                        {recrutadores.map((rec: Recrutador) => (
                          <option key={rec.id} value={rec.id}>
                            {rec.nome} ({rec.empresaNome})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      {vaga.candidatosSemResponsavel > 0 && (
                        <button
                          onClick={() => handleAutoAssignCandidates(vaga.id)}
                          disabled={saving || !vaga.responsavelId}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                        >
                          Atribuir Candidatos
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vagas com responsável */}
      {vagasComResponsavel.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Vagas com Responsável</h3>
            <p className="text-sm text-gray-600">Vagas que já possuem recrutador responsável</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vaga</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsável</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidatos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vagasComResponsavel.map((vaga: Vaga) => (
                  <tr key={vaga.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{vaga.titulo}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        vaga.status === 'aberta' ? 'bg-green-100 text-green-800' :
                        vaga.status === 'encerrada' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {vaga.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{vaga.responsavelNome}</div>
                        <div className="text-sm text-gray-500">{vaga.responsavelEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {vaga.totalCandidatos} total
                        {vaga.candidatosSemResponsavel > 0 && (
                          <span className="text-orange-600 ml-2">
                            ({vaga.candidatosSemResponsavel} sem responsável)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {vaga.candidatosSemResponsavel > 0 && (
                        <button
                          onClick={() => handleAutoAssignCandidates(vaga.id)}
                          disabled={saving}
                          className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50"
                        >
                          Atribuir Candidatos
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {vagas.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma vaga encontrada</p>
        </div>
      )}
    </div>
  );
};

export default VagaAssignmentManager; 