import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, CheckCircle, AlertCircle, FileText, Star, Clock } from "lucide-react";

interface ChecklistItem {
  id: string;
  nome: string;
  descricao?: string;
  tipo: string;
  obrigatorio: boolean;
  validacaoAutomatica: boolean;
  ordem: number;
  nomeEtapa: string;
  empresaId: string;
}

interface Etapa {
  id: string;
  nome: string;
  ordem: number;
  cor: string;
}

export default function EmpresaChecklistManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<ChecklistItem | null>(null);
  const [selectedEtapa, setSelectedEtapa] = useState<string>("");
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    tipo: "documento",
    obrigatorio: true,
    validacaoAutomatica: false,
    nomeEtapa: ""
  });

  // Buscar etapas da empresa
  const { data: etapas = [] } = useQuery({
    queryKey: ["/api/etapas-pipeline", user?.empresaId],
    queryFn: async () => {
      const response = await fetch(`/api/etapas-pipeline?empresaId=${user?.empresaId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user?.empresaId,
  });

  // Buscar checklists da empresa
  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ["/api/checklists-empresa", user?.empresaId],
    queryFn: async () => {
      const response = await fetch(`/api/checklists-empresa?empresaId=${user?.empresaId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user?.empresaId,
  });

  // Agrupar checklists por etapa
  const checklistsPorEtapa = etapas.reduce((acc: any, etapa: Etapa) => {
    acc[etapa.nome] = checklists.filter((item: ChecklistItem) => item.nomeEtapa === etapa.nome);
    return acc;
  }, {});

  // Mutation para criar checklist
  const createChecklistMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/checklists-empresa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          empresaId: user?.empresaId,
          nomeEtapa: selectedEtapa
        }),
      });
      if (!response.ok) throw new Error("Erro ao criar checklist");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklists-empresa", user?.empresaId] });
      setIsCreateModalOpen(false);
      setFormData({ nome: "", descricao: "", tipo: "documento", obrigatorio: true, validacaoAutomatica: false, nomeEtapa: "" });
      setSelectedEtapa("");
      toast({
        title: "Sucesso",
        description: "Checklist criado com sucesso!",
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

  // Mutation para atualizar checklist
  const updateChecklistMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/checklists-empresa/${editingChecklist?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao atualizar checklist");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklists-empresa", user?.empresaId] });
      setIsEditModalOpen(false);
      setEditingChecklist(null);
      setFormData({ nome: "", descricao: "", tipo: "documento", obrigatorio: true, validacaoAutomatica: false, nomeEtapa: "" });
      toast({
        title: "Sucesso",
        description: "Checklist atualizado com sucesso!",
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

  // Mutation para deletar checklist
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/checklists-empresa/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao deletar checklist");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklists-empresa", user?.empresaId] });
      toast({
        title: "Sucesso",
        description: "Checklist removido com sucesso!",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEtapa) {
      toast({
        title: "Erro",
        description: "Selecione uma etapa",
        variant: "destructive",
      });
      return;
    }
    createChecklistMutation.mutate(formData);
  };

  const handleEdit = (checklist: ChecklistItem) => {
    setEditingChecklist(checklist);
    setFormData({
      nome: checklist.nome,
      descricao: checklist.descricao || "",
      tipo: checklist.tipo,
      obrigatorio: checklist.obrigatorio,
      validacaoAutomatica: checklist.validacaoAutomatica,
      nomeEtapa: checklist.nomeEtapa
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateChecklistMutation.mutate(formData);
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "documento": return <FileText className="h-4 w-4" />;
      case "score": return <Star className="h-4 w-4" />;
      case "tempo": return <Clock className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "documento": return "Documento";
      case "score": return "Score";
      case "tempo": return "Tempo";
      default: return "Geral";
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuração de Checklists da Empresa</h2>
          <p className="text-muted-foreground">
            Configure os checklists padrão que serão aplicados a todas as vagas da empresa
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Checklist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Checklist</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="etapa">Etapa</Label>
                <Select value={selectedEtapa} onValueChange={setSelectedEtapa}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {etapas.map((etapa: Etapa) => (
                      <SelectItem key={etapa.id} value={etapa.nome}>
                        {etapa.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="nome">Nome do Item</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: RG, CPF, Comprovante de Residência"
                  required
                />
              </div>

              <div>
                <Label htmlFor="descricao">Descrição (opcional)</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição detalhada do item"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="documento">Documento</SelectItem>
                    <SelectItem value="score">Score</SelectItem>
                    <SelectItem value="tempo">Tempo</SelectItem>
                    <SelectItem value="geral">Geral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="obrigatorio"
                  checked={formData.obrigatorio}
                  onChange={(e) => setFormData({ ...formData, obrigatorio: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="obrigatorio">Obrigatório</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="validacaoAutomatica"
                  checked={formData.validacaoAutomatica}
                  onChange={(e) => setFormData({ ...formData, validacaoAutomatica: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="validacaoAutomatica">Validação Automática</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createChecklistMutation.isPending}>
                  {createChecklistMutation.isPending ? "Criando..." : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue={etapas[0]?.nome || ""} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          {etapas.slice(0, 6).map((etapa: Etapa) => (
            <TabsTrigger key={etapa.id} value={etapa.nome} className="text-xs">
              {etapa.nome}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {etapas.map((etapa: Etapa) => (
          <TabsContent key={etapa.id} value={etapa.nome} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: etapa.cor }}
                  />
                  {etapa.nome}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {checklistsPorEtapa[etapa.nome]?.length > 0 ? (
                  <div className="space-y-3">
                    {checklistsPorEtapa[etapa.nome].map((item: ChecklistItem) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getTipoIcon(item.tipo)}
                          <div>
                            <div className="font-medium">{item.nome}</div>
                            {item.descricao && (
                              <div className="text-sm text-muted-foreground">{item.descricao}</div>
                            )}
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline">{getTipoLabel(item.tipo)}</Badge>
                              {item.obrigatorio && <Badge variant="destructive">Obrigatório</Badge>}
                              {item.validacaoAutomatica && <Badge variant="secondary">Auto</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteMutation.mutate(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum checklist configurado para esta etapa</p>
                    <p className="text-sm">Clique em "Novo Checklist" para adicionar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Checklist</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="edit-nome">Nome do Item</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Textarea
                id="edit-descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-tipo">Tipo</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="documento">Documento</SelectItem>
                  <SelectItem value="score">Score</SelectItem>
                  <SelectItem value="tempo">Tempo</SelectItem>
                  <SelectItem value="geral">Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-obrigatorio"
                checked={formData.obrigatorio}
                onChange={(e) => setFormData({ ...formData, obrigatorio: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="edit-obrigatorio">Obrigatório</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-validacaoAutomatica"
                checked={formData.validacaoAutomatica}
                onChange={(e) => setFormData({ ...formData, validacaoAutomatica: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="edit-validacaoAutomatica">Validação Automática</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateChecklistMutation.isPending}>
                {updateChecklistMutation.isPending ? "Atualizando..." : "Atualizar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 