import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Plus, Edit, Trash2, FileText, CheckCircle, XCircle, Clock, Upload, Link, QrCode, Eye, Download } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface ChecklistItem {
  id: string;
  nome: string;
  descricao?: string;
  tipo: string;
  obrigatorio: boolean;
  ordem: number;
  validacaoAutomatica: boolean;
  criteriosValidacao?: any;
}

interface ChecklistTemplate {
  documentacao: any[];
  exames: any[];
  tarefas: any[];
  validacoes: any[];
}

interface ChecklistProgress {
  total: number;
  completados: number;
  pendentes: number;
  aprovados: number;
  reprovados: number;
}

interface ChecklistManagerProps {
  etapaId: string;
  vagaCandidatoId?: string;
  etapaNome?: string;
  onChecklistComplete?: () => void;
}

export default function ChecklistManager({ 
  etapaId, 
  vagaCandidatoId, 
  etapaNome,
  onChecklistComplete 
}: ChecklistManagerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editingChecklist, setEditingChecklist] = useState<ChecklistItem | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    tipo: "documento",
    obrigatorio: true,
    validacaoAutomatica: false
  });




  // Buscar checklists da etapa (sempre do banco, pois todas as etapas são reais)
  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ["/api/etapas", etapaId, "checklists"],
    queryFn: async () => {
      const response = await fetch(`/api/etapas/${etapaId}/checklists`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!etapaId,
  });

  // Buscar templates de checklist
  const { data: templates = {} } = useQuery({
    queryKey: ["/api/checklist/templates"],
  });

  // Buscar itens de checklist do candidato (se aplicável)
  const { data: itensCandidato = [] } = useQuery({
    queryKey: ["/api/vaga-candidatos", vagaCandidatoId, "checklist"],
    enabled: !!vagaCandidatoId,
  });

  // Buscar link de upload do candidato
  const { data: uploadLink } = useQuery({
    queryKey: ["/api/vaga-candidatos", vagaCandidatoId, "upload-link"],
    enabled: !!vagaCandidatoId,
  });

  const createChecklistMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/etapas/${etapaId}/checklists`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      // Sempre invalidar a query de etapas reais
      queryClient.invalidateQueries({ queryKey: ["/api/etapas", etapaId, "checklists"] });
      setIsCreateModalOpen(false);
      setFormData({ nome: "", descricao: "", tipo: "documento", obrigatorio: true, validacaoAutomatica: false });
      toast({
        title: "Sucesso",
        description: data.message || "Item de checklist criado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar item de checklist",
        variant: "destructive",
      });
    },
  });

  const updateChecklistMutation = useMutation({
    mutationFn: async (data: any) => {
      // Verificar se o ID é válido antes de fazer PUT
      if (!editingChecklist?.id) {
        throw new Error('Não é possível editar itens sem ID válido.');
      }
      const res = await apiRequest("PUT", `/api/checklists/${editingChecklist.id}`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      // Sempre invalidar a query de etapas reais
      queryClient.invalidateQueries({ queryKey: ["/api/etapas", etapaId, "checklists"] });
      setIsEditModalOpen(false);
      setEditingChecklist(null);
      setFormData({ nome: "", descricao: "", tipo: "documento", obrigatorio: true, validacaoAutomatica: false });
      toast({
        title: "Sucesso",
        description: "Item de checklist atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar item de checklist",
        variant: "destructive",
      });
    },
  });

  const createFromTemplateMutation = useMutation({
    mutationFn: async (templateType: string) => {
      const res = await apiRequest("POST", `/api/etapas/${etapaId}/checklists/template`, { tipoEtapa: templateType });
      return await res.json();
    },
    onSuccess: (data) => {
      // Sempre invalidar a query de etapas reais
      queryClient.invalidateQueries({ queryKey: ["/api/etapas", etapaId, "checklists"] });
      setIsTemplateModalOpen(false);
      toast({
        title: "Sucesso",
        description: "Checklist criado a partir do template!",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, status, observacoes, anexos }: any) => {
      const res = await apiRequest("PUT", `/api/checklist-items/${itemId}`, { status, observacoes, anexos });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vaga-candidatos", vagaCandidatoId, "checklist"] });
      setIsUploadModalOpen(false);
      toast({
        title: "Sucesso",
        description: "Item atualizado com sucesso!",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Verificar se o ID é válido antes de deletar
      if (!id) {
        throw new Error('Não é possível deletar itens sem ID válido.');
      }
      await apiRequest("DELETE", `/api/checklists/${id}`);
    },
    onSuccess: (_, id) => {
      // Sempre invalidar a query de etapas reais
      queryClient.invalidateQueries({ queryKey: ["/api/etapas", etapaId, "checklists"] });
      toast({
        title: "Sucesso",
        description: "Item removido com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao deletar item de checklist",
        variant: "destructive",
      });
    },
  });

  const handleCreateChecklist = () => {
    createChecklistMutation.mutate(formData);
  };

  const handleCreateFromTemplate = () => {
    if (selectedTemplate) {
      createFromTemplateMutation.mutate(selectedTemplate);
    }
  };

  const handleUpdateItem = (itemId: string, status: string, observacoes?: string, anexos?: any[]) => {
    updateItemMutation.mutate({ itemId, status, observacoes, anexos });
  };

  const handleEdit = (checklist: ChecklistItem) => {
    setEditingChecklist(checklist);
    setFormData({
      nome: checklist.nome,
      descricao: checklist.descricao || "",
      tipo: checklist.tipo,
      obrigatorio: checklist.obrigatorio,
      validacaoAutomatica: checklist.validacaoAutomatica
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja remover este item?")) {
      deleteMutation.mutate(id);
    }
  };

  const calcularProgresso = (): ChecklistProgress => {
    const total = allChecklists.length;
    const itensCompletados = itensCandidato.filter((item: any) => 
      item.status === "aprovado" || item.status === "completado"
    );
    const itensPendentes = itensCandidato.filter((item: any) => 
      item.status === "pendente"
    );
    const itensAprovados = itensCandidato.filter((item: any) => 
      item.status === "aprovado"
    );
    const itensReprovados = itensCandidato.filter((item: any) => 
      item.status === "reprovado"
    );

    return {
      total,
      completados: itensCompletados.length,
      pendentes: itensPendentes.length,
      aprovados: itensAprovados.length,
      reprovados: itensReprovados.length,
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "aprovado":
      case "completado":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "reprovado":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "em_andamento":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "documento":
        return <FileText className="h-4 w-4" />;
      case "exame":
        return <FileText className="h-4 w-4" />;
      case "tarefa":
        return <CheckCircle className="h-4 w-4" />;
      case "validacao":
        return <Eye className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aprovado":
      case "completado":
        return <Badge variant="default" className="bg-green-100 text-green-800">Aprovado</Badge>;
      case "reprovado":
        return <Badge variant="destructive">Reprovado</Badge>;
      case "em_andamento":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Em Andamento</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  // Combinar checklists reais e de template conforme necessário
  const allChecklists = checklists;
  
  const progresso = calcularProgresso();
  const percentualCompleto = progresso.total > 0 ? (progresso.completados / progresso.total) * 100 : 0;



  return (
    <div className="space-y-6">


      {/* Header com progresso */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Checklist - {etapaNome}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {progresso.completados} de {progresso.total} itens completados
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLinkModalOpen(true)}
                disabled={!vagaCandidatoId}
              >
                <Link className="h-4 w-4 mr-2" />
                Link de Upload
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTemplateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Template
              </Button>
              <Button
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Item
              </Button>
            </div>
          </div>
          <Progress value={percentualCompleto} className="w-full" />
        </CardHeader>
      </Card>

      {/* Lista de itens */}
      <div className="grid gap-4">
        {allChecklists.map((checklist: ChecklistItem, index: number) => {
          const itemCandidato = itensCandidato.find((item: any) => item.checklistId === checklist.id);
          
          return (
            <Card key={checklist.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      {getTipoIcon(checklist.tipo)}
                      <span className="font-medium">{checklist.nome}</span>
                      {checklist.obrigatorio && (
                        <Badge variant="outline" className="text-xs">Obrigatório</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {itemCandidato ? (
                      <>
                        {getStatusIcon(itemCandidato.status)}
                        {getStatusBadge(itemCandidato.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedItem({ ...itemCandidato, checklist });
                            setIsUploadModalOpen(true);
                          }}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {itemCandidato.anexos?.length > 0 ? 'Ver' : 'Upload'}
                        </Button>
                      </>
                    ) : (
                      <Badge variant="outline">Não iniciado</Badge>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(checklist)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {user?.perfil === 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(checklist.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                {checklist.descricao && (
                  <p className="text-sm text-muted-foreground mt-2">{checklist.descricao}</p>
                )}
                
                {itemCandidato?.anexos?.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium mb-2">Documentos anexados:</p>
                    <div className="flex flex-wrap gap-2">
                      {itemCandidato.anexos.map((anexo: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded border">
                          <FileText className="h-3 w-3" />
                          <span className="text-xs">{anexo.nome}</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal de criação */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Item de Checklist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: RG (Frente e Verso)"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição detalhada do item"
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="documento">Documento</SelectItem>
                  <SelectItem value="exame">Exame</SelectItem>
                  <SelectItem value="tarefa">Tarefa</SelectItem>
                  <SelectItem value="validacao">Validação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="obrigatorio"
                checked={formData.obrigatorio}
                onCheckedChange={(checked) => setFormData({ ...formData, obrigatorio: !!checked })}
              />
              <Label htmlFor="obrigatorio">Obrigatório</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="validacaoAutomatica"
                checked={formData.validacaoAutomatica}
                onCheckedChange={(checked) => setFormData({ ...formData, validacaoAutomatica: !!checked })}
              />
              <Label htmlFor="validacaoAutomatica">Validação Automática</Label>
            </div>
            <Button onClick={handleCreateChecklist} className="w-full">
              Criar Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Item de Checklist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: RG (Frente e Verso)"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição detalhada do item"
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="documento">Documento</SelectItem>
                  <SelectItem value="exame">Exame</SelectItem>
                  <SelectItem value="tarefa">Tarefa</SelectItem>
                  <SelectItem value="validacao">Validação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="obrigatorio-edit"
                checked={formData.obrigatorio}
                onCheckedChange={(checked) => setFormData({ ...formData, obrigatorio: !!checked })}
              />
              <Label htmlFor="obrigatorio-edit">Obrigatório</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="validacaoAutomatica-edit"
                checked={formData.validacaoAutomatica}
                onCheckedChange={(checked) => setFormData({ ...formData, validacaoAutomatica: !!checked })}
              />
              <Label htmlFor="validacaoAutomatica-edit">Validação Automática</Label>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={() => updateChecklistMutation.mutate(formData)} className="flex-1">
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de template */}
      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Checklist a partir de Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Selecione o template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="documentacao">Documentação Admissional</SelectItem>
                  <SelectItem value="exames">Exames Médicos</SelectItem>
                  <SelectItem value="tarefas">Tarefas Administrativas</SelectItem>
                  <SelectItem value="validacoes">Validações</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateFromTemplate} className="w-full" disabled={!selectedTemplate}>
              Criar a partir do Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de upload/visualização */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedItem?.anexos?.length > 0 ? 'Visualizar Documentos' : 'Upload de Documentos'}
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <>
              <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="status">Status</TabsTrigger>
                <TabsTrigger value="observacoes">Observações</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Arraste e solte arquivos aqui ou clique para selecionar
                  </p>
                  <Button variant="outline" className="mt-2">
                    Selecionar Arquivos
                  </Button>
                </div>
                
                {selectedItem.anexos?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Documentos anexados:</h4>
                    <div className="space-y-2">
                      {selectedItem.anexos.map((anexo: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>{anexo.nome}</span>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="status" className="space-y-4">
                <div>
                  <Label>Status</Label>
                  <Select 
                    value={selectedItem.status} 
                    onValueChange={(value) => setSelectedItem({ ...selectedItem, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="aprovado">Aprovado</SelectItem>
                      <SelectItem value="reprovado">Reprovado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              <TabsContent value="observacoes" className="space-y-4">
                <div>
                  <Label>Observações</Label>
                  <Textarea
                    value={selectedItem.observacoes || ''}
                    onChange={(e) => setSelectedItem({ ...selectedItem, observacoes: e.target.value })}
                    placeholder="Observações sobre o item..."
                    rows={4}
                  />
                </div>
              </TabsContent>
              </Tabs>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => handleUpdateItem(selectedItem.id, selectedItem.status, selectedItem.observacoes)}>
                  Salvar Alterações
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de link de upload */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link de Upload para Candidato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                Compartilhe este link com o candidato para que ele possa fazer upload dos documentos:
              </p>
              <div className="flex items-center gap-2">
                <Input 
                  value={uploadLink?.url || 'https://gentepro.com/upload/candidato/123'} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="sm">
                  <Link className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Gerar QR Code
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Enviar por Email
              </Button>
            </div>
            
            <Separator />
            
            <div className="text-sm text-gray-600">
              <p><strong>Instruções para o candidato:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Acesse o link em qualquer dispositivo</li>
                <li>Faça upload dos documentos solicitados</li>
                <li>Os documentos serão validados automaticamente</li>
                <li>Você receberá notificação quando tudo estiver aprovado</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 