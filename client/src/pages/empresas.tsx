import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Eye, Building2, Globe, Mail, Phone } from "lucide-react";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Company Modal Component
function EmpresaModal({ isOpen, onClose, editingEmpresa }: { isOpen: boolean; onClose: () => void; editingEmpresa?: any | null }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    email: "",
    telefone: "",
    site: "",
    status: "ativa",
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingEmpresa ? `/api/empresas/${editingEmpresa.id}` : "/api/empresas";
      const method = editingEmpresa ? "PUT" : "POST";
      const res = await apiRequest(method, url, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empresas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Sucesso",
        description: editingEmpresa ? "Empresa atualizada!" : "Empresa criada!",
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
    if (editingEmpresa) {
      setFormData({
        nome: editingEmpresa.nome,
        cnpj: editingEmpresa.cnpj || "",
        email: editingEmpresa.email || "",
        telefone: editingEmpresa.telefone || "",
        site: editingEmpresa.site || "",
        status: editingEmpresa.status || "ativa",
      });
    } else if (isOpen) {
      setFormData({
        nome: "",
        cnpj: "",
        email: "",
        telefone: "",
        site: "",
        status: "ativa",
      });
    }
  }, [editingEmpresa, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) {
      toast({
        title: "Erro",
        description: "Nome da empresa é obrigatório",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {editingEmpresa ? "Editar Empresa" : "Nova Empresa"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Nome da Empresa *</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Nome da empresa"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">CNPJ</label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="00.000.000/0000-00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="ativa">Ativa</option>
                <option value="inativa">Inativa</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="contato@empresa.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Telefone</label>
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="(11) 99999-9999"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Site</label>
              <input
                type="url"
                value={formData.site}
                onChange={(e) => setFormData({...formData, site: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="https://www.empresa.com"
              />
            </div>
          </div>
          
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
              {createMutation.isPending ? "Salvando..." : editingEmpresa ? "Atualizar" : "Criar Empresa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmpresasPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<any | null>(null);

  // Fetch data
  const { data: empresas = [], isLoading } = useQuery({ queryKey: ["/api/empresas"] });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (empresaId: string) => {
      await apiRequest("DELETE", `/api/empresas/${empresaId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empresas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Sucesso",
        description: "Empresa excluída com sucesso",
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

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PUT", `/api/empresas/${id}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empresas"] });
      toast({
        title: "Sucesso",
        description: "Status da empresa atualizado",
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

  // Filter empresas
  const filteredEmpresas = (empresas as any[]).filter(empresa => {
    const matchesStatus = statusFilter === "todas" || empresa.status === statusFilter;
    const matchesSearch = empresa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (empresa.cnpj && empresa.cnpj.includes(searchTerm));
    return matchesStatus && matchesSearch;
  });

  const handleEditEmpresa = (empresa: any) => {
    setEditingEmpresa(empresa);
    setIsModalOpen(true);
  };

  const handleNewEmpresa = () => {
    setEditingEmpresa(null);
    setIsModalOpen(true);
  };

  const handleDeleteEmpresa = (empresaId: string) => {
    if (confirm("Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.")) {
      deleteMutation.mutate(empresaId);
    }
  };

  const handleToggleStatus = (empresa: any) => {
    const newStatus = empresa.status === "ativa" ? "inativa" : "ativa";
    toggleStatusMutation.mutate({ id: empresa.id, status: newStatus });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativa": return "bg-green-100 text-green-800";
      case "inativa": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const canManageEmpresas = user && user.perfil === "admin";

  if (!canManageEmpresas) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 bg-gray-50 p-6">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
            <p className="text-gray-600">Apenas administradores podem gerenciar empresas.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 bg-gray-50 p-6">Carregando empresas...</div>
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
              <h1 className="text-3xl font-bold text-gray-900">Gestão de Empresas</h1>
              <p className="text-gray-600 mt-1">Gerencie todas as empresas cadastradas na plataforma</p>
            </div>
            <Button onClick={handleNewEmpresa} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Empresa
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Buscar por nome ou CNPJ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="ativa">Ativas</SelectItem>
                    <SelectItem value="inativa">Inativas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Companies Table */}
          <Card>
            <CardHeader>
              <CardTitle>Empresas ({filteredEmpresas.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmpresas.map((empresa: any) => (
                    <TableRow key={empresa.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="font-medium">{empresa.nome}</div>
                            {empresa.cnpj && (
                              <div className="text-sm text-gray-500">CNPJ: {empresa.cnpj}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {empresa.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              <a href={`mailto:${empresa.email}`} className="text-blue-600 hover:underline">
                                {empresa.email}
                              </a>
                            </div>
                          )}
                          {empresa.telefone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {empresa.telefone}
                            </div>
                          )}
                          {empresa.site && (
                            <div className="flex items-center gap-1 text-sm">
                              <Globe className="h-3 w-3" />
                              <a href={empresa.site} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                Site
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(empresa.status)}>
                          {empresa.status === "ativa" ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(empresa.dataCreacao).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditEmpresa(empresa)}
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditEmpresa(empresa)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(empresa)}
                            title={empresa.status === "ativa" ? "Desativar" : "Ativar"}
                            className={empresa.status === "ativa" ? "text-red-600" : "text-green-600"}
                          >
                            {empresa.status === "ativa" ? "Desativar" : "Ativar"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEmpresa(empresa.id)}
                            title="Excluir"
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredEmpresas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Nenhuma empresa encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <EmpresaModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingEmpresa(null);
            }}
            editingEmpresa={editingEmpresa}
          />
        </div>
      </div>
    </div>
  );
}