import React, { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import axios from 'axios';

export default function QuadroIdealHistoricoPage() {
  const [match, params] = useRoute('/quadro-ideal/:id/historico');
  const quadroIdealId = params?.id;
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!quadroIdealId) return;
    setLoading(true);
    axios.get(`/api/quadro-ideal/historico/${quadroIdealId}`)
      .then(res => setHistorico(res.data))
      .catch(() => setError('Erro ao carregar histórico.'))
      .finally(() => setLoading(false));
  }, [quadroIdealId]);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Histórico de Alterações</h1>
      {historico.length === 0 && <div>Nenhuma alteração registrada.</div>}
      <ul className="space-y-4">
        {historico.map((h, i) => (
          <li key={h.id} className="bg-white rounded shadow p-4">
            <div className="text-xs text-gray-500 mb-1">{new Date(h.dataAlteracao).toLocaleString()}</div>
            <div><b>Campo:</b> {h.campoAlterado}</div>
            <div><b>De:</b> {h.valorAnterior || <i>vazio</i>} <b>Para:</b> {h.valorNovo || <i>vazio</i>}</div>
            <div className="text-xs text-gray-400 mt-1">Usuário: {h.usuarioId}</div>
          </li>
        ))}
      </ul>
    </div>
  );
} 