import React, { useState, useEffect } from 'react';
import { 
  User, 
  Briefcase, 
  Users, 
  Save, 
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Candidato {
  id: string;
  nome: string;
  email: string;
  responsavelId?: string;
  responsavelNome?: string;
}

interface Vaga {
  id: string;
  titulo: string;
  status: string;
}

interface Recrutador {
  id: string;
  nome: string;
  email: string;
  empresaNome: string;
}

interface VagaCandidato {
  id: string;
  candidatoId: string;
  vagaId: string;
  responsavelId?: string;
  candidatoNome: string;
  vagaTitulo: string;
  responsavelNome?: string;
}

const CandidateAssignment: React.FC = () => {
  const [vagaCandidatos, setVagaCandidatos] = useState<VagaCandidato[]>([]);
  const [recrutadores, setRecrutadores] = useState<Recrutador[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar vaga-candidatos
      const vcResponse = await fetch('/api/vaga-candidatos', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!vcResponse.ok) {
        throw new Error(`Erro ${vcResponse.status}: ${vcResponse.statusText}`);
      }
      
      const vcData = await vcResponse.json();
      setVagaCandidatos(vcData);

      // Buscar recrutadores
      const recResponse = await fetch('/api/usuarios?perfil=recrutador,admin,gestor', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!recResponse.ok) {
        throw new Error(`Erro ${recResponse.status}: ${recResponse.statusText}`);
      }
      
      const recData = await recResponse.json();
      setRecrutadores(recData);
      
      console.log('Dados reais carregados:', { 
        candidatos: vcData.length, 
        recrutadores: recData.length 
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar dados. Verifique se está logado.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRecruiter = async (vagaCandidatoId: string, recrutadorId: string) => {
    try {
      setSaving(true);
      
      console.log('Atribuindo recrutador:', { vagaCandidatoId, recrutadorId });
      
      const response = await fetch(`/api/vaga-candidatos/${vagaCandidatoId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ responsavelId: recrutadorId }),
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Atribuição bem-sucedida:', result);
        setMessage({ type: 'success', text: 'Recrutador atribuído com sucesso!' });
        
        // Atualizar localmente primeiro
        const recrutador = recrutadores.find(r => r.id === recrutadorId);
        if (recrutador) {
          setVagaCandidatos(prev => 
            prev.map(vc => 
              vc.id === vagaCandidatoId 
                ? { ...vc, responsavelId: recrutadorId, responsavelNome: recrutador.nome }
                : vc
            )
          );
        }
        
        // Recarregar dados do servidor após 1 segundo
        setTimeout(() => {
          fetchData();
        }, 1000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na resposta:', errorData);
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro ao atribuir recrutador:', error);
      setMessage({ type: 'error', text: `Erro ao atribuir recrutador: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAssign = async (recrutadorId: string) => {
    try {
      setSaving(true);
      
      const candidatosSemResponsavel = vagaCandidatos.filter(vc => !vc.responsavelId);
      
      for (const vc of candidatosSemResponsavel.slice(0, 5)) { // Limitar a 5 por vez
        await handleAssignRecruiter(vc.id, recrutadorId);
      }
      
      setMessage({ type: 'success', text: 'Atribuição em lote concluída!' });
    } catch (error) {
      console.error('Erro:', error);
      setMessage({ type: 'error', text: 'Erro na atribuição em lote' });
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

  const candidatosSemResponsavel = vagaCandidatos.filter(vc => !vc.responsavelId);
  const candidatosComResponsavel = vagaCandidatos.filter(vc => vc.responsavelId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Atribuição de Candidatos</h2>
          <p className="text-gray-600">Vincule candidatos a vagas e recrutadores</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </button>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Candidatos</p>
              <p className="text-2xl font-bold text-gray-900">{vagaCandidatos.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-2">
            <User className="h-6 w-6 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Com Responsável</p>
              <p className="text-2xl font-bold text-gray-900">{candidatosComResponsavel.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-6 w-6 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Sem Responsável</p>
              <p className="text-2xl font-bold text-gray-900">{candidatosSemResponsavel.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Candidatos sem responsável */}
      {candidatosSemResponsavel.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Candidatos sem Responsável</h3>
            <p className="text-sm text-gray-600">Atribua recrutadores aos candidatos pendentes</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vaga</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recrutador</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {candidatosSemResponsavel.map((vc) => (
                  <tr key={vc.id}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{vc.candidatoNome}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{vc.vagaTitulo}</div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        onChange={(e) => handleAssignRecruiter(vc.id, e.target.value)}
                        disabled={saving}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecionar recrutador...</option>
                        {recrutadores.map((rec) => (
                          <option key={rec.id} value={rec.id}>
                            {rec.nome} ({rec.empresaNome})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleBulkAssign(recrutadores[0]?.id || '')}
                        disabled={saving || !recrutadores.length}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                      >
                        Atribuir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Candidatos com responsável */}
      {candidatosComResponsavel.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Candidatos com Responsável</h3>
            <p className="text-sm text-gray-600">Candidatos já atribuídos a recrutadores</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vaga</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsável</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {candidatosComResponsavel.map((vc) => (
                  <tr key={vc.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{vc.candidatoNome}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{vc.vagaTitulo}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{vc.responsavelNome}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {vagaCandidatos.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum candidato encontrado</p>
        </div>
      )}
    </div>
  );
};

export default CandidateAssignment; 