import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, AlertTriangle, Clock, CheckCircle, XCircle, Bell, Mail, Smartphone, Calendar, Timer, Zap } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SlaEtapa {
  id: string;
  nome: string;
  descricao?: string;
  prazoHoras: number;
  prazoDias: number;
  tipoPrazo: 'horas' | 'dias' | 'semanas';
  ativo: boolean;
  alertaAntes: number;
  alertaApos: number;
  acoesAutomaticas: any[];
  notificacoes: any;
}

interface AlertaSla {
  id: string;
  slaId: string;
  vagaCandidatoId: string;
  tipo: string;
  status: string;
  titulo: string;
  mensagem?: string;
  nivelUrgencia: string;
  dataVencimento: string;
  dataCriacao: string;
  dataEnvio?: string;
  dataLeitura?: string;
  dataResolucao?: string;
  sla?: {
    nome: string;
    descricao?: string;
  };
  vagaCandidato?: {
    candidato: {
      nome: string;
      email: string;
    };
    vaga: {
      titulo: string;
    };
  };
}

interface SlaManagerProps {
  etapaId: string;
  etapaNome: string;
  vagaCandidatoId?: string;
}

export default function SlaManager({ etapaId, etapaNome, vagaCandidatoId }: SlaManagerProps) {
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTipoEtapa, setSelectedTipoEtapa] = useState<string>("");
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    prazoHoras: 0,
    prazoDias: 1,
    tipoPrazo: "dias" as const,
    ativo: true,
    alertaAntes: 2,
    alertaApos: 1,
    acoesAutomaticas: [],
    notificacoes: {
      email: true,
      push: true,
      sms: false,
      destinatarios: []
    }
  });

  // Buscar SLAs da etapa
  const { data: slas = [], isLoading } = useQuery({
    queryKey: ["/api/etapas", etapaId, "slas"],
    enabled: !!etapaId,
  });

  // Buscar templates de SLA
  const { data: templates = {} } = useQuery({
    queryKey: ["/api/sla/templates"],
  });

  // Buscar alertas de SLA pendentes
  const { data: alertasPendentes = [] } = useQuery({
    queryKey: ["/api/sla/alertas/pendentes"],
  });

  // Buscar alertas de SLA do candidato
  const { data: alertasCandidato = [] } = useQuery({
    queryKey: ["/api/vaga-candidatos", vagaCandidatoId, "sla-alertas"],
    enabled: !!vagaCandidatoId,
  });

  const createSlaMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/etapas/${etapaId}/slas`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/etapas", etapaId, "slas"] });
      setIsCreateModalOpen(false);
      setFormData({
        nome: "", descricao: "", prazoHoras: 0, prazoDias: 1, tipoPrazo: "dias", 
        ativo: true, alertaAntes: 2, alertaApos: 1, acoesAutomaticas: [], 
        notificacoes: { email: true, push: true, sms: false, destinatarios: [] }
      });
      toast({
        title: "Sucesso",
        description: "SLA criado com sucesso!",
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
      const res = await apiRequest("POST", `/api/etapas/${etapaId}/slas/template`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/etapas", etapaId, "slas"] });
      setIsTemplateModalOpen(false);
      setSelectedTipoEtapa("");
      toast({
        title: "Sucesso",
        description: "SLAs criados a partir do template!",
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

  const updateSlaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/slas/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/etapas", etapaId, "slas"] });
      toast({
        title: "Sucesso",
        description: "SLA atualizado com sucesso!",
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
      await apiRequest("DELETE", `/api/slas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/etapas", etapaId, "slas"] });
      toast({
        title: "Sucesso",
        description: "SLA excluído com sucesso!",
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

  const resolverAlertaMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/sla-alertas/${id}/resolver`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sla/alertas/pendentes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vaga-candidatos", vagaCandidatoId, "sla-alertas"] });
      toast({
        title: "Sucesso",
        description: "Alerta resolvido com sucesso!",
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

  const handleCreateSla = () => {
    if (!formData.nome) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive",
      });
      return;
    }

    createSlaMutation.mutate(formData);
  };

  const handleCreateFromTemplate = () => {
    if (!selectedTipoEtapa) {
      toast({
        title: "Erro",
        description: "Tipo de etapa é obrigatório",
        variant: "destructive",
      });
      return;
    }

    createFromTemplateMutation.mutate({ tipoEtapa: selectedTipoEtapa });
  };

  const handleToggleAtivo = (sla: SlaEtapa) => {
    updateSlaMutation.mutate({
      id: sla.id,
      data: { ativo: !sla.ativo }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este SLA?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleResolverAlerta = (id: string) => {
    resolverAlertaMutation.mutate(id);
  };

  const getNivelUrgenciaColor = (nivel: string) => {
    switch (nivel) {
      case 'baixo':
        return "bg-green-100 text-green-800";
      case 'medio':
        return "bg-yellow-100 text-yellow-800";
      case 'alto':
        return "bg-orange-100 text-orange-800";
      case 'critico':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getNivelUrgenciaIcon = (nivel: string) => {
    switch (nivel) {
      case 'baixo':
        return <CheckCircle className="h-4 w-4" />;
      case 'medio':
        return <Clock className="h-4 w-4" />;
      case 'alto':
        return <AlertTriangle className="h-4 w-4" />;
      case 'critico':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatarPrazo = (sla: SlaEtapa) => {
    if (sla.tipoPrazo === 'horas') {
      return `${sla.prazoHoras} hora(s)`;
    } else if (sla.tipoPrazo === 'dias') {
      return `${sla.prazoDias} dia(s)`;
    } else if (sla.tipoPrazo === 'semanas') {
      return `${sla.prazoDias} semana(s)`;
    }
    return `${sla.prazoDias} dia(s)`;
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
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
          <h3 className="text-lg font-semibold">SLAs da Etapa: {etapaNome}</h3>
          <p className="text-sm text-gray-600">Gerencie os prazos e alertas desta etapa</p>
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
                <DialogTitle>Criar SLAs do Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tipo de Etapa</Label>
                  <Select value={selectedTipoEtapa} onValueChange={setSelectedTipoEtapa}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de etapa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="triagem">Triagem</SelectItem>
                      <SelectItem value="entrevista">Entrevista</SelectItem>
                      <SelectItem value="documentacao">Documentação</SelectItem>
                      <SelectItem value="exames">Exames</SelectItem>
                      <SelectItem value="integracao">Integração</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsTemplateModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateFromTemplate} disabled={createFromTemplateMutation.isPending}>
                    {createFromTemplateMutation.isPending ? "Criando..." : "Criar SLAs"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo SLA
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo SLA</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: SLA Triagem Padrão"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição do SLA..."
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Tipo de Prazo</Label>
                    <Select value={formData.tipoPrazo} onValueChange={(value: any) => setFormData({ ...formData, tipoPrazo: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="horas">Horas</SelectItem>
                        <SelectItem value="dias">Dias</SelectItem>
                        <SelectItem value="semanas">Semanas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prazo</Label>
                    <Input
                      type="number"
                      value={formData.tipoPrazo === 'horas' ? formData.prazoHoras : formData.prazoDias}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        if (formData.tipoPrazo === 'horas') {
                          setFormData({ ...formData, prazoHoras: value });
                        } else {
                          setFormData({ ...formData, prazoDias: value });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label>Ativo</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Switch
                        checked={formData.ativo}
                        onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                      />
                      <span className="text-sm">{formData.ativo ? "Sim" : "Não"}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Alerta Antes (horas/dias)</Label>
                    <Input
                      type="number"
                      value={formData.alertaAntes}
                      onChange={(e) => setFormData({ ...formData, alertaAntes: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Alerta Após (horas/dias)</Label>
                    <Input
                      type="number"
                      value={formData.alertaApos}
                      onChange={(e) => setFormData({ ...formData, alertaApos: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Notificações</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="email"
                        checked={formData.notificacoes.email}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          notificacoes: { ...formData.notificacoes, email: !!checked }
                        })}
                      />
                      <Label htmlFor="email" className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="push"
                        checked={formData.notificacoes.push}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          notificacoes: { ...formData.notificacoes, push: !!checked }
                        })}
                      />
                      <Label htmlFor="push" className="flex items-center gap-1">
                        <Bell className="h-4 w-4" />
                        Push
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sms"
                        checked={formData.notificacoes.sms}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          notificacoes: { ...formData.notificacoes, sms: !!checked }
                        })}
                      />
                      <Label htmlFor="sms" className="flex items-center gap-1">
                        <Smartphone className="h-4 w-4" />
                        SMS
                      </Label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateSla} disabled={createSlaMutation.isPending}>
                    {createSlaMutation.isPending ? "Criando..." : "Criar SLA"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs para SLAs e Alertas */}
      <Tabs defaultValue="slas" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="slas">SLAs ({slas.length})</TabsTrigger>
          <TabsTrigger value="alertas">Alertas ({alertasPendentes.length})</TabsTrigger>
          {vagaCandidatoId && (
            <TabsTrigger value="candidato">Candidato ({alertasCandidato.length})</TabsTrigger>
          )}
        </TabsList>

        {/* Tab SLAs */}
        <TabsContent value="slas" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                {slas.map((sla: SlaEtapa) => (
                  <div key={sla.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Timer className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="font-medium">{sla.nome}</div>
                          {sla.descricao && (
                            <div className="text-sm text-gray-600">{sla.descricao}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={sla.ativo ? "default" : "secondary"}>
                          {sla.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                        <Badge variant="outline">
                          {formatarPrazo(sla)}
                        </Badge>
                        <Badge variant="outline">
                          Alerta: {sla.alertaAntes}h antes, {sla.alertaApos}h após
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleToggleAtivo(sla)}
                            >
                              <Switch className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{sla.ativo ? "Desativar" : "Ativar"}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(sla.id)}
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
                
                {slas.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum SLA configurado para esta etapa
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Alertas */}
        <TabsContent value="alertas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Alertas Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alertasPendentes.map((alerta: AlertaSla) => (
                  <div key={alerta.id} className="flex items-start gap-3 p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {getNivelUrgenciaIcon(alerta.nivelUrgencia)}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{alerta.titulo}</div>
                            {alerta.mensagem && (
                              <div className="text-sm text-gray-600 mt-1">{alerta.mensagem}</div>
                            )}
                            <div className="text-sm text-gray-500 mt-1">
                              SLA: {alerta.sla?.nome}
                            </div>
                            {alerta.vagaCandidato && (
                              <div className="text-sm text-gray-500">
                                Candidato: {alerta.vagaCandidato.candidato.nome} - {alerta.vagaCandidato.vaga.titulo}
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatarData(alerta.dataVencimento)}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge className={getNivelUrgenciaColor(alerta.nivelUrgencia)}>
                            {alerta.nivelUrgencia}
                          </Badge>
                          <Badge variant="outline">
                            {alerta.tipo}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleResolverAlerta(alerta.id)}
                          >
                            Resolver
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {alertasPendentes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum alerta pendente
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Candidato */}
        {vagaCandidatoId && (
          <TabsContent value="candidato" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Alertas do Candidato
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alertasCandidato.map((alerta: AlertaSla) => (
                    <div key={alerta.id} className="flex items-start gap-3 p-4 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {getNivelUrgenciaIcon(alerta.nivelUrgencia)}
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{alerta.titulo}</div>
                              {alerta.mensagem && (
                                <div className="text-sm text-gray-600 mt-1">{alerta.mensagem}</div>
                              )}
                              <div className="text-sm text-gray-500 mt-1">
                                SLA: {alerta.sla?.nome}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatarData(alerta.dataVencimento)}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge className={getNivelUrgenciaColor(alerta.nivelUrgencia)}>
                              {alerta.nivelUrgencia}
                            </Badge>
                            <Badge variant="outline">
                              {alerta.status}
                            </Badge>
                            {alerta.status === 'pendente' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleResolverAlerta(alerta.id)}
                              >
                                Resolver
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {alertasCandidato.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum alerta para este candidato
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
} 