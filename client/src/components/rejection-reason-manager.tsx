import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, AlertTriangle, CheckCircle, XCircle, History, FileText, User, Calendar } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MotivoReprovacao {
  id: string;
  nome: string;
  descricao?: string;
  categoria: string;
  ativo: boolean;
  obrigatorio: boolean;
  ordem: number;
}

interface HistoricoReprovacao {
  id: string;
  motivoId?: string;
  motivoCustomizado?: string;
  observacoes?: string;
  etapaReprovacao: string;
  reprovadoPor: string;
  dataReprovacao: string;
  motivo?: {
    nome: string;
    categoria: string;
  };
  reprovadoPorUsuario?: {
    nome: string;
    email: string;
  };
}

interface RejectionReasonManagerProps {
  empresaId: string;
  vagaCandidatoId?: string;
  onRejectionComplete?: () => void;
}

export default function RejectionReasonManager({ 
  empresaId, 
  vagaCandidatoId, 
  onRejectionComplete 
}: RejectionReasonManagerProps) {
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<string>("");
  const [selectedMotivo, setSelectedMotivo] = useState<string>("");
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    categoria: "geral",
    ativo: true,
    obrigatorio: false,
    ordem: 0
  });
  const [rejectionData, setRejectionData] = useState({
    motivoId: "",
    motivoCustomizado: "",
    observacoes: ""
  });

  // Buscar motivos de reprovação da empresa
  const { data: motivos = [], isLoading } = useQuery({
    queryKey: ["/api/empresas", empresaId, "motivos-reprovacao"],
    enabled: !!empresaId,
  });

  // Buscar templates de motivos de reprovação
  const { data: templates = {} } = useQuery({
    queryKey: ["/api/rejection/templates"],
  });

  // Buscar histórico de reprovações do candidato
  const { data: historico = [] } = useQuery({
    queryKey: ["/api/vaga-candidatos", vagaCandidatoId, "historico-reprovacoes"],
    enabled: !!vagaCandidatoId,
  });

  const createMotivoMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/empresas/${empresaId}/motivos-reprovacao`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empresas", empresaId, "motivos-reprovacao"] });
      setIsCreateModalOpen(false);
      setFormData({
        nome: "", descricao: "", categoria: "geral", ativo: true, obrigatorio: false, ordem: 0
      });
      toast({
        title: "Sucesso",
        description: "Motivo de reprovação criado com sucesso!",
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
      const res = await apiRequest("POST", `/api/empresas/${empresaId}/motivos-reprovacao/template`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empresas", empresaId, "motivos-reprovacao"] });
      setIsTemplateModalOpen(false);
      setSelectedCategoria("");
      toast({
        title: "Sucesso",
        description: "Motivos criados a partir do template!",
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

  const updateMotivoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/motivos-reprovacao/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empresas", empresaId, "motivos-reprovacao"] });
      toast({
        title: "Sucesso",
        description: "Motivo atualizado com sucesso!",
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
      await apiRequest("DELETE", `/api/motivos-reprovacao/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empresas", empresaId, "motivos-reprovacao"] });
      toast({
        title: "Sucesso",
        description: "Motivo excluído com sucesso!",
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

  const rejectCandidateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/vaga-candidatos/${vagaCandidatoId}/reprovar`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vaga-candidatos", vagaCandidatoId, "historico-reprovacoes"] });
      setIsRejectionModalOpen(false);
      setRejectionData({ motivoId: "", motivoCustomizado: "", observacoes: "" });
      onRejectionComplete?.();
      toast({
        title: "Sucesso",
        description: "Candidato reprovado com sucesso!",
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

  const handleCreateMotivo = () => {
    if (!formData.nome) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive",
      });
      return;
    }

    createMotivoMutation.mutate(formData);
  };

  const handleCreateFromTemplate = () => {
    createFromTemplateMutation.mutate({ categoria: selectedCategoria });
  };

  const handleToggleAtivo = (motivo: MotivoReprovacao) => {
    updateMotivoMutation.mutate({
      id: motivo.id,
      data: { ativo: !motivo.ativo }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este motivo?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleRejectCandidate = () => {
    if (!rejectionData.motivoId && !rejectionData.motivoCustomizado) {
      toast({
        title: "Erro",
        description: "É obrigatório informar o motivo da reprovação",
        variant: "destructive",
      });
      return;
    }

    rejectCandidateMutation.mutate(rejectionData);
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'geral':
        return <User className="h-4 w-4" />;
      case 'tecnico':
        return <FileText className="h-4 w-4" />;
      case 'comportamental':
        return <AlertTriangle className="h-4 w-4" />;
      case 'documental':
        return <FileText className="h-4 w-4" />;
      case 'outros':
        return <XCircle className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'geral':
        return "bg-blue-100 text-blue-800";
      case 'tecnico':
        return "bg-green-100 text-green-800";
      case 'comportamental':
        return "bg-yellow-100 text-yellow-800";
      case 'documental':
        return "bg-purple-100 text-purple-800";
      case 'outros':
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const motivosPorCategoria = motivos.reduce((acc: Record<string, MotivoReprovacao[]>, motivo: MotivoReprovacao) => {
    if (!acc[motivo.categoria]) {
      acc[motivo.categoria] = [];
    }
    acc[motivo.categoria].push(motivo);
    return acc;
  }, {});

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
          <h3 className="text-lg font-semibold">Motivos de Reprovação</h3>
          <p className="text-sm text-gray-600">Gerencie os motivos de reprovação da empresa</p>
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
                <DialogTitle>Criar Motivos do Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Categoria</Label>
                  <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as categorias</SelectItem>
                      <SelectItem value="geral">Geral</SelectItem>
                      <SelectItem value="tecnico">Técnico</SelectItem>
                      <SelectItem value="comportamental">Comportamental</SelectItem>
                      <SelectItem value="documental">Documental</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsTemplateModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateFromTemplate} disabled={createFromTemplateMutation.isPending}>
                    {createFromTemplateMutation.isPending ? "Criando..." : "Criar Motivos"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Motivo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Motivo de Reprovação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Perfil não adequado"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição do motivo..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Categoria</Label>
                    <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="geral">Geral</SelectItem>
                        <SelectItem value="tecnico">Técnico</SelectItem>
                        <SelectItem value="comportamental">Comportamental</SelectItem>
                        <SelectItem value="documental">Documental</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Ordem</Label>
                    <Input
                      type="number"
                      value={formData.ordem}
                      onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="obrigatorio"
                    checked={formData.obrigatorio}
                    onCheckedChange={(checked) => setFormData({ ...formData, obrigatorio: checked })}
                  />
                  <Label htmlFor="obrigatorio">Obrigatório</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateMotivo} disabled={createMotivoMutation.isPending}>
                    {createMotivoMutation.isPending ? "Criando..." : "Criar Motivo"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lista de Motivos por Categoria */}
      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="tecnico">Técnico</TabsTrigger>
          <TabsTrigger value="comportamental">Comportamental</TabsTrigger>
          <TabsTrigger value="documental">Documental</TabsTrigger>
          <TabsTrigger value="outros">Outros</TabsTrigger>
        </TabsList>

        {Object.entries(motivosPorCategoria).map(([categoria, motivosCategoria]) => (
          <TabsContent key={categoria} value={categoria} className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {motivosCategoria.map((motivo: MotivoReprovacao) => (
                    <div key={motivo.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getCategoriaIcon(motivo.categoria)}
                          <div>
                            <div className="font-medium">{motivo.nome}</div>
                            {motivo.descricao && (
                              <div className="text-sm text-gray-600">{motivo.descricao}</div>
                            )}
                          </div>
                        </div>
                        <Badge variant={motivo.ativo ? "default" : "secondary"}>
                          {motivo.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                        {motivo.obrigatorio && (
                          <Badge variant="destructive">
                            Obrigatório
                          </Badge>
                        )}
                        <Badge className={getCategoriaColor(motivo.categoria)}>
                          {motivo.categoria}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleToggleAtivo(motivo)}
                              >
                                <Switch className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{motivo.ativo ? "Desativar" : "Ativar"}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDelete(motivo.id)}
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
                  
                  {motivosCategoria.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum motivo encontrado nesta categoria
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Modal de Reprovação de Candidato */}
      {vagaCandidatoId && (
        <Dialog open={isRejectionModalOpen} onOpenChange={setIsRejectionModalOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <XCircle className="h-4 w-4 mr-2" />
              Reprovar Candidato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Reprovar Candidato</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Motivo da Reprovação *</Label>
                <RadioGroup 
                  value={rejectionData.motivoId ? "padrao" : "customizado"} 
                  onValueChange={(value) => {
                    if (value === "customizado") {
                      setRejectionData({ ...rejectionData, motivoId: "", motivoCustomizado: "" });
                    } else {
                      setRejectionData({ ...rejectionData, motivoCustomizado: "" });
                    }
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="padrao" id="padrao" />
                    <Label htmlFor="padrao">Motivo Padrão</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="customizado" id="customizado" />
                    <Label htmlFor="customizado">Motivo Customizado</Label>
                  </div>
                </RadioGroup>
              </div>

              {rejectionData.motivoId ? (
                <div>
                  <Label>Selecionar Motivo</Label>
                  <Select value={rejectionData.motivoId} onValueChange={(value) => setRejectionData({ ...rejectionData, motivoId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {motivos.filter((m: MotivoReprovacao) => m.ativo).map((motivo: MotivoReprovacao) => (
                        <SelectItem key={motivo.id} value={motivo.id}>
                          {motivo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <Label>Motivo Customizado</Label>
                  <Textarea
                    value={rejectionData.motivoCustomizado}
                    onChange={(e) => setRejectionData({ ...rejectionData, motivoCustomizado: e.target.value })}
                    placeholder="Descreva o motivo da reprovação..."
                  />
                </div>
              )}

              <div>
                <Label>Observações Adicionais</Label>
                <Textarea
                  value={rejectionData.observacoes}
                  onChange={(e) => setRejectionData({ ...rejectionData, observacoes: e.target.value })}
                  placeholder="Observações adicionais sobre a reprovação..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsRejectionModalOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleRejectCandidate} 
                  disabled={rejectCandidateMutation.isPending}
                >
                  {rejectCandidateMutation.isPending ? "Reprovando..." : "Reprovar Candidato"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Histórico de Reprovações */}
      {vagaCandidatoId && historico.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Reprovações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {historico.map((item: HistoricoReprovacao) => (
                <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <XCircle className="h-5 w-5 text-red-500 mt-1" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          {item.motivo?.nome || item.motivoCustomizado}
                        </div>
                        {item.observacoes && (
                          <div className="text-sm text-gray-600 mt-1">{item.observacoes}</div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(item.dataReprovacao).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {item.reprovadoPorUsuario?.nome || "Usuário"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.dataReprovacao).toLocaleString('pt-BR')}
                      </div>
                      {item.motivo?.categoria && (
                        <Badge variant="outline" className="text-xs">
                          {item.motivo.categoria}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 