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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, GripVertical, CheckCircle, AlertCircle, Settings } from "lucide-react";

interface Etapa {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
  cor: string;
  camposObrigatorios: string[];
  responsaveis: string[];
  empresaId: string;
}

interface Usuario {
  id: string;
  nome: string;
  email: string;
}

export default function EmpresaEtapasManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEtapa, setEditingEtapa] = useState<Etapa | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    cor: "#3B82F6",
    camposObrigatorios: [] as string[],
    responsaveis: [] as string[]
  });

  // Buscar etapas da empresa
  const { data: etapas = [], isLoading } = useQuery({
    queryKey: ["/api/etapas-pipeline", user?.empresaId],
    queryFn: async () => {
      const response = await fetch(`/api/etapas-pipeline?empresaId=${user?.empresaId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user?.empresaId,
  });

  // Buscar usuários da empresa
  const { data: usuarios = [] } = useQuery({
    queryKey: ["/api/usuarios", user?.empresaId],
    queryFn: async () => {
      const response = await fetch(`/api/usuarios?empresaId=${user?.empresaId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user?.empresaId,
  });

  // Mutation para criar etapa
  const createEtapaMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/etapas-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          empresaId: user?.empresaId,
          ordem: etapas.length + 1
        }),
      });
      if (!response.ok) throw new Error("Erro ao criar etapa");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/etapas-pipeline", user?.empresaId] });
      setIsCreateModalOpen(false);
      setFormData({ nome: "", descricao: "", cor: "#3B82F6", camposObrigatorios: [], responsaveis: [] });
      toast({
        title: "Sucesso",
        description: "Etapa criada com sucesso!",
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

  // Mutation para atualizar etapa
  const updateEtapaMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/etapas-pipeline/${editingEtapa?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao atualizar etapa");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/etapas-pipeline", user?.empresaId] });
      setIsEditModalOpen(false);
      setEditingEtapa(null);
      setFormData({ nome: "", descricao: "", cor: "#3B82F6", camposObrigatorios: [], responsaveis: [] });
      toast({
        title: "Sucesso",
        description: "Etapa atualizada com sucesso!",
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

  // Mutation para deletar etapa
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/etapas-pipeline/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao deletar etapa");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/etapas-pipeline", user?.empresaId] });
      toast({
        title: "Sucesso",
        description: "Etapa removida com sucesso!",
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

  // Mutation para reordenar etapas
  const reorderMutation = useMutation({
    mutationFn: async (etapasReordenadas: {id: string, ordem: number}[]) => {
      const response = await fetch("/api/etapas-pipeline/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etapas: etapasReordenadas }),
      });
      if (!response.ok) throw new Error("Erro ao reordenar etapas");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/etapas-pipeline", user?.empresaId] });
      toast({
        title: "Sucesso",
        description: "Ordem das etapas atualizada!",
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
    createEtapaMutation.mutate(formData);
  };

  const handleEdit = (etapa: Etapa) => {
    setEditingEtapa(etapa);
    setFormData({
      nome: etapa.nome,
      descricao: etapa.descricao || "",
      cor: etapa.cor,
      camposObrigatorios: etapa.camposObrigatorios || [],
      responsaveis: etapa.responsaveis || []
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateEtapaMutation.mutate(formData);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const etapasReordenadas = [...etapas];
    const [moved] = etapasReordenadas.splice(fromIndex, 1);
    etapasReordenadas.splice(toIndex, 0, moved);
    
    const etapasComOrdem = etapasReordenadas.map((etapa, index) => ({
      id: etapa.id,
      ordem: index + 1
    }));
    
    reorderMutation.mutate(etapasComOrdem);
  };

  const toggleCampoObrigatorio = (campo: string) => {
    const novosCampos = formData.camposObrigatorios.includes(campo)
      ? formData.camposObrigatorios.filter(c => c !== campo)
      : [...formData.camposObrigatorios, campo];
    
    setFormData({ ...formData, camposObrigatorios: novosCampos });
  };

  const toggleResponsavel = (responsavelId: string) => {
    const novosResponsaveis = formData.responsaveis.includes(responsavelId)
      ? formData.responsaveis.filter(r => r !== responsavelId)
      : [...formData.responsaveis, responsavelId];
    
    setFormData({ ...formData, responsaveis: novosResponsaveis });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Etapas Padrão do Pipeline</h2>
          <p className="text-muted-foreground">
            Configure as etapas padrão que serão aplicadas a todas as vagas da empresa
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Etapa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Etapa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome da Etapa</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Triagem de Currículos"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cor">Cor</Label>
                  <Input
                    id="cor"
                    type="color"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    className="h-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="descricao">Descrição (opcional)</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição detalhada da etapa"
                  rows={3}
                />
              </div>

              <div>
                <Label>Campos Obrigatórios</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {["observacao", "score"].map((campo) => (
                    <label key={campo} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.camposObrigatorios.includes(campo)}
                        onChange={() => toggleCampoObrigatorio(campo)}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {campo === "observacao" ? "Observação" : "Score"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Responsáveis</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                  {usuarios.map((usuario: Usuario) => (
                    <label key={usuario.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.responsaveis.includes(usuario.id)}
                        onChange={() => toggleResponsavel(usuario.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{usuario.nome}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createEtapaMutation.isPending}>
                  {createEtapaMutation.isPending ? "Criando..." : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Etapas Configuradas ({etapas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {etapas.length > 0 ? (
            <div className="space-y-3">
              {etapas.map((etapa: Etapa, index: number) => (
                <div key={etapa.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: etapa.cor }}
                    />
                    <div>
                      <div className="font-medium">{etapa.nome}</div>
                      {etapa.descricao && (
                        <div className="text-sm text-muted-foreground">{etapa.descricao}</div>
                      )}
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">Ordem: {etapa.ordem}</Badge>
                        {etapa.camposObrigatorios?.length > 0 && (
                          <Badge variant="secondary">
                            {etapa.camposObrigatorios.length} campo(s) obrigatório(s)
                          </Badge>
                        )}
                        {etapa.responsaveis?.length > 0 && (
                          <Badge variant="outline">
                            {etapa.responsaveis.length} responsável(is)
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(etapa)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMutation.mutate(etapa.id)}
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
              <p>Nenhuma etapa configurada</p>
              <p className="text-sm">Clique em "Nova Etapa" para adicionar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Etapa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-nome">Nome da Etapa</Label>
                <Input
                  id="edit-nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-cor">Cor</Label>
                <Input
                  id="edit-cor"
                  type="color"
                  value={formData.cor}
                  onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                  className="h-10"
                />
              </div>
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
              <Label>Campos Obrigatórios</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {["observacao", "score"].map((campo) => (
                  <label key={campo} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.camposObrigatorios.includes(campo)}
                      onChange={() => toggleCampoObrigatorio(campo)}
                      className="rounded"
                    />
                    <span className="text-sm">
                      {campo === "observacao" ? "Observação" : "Score"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label>Responsáveis</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                {usuarios.map((usuario: Usuario) => (
                  <label key={usuario.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.responsaveis.includes(usuario.id)}
                      onChange={() => toggleResponsavel(usuario.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{usuario.nome}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateEtapaMutation.isPending}>
                {updateEtapaMutation.isPending ? "Atualizando..." : "Atualizar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 