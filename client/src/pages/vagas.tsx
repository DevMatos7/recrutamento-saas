import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Eye, Square, Users } from "lucide-react";
import { Link } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Vaga } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Job Modal Component with Form
function VagaModal({ isOpen, onClose, editingVaga }: { isOpen: boolean; onClose: () => void; editingVaga?: Vaga | null }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    requisitos: "",
    local: "",
    salario: "",
    beneficios: "",
    tipoContratacao: "CLT",
    status: "aberta",
    empresaId: user?.empresaId || "",
    departamentoId: "",
    gestorId: user?.id || "",
  });

  const { data: empresas = [] } = useQuery({ queryKey: ["/api/empresas"] });
  const { data: departamentos = [] } = useQuery({ queryKey: ["/api/departamentos"] });
  const { data: usuarios = [] } = useQuery({ queryKey: ["/api/usuarios"] });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingVaga ? `/api/vagas/${editingVaga.id}` : "/api/vagas";
      const method = editingVaga ? "PUT" : "POST";
      const res = await apiRequest(method, url, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vagas"] });
      toast({
        title: "Sucesso",
        description: editingVaga ? "Vaga atualizada!" : "Vaga criada!",
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

  useEffect(() => {
    if (editingVaga) {
      setFormData({
        titulo: editingVaga.titulo,
        descricao: editingVaga.descricao,
        requisitos: editingVaga.requisitos ?? "",
        local: editingVaga.local,
        salario: editingVaga.salario || "",
        beneficios: editingVaga.beneficios || "",
        tipoContratacao: editingVaga.tipoContratacao,
        status: editingVaga.status,
        empresaId: editingVaga.empresaId,
        departamentoId: editingVaga.departamentoId,
        gestorId: editingVaga.gestorId,
      });
    } else if (isOpen) {
      setFormData({
        titulo: "",
        descricao: "",
        requisitos: "",
        local: "",
        salario: "",
        beneficios: "",
        tipoContratacao: "CLT",
        status: "aberta",
        empresaId: user?.empresaId || "",
        departamentoId: "",
        gestorId: user?.id || "",
      });
    }
  }, [editingVaga, isOpen, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo || !formData.descricao || !formData.requisitos) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {editingVaga ? "Editar Vaga" : "Nova Vaga"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Título *</label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Ex: Desenvolvedor Frontend React"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Local *</label>
              <input
                type="text"
                value={formData.local}
                onChange={(e) => setFormData({...formData, local: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Ex: São Paulo - SP, Remoto"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Contratação</label>
              <select
                value={formData.tipoContratacao}
                onChange={(e) => setFormData({...formData, tipoContratacao: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="CLT">CLT</option>
                <option value="PJ">PJ</option>
                <option value="Estágio">Estágio</option>
                <option value="Temporário">Temporário</option>
                <option value="Freelancer">Freelancer</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Departamento</label>
              <select
                value={formData.departamentoId}
                onChange={(e) => setFormData({...formData, departamentoId: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="">Selecionar departamento</option>
                {(departamentos as any[]).map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.nome}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Faixa Salarial</label>
              <input
                type="text"
                value={formData.salario}
                onChange={(e) => setFormData({...formData, salario: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Ex: R$ 5.000 - R$ 8.000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="aberta">Aberta</option>
                <option value="em_triagem">Em Triagem</option>
                <option value="entrevistas">Entrevistas</option>
                <option value="encerrada">Encerrada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Descrição *</label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({...formData, descricao: e.target.value})}
              className="w-full p-2 border rounded h-24"
              placeholder="Descreva as responsabilidades e atividades da vaga..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Requisitos *</label>
            <textarea
              value={formData.requisitos}
              onChange={(e) => setFormData({...formData, requisitos: e.target.value})}
              className="w-full p-2 border rounded h-24"
              placeholder="Liste os requisitos técnicos e experiências necessárias..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Benefícios</label>
            <textarea
              value={formData.beneficios}
              onChange={(e) => setFormData({...formData, beneficios: e.target.value})}
              className="w-full p-2 border rounded h-20"
              placeholder="Liste os benefícios oferecidos..."
            />
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
              {createMutation.isPending ? "Salvando..." : editingVaga ? "Atualizar" : "Criar Vaga"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VagasPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVaga, setEditingVaga] = useState<Vaga | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: vagas = [], isLoading } = useQuery({
    queryKey: ["/api/vagas"],
  });

  const { data: empresas = [] } = useQuery({
    queryKey: ["/api/empresas"],
  });

  const { data: departamentos = [] } = useQuery({
    queryKey: ["/api/departamentos"],
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ["/api/usuarios"],
  });

  const encerrarVagaMutation = useMutation({
    mutationFn: async (vagaId: string) => {
      const res = await apiRequest("PATCH", `/api/vagas/${vagaId}/encerrar`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vagas"] });
      toast({
        title: "Sucesso",
        description: "Vaga encerrada com sucesso!",
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
    mutationFn: async (vagaId: string) => {
      await apiRequest("DELETE", `/api/vagas/${vagaId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vagas"] });
      toast({
        title: "Sucesso",
        description: "Vaga excluída com sucesso!",
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

  // Create lookup maps
  const empresaMap = Object.fromEntries((empresas as any[]).map(e => [e.id, e]));
  const departamentoMap = Object.fromEntries((departamentos as any[]).map(d => [d.id, d]));
  const usuarioMap = Object.fromEntries((usuarios as any[]).map(u => [u.id, u]));

  // Filter vagas
  const filteredVagas = (vagas as any[]).filter(vaga => {
    const matchesStatus = statusFilter === "todos" || vaga.status === statusFilter;
    const matchesSearch = vaga.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vaga.local.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleEditVaga = (vaga: Vaga) => {
    setEditingVaga(vaga);
    setIsModalOpen(true);
  };

  const handleNewVaga = () => {
    setEditingVaga(null);
    setIsModalOpen(true);
  };

  const handleEncerrarVaga = (vagaId: string) => {
    if (confirm("Tem certeza que deseja encerrar esta vaga?")) {
      encerrarVagaMutation.mutate(vagaId);
    }
  };

  const handleDeleteVaga = (vagaId: string) => {
    if (confirm("Tem certeza que deseja excluir esta vaga?")) {
      deleteMutation.mutate(vagaId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberta": return "bg-green-100 text-green-800";
      case "em_triagem": return "bg-blue-100 text-blue-800";
      case "entrevistas": return "bg-yellow-100 text-yellow-800";
      case "encerrada": return "bg-gray-100 text-gray-800";
      case "cancelada": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "aberta": return "Aberta";
      case "em_triagem": return "Em Triagem";
      case "entrevistas": return "Entrevistas";
      case "encerrada": return "Encerrada";
      case "cancelada": return "Cancelada";
      default: return status;
    }
  };

  const canManageVagas = user && ["admin", "recrutador"].includes(user.perfil);

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 bg-gray-50 p-6">Carregando vagas...</div>
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
              <h1 className="text-3xl font-bold text-gray-900">Gestão de Vagas</h1>
              <p className="text-gray-600 mt-1">Gerencie todas as vagas da sua empresa</p>
            </div>
            {canManageVagas && (
              <Button onClick={handleNewVaga} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nova Vaga
              </Button>
            )}
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por título ou local..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Status</SelectItem>
                      <SelectItem value="aberta">Aberta</SelectItem>
                      <SelectItem value="em_triagem">Em Triagem</SelectItem>
                      <SelectItem value="entrevistas">Entrevistas</SelectItem>
                      <SelectItem value="encerrada">Encerrada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vagas Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Vagas ({filteredVagas.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Gestor</TableHead>
                    <TableHead>Data Abertura</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVagas.map((vaga: any) => (
                    <TableRow key={vaga.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{vaga.titulo}</div>
                          <div className="text-sm text-gray-500">
                            {departamentoMap[vaga.departamentoId]?.nome || '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{vaga.local}</TableCell>
                      <TableCell>{vaga.tipoContratacao}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(vaga.status)}>
                          {getStatusLabel(vaga.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {usuarioMap[vaga.gestorId]?.nome || '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(vaga.dataAbertura).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/pipeline/${vaga.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Ver Pipeline"
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditVaga(vaga)}
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canManageVagas && vaga.status === "aberta" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditVaga(vaga)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEncerrarVaga(vaga.id)}
                                title="Encerrar"
                              >
                                <Square className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {user?.perfil === "admin" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteVaga(vaga.id)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredVagas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Nenhuma vaga encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <VagaModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingVaga(null);
            }}
            editingVaga={editingVaga}
          />
        </div>
      </div>
    </div>
  );
}