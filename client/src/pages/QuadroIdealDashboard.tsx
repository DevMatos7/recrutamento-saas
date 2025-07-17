import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import axios from 'axios';
import { DashboardCard } from '../components/quadroIdeal/DashboardCard';
import { FiltrosQuadroIdeal } from '../components/quadroIdeal/FiltrosQuadroIdeal';
import { QuadroIdealBarChart } from '../components/quadroIdeal/QuadroIdealBarChart';
import { QuadroIdealLineChart } from '../components/quadroIdeal/QuadroIdealLineChart';
import { ImportCSVModal } from '../components/quadroIdeal/ImportCSVModal';
import { ExportButtons } from '../components/quadroIdeal/ExportButtons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '../components/ui/dialog';
import { QuadroIdealForm } from '../components/quadroIdeal/QuadroIdealForm';
import { useAlertasQuadroIdeal } from '../hooks/useAlertasQuadroIdeal';
import { Clock } from 'lucide-react';

export default function QuadroIdealDashboard() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [quadrosIdeais, setQuadrosIdeais] = useState<any[]>([]);
  const [quadrosReais, setQuadrosReais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({ empresaId: '', departamentoId: '', cargo: '' });
  const [importModal, setImportModal] = useState<'ideal' | 'real' | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [historicoOpen, setHistoricoOpen] = useState(false);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [historico, setHistorico] = useState<any[]>([]);
  const [historicoError, setHistoricoError] = useState('');
  const [historicoId, setHistoricoId] = useState<string | null>(null);
  const [, navigate] = useLocation();

  // Buscar dados reais do backend
  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get('/api/empresas'),
      axios.get('/api/departamentos'),
      axios.get('/api/quadro-ideal'),
      axios.get('/api/quadro-real')
    ])
      .then(([empRes, depRes, qiRes, qrRes]) => {
        setEmpresas(empRes.data);
        setDepartamentos(depRes.data);
        setQuadrosIdeais(qiRes.data);
        setQuadrosReais(qrRes.data);
        setError(null);
      })
      .catch(() => setError('Erro ao carregar dados.'))
      .finally(() => setLoading(false));
  }, []);

  // Hook de alertas do Quadro Ideal
  const { data: alertas, loading: loadingAlertas, error: errorAlertas } = useAlertasQuadroIdeal();

  // Filtros dinâmicos
  const cargos = useMemo(() => Array.from(new Set(quadrosIdeais.map((q: any) => q.cargo))), [quadrosIdeais]);

  const quadrosFiltrados = useMemo(() => {
    return quadrosIdeais.filter((q: any) =>
      (!filtros.empresaId || q.empresaId === filtros.empresaId) &&
      (!filtros.departamentoId || q.departamentoId === filtros.departamentoId) &&
      (!filtros.cargo || q.cargo === filtros.cargo)
    );
  }, [quadrosIdeais, filtros]);

  // Mapear quantidade atual do Quadro Real
  const realMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const qr of quadrosReais) {
      const key = `${qr.departamentoId}:${qr.cargo}`;
      map.set(key, qr.quantidadeAtual);
    }
    return map;
  }, [quadrosReais]);

  // Gap/status
  const quadrosComGap = quadrosFiltrados.map(qi => {
    const key = `${qi.departamentoId}:${qi.cargo}`;
    const atual = realMap.get(key) ?? 0;
    const gap = atual - qi.quantidadeIdeal;
    let status = 'OK', cor = 'verde';
    if (gap < 0) {
      status = 'Déficit'; cor = 'vermelho';
    } else if (gap > 0) {
      status = 'Excesso'; cor = 'azul';
    }
    return { ...qi, atual, gap, status, cor };
  });

  // Função para abrir modal de novo cadastro
  function handleNovo() {
    setEditData({});
    setModalOpen(true);
  }

  // Função para abrir modal de edição
  function handleEditar(item: any) {
    setEditData(item);
    setModalOpen(true);
  }

  // Função para salvar (criar ou editar)
  async function handleSalvar(data: any) {
    try {
      if (data.id) {
        await axios.put(`/api/quadro-ideal/${data.id}`, data);
      } else {
        await axios.post('/api/quadro-ideal', data);
      }
      setModalOpen(false);
      // Recarregar lista
      setLoading(true);
      Promise.all([
        axios.get('/api/empresas'),
        axios.get('/api/departamentos'),
        axios.get('/api/quadro-ideal'),
        axios.get('/api/quadro-real')
      ])
        .then(([empRes, depRes, qiRes, qrRes]) => {
          setEmpresas(empRes.data);
          setDepartamentos(depRes.data);
          setQuadrosIdeais(qiRes.data);
          setQuadrosReais(qrRes.data);
          setError(null);
        })
        .catch(() => setError('Erro ao carregar dados.'))
        .finally(() => setLoading(false));
      // Mensagem de sucesso (pode usar toast se houver)
      alert('Quadro Ideal salvo com sucesso!');
    } catch (err) {
      alert('Erro ao salvar Quadro Ideal.');
    }
  }

  // Função para excluir
  async function handleExcluir() {
    if (!confirmDelete) return;
    try {
      await axios.delete(`/api/quadro-ideal/${confirmDelete.id}`);
      setConfirmDelete(null);
      // Recarregar lista
      setLoading(true);
      Promise.all([
        axios.get('/api/empresas'),
        axios.get('/api/departamentos'),
        axios.get('/api/quadro-ideal'),
        axios.get('/api/quadro-real')
      ])
        .then(([empRes, depRes, qiRes, qrRes]) => {
          setEmpresas(empRes.data);
          setDepartamentos(depRes.data);
          setQuadrosIdeais(qiRes.data);
          setQuadrosReais(qrRes.data);
          setError(null);
        })
        .catch(() => setError('Erro ao carregar dados.'))
        .finally(() => setLoading(false));
      alert('Quadro Ideal excluído com sucesso!');
    } catch (err) {
      alert('Erro ao excluir Quadro Ideal.');
    }
  }

  // Função para abrir solicitações automáticas
  async function handleAbrirSolicitacoesAutomaticas() {
    try {
      await axios.post('/api/solicitacoes-vaga/automatica');
      alert('Solicitações automáticas abertas com sucesso!');
    } catch (err) {
      alert('Erro ao abrir solicitações automáticas.');
    }
  }

  async function abrirHistorico(quadroId: string) {
    setHistoricoOpen(true);
    setHistoricoLoading(true);
    setHistoricoError('');
    setHistorico([]);
    setHistoricoId(quadroId);
    try {
      const res = await axios.get(`/api/quadro-ideal/historico/${quadroId}`);
      setHistorico(res.data);
    } catch {
      setHistoricoError('Erro ao buscar histórico.');
    } finally {
      setHistoricoLoading(false);
    }
  }

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Quadro Ideal</h1>
        <div className="flex gap-2">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
            onClick={() => setImportModal('ideal')}
          >
            Importar Quadro Ideal (CSV)
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600"
            onClick={() => setImportModal('real')}
          >
            Importar Quadro Real (CSV)
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
            onClick={handleNovo}
          >
            + Novo Quadro Ideal
          </button>
        </div>
      </div>
      {/* Botão para abrir solicitações automáticas */}
      <div className="mb-4">
        <button
          className="bg-orange-600 text-white px-4 py-2 rounded shadow hover:bg-orange-700"
          onClick={handleAbrirSolicitacoesAutomaticas}
        >
          Abrir solicitações automáticas
        </button>
      </div>
      {/* Alertas visuais do Quadro Ideal */}
      {loadingAlertas && <div>Carregando alertas...</div>}
      {errorAlertas && <div className="text-red-600">Erro ao carregar alertas.</div>}
      {alertas && alertas.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-2">Alertas do Quadro Ideal</h2>
          <div className="grid gap-2">
            {alertas.map((a, i) => (
              <div
                key={i}
                className={`rounded p-3 shadow flex items-center gap-4
                  ${a.cor === 'vermelho' ? 'bg-red-100 border-l-4 border-red-500' : ''}
                  ${a.cor === 'amarelo' ? 'bg-yellow-100 border-l-4 border-yellow-400' : ''}
                  ${a.cor === 'azul' ? 'bg-blue-100 border-l-4 border-blue-500' : ''}
                  ${a.cor === 'verde' ? 'bg-green-100 border-l-4 border-green-500' : ''}
                `}
              >
                <div>
                  <b>{a.cargo}</b> ({a.departamentoId})<br />
                  Ideal: <b>{a.ideal}</b> | Atual: <b>{a.atual}</b> | Gap: <b>{a.gap}</b>
                </div>
                <div className="ml-auto font-semibold">
                  Status: <span className="uppercase">{a.status}</span>
                  {a.acaoSugerida && (
                    <span className="ml-4 italic text-sm">{a.acaoSugerida}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {alertas && alertas.length === 0 && (
        <div className="mb-4 text-green-700">Nenhum alerta crítico no momento.</div>
      )}
      <ExportButtons className="mb-6" />
      <ImportCSVModal open={!!importModal} tipo={importModal as any} onClose={() => setImportModal(null)} />
      <FiltrosQuadroIdeal
        empresas={empresas}
        departamentos={departamentos}
        cargos={cargos}
        filtros={filtros}
        onChange={setFiltros}
      />
      <div className="overflow-x-auto mt-6">
        <table className="min-w-full bg-white border rounded shadow">
          <thead>
            <tr>
              <th className="px-4 py-2">Empresa</th>
              <th className="px-4 py-2">Departamento</th>
              <th className="px-4 py-2">Cargo</th>
              <th className="px-4 py-2">Ideal</th>
              <th className="px-4 py-2">Atual</th>
              <th className="px-4 py-2">Gap</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {quadrosComGap.map((q) => (
              <tr key={q.id} className="border-t">
                <td className="px-4 py-2">{empresas.find(e => e.id === q.empresaId)?.nome || '-'}</td>
                <td className="px-4 py-2">{departamentos.find(d => d.id === q.departamentoId)?.nome || '-'}</td>
                <td className="px-4 py-2">{q.cargo}</td>
                <td className="px-4 py-2">{q.quantidadeIdeal}</td>
                <td className="px-4 py-2">{q.atual}</td>
                <td className="px-4 py-2">{q.gap}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-white bg-${q.cor}-500`}>{q.status}</span>
                </td>
                <td className="px-4 py-2 flex gap-2">
                  <button
                    className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                    onClick={() => handleEditar(q)}
                  >
                    Editar
                  </button>
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                    onClick={() => setConfirmDelete(q)}
                  >
                    Excluir
                  </button>
                  <button
                    className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-gray-300"
                    title="Ver histórico"
                    onClick={() => abrirHistorico(q.id)}
                  >
                    <Clock className="w-4 h-4" /> Histórico
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal de cadastro/edição */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editData && editData.id ? 'Editar Quadro Ideal' : 'Novo Quadro Ideal'}</DialogTitle>
          </DialogHeader>
          <QuadroIdealForm
            initialData={editData}
            empresas={empresas}
            departamentos={departamentos}
            onSubmit={handleSalvar}
            loading={loading}
            onCancel={() => setModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
      {/* Modal de confirmação de exclusão */}
      <Dialog open={!!confirmDelete} onOpenChange={v => !v && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="mb-4">Deseja realmente excluir o Quadro Ideal de <b>{confirmDelete?.cargo}</b> ({departamentos.find(d => d.id === confirmDelete?.departamentoId)?.nome || '-'})?</div>
          <div className="flex justify-end gap-2">
            <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setConfirmDelete(null)}>Cancelar</button>
            <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={handleExcluir}>Excluir</button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal de histórico */}
      <Dialog open={historicoOpen} onOpenChange={setHistoricoOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Histórico do Quadro Ideal</DialogTitle>
          </DialogHeader>
          {historicoLoading && <div>Carregando histórico...</div>}
          {historicoError && <div className="text-red-600 text-sm">{historicoError}</div>}
          {!historicoLoading && !historicoError && (
            historico.length === 0 ? (
              <div className="text-gray-600">Nenhuma alteração registrada.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {historico.map((h: any) => (
                  <li key={h.id} className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{new Date(h.dataAlteracao || h.data).toLocaleString('pt-BR')}</span>
                      <span className="text-gray-700">{h.acao || h.campoAlterado}</span>
                      {h.motivo && <span className="text-gray-500 italic">Motivo: {h.motivo}</span>}
                      {/* Usuário pode ser exibido se backend retornar nome/email */}
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}
        </DialogContent>
      </Dialog>
      {/* Gráficos e outros componentes podem ser mantidos abaixo */}
      <QuadroIdealBarChart data={quadrosComGap.map(q => ({ cargo: q.cargo, ideal: q.quantidadeIdeal, atual: q.atual }))} />
      {/* <QuadroIdealLineChart data={lineChartData} /> */}
    </div>
  );
} 