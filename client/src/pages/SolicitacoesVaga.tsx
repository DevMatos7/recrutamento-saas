import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function SolicitacoesVagaPage() {
  const { user } = useAuth();
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({ status: '', origem: '', departamentoId: '', tipo: '', urgencia: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    tipo: '',
    cargo: '',
    quantidade: 1,
    justificativa: '',
    colaboradorDesligado: '',
    unidadeId: '',
    departamentoId: '',
    turnoId: '',
    dataInicio: '',
    urgencia: '',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [historicoOpen, setHistoricoOpen] = useState(false);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [historico, setHistorico] = useState<any[]>([]);
  const [historicoError, setHistoricoError] = useState('');
  const [historicoId, setHistoricoId] = useState<string | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const { toast } = useToast();

  // Buscar dados auxiliares
  const { data: departamentos = [] } = useQuery({ queryKey: ['/api/departamentos'] });
  const { data: empresas = [] } = useQuery({ queryKey: ['/api/empresas'] });
  const { data: jornadas = [] } = useQuery({ queryKey: ['/api/jornadas'] });
  const { data: perfisVaga = [] } = useQuery({ queryKey: ['/api/perfis-vaga'] });

  // Mapas para exibir nomes
  const departamentoMap = Object.fromEntries((departamentos as any[]).map((d: any) => [d.id, d]));
  const empresaMap = Object.fromEntries((empresas as any[]).map((e: any) => [e.id, e]));
  const jornadaMap = Object.fromEntries((jornadas as any[]).map((j: any) => [j.id, j]));
  const perfilVagaMap = Object.fromEntries((perfisVaga as any[]).map((p: any) => [p.id, p]));

  async function fetchSolicitacoes() {
    setLoading(true);
    try {
      const res = await axios.get('/api/solicitacoes-vaga');
      setSolicitacoes(res.data);
    } catch {
      setError('Erro ao carregar solicitações.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchSolicitacoes(); }, []);

  async function handleAcao(id: string, acao: 'aprovar' | 'reprovar') {
    setActionLoading(id + acao);
    try {
      let motivo = '';
      if (acao === 'reprovar') {
        motivo = prompt('Informe o motivo da reprovação:') || '';
        if (!motivo) return setActionLoading(null);
        await axios.put(`/api/solicitacoes-vaga/${id}/reprovar`, { motivo });
      } else {
        await axios.put(`/api/solicitacoes-vaga/${id}/aprovar`);
      }
      fetchSolicitacoes();
    } catch {
      alert('Erro ao atualizar solicitação.');
    } finally {
      setActionLoading(null);
    }
  }

  function resetForm() {
    setForm({
      tipo: '', cargo: '', quantidade: 1, justificativa: '', colaboradorDesligado: '', unidadeId: '', departamentoId: '', turnoId: '', dataInicio: '', urgencia: ''
    });
    setFormError('');
  }

  function openEdit(solicitacao: any) {
    setEditing(solicitacao);
    setForm({
      tipo: solicitacao.tipo || '',
      cargo: solicitacao.cargo || '',
      quantidade: solicitacao.quantidadeSolicitada || 1,
      justificativa: solicitacao.motivo || '',
      colaboradorDesligado: solicitacao.colaboradorDesligado || '',
      unidadeId: solicitacao.unidadeId || '',
      departamentoId: solicitacao.departamentoId || '',
      turnoId: solicitacao.turnoId || '',
      dataInicio: solicitacao.dataInicio ? solicitacao.dataInicio.slice(0, 10) : '',
      urgencia: solicitacao.urgencia || '',
    });
    setModalOpen(true);
    setFormError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    // Validações
    if (!form.tipo) return setFormError('Tipo de vaga é obrigatório.');
    if (!form.cargo) return setFormError('Cargo/Função é obrigatório.');
    if (!form.quantidade || form.quantidade < 1) return setFormError('Quantidade deve ser maior que zero.');
    if (!form.justificativa) return setFormError('Justificativa é obrigatória.');
    if (form.tipo === 'reposicao' && !form.colaboradorDesligado) return setFormError('Nome do colaborador desligado é obrigatório para reposição.');
    if (!form.departamentoId) return setFormError('Departamento é obrigatório.');
    if (!form.unidadeId) return setFormError('Unidade é obrigatória.');
    if (!form.turnoId) return setFormError('Turno é obrigatório.');
    if (!form.dataInicio) return setFormError('Data desejada para início é obrigatória.');
    if (!form.urgencia) return setFormError('Nível de urgência é obrigatório.');
    setFormLoading(true);
    try {
      if (editing) {
        await axios.put(`/api/solicitacoes-vaga/${editing.id}`, {
          tipo: form.tipo,
          cargo: form.cargo,
          quantidadeSolicitada: form.quantidade,
          motivo: form.justificativa,
          colaboradorDesligado: form.tipo === 'reposicao' ? form.colaboradorDesligado : undefined,
          departamentoId: form.departamentoId,
          unidadeId: form.unidadeId,
          turnoId: form.turnoId,
          dataInicio: form.dataInicio,
          urgencia: form.urgencia,
        });
      } else {
        await axios.post('/api/solicitacoes-vaga', {
          tipo: form.tipo,
          cargo: form.cargo,
          quantidadeSolicitada: form.quantidade,
          motivo: form.justificativa,
          colaboradorDesligado: form.tipo === 'reposicao' ? form.colaboradorDesligado : undefined,
          departamentoId: form.departamentoId,
          unidadeId: form.unidadeId,
          turnoId: form.turnoId,
          dataInicio: form.dataInicio,
          urgencia: form.urgencia,
        });
      }
      setModalOpen(false);
      setEditing(null);
      resetForm();
      fetchSolicitacoes();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Erro ao salvar solicitação.');
    } finally {
      setFormLoading(false);
    }
  }

  async function abrirHistorico(solicitacaoId: string) {
    setHistoricoOpen(true);
    setHistoricoLoading(true);
    setHistoricoError('');
    setHistorico([]);
    setHistoricoId(solicitacaoId);
    try {
      const res = await axios.get(`/api/solicitacoes-vaga/${solicitacaoId}/historico`);
      setHistorico(res.data);
    } catch {
      setHistoricoError('Erro ao buscar histórico.');
    } finally {
      setHistoricoLoading(false);
    }
  }

  // Filtros dinâmicos
  const solicitacoesFiltradas = solicitacoes.filter((s) => {
    if (filtros.status && s.status !== filtros.status) return false;
    if (filtros.origem && s.origem !== filtros.origem) return false;
    if (filtros.departamentoId && s.departamentoId !== filtros.departamentoId) return false;
    if (filtros.tipo && s.tipo !== filtros.tipo) return false;
    if (filtros.urgencia && s.urgencia !== filtros.urgencia) return false;
    return true;
  });

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Solicitações de Vaga</h1>
      {/* Botão Nova Solicitação */}
      {user?.perfil === 'gestor' && (
        <Button className="mb-4" onClick={() => { setModalOpen(true); resetForm(); }}>Nova Solicitação</Button>
      )}
      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-4">
        <select value={filtros.status} onChange={e => setFiltros(f => ({ ...f, status: e.target.value }))} className="p-2 border rounded">
          <option value="">Status</option>
          <option value="pendente">Pendente</option>
          <option value="aprovada">Aprovada</option>
          <option value="reprovada">Reprovada</option>
        </select>
        <select value={filtros.origem} onChange={e => setFiltros(f => ({ ...f, origem: e.target.value }))} className="p-2 border rounded">
          <option value="">Origem</option>
          <option value="manual">Manual</option>
          <option value="automatica">Automática</option>
        </select>
        <select value={filtros.departamentoId} onChange={e => setFiltros(f => ({ ...f, departamentoId: e.target.value }))} className="p-2 border rounded">
          <option value="">Departamento</option>
          {departamentos.map((d: any) => <option key={d.id} value={d.id}>{d.nome}</option>)}
        </select>
        <select value={filtros.tipo} onChange={e => setFiltros(f => ({ ...f, tipo: e.target.value }))} className="p-2 border rounded">
          <option value="">Tipo</option>
          <option value="reposicao">Reposição</option>
          <option value="aumento_quadro">Aumento de Quadro</option>
        </select>
        <select value={filtros.urgencia} onChange={e => setFiltros(f => ({ ...f, urgencia: e.target.value }))} className="p-2 border rounded">
          <option value="">Urgência</option>
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left">Cargo</th>
              <th className="px-3 py-2 text-left">Departamento</th>
              <th className="px-3 py-2 text-left">Unidade</th>
              <th className="px-3 py-2 text-left">Turno</th>
              <th className="px-3 py-2 text-left">Tipo</th>
              <th className="px-3 py-2 text-left">Urgência</th>
              <th className="px-3 py-2 text-left">Origem</th>
              <th className="px-3 py-2 text-left">Colab. Desligado</th>
              <th className="px-3 py-2 text-left">Quantidade</th>
              <th className="px-3 py-2 text-left">Justificativa</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {solicitacoesFiltradas.map(s => (
              <tr key={s.id} className="border-b">
                <td className="px-3 py-2">{s.cargo}</td>
                <td className="px-3 py-2">{departamentoMap[s.departamentoId]?.nome || s.departamentoId}</td>
                <td className="px-3 py-2">{empresaMap[s.unidadeId]?.nome || '-'}</td>
                <td className="px-3 py-2">{jornadaMap[s.turnoId]?.nome || '-'}</td>
                <td className="px-3 py-2">{s.tipo === 'reposicao' ? 'Reposição' : s.tipo === 'aumento_quadro' ? 'Aumento de Quadro' : '-'}</td>
                <td className="px-3 py-2">{s.urgencia ? s.urgencia.charAt(0).toUpperCase() + s.urgencia.slice(1) : '-'}</td>
                <td className="px-3 py-2">
                  <Badge variant={s.origem === 'manual' ? 'default' : 'secondary'}>{s.origem === 'manual' ? 'Manual' : 'Automática'}</Badge>
                </td>
                <td className="px-3 py-2">{s.colaboradorDesligado || '-'}</td>
                <td className="px-3 py-2">{s.quantidadeSolicitada}</td>
                <td className="px-3 py-2">{s.motivo}</td>
                <td className="px-3 py-2 font-semibold">
                  {s.status === 'pendente' && <span className="text-yellow-600">Pendente</span>}
                  {s.status === 'aprovada' && <span className="text-green-600">Aprovada</span>}
                  {s.status === 'reprovada' && <span className="text-red-600">Reprovada</span>}
                </td>
                <td className="px-3 py-2 space-x-1">
                  {/* Botões de ação conforme permissões e status */}
                  {s.status === 'pendente' && (user?.perfil === 'admin' || user?.perfil === 'rh') && (
                    <>
                      <Button size="sm" className="bg-green-600 text-white" disabled={actionLoading === s.id + 'aprovar'} onClick={() => handleAcao(s.id, 'aprovar')}>
                        {actionLoading === s.id + 'aprovar' ? 'Aprovando...' : 'Aprovar'}
                      </Button>
                      <Button size="sm" className="bg-red-600 text-white" disabled={actionLoading === s.id + 'reprovar'} onClick={() => handleAcao(s.id, 'reprovar')}>
                        {actionLoading === s.id + 'reprovar' ? 'Reprovando...' : 'Reprovar'}
                      </Button>
                    </>
                  )}
                  {/* Botão de histórico */}
                  <Button size="sm" variant="outline" onClick={() => abrirHistorico(s.id)}>Histórico</Button>
                  {/* Botão de editar (apenas gestor dono ou admin/rh) */}
                  {(user?.perfil === 'admin' || user?.perfil === 'rh' || user?.id === s.criadoPor) && s.status === 'pendente' && (
                    <Button size="sm" variant="outline" onClick={() => openEdit(s)}>Editar</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={modalOpen} onOpenChange={v => { setModalOpen(v); if (!v) setEditing(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Solicitação de Vaga' : 'Nova Solicitação de Vaga'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Tipo de vaga *</label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reposicao">Reposição</SelectItem>
                  <SelectItem value="aumento_quadro">Aumento de Quadro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Cargo/Função *</label>
              <Select value={form.cargo} onValueChange={v => setForm(f => ({ ...f, cargo: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {perfisVaga.map((p: any) => (
                    <SelectItem key={p.tituloVaga} value={p.tituloVaga}>{p.tituloVaga}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Quantidade de vagas *</label>
              <Input type="number" min={1} value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block mb-1 font-medium">Justificativa *</label>
              <Textarea value={form.justificativa} onChange={e => setForm(f => ({ ...f, justificativa: e.target.value }))} />
            </div>
            {form.tipo === 'reposicao' && (
              <div>
                <label className="block mb-1 font-medium">Nome do colaborador desligado *</label>
                <Input value={form.colaboradorDesligado} onChange={e => setForm(f => ({ ...f, colaboradorDesligado: e.target.value }))} />
              </div>
            )}
            <div>
              <label className="block mb-1 font-medium">Departamento *</label>
              <Select value={form.departamentoId} onValueChange={v => setForm(f => ({ ...f, departamentoId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {departamentos.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Unidade *</label>
              <Select value={form.unidadeId} onValueChange={v => setForm(f => ({ ...f, unidadeId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {empresas.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Turno *</label>
              <Select value={form.turnoId} onValueChange={v => setForm(f => ({ ...f, turnoId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {jornadas.map((j: any) => (
                    <SelectItem key={j.id} value={j.id}>{j.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Data desejada para início *</label>
              <Input type="date" value={form.dataInicio} onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))} />
            </div>
            <div>
              <label className="block mb-1 font-medium">Nível de urgência *</label>
              <Select value={form.urgencia} onValueChange={v => setForm(f => ({ ...f, urgencia: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formError && <div className="text-red-600 text-sm">{formError}</div>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setEditing(null); }}>Cancelar</Button>
              <Button type="submit" disabled={formLoading}>{formLoading ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={historicoOpen} onOpenChange={setHistoricoOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Histórico da Solicitação</DialogTitle>
          </DialogHeader>
          {historicoLoading && <div>Carregando histórico...</div>}
          {historicoError && <div className="text-red-600 text-sm">{historicoError}</div>}
          {!historicoLoading && !historicoError && (
            historico.length === 0 ? (
              <div className="text-gray-600">Nenhuma ação registrada.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {historico.map((h: any) => (
                  <li key={h.id} className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{new Date(h.data).toLocaleString('pt-BR')}</span>
                      <span className="text-gray-700">{h.acao}</span>
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
    </div>
  );
} 