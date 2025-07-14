import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Filter,
  Database,
  Tag,
  AlertCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ProtectedRoute } from "@/lib/protected-route";

interface Skill {
  id: string;
  nome: string;
  codigoExterno?: string;
  categoria?: string;
}

export default function SkillsAdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [deletingSkill, setDeletingSkill] = useState<Skill | null>(null);

  // Buscar skills
  const { data: skills = [], isLoading } = useQuery({
    queryKey: ["/api/skills", searchTerm, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory !== "todos") params.append("categoria", selectedCategory);
      params.append("limit", "100");
      
      const res = await apiRequest("GET", `/api/skills?${params}`);
      return await res.json();
    },
  });

  // Buscar categorias únicas
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/skills", "categories"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/skills?limit=1000");
      const allSkills = await res.json();
      const uniqueCategories = [...new Set(allSkills.map((s: Skill) => s.categoria).filter(Boolean))];
      return uniqueCategories.sort();
    },
  });

  // Mutations
  const createSkillMutation = useMutation({
    mutationFn: async (skillData: Partial<Skill>) => {
      const res = await apiRequest("POST", "/api/skills", skillData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Competência criada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar competência",
        variant: "destructive",
      });
    },
  });

  const updateSkillMutation = useMutation({
    mutationFn: async ({ id, ...skillData }: Partial<Skill> & { id: string }) => {
      const res = await apiRequest("PUT", `/api/skills/${id}`, skillData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      setEditingSkill(null);
      toast({
        title: "Sucesso",
        description: "Competência atualizada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar competência",
        variant: "destructive",
      });
    },
  });

  const deleteSkillMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/skills/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      setDeletingSkill(null);
      toast({
        title: "Sucesso",
        description: "Competência excluída com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir competência",
        variant: "destructive",
      });
    },
  });

  const handleCreateSkill = (formData: FormData) => {
    const nome = formData.get("nome") as string;
    const codigoExterno = formData.get("codigoExterno") as string;
    const categoria = formData.get("categoria") as string;

    if (!nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive",
      });
      return;
    }

    createSkillMutation.mutate({
      nome: nome.trim(),
      codigoExterno: codigoExterno.trim() || undefined,
      categoria: categoria || "Custom",
    });
  };

  const handleUpdateSkill = (formData: FormData) => {
    if (!editingSkill) return;

    const nome = formData.get("nome") as string;
    const codigoExterno = formData.get("codigoExterno") as string;
    const categoria = formData.get("categoria") as string;

    if (!nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive",
      });
      return;
    }

    updateSkillMutation.mutate({
      id: editingSkill.id,
      nome: nome.trim(),
      codigoExterno: codigoExterno.trim() || undefined,
      categoria: categoria || "Custom",
    });
  };

  const handleDeleteSkill = (skill: Skill) => {
    deleteSkillMutation.mutate(skill.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Administração de Competências</h1>
          <p className="text-gray-600">Gerencie as competências disponíveis no sistema</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Competência
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Competência</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateSkill(new FormData(e.currentTarget)); }}>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <Input name="nome" placeholder="Nome da competência" required />
                </div>
                <div>
                  <label className="text-sm font-medium">Código Externo</label>
                  <Input name="codigoExterno" placeholder="Código de referência" />
                </div>
                <div>
                  <label className="text-sm font-medium">Categoria</label>
                  <Select name="categoria" defaultValue="Custom">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Custom">Custom</SelectItem>
                      <SelectItem value="CBO">CBO</SelectItem>
                      <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                      <SelectItem value="Gestão">Gestão</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createSkillMutation.isPending}>
                    {createSkillMutation.isPending ? "Criando..." : "Criar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar competências..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Categoria</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Competências ({skills.length} encontradas)</span>
            <Badge variant="secondary">
              <Database className="w-4 h-4 mr-1" />
              Total: {skills.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : skills.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Nenhuma competência encontrada
              </h3>
              <p className="text-gray-500">
                Tente ajustar os filtros ou criar uma nova competência.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {skills.map((skill: Skill) => (
                <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{skill.nome}</h4>
                      {skill.categoria && (
                        <Badge variant="outline" className="text-xs">
                          {skill.categoria}
                        </Badge>
                      )}
                    </div>
                    {skill.codigoExterno && (
                      <p className="text-sm text-gray-500">{skill.codigoExterno}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingSkill(skill)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Competência</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={(e) => { e.preventDefault(); handleUpdateSkill(new FormData(e.currentTarget)); }}>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Nome *</label>
                              <Input name="nome" defaultValue={skill.nome} required />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Código Externo</label>
                              <Input name="codigoExterno" defaultValue={skill.codigoExterno || ""} />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Categoria</label>
                              <Select name="categoria" defaultValue={skill.categoria || "Custom"}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Custom">Custom</SelectItem>
                                  <SelectItem value="CBO">CBO</SelectItem>
                                  <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                                  <SelectItem value="Gestão">Gestão</SelectItem>
                                  <SelectItem value="Design">Design</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-2">
                              <Button type="submit" disabled={updateSkillMutation.isPending}>
                                {updateSkillMutation.isPending ? "Salvando..." : "Salvar"}
                              </Button>
                              <Button type="button" variant="outline" onClick={() => setEditingSkill(null)}>
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingSkill(skill)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirmar Exclusão</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-yellow-600">
                            <AlertCircle className="w-5 h-5" />
                            <span className="font-medium">Atenção!</span>
                          </div>
                          <p>
                            Tem certeza que deseja excluir a competência <strong>"{skill.nome}"</strong>?
                          </p>
                          <p className="text-sm text-gray-600">
                            Esta ação não pode ser desfeita.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteSkill(skill)}
                              disabled={deleteSkillMutation.isPending}
                            >
                              {deleteSkillMutation.isPending ? "Excluindo..." : "Excluir"}
                            </Button>
                            <Button variant="outline" onClick={() => setDeletingSkill(null)}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 