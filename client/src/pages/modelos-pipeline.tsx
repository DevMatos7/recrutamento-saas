import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Eye, Settings, Copy, Star, StarOff } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ModeloPipeline {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  padrao: boolean;
  dataCriacao: string;
  etapas?: EtapaModeloPipeline[];
}

interface EtapaModeloPipeline {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
  tipo: string;
  cor: string;
  obrigatoria: boolean;
  podeReprovar: boolean;
  sla?: number;
}

interface EtapaTemplate {
  nome: string;
  descricao: string;
  tipo: string;
  cor: string;
  obrigatoria: boolean;
  podeReprovar: boolean;
  sla?: number;
}

// Paleta de cores global para etapas
const CORES_PALETA = [
  '#1976d2', '#388e3c', '#fbc02d', '#d32f2f', '#7b1fa2', '#0288d1', '#c2185b', '#ffa000', '#455a64', '#8d6e63'
];

export default function ModelosPipelinePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingModelo, setEditingModelo] = useState<ModeloPipeline | null>(null);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>("");
  const [templates, setTemplates] = useState<EtapaTemplate[]>([]);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    tipoVaga: ""
  });

  // Estado para modal de edição/visualização
  const [isViewEditModalOpen, setIsViewEditModalOpen] = useState(false);
  const [viewEditMode, setViewEditMode] = useState<'view' | 'edit'>('view');

  // Estado para etapas ao criar modelo
  const [etapas, setEtapas] = useState<EtapaModeloPipeline[]>([]);
  const [novaEtapa, setNovaEtapa] = useState({
    nome: '',
    tipo: '',
    ordem: etapas.length + 1,
    cor: '',
    obrigatoria: false,
    podeReprovar: false,
    sla: undefined,
  });

  // Adicionar estado para tipos e cores sugeridos
  const [tiposEtapaSugeridos, setTiposEtapaSugeridos] = useState<string[]>([]);

  // Função para gerar ID único (compatível com todos os navegadores)
  function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
  }

  // Buscar empresas do usuário
  const { data: empresas = [] } = useQuery({
    queryKey: ["/api/empresas"],
  }) as { data: any[] };

  // Inicializar selectedEmpresa com a primeira empresa disponível
  useEffect(() => {
    if (!selectedEmpresa && empresas.length > 0) {
      setSelectedEmpresa(empresas[0].id);
    }
  }, [empresas, selectedEmpresa]);

  // Buscar modelos de pipeline da empresa selecionada
  const { data: modelosApi = [], isLoading } = useQuery({
    queryKey: ["/api/empresas", selectedEmpresa, "modelos-pipeline"],
    enabled: !!selectedEmpresa,
  }) as { data: any[], isLoading: boolean };

  const modelosFiltrados = modelosApi.filter(
    (m) => String(m.empresaId) === String(selectedEmpresa) || String(m.empresa_id) === String(selectedEmpresa)
  );

  // Buscar templates de etapas
  const { data: templatesData = [] } = useQuery({
    queryKey: ["/api/pipeline/templates"],
  });

  // Buscar templates por tipo de vaga
  const { data: templatesPorTipo = [] } = useQuery({
    queryKey: ["/api/pipeline/templates", formData.tipoVaga],
    enabled: !!formData.tipoVaga,
  });

  // Buscar tipos de etapa já cadastrados ao abrir o modal de criação
  useEffect(() => {
    if (isCreateModalOpen && selectedEmpresa) {
      fetch(`/api/empresas/${selectedEmpresa}/etapas-pipeline`)
        .then(r => r.json())
        .then((etapas: any[]) => {
          setTiposEtapaSugeridos(Array.from(new Set(etapas.map(e => String(e.nome)))));
        });
    }
  }, [isCreateModalOpen, selectedEmpresa]);

  const createModeloMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/empresas/${selectedEmpresa}/modelos-pipeline`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empresas", selectedEmpresa, "modelos-pipeline"] });
      setIsCreateModalOpen(false);
      setFormData({ nome: "", descricao: "", tipoVaga: "" });
      toast({
        title: "Sucesso",
        description: "Modelo de pipeline criado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createFromTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      // Primeiro, buscar o template baseado no tipo de vaga
      const templateResponse = await fetch(`/api/pipeline/templates/${data.tipoVaga}`);
      if (!templateResponse.ok) {
        throw new Error('Template não encontrado');
      }
      const template = await templateResponse.json();
      
      // Criar modelo com as etapas do template
      const modeloData = {
        ...data,
        etapas: template.etapas || []
      };
      
      const res = await apiRequest("POST", `/api/empresas/${selectedEmpresa}/modelos-pipeline`, modeloData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empresas", selectedEmpresa, "modelos-pipeline"] });
      setIsTemplateModalOpen(false);
      setFormData({ nome: "", descricao: "", tipoVaga: "" });
      toast({
        title: "Sucesso",
        description: "Modelo criado a partir do template com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const setPadraoMutation = useMutation({
    mutationFn: async (modeloId: string) => {
      const res = await apiRequest("PATCH", `/api/modelos-pipeline/${modeloId}/padrao`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empresas", selectedEmpresa, "modelos-pipeline"] });
      toast({
        title: "Sucesso",
        description: "Modelo definido como padrão!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (modeloId: string) => {
      await apiRequest("DELETE", `/api/modelos-pipeline/${modeloId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empresas", selectedEmpresa, "modelos-pipeline"] });
      toast({
        title: "Sucesso",
        description: "Modelo excluído com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Funções para abrir modal de visualização/edição
  const handleViewModelo = (modelo: ModeloPipeline) => {
    setEditingModelo(modelo);
    setViewEditMode('view');
    setIsViewEditModalOpen(true);
  };
  const handleEditModelo = (modelo: ModeloPipeline) => {
    setEditingModelo(modelo);
    setViewEditMode('edit');
    setIsViewEditModalOpen(true);
  };

  // Ajustar handleCreateModelo para receber etapas
  const handleCreateModelo = (etapasCriadas: EtapaModeloPipeline[]) => {
    if (!formData.nome || !selectedEmpresa) {
      toast({
        title: "Erro",
        description: "Nome e empresa são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    if (etapasCriadas.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma etapa ao modelo",
        variant: "destructive",
      });
      return;
    }
    createModeloMutation.mutate({
      nome: formData.nome,
      descricao: formData.descricao,
      empresaId: selectedEmpresa,
      etapas: etapasCriadas,
    });
  };

  const handleCreateFromTemplate = () => {
    if (!formData.nome || !selectedEmpresa) {
      toast({
        title: "Erro",
        description: "Nome e empresa são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    createFromTemplateMutation.mutate({
      nome: formData.nome,
      tipoVaga: formData.tipoVaga,
      empresaId: selectedEmpresa,
    });
  };

  const handleSetPadrao = (modeloId: string) => {
    if (confirm("Tem certeza que deseja definir este modelo como padrão?")) {
      setPadraoMutation.mutate(modeloId);
    }
  };

  const handleDelete = (modeloId: string) => {
    if (confirm("Tem certeza que deseja excluir este modelo?")) {
      deleteMutation.mutate(modeloId);
    }
  };

  const canManageModelos = user && ["admin", "recrutador"].includes(user.perfil);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modelos de Pipeline</h1>
          <p className="text-gray-600 mt-1">Gerencie modelos padrão de pipeline por empresa</p>
        </div>
        {canManageModelos && (
          <div className="flex gap-2">
            <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Copy className="h-4 w-4" />
                  Criar do Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar Modelo do Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome do Modelo</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Pipeline CLT Completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tipoVaga">Tipo de Vaga</Label>
                    <Select value={formData.tipoVaga} onValueChange={(value) => setFormData({ ...formData, tipoVaga: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de vaga" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clt">CLT</SelectItem>
                        <SelectItem value="pj">PJ</SelectItem>
                        <SelectItem value="freelancer">Freelancer</SelectItem>
                        <SelectItem value="estágio">Estágio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsTemplateModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateFromTemplate} disabled={createFromTemplateMutation.isPending}>
                      {createFromTemplateMutation.isPending ? "Criando..." : "Criar Modelo"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Modelo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl" style={{ minWidth: 500, maxWidth: 700 }}>
                <DialogHeader>
                  <DialogTitle>Criar Novo Modelo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome do Modelo</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Pipeline Vendas"
                    />
                  </div>
                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Descrição do modelo..."
                    />
                  </div>
                  {/* Adicionar etapas */}
                  <div>
                    <Label>Etapas do Pipeline</Label>
                    <div className="flex flex-wrap gap-2 items-end mb-2">
                      <Input
                        placeholder="Nome da etapa"
                        value={novaEtapa.nome}
                        onChange={e => setNovaEtapa({ ...novaEtapa, nome: e.target.value })}
                        style={{ width: 140 }}
                      />
                      <Input
                        placeholder="Tipo"
                        value={novaEtapa.tipo}
                        onChange={e => setNovaEtapa({ ...novaEtapa, tipo: e.target.value })}
                        list="tipos-etapa-sugeridos"
                        style={{ width: 120 }}
                      />
                      <datalist id="tipos-etapa-sugeridos">
                        {tiposEtapaSugeridos.map(tipo => (
                          <option key={tipo} value={tipo} />
                        ))}
                      </datalist>
                      <Input
                        placeholder="SLA (dias)"
                        type="number"
                        value={typeof novaEtapa.sla === 'number' ? String(novaEtapa.sla) : ''}
                        onChange={e => setNovaEtapa({ ...novaEtapa, sla: e.target.value === '' ? undefined : Number(e.target.value) })}
                        style={{ width: 100 }}
                      />
                      {/* Paleta de cores em duas linhas */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div className="flex gap-1 mb-1">
                          {CORES_PALETA.slice(0, 5).map(cor => (
                            <button
                              key={cor}
                              type="button"
                              style={{ background: cor, width: 24, height: 24, borderRadius: '50%', border: novaEtapa.cor === cor ? '2px solid #333' : '1px solid #ccc', outline: 'none' }}
                              onClick={() => setNovaEtapa({ ...novaEtapa, cor })}
                              aria-label={`Selecionar cor ${cor}`}
                            />
                          ))}
                        </div>
                        <div className="flex gap-1">
                          {CORES_PALETA.slice(5).map(cor => (
                            <button
                              key={cor}
                              type="button"
                              style={{ background: cor, width: 24, height: 24, borderRadius: '50%', border: novaEtapa.cor === cor ? '2px solid #333' : '1px solid #ccc', outline: 'none' }}
                              onClick={() => setNovaEtapa({ ...novaEtapa, cor })}
                              aria-label={`Selecionar cor ${cor}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 ml-2">
                        <label className="flex items-center gap-1 text-sm">
                          <input type="checkbox" checked={novaEtapa.obrigatoria} onChange={e => setNovaEtapa({ ...novaEtapa, obrigatoria: e.target.checked })} />
                          Obrigatória
                        </label>
                        <label className="flex items-center gap-1 text-sm">
                          <input type="checkbox" checked={novaEtapa.podeReprovar} onChange={e => setNovaEtapa({ ...novaEtapa, podeReprovar: e.target.checked })} />
                          Pode Reprovar
                        </label>
                      </div>
                      <Button size="sm" onClick={() => {
                        if (novaEtapa.nome && novaEtapa.tipo) {
                          setEtapas([
                            ...etapas,
                            { ...novaEtapa, ordem: etapas.length + 1, id: generateId() }
                          ]);
                          setNovaEtapa({ nome: '', tipo: '', ordem: etapas.length + 2, cor: '', obrigatoria: false, podeReprovar: false, sla: undefined });
                        }
                      }}>Adicionar</Button>
                    </div>
                    {/* Lista das etapas já adicionadas */}
                    <div className="space-y-2 mt-2">
                      {etapas.map((etapa, idx) => (
                        <div key={etapa.id} className="flex gap-2 items-center border rounded px-2 py-1 bg-gray-50">
                          <span className="font-medium">{etapa.ordem}. {etapa.nome}</span>
                          <span className="text-xs text-gray-500">{etapa.tipo}</span>
                          <span style={{ background: etapa.cor, width: 18, height: 18, borderRadius: '50%', display: 'inline-block', border: '1px solid #ccc' }} />
                          <span className="text-xs">SLA: {etapa.sla || '-'}</span>
                          {etapa.obrigatoria && <span className="text-xs text-blue-600">Obrigatória</span>}
                          {etapa.podeReprovar && <span className="text-xs text-red-600">Pode Reprovar</span>}
                          <Button size="sm" variant="ghost" onClick={() => setEtapas(etapas.filter((_, i) => i !== idx))}>Remover</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={() => handleCreateModelo(etapas)} disabled={createModeloMutation.isPending}>
                      {createModeloMutation.isPending ? "Criando..." : "Criar Modelo"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="w-64">
              <Label htmlFor="empresa">Empresa</Label>
              <Select
                value={selectedEmpresa}
                onValueChange={(value) => {
                  setSelectedEmpresa(value);
                  // Invalida a query para garantir atualização imediata
                  queryClient.invalidateQueries({ queryKey: ["/api/empresas", value, "modelos-pipeline"] });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((empresa: any) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Modelos */}
      <Card>
        <CardHeader>
          <CardTitle>Modelos de Pipeline ({modelosFiltrados.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Padrão</TableHead>
                <TableHead>Data Criação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelosFiltrados.map((modelo: ModeloPipeline) => (
                <TableRow key={modelo.id}>
                  <TableCell>
                    <div className="font-medium">{modelo.nome}</div>
                  </TableCell>
                  <TableCell>{modelo.descricao || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={modelo.ativo ? "default" : "secondary"}>
                      {modelo.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {modelo.padrao ? (
                      <Badge variant="default" className="bg-yellow-500">
                        <Star className="h-3 w-3 mr-1" />
                        Padrão
                      </Badge>
                    ) : (
                      <Badge variant="outline">-</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {modelo.dataCriacao ? new Date(modelo.dataCriacao).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" aria-label="Ver etapas" onClick={() => handleViewModelo(modelo)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver etapas</TooltipContent>
                        </Tooltip>
                        {canManageModelos && !modelo.padrao && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleSetPadrao(modelo.id)}
                                aria-label="Definir como padrão"
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Definir como padrão</TooltipContent>
                          </Tooltip>
                        )}
                        {canManageModelos && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" aria-label="Editar" onClick={() => handleEditModelo(modelo)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar modelo</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDelete(modelo.id)}
                                  aria-label="Excluir"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Excluir modelo</TooltipContent>
                            </Tooltip>
                          </>
                        )}
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {modelosFiltrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    {selectedEmpresa ? "Nenhum modelo encontrado" : "Selecione uma empresa para ver os modelos"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Visualização/Edição de Modelo */}
      <Dialog open={isViewEditModalOpen} onOpenChange={setIsViewEditModalOpen}>
        <DialogContent className="max-w-xl" style={{ minWidth: 500, maxWidth: 700 }}>
          <DialogHeader>
            <DialogTitle>
              {viewEditMode === 'edit' ? 'Editar Modelo' : 'Visualizar Modelo'}
            </DialogTitle>
          </DialogHeader>
          {editingModelo ? (
            viewEditMode === 'edit' ? (
              <EditModeloForm
                modelo={editingModelo}
                onCancel={() => setIsViewEditModalOpen(false)}
                onSave={novoModelo => {
                  // Aqui você pode implementar a lógica de salvar (API/mutation)
                  setIsViewEditModalOpen(false);
                }}
              />
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Nome:</Label>
                  <span className="ml-2">{editingModelo.nome}</span>
                </div>
                <div>
                  <Label>Descrição:</Label>
                  <span className="ml-2">{editingModelo.descricao}</span>
                </div>
                <div>
                  <Label>Etapas:</Label>
                  <ul className="mt-2 space-y-1">
                    {editingModelo.etapas && editingModelo.etapas.length > 0 ? (
                      editingModelo.etapas.map((etapa, idx) => (
                        <li key={etapa.id || idx} className="flex gap-2 items-center">
                          <span className="font-medium">{etapa.ordem}. {etapa.nome}</span>
                          <span className="text-xs text-gray-500">{etapa.tipo}</span>
                          <span style={{ background: etapa.cor, width: 18, height: 18, borderRadius: '50%', display: 'inline-block', border: '1px solid #ccc' }} />
                          <span className="text-xs">SLA: {etapa.sla || '-'}</span>
                          {etapa.obrigatoria && <span className="text-xs text-blue-600">Obrigatória</span>}
                          {etapa.podeReprovar && <span className="text-xs text-red-600">Pode Reprovar</span>}
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-400">Nenhuma etapa cadastrada</li>
                    )}
                  </ul>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => setIsViewEditModalOpen(false)}>Fechar</Button>
                </div>
              </div>
            )
          ) : (
            <div>Carregando...</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 

// Componente de edição de modelo
function EditModeloForm({ modelo, onCancel, onSave }) {
  const [nome, setNome] = React.useState(modelo.nome);
  const [descricao, setDescricao] = React.useState(modelo.descricao);
  const [etapas, setEtapas] = React.useState(modelo.etapas ? [...modelo.etapas] : []);
  const [novaEtapa, setNovaEtapa] = React.useState({ nome: '', tipo: '', cor: '', sla: undefined, obrigatoria: false, podeReprovar: false, ordem: etapas.length + 1 });

  // Adicionar nova etapa
  const handleAddEtapa = () => {
    if (novaEtapa.nome && novaEtapa.tipo) {
      setEtapas([
        ...etapas,
        { ...novaEtapa, ordem: etapas.length + 1, id: '_' + Math.random().toString(36).substr(2, 9) }
      ]);
      setNovaEtapa({ nome: '', tipo: '', cor: '', sla: undefined, obrigatoria: false, podeReprovar: false, ordem: etapas.length + 2 });
    }
  };

  // Editar etapa existente
  const handleEditEtapa = (idx, campo, valor) => {
    setEtapas(etapas.map((et, i) => i === idx ? { ...et, [campo]: valor } : et));
  };

  // Remover etapa
  const handleRemoveEtapa = idx => {
    setEtapas(etapas.filter((_, i) => i !== idx).map((et, i) => ({ ...et, ordem: i + 1 })));
  };

  return (
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); onSave({ ...modelo, nome, descricao, etapas }); }}>
      <div>
        <Label>Nome:</Label>
        <Input value={nome} onChange={e => setNome(e.target.value)} />
      </div>
      <div>
        <Label>Descrição:</Label>
        <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} />
      </div>
      <div>
        <Label>Etapas:</Label>
        <ul className="space-y-2 mt-2">
          {etapas.map((etapa, idx) => (
            <li key={etapa.id || idx} className="flex gap-2 items-center border rounded px-2 py-1 bg-gray-50">
              <Input value={etapa.nome} onChange={e => handleEditEtapa(idx, 'nome', e.target.value)} style={{ width: 120 }} />
              <Input value={etapa.tipo} onChange={e => handleEditEtapa(idx, 'tipo', e.target.value)} style={{ width: 100 }} />
              <Input type="number" value={etapa.sla === undefined ? '' : String(etapa.sla)} onChange={e => handleEditEtapa(idx, 'sla', e.target.value === '' ? undefined : Number(e.target.value))} style={{ width: 60 }} />
              {/* Paleta de cores inline */}
              <div className="flex gap-1">
                {CORES_PALETA.map(cor => (
                  <button
                    key={cor}
                    type="button"
                    style={{ background: cor, width: 18, height: 18, borderRadius: '50%', border: etapa.cor === cor ? '2px solid #333' : '1px solid #ccc', outline: 'none' }}
                    onClick={() => handleEditEtapa(idx, 'cor', cor)}
                    aria-label={`Selecionar cor ${cor}`}
                  />
                ))}
              </div>
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={etapa.obrigatoria} onChange={e => handleEditEtapa(idx, 'obrigatoria', e.target.checked)} /> Obrigatória
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={etapa.podeReprovar} onChange={e => handleEditEtapa(idx, 'podeReprovar', e.target.checked)} /> Pode Reprovar
              </label>
              <Button size="sm" variant="ghost" onClick={() => handleRemoveEtapa(idx)}>Remover</Button>
            </li>
          ))}
        </ul>
        {/* Adicionar nova etapa */}
        <div className="flex flex-wrap gap-2 items-end mt-2">
          <Input placeholder="Nome da etapa" value={novaEtapa.nome} onChange={e => setNovaEtapa({ ...novaEtapa, nome: e.target.value })} style={{ width: 120 }} />
          <Input placeholder="Tipo" value={novaEtapa.tipo} onChange={e => setNovaEtapa({ ...novaEtapa, tipo: e.target.value })} style={{ width: 100 }} />
          <Input placeholder="SLA" type="number" value={novaEtapa.sla === undefined ? '' : String(novaEtapa.sla)} onChange={e => setNovaEtapa({ ...novaEtapa, sla: e.target.value === '' ? undefined : Number(e.target.value) })} style={{ width: 60 }} />
          <div className="flex gap-1">
            {CORES_PALETA.map(cor => (
              <button
                key={cor}
                type="button"
                style={{ background: cor, width: 18, height: 18, borderRadius: '50%', border: novaEtapa.cor === cor ? '2px solid #333' : '1px solid #ccc', outline: 'none' }}
                onClick={() => setNovaEtapa({ ...novaEtapa, cor })}
                aria-label={`Selecionar cor ${cor}`}
              />
            ))}
          </div>
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" checked={novaEtapa.obrigatoria} onChange={e => setNovaEtapa({ ...novaEtapa, obrigatoria: e.target.checked })} /> Obrigatória
          </label>
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" checked={novaEtapa.podeReprovar} onChange={e => setNovaEtapa({ ...novaEtapa, podeReprovar: e.target.checked })} /> Pode Reprovar
          </label>
          <Button size="sm" onClick={handleAddEtapa}>Adicionar</Button>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar alterações</Button>
      </div>
    </form>
  );
} 