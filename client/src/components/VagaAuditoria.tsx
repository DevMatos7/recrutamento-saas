import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface AuditoriaItem {
  id: string;
  vagaId: string;
  usuarioId: string;
  acao: string;
  detalhes: string | null;
  data: string;
  usuario?: {
    nome: string;
    email: string;
  };
}

interface VagaAuditoriaProps {
  vagaId: string;
  onClose: () => void;
}

const VagaAuditoria: React.FC<VagaAuditoriaProps> = ({ vagaId, onClose }) => {
  const [auditoria, setAuditoria] = useState<AuditoriaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuditoria = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/vagas/${vagaId}/auditoria`, {
          withCredentials: true
        });
        setAuditoria(Array.isArray(response.data) ? response.data : []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar histórico de auditoria');
      } finally {
        setLoading(false);
      }
    };

    fetchAuditoria();
  }, [vagaId]);

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  const getAcaoColor = (acao: string) => {
    switch (acao.toLowerCase()) {
      case 'criar':
        return 'text-green-600';
      case 'editar':
        return 'text-blue-600';
      case 'excluir':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getAcaoLabel = (acao: string) => {
    switch (acao.toLowerCase()) {
      case 'criar':
        return 'CRIAÇÃO';
      case 'editar':
        return 'EDIÇÃO';
      case 'excluir':
        return 'EXCLUSÃO';
      default:
        return acao.toUpperCase();
    }
  };

  const renderizarDetalhes = (detalhes: string) => {
    try {
      const dados = JSON.parse(detalhes);
      
      // Se tem dados antigos e novos (formato novo)
      if (dados.dadosAntigos && dados.dadosNovos) {
        return (
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">Campos alterados:</div>
            {dados.camposAlterados?.map((campo: string) => {
              const valorAntigo = dados.dadosAntigos[campo];
              const valorNovo = dados.dadosNovos[campo];
              
              if (valorAntigo === valorNovo) return null;
              
              return (
                <div key={campo} className="bg-white border rounded-lg p-3">
                  <div className="font-medium text-gray-800 mb-2 capitalize">
                    {campo.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-red-600 font-medium mb-1">Valor anterior:</div>
                      <div className="bg-red-50 p-2 rounded border-l-4 border-red-300">
                        {valorAntigo || <span className="text-gray-500 italic">(vazio)</span>}
                      </div>
                    </div>
                    <div>
                      <div className="text-green-600 font-medium mb-1">Novo valor:</div>
                      <div className="bg-green-50 p-2 rounded border-l-4 border-green-300">
                        {valorNovo || <span className="text-gray-500 italic">(vazio)</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
      
      // Formato antigo (apenas dados novos)
      return (
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm font-medium text-gray-700 mb-2">Dados alterados:</div>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
            {JSON.stringify(dados, null, 2)}
          </pre>
        </div>
      );
    } catch (e) {
      // Se não for JSON válido, mostrar como texto simples
      return (
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-700">{detalhes}</div>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Carregando histórico...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Histórico de Auditoria da Vaga</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {auditoria.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg">Nenhum registro de auditoria encontrado</p>
            <p className="text-sm">As alterações nesta vaga aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-6">
            {auditoria.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getAcaoColor(item.acao)} bg-opacity-10`}>
                        {getAcaoLabel(item.acao)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatarData(item.data)}
                      </span>
                    </div>
                    {item.usuario && (
                      <div className="text-xs text-gray-500">
                        Por: {item.usuario.nome}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4">
                  {item.detalhes && renderizarDetalhes(item.detalhes)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VagaAuditoria; 