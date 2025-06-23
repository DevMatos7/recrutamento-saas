import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Plus, Edit, Trash2, Eye, Filter, Building2, Users, MapPin, Clock, CheckCircle, XCircle } from "lucide-react";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Vaga, type Empresa, type Departamento, type Usuario } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FilterState {
  search: string;
  status: string;
  tipoContratacao: string;
  departamento: string;
  local: string;
  periodo: string;
}

// Enhanced Job Modal with improved validation and UX
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

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: empresas = [] } = useQuery<Empresa[]>({ queryKey: ["/api/empresas"] });
  const { data: departamentos = [] } = useQuery<Departamento[]>({ queryKey: ["/api/departamentos"] });
  const { data: usuarios = [] } = useQuery<Usuario[]>({ queryKey: ["/api/usuarios"] });

  // Filter departments and users by selected company
  const filteredDepartamentos = departamentos.filter(dep => dep.empresaId === formData.empresaId);
  const filteredUsuarios = usuarios.filter(usr => usr.empresaId === formData.empresaId && ["admin", "recrutador", "gestor"].includes(usr.perfil));

  useEffect(() => {
    if (editingVaga) {
      setFormData({
        titulo: editingVaga.titulo || "",
        descricao: editingVaga.descricao || "",
        requisitos: editingVaga.requisitos || "",
        local: editingVaga.local || "",
        salario: editingVaga.salario || "",
        beneficios: editingVaga.beneficios || "",
        tipoContratacao: editingVaga.tipoContratacao || "CLT",
        status: editingVaga.status || "aberta",
        empresaId: editingVaga.empresaId || "",
        departamentoId: editingVaga.departamentoId || "",
        gestorId: editingVaga.gestorId || "",
      });
    } else {
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
    setErrors({});
  }, [editingVaga, user, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.titulo.trim()) newErrors.titulo = "Título é obrigatório";
    if (!formData.descricao.trim()) newErrors.descricao = "Descrição é obrigatória";
    if (!formData.local.trim()) newErrors.local = "Local é obrigatório";
    if (!formData.empresaId) newErrors.empresaId = "Empresa é obrigatória";
    if (!formData.departamentoId) newErrors.departamentoId = "Departamento é obrigatório";
    if (!formData.gestorId) newErrors.gestorId = "Gestor responsável é obrigatório";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!validateForm()) throw new Error("Dados inválidos");
      
      const url = editingVaga ? `/api/vagas/${editingVaga.id}` : "/api/vagas";
      const method = editingVaga ? "PUT" : "POST";
      const res = await apiRequest(method, url, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao salvar vaga");
      }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingVaga ? "Editar Vaga" : "Nova Vaga"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Gerais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Informações Gerais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="titulo">Título da Vaga *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => handleChange("titulo", e.target.value)}
                  className={errors.titulo ? "border-red-500" : ""}
                  placeholder="Ex: Desenvolvedor Front-end"
                />
                {errors.titulo && <p className="text-red-500 text-sm mt-1">{errors.titulo}</p>}
              </div>

              <div>
                <Label htmlFor="local">Local *</Label>
                <Input
                  id="local"
                  value={formData.local}
                  onChange={(e) => handleChange("local", e.target.value)}
                  className={errors.local ? "border-red-500" : ""}
                  placeholder="Ex: São Paulo - SP / Remoto"
                />
                {errors.local && <p className="text-red-500 text-sm mt-1">{errors.local}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleChange("descricao", e.target.value)}
                className={`min-h-[120px] ${errors.descricao ? "border-red-500" : ""}`}
                placeholder="Descreva as principais responsabilidades e atividades da vaga..."
              />
              {errors.descricao && <p className="text-red-500 text-sm mt-1">{errors.descricao}</p>}
            </div>

            <div>
              <Label htmlFor="requisitos">Requisitos</Label>
              <Textarea
                id="requisitos"
                value={formData.requisitos}
                onChange={(e) => handleChange("requisitos", e.target.value)}
                className="min-h-[100px]"
                placeholder="Liste os requisitos necessários para a vaga..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipoContratacao">Tipo de Contratação *</Label>
                <Select value={formData.tipoContratacao} onValueChange={(value) => handleChange("tipoContratacao", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLT">CLT</SelectItem>
                    <SelectItem value="PJ">PJ</SelectItem>
                    <SelectItem value="Estágio">Estágio</SelectItem>
                    <SelectItem value="Temporário">Temporário</SelectItem>
                    <SelectItem value="Freelancer">Freelancer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="salario">Faixa Salarial</Label>
                <Input
                  id="salario"
                  value={formData.salario}
                  onChange={(e) => handleChange("salario", e.target.value)}
                  placeholder="Ex: R$ 5.000 - R$ 8.000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="beneficios">Benefícios</Label>
              <Textarea
                id="beneficios"
                value={formData.beneficios}
                onChange={(e) => handleChange("beneficios", e.target.value)}
                className="min-h-[80px]"
                placeholder="Liste os benefícios oferecidos..."
              />
            </div>
          </div>

          {/* Organização */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Organização</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="empresaId">Empresa *</Label>
                <Select value={formData.empresaId} onValueChange={(value) => handleChange("empresaId", value)}>
                  <SelectTrigger className={errors.empresaId ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {empresa.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.empresaId && <p className="text-red-500 text-sm mt-1">{errors.empresaId}</p>}
              </div>

              <div>
                <Label htmlFor="departamentoId">Departamento *</Label>
                <Select value={formData.departamentoId} onValueChange={(value) => handleChange("departamentoId", value)}>
                  <SelectTrigger className={errors.departamentoId ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDepartamentos.map((departamento) => (
                      <SelectItem key={departamento.id} value={departamento.id}>
                        {departamento.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departamentoId && <p className="text-red-500 text-sm mt-1">{errors.departamentoId}</p>}
              </div>

              <div>
                <Label htmlFor="gestorId">Gestor Responsável *</Label>
                <Select value={formData.gestorId} onValueChange={(value) => handleChange("gestorId", value)}>
                  <SelectTrigger className={errors.gestorId ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredUsuarios.map((usuario) => (
                      <SelectItem key={usuario.id} value={usuario.id}>
                        {usuario.nome} ({usuario.perfil})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.gestorId && <p className="text-red-500 text-sm mt-1">{errors.gestorId}</p>}
              </div>
            </div>

            {editingVaga && (
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aberta">Aberta</SelectItem>
                    <SelectItem value="em_triagem">Em Triagem</SelectItem>
                    <SelectItem value="entrevistas">Entrevistas</SelectItem>
                    <SelectItem value="encerrada">Encerrada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Salvando..." : editingVaga ? "Atualizar" : "Criar Vaga"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    aberta: { label: "Aberta", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    em_triagem: { label: "Em Triagem", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
    entrevistas: { label: "Entrevistas", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
    encerrada: { label: "Encerrada", className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
    cancelada: { label: "Cancelada", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.aberta;
  return <Badge className={config.className}>{config.label}</Badge>;
}

// Main component
export default function VagasEnhancedPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVaga, setEditingVaga] = useState<Vaga | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "",
    tipoContratacao: "",
    departamento: "",
    local: "",
    periodo: "",
  });

  const { data: vagas = [], isLoading, error } = useQuery<Vaga[]>({
    queryKey: ["/api/vagas"],
  });

  const { data: departamentos = [] } = useQuery<Departamento[]>({ queryKey: ["/api/departamentos"] });
  const { data: usuarios = [] } = useQuery<Usuario[]>({ queryKey: ["/api/usuarios"] });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/vagas/${id}`);
      if (!res.ok) throw new Error("Erro ao deletar vaga");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vagas"] });
      toast({
        title: "Sucesso",
        description: "Vaga removida com sucesso!",
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

  const encerrarMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/vagas/${id}/encerrar`);
      if (!res.ok) throw new Error("Erro ao encerrar vaga");
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

  // Filter vagas based on current filters
  const filteredVagas = vagas.filter(vaga => {
    if (filters.search && !vaga.titulo.toLowerCase().includes(filters.search.toLowerCase()) && 
        !vaga.local.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status && vaga.status !== filters.status) return false;
    if (filters.tipoContratacao && vaga.tipoContratacao !== filters.tipoContratacao) return false;
    if (filters.departamento && vaga.departamentoId !== filters.departamento) return false;
    if (filters.local && !vaga.local.toLowerCase().includes(filters.local.toLowerCase())) return false;
    
    // Period filter
    if (filters.periodo) {
      const now = new Date();
      const vagaDate = new Date(vaga.dataAbertura);
      const diffTime = Math.abs(now.getTime() - vagaDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch (filters.periodo) {
        case "7":
          if (diffDays > 7) return false;
          break;
        case "30":
          if (diffDays > 30) return false;
          break;
        case "90":
          if (diffDays > 90) return false;
          break;
      }
    }
    
    return true;
  });

  const handleEditVaga = (vaga: Vaga) => {
    setEditingVaga(vaga);
    setIsModalOpen(true);
  };

  const handleNewVaga = () => {
    setEditingVaga(null);
    setIsModalOpen(true);
  };

  const handleDeleteVaga = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta vaga?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEncerrarVaga = (id: string) => {
    if (confirm("Tem certeza que deseja encerrar esta vaga?")) {
      encerrarMutation.mutate(id);
    }
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      tipoContratacao: "",
      departamento: "",
      local: "",
      periodo: "",
    });
  };

  const getGestorName = (gestorId: string) => {
    const gestor = usuarios.find(u => u.id === gestorId);
    return gestor ? gestor.nome : "N/A";
  };

  const getDepartmentName = (departamentoId: string) => {
    const departamento = departamentos.find(d => d.id === departamentoId);
    return departamento ? departamento.nome : "N/A";
  };

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="text-red-600">Erro ao carregar vagas</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Ocorreu um erro ao carregar as vagas. Tente novamente.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Gestão de Vagas</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Gerencie o ciclo completo das vagas de emprego
                </p>
              </div>
              {["admin", "recrutador"].includes(user?.perfil || "") && (
                <Button onClick={handleNewVaga} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Vaga
                </Button>
              )}
            </div>

            {/* Filter Section */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <Filter className="w-5 h-5 mr-2" />
                    Filtros Avançados
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    {showFilters ? "Ocultar" : "Mostrar"} Filtros
                  </Button>
                </div>
              </CardHeader>
              {showFilters && (
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="search">Buscar</Label>
                      <Input
                        id="search"
                        placeholder="Título ou local..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos</SelectItem>
                          <SelectItem value="aberta">Aberta</SelectItem>
                          <SelectItem value="em_triagem">Em Triagem</SelectItem>
                          <SelectItem value="entrevistas">Entrevistas</SelectItem>
                          <SelectItem value="encerrada">Encerrada</SelectItem>
                          <SelectItem value="cancelada">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="tipoContratacao">Tipo de Contratação</Label>
                      <Select value={filters.tipoContratacao} onValueChange={(value) => setFilters(prev => ({ ...prev, tipoContratacao: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos</SelectItem>
                          <SelectItem value="CLT">CLT</SelectItem>
                          <SelectItem value="PJ">PJ</SelectItem>
                          <SelectItem value="Estágio">Estágio</SelectItem>
                          <SelectItem value="Temporário">Temporário</SelectItem>
                          <SelectItem value="Freelancer">Freelancer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="departamento">Departamento</Label>
                      <Select value={filters.departamento} onValueChange={(value) => setFilters(prev => ({ ...prev, departamento: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos</SelectItem>
                          {departamentos.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="periodo">Período</Label>
                      <Select value={filters.periodo} onValueChange={(value) => setFilters(prev => ({ ...prev, periodo: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos</SelectItem>
                          <SelectItem value="7">Últimos 7 dias</SelectItem>
                          <SelectItem value="30">Últimos 30 dias</SelectItem>
                          <SelectItem value="90">Últimos 90 dias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <Button variant="outline" onClick={clearFilters} className="w-full">
                        Limpar Filtros
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Results Summary */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Exibindo {filteredVagas.length} de {vagas.length} vagas
              </p>
            </div>
          </div>

          {/* Jobs Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 dark:text-gray-400">Carregando vagas...</p>
                  </div>
                </div>
              ) : filteredVagas.length === 0 ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-center">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Nenhuma vaga encontrada
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {vagas.length === 0 
                        ? "Não há vagas cadastradas ainda."
                        : "Nenhuma vaga corresponde aos filtros aplicados."
                      }
                    </p>
                    {["admin", "recrutador"].includes(user?.perfil || "") && (
                      <Button onClick={handleNewVaga} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Criar primeira vaga
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Criada em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVagas.map((vaga) => (
                      <TableRow key={vaga.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {vaga.titulo}
                            </div>
                            {vaga.salario && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {vaga.salario}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={vaga.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                            {vaga.local}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{vaga.tipoContratacao}</Badge>
                        </TableCell>
                        <TableCell>{getDepartmentName(vaga.departamentoId)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1 text-gray-400" />
                            {getGestorName(vaga.gestorId)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1 text-gray-400" />
                            {format(new Date(vaga.dataAbertura), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {["admin", "recrutador"].includes(user?.perfil || "") && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditVaga(vaga)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                
                                {["aberta", "em_triagem"].includes(vaga.status) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEncerrarVaga(vaga.id)}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                )}
                                
                                {user?.perfil === "admin" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteVaga(vaga.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

      <VagaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingVaga={editingVaga}
      />
    </div>
  );
}