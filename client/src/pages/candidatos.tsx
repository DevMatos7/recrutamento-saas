import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Eye, Mail, Phone, LinkedinIcon, FileText, MoreHorizontal, Shield, ShieldCheck, ShieldX, AlertTriangle, Brain } from "lucide-react";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CandidatoDetailModal } from "@/components/candidato-detail-modal";

// Candidate Modal Component
function CandidatoModal({ isOpen, onClose, editingCandidato }: { isOpen: boolean; onClose: () => void; editingCandidato?: any | null }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    curriculoUrl: "",
    linkedin: "",
    status: "ativo",
    origem: "manual",
    empresaId: user?.empresaId || "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingCandidato ? `/api/candidatos/${editingCandidato.id}` : "/api/candidatos";
      const method = editingCandidato ? "PUT" : "POST";
      const res = await apiRequest(method, url, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidatos"] });
      toast({
        title: "Sucesso",
        description: editingCandidato ? "Candidato atualizado!" : "Candidato criado!",
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
    if (editingCandidato) {
      setFormData({
        nome: editingCandidato.nome,
        email: editingCandidato.email,
        telefone: editingCandidato.telefone,
        curriculoUrl: editingCandidato.curriculoUrl || "",
        linkedin: editingCandidato.linkedin || "",
        status: editingCandidato.status,
        origem: editingCandidato.origem,
        empresaId: editingCandidato.empresaId,
      });
    } else if (isOpen) {
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        curriculoUrl: "",
        linkedin: "",
        status: "ativo",
        origem: "manual",
        empresaId: user?.empresaId || "",
      });
    }
  }, [editingCandidato, isOpen, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.email || !formData.telefone) {
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
      <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {editingCandidato ? "Editar Candidato" : "Novo Candidato"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome *</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Nome completo"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="email@exemplo.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Telefone *</label>
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="(11) 99999-9999"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">LinkedIn</label>
              <input
                type="url"
                value={formData.linkedin}
                onChange={(e) => setFormData({...formData, linkedin: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="https://linkedin.com/in/usuario"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Origem</label>
              <select
                value={formData.origem}
                onChange={(e) => setFormData({...formData, origem: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="manual">Manual</option>
                <option value="portal_externo">Portal Externo</option>
                <option value="importado">Importado</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">URL do Currículo</label>
            <input
              type="url"
              value={formData.curriculoUrl}
              onChange={(e) => setFormData({...formData, curriculoUrl: e.target.value})}
              className="w-full p-2 border rounded"
              placeholder="https://exemplo.com/curriculo.pdf"
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
              {createMutation.isPending ? "Salvando..." : editingCandidato ? "Atualizar" : "Criar Candidato"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CandidatosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [origemFilter, setOrigemFilter] = useState("todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCandidato, setEditingCandidato] = useState<any | null>(null);
  const [selectedCandidatoId, setSelectedCandidatoId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Query para obter resultados DISC de todos os candidatos
  const { data: resultadosDisc } = useQuery({
    queryKey: ['/api/avaliacoes/disc/resultados-todos'],
  });

  // Fetch data
  const { data: candidatos = [], isLoading } = useQuery({ queryKey: ["/api/candidatos"] });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (candidatoId: string) => {
      await apiRequest("DELETE", `/api/candidatos/${candidatoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidatos"] });
      toast({
        title: "Sucesso",
        description: "Candidato excluído com sucesso",
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

  // Filter candidatos
  const filteredCandidatos = (candidatos as any[]).filter(candidato => {
    const matchesStatus = statusFilter === "todos" || candidato.status === statusFilter;
    const matchesOrigem = origemFilter === "todos" || candidato.origem === origemFilter;
    const matchesSearch = candidato.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidato.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesOrigem && matchesSearch;
  });

  const handleEditCandidato = (candidato: any) => {
    setEditingCandidato(candidato);
    setIsModalOpen(true);
  };

  const handleNewCandidato = () => {
    setEditingCandidato(null);
    setIsModalOpen(true);
  };

  const handleDeleteCandidato = (candidatoId: string) => {
    if (confirm("Tem certeza que deseja excluir este candidato?")) {
      deleteMutation.mutate(candidatoId);
    }
  };

  const renderStatusEtico = (statusEtico: string, motivo: string) => {
    switch (statusEtico) {
      case "aprovado":
        return (
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            <Badge variant="default" className="bg-green-100 text-green-800">
              Aprovado
            </Badge>
          </div>
        );
      case "reprovado":
        return (
          <div className="flex items-center gap-1">
            <ShieldX className="h-4 w-4 text-red-500" />
            <Badge variant="destructive" title={motivo || "Reprovado por questões éticas"}>
              Reprovado
            </Badge>
          </div>
        );
      case "pendente":
        return (
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Pendente
            </Badge>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4 text-gray-500" />
            <Badge variant="outline">
              Não avaliado
            </Badge>
          </div>
        );
    }
  };

  const renderStatusDisc = (candidatoId: string) => {
    console.log("renderStatusDisc - candidatoId:", candidatoId);
    console.log("renderStatusDisc - resultadosDisc completo:", resultadosDisc);
    
    // resultadosDisc é um objeto onde as chaves são candidatoId
    const resultado = resultadosDisc[candidatoId];
    console.log("renderStatusDisc - resultado encontrado:", resultado);
    
    if (!resultado || resultado.length === 0) {
      return (
        <div className="flex items-center gap-1">
          <Brain className="h-4 w-4 text-gray-500" />
          <Badge variant="outline">
            Não realizado
          </Badge>
        </div>
      );
    }

    // Pegar a avaliação mais recente finalizada
    const avaliacaoFinalizada = resultado.find((av: any) => av.status === "finalizada");
    
    if (avaliacaoFinalizada) {
      let perfil = "N/A";
      
      // Parse do resultado se necessário
      if (avaliacaoFinalizada.resultado) {
        try {
          const resultadoParsed = typeof avaliacaoFinalizada.resultado === 'string' 
            ? JSON.parse(avaliacaoFinalizada.resultado) 
            : avaliacaoFinalizada.resultado;
          perfil = resultadoParsed.perfilDominante || "N/A";
        } catch (error) {
          console.error("Erro ao fazer parse do resultado DISC:", error);
        }
      }
      
      const getPerfilColor = (perfil: string) => {
        switch (perfil) {
          case "D": return "bg-red-100 text-red-800";
          case "I": return "bg-blue-100 text-blue-800";
          case "S": return "bg-green-100 text-green-800";
          case "C": return "bg-purple-100 text-purple-800";
          default: return "bg-gray-100 text-gray-800";
        }
      };
      
      return (
        <div className="flex items-center gap-1">
          <Brain className="h-4 w-4 text-blue-500" />
          <Badge className={getPerfilColor(perfil)}>
            {perfil}
          </Badge>
        </div>
      );
    } else {
      // Tem avaliação mas não finalizada
      return (
        <div className="flex items-center gap-1">
          <Brain className="h-4 w-4 text-orange-500" />
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            Em andamento
          </Badge>
        </div>
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativo": return "bg-green-100 text-green-800";
      case "inativo": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getOrigemColor = (origem: string) => {
    switch (origem) {
      case "manual": return "bg-blue-100 text-blue-800";
      case "portal_externo": return "bg-purple-100 text-purple-800";
      case "importado": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const canManageCandidatos = user && ["admin", "recrutador"].includes(user.perfil);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestão de Candidatos</h1>
              <p className="text-gray-600 mt-1">Gerencie todos os candidatos da sua empresa</p>
            </div>
            {canManageCandidatos && (
              <Button onClick={handleNewCandidato} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Candidato
              </Button>
            )}
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={origemFilter} onValueChange={setOrigemFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="portal_externo">Portal Externo</SelectItem>
                    <SelectItem value="importado">Importado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Candidates Table */}
          <Card>
            <CardHeader>
              <CardTitle>Candidatos ({filteredCandidatos.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Status Ético</TableHead>
                    <TableHead>DISC</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidatos.map((candidato: any) => (
                    <TableRow key={candidato.id}>
                      <TableCell className="font-medium">{candidato.nome}</TableCell>
                      <TableCell>{candidato.email}</TableCell>
                      <TableCell>{candidato.telefone}</TableCell>
                      <TableCell>
                        <Badge variant={candidato.status === "ativo" ? "default" : "secondary"}>
                          {candidato.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {renderStatusEtico(candidato.statusEtico, candidato.motivoReprovacaoEtica)}
                      </TableCell>
                      <TableCell>
                        {renderStatusDisc(candidato.id)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {candidato.origem || "manual"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedCandidatoId(candidato.id);
                              setShowDetailModal(true);
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditCandidato(candidato)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteCandidato(candidato.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCandidatos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Nenhum candidato encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <CandidatoModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingCandidato(null);
            }}
            editingCandidato={editingCandidato}
          />
    </div>
  );
}