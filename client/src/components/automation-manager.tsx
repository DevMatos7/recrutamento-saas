import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Play, Clock, CheckCircle, XCircle, AlertTriangle, Zap, Webhook, Bell, Move } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Automatizacao {
  id: string;
  nome: string;
  descricao?: string;
  tipo: string;
  ativo: boolean;
  condicoes?: any[];
  acoes?: any[];
  webhookUrl?: string;
  webhookMethod?: string;
  delayExecucao?: number;
  maxTentativas?: number;
  ultimaExecucao?: string;
  tentativasAtuais?: number;
}

interface LogAutomatizacao {
  id: string;
  status: string;
  dadosEntrada?: any;
  resultado?: any;
  erro?: string;
  tentativa: number;
  dataExecucao: string;
}

interface AutomationManagerProps {
  etapaId: string;
  etapaNome?: string;
}

export default function AutomationManager({ etapaId, etapaNome }: AutomationManagerProps) {
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedAutomatizacao, setSelectedAutomatizacao] = useState<Automatizacao | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    tipo: "movimento",
    ativo: true,
    condicoes: [],
    acoes: [],
    webhookUrl: "",
    webhookMethod: "POST",
    delayExecucao: 0,
    maxTentativas: 3
  });

  // Buscar automatizações da etapa
  const { data: automatizacoes = [], isLoading } = useQuery({
    queryKey: ["/api/etapas", etapaId, "automatizacoes"],
    enabled: !!etapaId,
  });

  // Buscar templates de automatização
  const { data: templates = {} } = useQuery({
    queryKey: ["/api/automation/templates"],
  });

  // Buscar logs da automatização selecionada
  const { data: logs = [] } = useQuery({
    queryKey: ["/api/automatizacoes", selectedAutomatizacao?.id, "logs"],
    enabled: !!selectedAutomatizacao?.id,
  });

  const createAutomatizacaoMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/etapas/${etapaId}/automatizacoes`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/etapas", etapaId, "automatizacoes"] });
      setIsCreateModalOpen(false);
      setFormData({
        nome: "", descricao: "", tipo: "movimento", ativo: true,
        condicoes: [], acoes: [], webhookUrl: "", webhookMethod: "POST",
        delayExecucao: 0, maxTentativas: 3
      });
      toast({
        title: "Sucesso",
        description: "Automatização criada com sucesso!",
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
      const res = await apiRequest("POST", `/api/etapas/${etapaId}/automatizacoes/template`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/etapas", etapaId, "automatizacoes"] });
      setIsTemplateModalOpen(false);
      setSelectedTemplate("");
      toast({
        title: "Sucesso",
        description: "Automatizações criadas a partir do template!",
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

  const updateAutomatizacaoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/automatizacoes/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/etapas", etapaId, "automatizacoes"] });
      toast({
        title: "Sucesso",
        description: "Automatização atualizada com sucesso!",
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
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/automatizacoes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/etapas", etapaId, "automatizacoes"] });
      toast({
        title: "Sucesso",
        description: "Automatização excluída com sucesso!",
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

  const executeMutation = useMutation({
    mutationFn: async ({ id, vagaCandidatoId }: { id: string; vagaCandidatoId: string }) => {
      const res = await apiRequest("POST", `/api/automatizacoes/${id}/executar`, { vagaCandidatoId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/etapas", etapaId, "automatizacoes"] });
      toast({
        title: "Sucesso",
        description: "Automatização executada com sucesso!",
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

  const handleCreateAutomatizacao = () => {
    if (!formData.nome) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive",
      });
      return;
    }

    createAutomatizacaoMutation.mutate(formData);
  };

  const handleCreateFromTemplate = () => {
    if (!selectedTemplate) {
      toast({
        title: "Erro",
        description: "Selecione um template",
        variant: "destructive",
      });
      return;
    }

    createFromTemplateMutation.mutate({ tipoEtapa: selectedTemplate });
  };

  const handleToggleAtivo = (automatizacao: Automatizacao) => {
    updateAutomatizacaoMutation.mutate({
      id: automatizacao.id,
      data: { ativo: !automatizacao.ativo }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta automatização?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleExecute = (id: string) => {
    const vagaCandidatoId = prompt("Digite o ID do candidato para executar a automatização:");
    if (vagaCandidatoId) {
      executeMutation.mutate({ id, vagaCandidatoId });
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'movimento':
        return <Move className="h-4 w-4" />;
      case 'webhook':
        return <Webhook className="h-4 w-4" />;
      case 'notificacao':
        return <Bell className="h-4 w-4" />;
      case 'acao_personalizada':
        return <Zap className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sucesso':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'erro':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'executando':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Automatizações da Etapa</h3>
          {etapaNome && <p className="text-sm text-gray-600">{etapaNome}</p>}
        </div>
        <div className="flex gap-2">
          <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Automatizações do Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tipo de Etapa</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de etapa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Triagem de Currículos">Triagem</SelectItem>
                      <SelectItem value="Entrevista com o Candidato">Entrevista</SelectItem>
                      <SelectItem value="Recebimento da Documentação Admissional">Documentação</SelectItem>
                      <SelectItem value="Realização de Exames Médicos">Exames</SelectItem>
                      <SelectItem value="Integração e Ambientação">Integração</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsTemplateModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateFromTemplate} disabled={createFromTemplateMutation.isPending}>
                    {createFromTemplateMutation.isPending ? "Criando..." : "Criar Automatizações"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Automatização
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Nova Automatização</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Mover para próxima etapa"
                    />
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="movimento">Movimento</SelectItem>
                        <SelectItem value="webhook">Webhook</SelectItem>
                        <SelectItem value="notificacao">Notificação</SelectItem>
                        <SelectItem value="acao_personalizada">Ação Personalizada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição da automatização..."
                  />
                </div>
                {formData.tipo === 'webhook' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>URL do Webhook</Label>
                      <Input
                        value={formData.webhookUrl}
                        onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                        placeholder="https://api.exemplo.com/webhook"
                      />
                    </div>
                    <div>
                      <Label>Método</Label>
                      <Select value={formData.webhookMethod} onValueChange={(value) => setFormData({ ...formData, webhookMethod: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Delay de Execução (minutos)</Label>
                    <Input
                      type="number"
                      value={formData.delayExecucao}
                      onChange={(e) => setFormData({ ...formData, delayExecucao: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Máximo de Tentativas</Label>
                    <Input
                      type="number"
                      value={formData.maxTentativas}
                      onChange={(e) => setFormData({ ...formData, maxTentativas: parseInt(e.target.value) || 3 })}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                  />
                  <Label htmlFor="ativo">Ativo</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateAutomatizacao} disabled={createAutomatizacaoMutation.isPending}>
                    {createAutomatizacaoMutation.isPending ? "Criando..." : "Criar Automatização"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lista de Automatizações */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            {automatizacoes.map((automatizacao: Automatizacao) => (
              <div key={automatizacao.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getTipoIcon(automatizacao.tipo)}
                    <div>
                      <div className="font-medium">{automatizacao.nome}</div>
                      {automatizacao.descricao && (
                        <div className="text-sm text-gray-600">{automatizacao.descricao}</div>
                      )}
                    </div>
                  </div>
                  <Badge variant={automatizacao.ativo ? "default" : "secondary"}>
                    {automatizacao.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                  {automatizacao.delayExecucao && automatizacao.delayExecucao > 0 && (
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {automatizacao.delayExecucao}min
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedAutomatizacao(automatizacao)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Ver logs</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleExecute(automatizacao.id)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Executar</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleToggleAtivo(automatizacao)}
                        >
                          <Switch className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{automatizacao.ativo ? "Desativar" : "Ativar"}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(automatizacao.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Excluir</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ))}
            
            {automatizacoes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhuma automatização encontrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Logs */}
      {selectedAutomatizacao && (
        <Dialog open={!!selectedAutomatizacao} onOpenChange={() => setSelectedAutomatizacao(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Logs de Execução - {selectedAutomatizacao.nome}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="logs" className="w-full">
              <TabsList>
                <TabsTrigger value="logs">Logs</TabsTrigger>
                <TabsTrigger value="details">Detalhes</TabsTrigger>
              </TabsList>
              <TabsContent value="logs" className="space-y-4">
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {logs.map((log: LogAutomatizacao) => (
                    <div key={log.id} className="flex items-center gap-3 p-3 border rounded">
                      {getStatusIcon(log.status)}
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="font-medium">{log.status}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(log.dataExecucao).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        {log.erro && (
                          <div className="text-sm text-red-600 mt-1">{log.erro}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          Tentativa {log.tentativa}
                        </div>
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum log encontrado
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome</Label>
                    <div className="text-sm">{selectedAutomatizacao.nome}</div>
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <div className="text-sm">{selectedAutomatizacao.tipo}</div>
                  </div>
                  <div>
                    <Label>Delay de Execução</Label>
                    <div className="text-sm">{selectedAutomatizacao.delayExecucao || 0} minutos</div>
                  </div>
                  <div>
                    <Label>Máximo de Tentativas</Label>
                    <div className="text-sm">{selectedAutomatizacao.maxTentativas || 3}</div>
                  </div>
                  {selectedAutomatizacao.webhookUrl && (
                    <div className="col-span-2">
                      <Label>URL do Webhook</Label>
                      <div className="text-sm break-all">{selectedAutomatizacao.webhookUrl}</div>
                    </div>
                  )}
                  {selectedAutomatizacao.ultimaExecucao && (
                    <div>
                      <Label>Última Execução</Label>
                      <div className="text-sm">
                        {new Date(selectedAutomatizacao.ultimaExecucao).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  )}
                  <div>
                    <Label>Tentativas Atuais</Label>
                    <div className="text-sm">{selectedAutomatizacao.tentativasAtuais || 0}</div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 