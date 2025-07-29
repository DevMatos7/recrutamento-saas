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
import { Plus, Edit, Trash2, Settings, FileText, Copy, CheckCircle } from "lucide-react";
import EmpresaEtapasManager from "@/components/empresa-etapas-manager";
import EmpresaChecklistManager from "@/components/empresa-checklist-manager";
import MigracaoManager from "@/components/migracao-manager";

interface ModeloPipeline {
  id: string;
  nome: string;
  descricao?: string;
  padrao: boolean;
  empresaId: string;
  dataCriacao: string;
}

interface Empresa {
  id: string;
  nome: string;
}

export default function PipelineModelosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingModelo, setEditingModelo] = useState<ModeloPipeline | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    empresaId: ""
  });

  // Buscar empresas
  const { data: empresas = [] } = useQuery({
    queryKey: ["/api/empresas"],
    queryFn: async () => {
      const response = await fetch("/api/empresas");
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Buscar modelos de pipeline da empresa selecionada
  const { data: modelos = [], isLoading } = useQuery({
    queryKey: ["/api/modelos-pipeline", selectedEmpresa],
    queryFn: async () => {
      if (!selectedEmpresa) return [];
      const response = await fetch(`/api/modelos-pipeline?empresaId=${selectedEmpresa}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedEmpresa,
  });

  // Buscar etapas da empresa selecionada
  const { data: etapas = [] } = useQuery({
    queryKey: ["/api/etapas-pipeline", selectedEmpresa],
    queryFn: async () => {
      if (!selectedEmpresa) return [];
      const response = await fetch(`/api/etapas-pipeline?empresaId=${selectedEmpresa}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedEmpresa,
  });

  // Mutation para criar modelo
  const createModeloMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/modelos-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao criar modelo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modelos-pipeline", selectedEmpresa] });
      setIsCreateModalOpen(false);
      setFormData({ nome: "", descricao: "", empresaId: "" });
      toast({
        title: "Sucesso",
        description: "Modelo criado com sucesso!",
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

  // Mutation para atualizar modelo
  const updateModeloMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/modelos-pipeline/${editingModelo?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao atualizar modelo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modelos-pipeline", selectedEmpresa] });
      setIsEditModalOpen(false);
      setEditingModelo(null);
      setFormData({ nome: "", descricao: "", empresaId: "" });
      toast({
        title: "Sucesso",
        description: "Modelo atualizado com sucesso!",
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

  // Mutation para deletar modelo
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/modelos-pipeline/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao deletar modelo");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modelos-pipeline", selectedEmpresa] });
      toast({
        title: "Sucesso",
        description: "Modelo removido com sucesso!",
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

  // Mutation para definir modelo como padrão
  const setPadraoMutation = useMutation({
    mutationFn: async (modeloId: string) => {
      const response = await fetch(`/api/modelos-pipeline/${modeloId}/padrao`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresaId: selectedEmpresa }),
      });
      if (!response.ok) throw new Error("Erro ao definir modelo como padrão");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modelos-pipeline", selectedEmpresa] });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createModeloMutation.mutate({
      ...formData,
      empresaId: selectedEmpresa
    });
  };

  const handleEdit = (modelo: ModeloPipeline) => {
    setEditingModelo(modelo);
    setFormData({
      nome: modelo.nome,
      descricao: modelo.descricao || "",
      empresaId: modelo.empresaId
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateModeloMutation.mutate(formData);
  };

  const handleEmpresaChange = (empresaId: string) => {
    setSelectedEmpresa(empresaId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Modelos de Pipeline</h1>
          <p className="text-muted-foreground">
            Gerencie modelos padrão de pipeline por empresa
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Criar do Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Modelo do Template</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome do Modelo</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Pipeline Padrão"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição do modelo"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createModeloMutation.isPending}>
                    {createModeloMutation.isPending ? "Criando..." : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            + Novo Modelo
          </Button>
        </div>
      </div>

      {/* Filtro de Empresa */}
      <Card>
        <CardContent className="pt-6">
          <div>
            <Label htmlFor="empresa">Empresa</Label>
            <Select value={selectedEmpresa} onValueChange={handleEmpresaChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((empresa: Empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id}>
                    {empresa.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Teste simples das abas */}
      <div className="border-2 border-red-500 p-4 mb-4">
        <h3 className="text-red-600 font-bold">DEBUG: Abas devem aparecer aqui</h3>
        <p>selectedEmpresa: {selectedEmpresa || 'Nenhuma'}</p>
      </div>

      {/* Teste simples das abas */}
      <div className="border-2 border-red-500 p-4 mb-4">
        <h3 className="text-red-600 font-bold">DEBUG: Abas devem aparecer aqui</h3>
        <p>selectedEmpresa: {selectedEmpresa || 'Nenhuma'}</p>
        <p>empresas.length: {empresas.length}</p>
      </div>

      {/* Teste simples de tabs */}
      <div className="border-2 border-blue-500 p-4 mb-4">
        <h3 className="text-blue-600 font-bold">Teste de Tabs</h3>
        <Tabs defaultValue="teste" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="teste">Teste 1</TabsTrigger>
            <TabsTrigger value="teste2">Teste 2</TabsTrigger>
          </TabsList>
          <TabsContent value="teste">
            <p>Conteúdo do teste 1</p>
          </TabsContent>
          <TabsContent value="teste2">
            <p>Conteúdo do teste 2</p>
          </TabsContent>
        </Tabs>
      </div>

      <Tabs defaultValue="migracao" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="migracao">Migração</TabsTrigger>
          <TabsTrigger value="modelos" disabled={!selectedEmpresa}>Modelos ({modelos.length})</TabsTrigger>
          <TabsTrigger value="etapas" disabled={!selectedEmpresa}>Etapas ({etapas.length})</TabsTrigger>
          <TabsTrigger value="checklists" disabled={!selectedEmpresa}>Checklists</TabsTrigger>
        </TabsList>

        {/* Aba de Migração - Sempre visível */}
        <TabsContent value="migracao" className="space-y-4">
          <MigracaoManager />
        </TabsContent>

        {/* Outras abas - Só quando empresa selecionada */}
        {selectedEmpresa && (
          <>

          {/* Aba de Modelos */}
          <TabsContent value="modelos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Modelos de Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">Carregando...</div>
                ) : modelos.length > 0 ? (
                  <div className="space-y-3">
                    {modelos.map((modelo: ModeloPipeline) => (
                      <div key={modelo.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">{modelo.nome}</div>
                          {modelo.descricao && (
                            <div className="text-sm text-muted-foreground">{modelo.descricao}</div>
                          )}
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">
                              Criado em {formatDate(modelo.dataCriacao)}
                            </Badge>
                            {modelo.padrao && <Badge variant="default">Padrão</Badge>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!modelo.padrao && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPadraoMutation.mutate(modelo.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(modelo)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteMutation.mutate(modelo.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum modelo encontrado</p>
                    <p className="text-sm">Clique em "Novo Modelo" para adicionar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Etapas */}
          <TabsContent value="etapas" className="space-y-4">
            <EmpresaEtapasManager />
          </TabsContent>

          {/* Aba de Checklists */}
          <TabsContent value="checklists" className="space-y-4">
            <EmpresaChecklistManager />
          </TabsContent>

          </>
        )}
      </Tabs>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Modelo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="edit-nome">Nome do Modelo</Label>
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
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateModeloMutation.isPending}>
                {updateModeloMutation.isPending ? "Atualizando..." : "Atualizar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 