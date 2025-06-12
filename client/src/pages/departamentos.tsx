import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Eye, Building2 } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Department Modal Component
function DepartamentoModal({ isOpen, onClose, editingDepartamento }: { isOpen: boolean; onClose: () => void; editingDepartamento?: any | null }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nome: "",
    empresaId: user?.empresaId || "",
  });

  const { data: empresas = [] } = useQuery({ 
    queryKey: ["/api/empresas"],
    enabled: user?.perfil === "admin"
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingDepartamento ? `/api/departamentos/${editingDepartamento.id}` : "/api/departamentos";
      const method = editingDepartamento ? "PUT" : "POST";
      const res = await apiRequest(method, url, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departamentos"] });
      toast({
        title: "Sucesso",
        description: editingDepartamento ? "Departamento atualizado!" : "Departamento criado!",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  React.useEffect(() => {
    if (editingDepartamento) {
      setFormData({
        nome: editingDepartamento.nome,
        empresaId: editingDepartamento.empresaId,
      });
    } else if (isOpen) {
      setFormData({
        nome: "",
        empresaId: user?.empresaId || "",
      });
    }
  }, [editingDepartamento, isOpen, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) {
      toast({
        title: "Erro",
        description: "Nome do departamento é obrigatório",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold mb-4">
          {editingDepartamento ? "Editar Departamento" : "Novo Departamento"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome *</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              className="w-full p-2 border rounded"
              placeholder="Nome do departamento"
              required
            />
          </div>
          
          {user?.perfil === "admin" && (
            <div>
              <label className="block text-sm font-medium mb-1">Empresa</label>
              <select
                value={formData.empresaId}
                onChange={(e) => setFormData({...formData, empresaId: e.target.value})}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Selecionar empresa</option>
                {(empresas as any[]).map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? "Salvando..." : editingDepartamento ? "Atualizar" : "Criar Departamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DepartamentosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartamento, setEditingDepartamento] = useState<any | null>(null);

  // Fetch data
  const { data: departamentos = [], isLoading } = useQuery({ queryKey: ["/api/departamentos"] });
  const { data: empresas = [] } = useQuery({ 
    queryKey: ["/api/empresas"],
    enabled: user?.perfil === "admin"
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (departamentoId: string) => {
      await apiRequest("DELETE", `/api/departamentos/${departamentoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departamentos"] });
      toast({
        title: "Sucesso",
        description: "Departamento excluído com sucesso",
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

  // Create empresa map for displaying empresa names
  const empresaMap = Object.fromEntries((empresas as any[]).map(e => [e.id, e]));

  // Filter departamentos
  const filteredDepartamentos = (departamentos as any[]).filter(departamento => {
    const matchesSearch = departamento.nome.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleEditDepartamento = (departamento: any) => {
    setEditingDepartamento(departamento);
    setIsModalOpen(true);
  };

  const handleNewDepartamento = () => {
    setEditingDepartamento(null);
    setIsModalOpen(true);
  };

  const handleDeleteDepartamento = (departamentoId: string) => {
    if (confirm("Tem certeza que deseja excluir este departamento? Esta ação não pode ser desfeita.")) {
      deleteMutation.mutate(departamentoId);
    }
  };

  const canManageDepartamentos = user && ["admin"].includes(user.perfil);

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 bg-gray-50 p-6">Carregando departamentos...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 bg-gray-50">
        <div className="space-y-6 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestão de Departamentos</h1>
              <p className="text-gray-600 mt-1">
                {user?.perfil === "admin" 
                  ? "Gerencie departamentos de todas as empresas" 
                  : "Gerencie os departamentos da sua empresa"}
              </p>
            </div>
            {canManageDepartamentos && (
              <Button onClick={handleNewDepartamento} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Departamento
              </Button>
            )}
          </div>

          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar departamento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Departments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Departamentos ({filteredDepartamentos.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Departamento</TableHead>
                    {user?.perfil === "admin" && <TableHead>Empresa</TableHead>}
                    <TableHead>Data de Criação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDepartamentos.map((departamento: any) => (
                    <TableRow key={departamento.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="font-medium">{departamento.nome}</div>
                          </div>
                        </div>
                      </TableCell>
                      {user?.perfil === "admin" && (
                        <TableCell>
                          <div className="text-sm">
                            {empresaMap[departamento.empresaId]?.nome || 'Empresa não encontrada'}
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        {new Date(departamento.dataCreacao).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditDepartamento(departamento)}
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canManageDepartamentos && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditDepartamento(departamento)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDepartamento(departamento.id)}
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredDepartamentos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={user?.perfil === "admin" ? 4 : 3} className="text-center py-8 text-gray-500">
                        Nenhum departamento encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <DepartamentoModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingDepartamento(null);
            }}
            editingDepartamento={editingDepartamento}
          />
        </div>
      </div>
    </div>
  );
}