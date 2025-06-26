import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Eye, Mail, Phone, LinkedinIcon, FileText, MoreHorizontal, Shield, ShieldCheck, ShieldX, AlertTriangle, Brain, X } from "lucide-react";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CandidatoDetailModal } from "@/components/candidato-detail-modal";
import { StatusEticoModal } from "@/components/status-etico-modal";

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
    // Informações pessoais
    cpf: "",
    dataNascimento: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    // Informações profissionais
    cargo: "",
    resumoProfissional: "",
    pretensoSalarial: "",
    disponibilidade: "",
    modalidadeTrabalho: "",
    portfolio: "",
    // Arrays para dados complexos
    experienciaProfissional: [] as Array<{
      empresa: string;
      cargo: string;
      dataInicio: string;
      dataFim: string;
      descricao: string;
      atual: boolean;
    }>,
    educacao: [] as Array<{
      instituicao: string;
      curso: string;
      nivel: string;
      dataInicio: string;
      dataConclusao: string;
      status: string;
    }>,
    habilidades: [] as string[],
    idiomas: [] as Array<{
      idioma: string;
      nivel: string;
    }>,
    certificacoes: [] as Array<{
      nome: string;
      instituicao: string;
      dataEmissao: string;
      dataVencimento: string;
    }>,
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
        // Informações pessoais
        cpf: editingCandidato.cpf || "",
        dataNascimento: editingCandidato.dataNascimento || "",
        endereco: editingCandidato.endereco || "",
        cidade: editingCandidato.cidade || "",
        estado: editingCandidato.estado || "",
        cep: editingCandidato.cep || "",
        // Informações profissionais
        cargo: editingCandidato.cargo || "",
        resumoProfissional: editingCandidato.resumoProfissional || "",
        pretensoSalarial: editingCandidato.pretensoSalarial || "",
        disponibilidade: editingCandidato.disponibilidade || "",
        modalidadeTrabalho: editingCandidato.modalidadeTrabalho || "",
        portfolio: editingCandidato.portfolio || "",
        // Arrays para dados complexos
        experienciaProfissional: editingCandidato.experienciaProfissional || [],
        educacao: editingCandidato.educacao || [],
        habilidades: editingCandidato.habilidades || [],
        idiomas: editingCandidato.idiomas || [],
        certificacoes: editingCandidato.certificacoes || [],
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
        // Informações pessoais
        cpf: "",
        dataNascimento: "",
        endereco: "",
        cidade: "",
        estado: "",
        cep: "",
        // Informações profissionais
        cargo: "",
        resumoProfissional: "",
        pretensoSalarial: "",
        disponibilidade: "",
        modalidadeTrabalho: "",
        portfolio: "",
        // Arrays para dados complexos
        experienciaProfissional: [],
        educacao: [],
        habilidades: [],
        idiomas: [],
        certificacoes: [],
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

  // Helper functions para gerenciar arrays
  const addExperiencia = () => {
    setFormData({
      ...formData,
      experienciaProfissional: [
        ...formData.experienciaProfissional,
        { empresa: "", cargo: "", dataInicio: "", dataFim: "", descricao: "", atual: false }
      ]
    });
  };

  const removeExperiencia = (index: number) => {
    setFormData({
      ...formData,
      experienciaProfissional: formData.experienciaProfissional.filter((_, i) => i !== index)
    });
  };

  const updateExperiencia = (index: number, field: string, value: any) => {
    const updated = [...formData.experienciaProfissional];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, experienciaProfissional: updated });
  };

  const addEducacao = () => {
    setFormData({
      ...formData,
      educacao: [
        ...formData.educacao,
        { instituicao: "", curso: "", nivel: "", dataInicio: "", dataConclusao: "", status: "" }
      ]
    });
  };

  const removeEducacao = (index: number) => {
    setFormData({
      ...formData,
      educacao: formData.educacao.filter((_, i) => i !== index)
    });
  };

  const updateEducacao = (index: number, field: string, value: string) => {
    const updated = [...formData.educacao];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, educacao: updated });
  };

  const addHabilidade = (habilidade: string) => {
    if (habilidade && !formData.habilidades.includes(habilidade)) {
      setFormData({
        ...formData,
        habilidades: [...formData.habilidades, habilidade]
      });
    }
  };

  const removeHabilidade = (index: number) => {
    setFormData({
      ...formData,
      habilidades: formData.habilidades.filter((_, i) => i !== index)
    });
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {editingCandidato ? "Editar Candidato" : "Novo Candidato"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basico" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basico">Dados Básicos</TabsTrigger>
              <TabsTrigger value="pessoais">Dados Pessoais</TabsTrigger>
              <TabsTrigger value="profissional">Profissional</TabsTrigger>
              <TabsTrigger value="experiencia">Experiência</TabsTrigger>
            </TabsList>

            {/* Aba Dados Básicos */}
            <TabsContent value="basico" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome *</label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Telefone *</label>
                  <Input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Origem</label>
                  <Select value={formData.origem} onValueChange={(value) => setFormData({...formData, origem: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="portal_externo">Portal Externo</SelectItem>
                      <SelectItem value="importado">Importado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">LinkedIn</label>
                  <Input
                    type="url"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({...formData, linkedin: e.target.value})}
                    placeholder="https://linkedin.com/in/usuario"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">URL do Currículo</label>
                <Input
                  type="url"
                  value={formData.curriculoUrl}
                  onChange={(e) => setFormData({...formData, curriculoUrl: e.target.value})}
                  placeholder="https://exemplo.com/curriculo.pdf"
                />
              </div>
            </TabsContent>

            {/* Aba Dados Pessoais */}
            <TabsContent value="pessoais" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">CPF</label>
                  <Input
                    value={formData.cpf}
                    onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                    placeholder="000.000.000-00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Data de Nascimento</label>
                  <Input
                    type="date"
                    value={formData.dataNascimento}
                    onChange={(e) => setFormData({...formData, dataNascimento: e.target.value})}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Endereço</label>
                  <Input
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                    placeholder="Rua, número, bairro"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Cidade</label>
                  <Input
                    value={formData.cidade}
                    onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                    placeholder="São Paulo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Estado</label>
                  <Input
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    placeholder="SP"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">CEP</label>
                  <Input
                    value={formData.cep}
                    onChange={(e) => setFormData({...formData, cep: e.target.value})}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Aba Profissional */}
            <TabsContent value="profissional" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cargo Desejado</label>
                  <Input
                    value={formData.cargo}
                    onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                    placeholder="Desenvolvedor Full Stack"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Pretensão Salarial</label>
                  <Input
                    value={formData.pretensoSalarial}
                    onChange={(e) => setFormData({...formData, pretensoSalarial: e.target.value})}
                    placeholder="R$ 5.000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Disponibilidade</label>
                  <Select value={formData.disponibilidade} onValueChange={(value) => setFormData({...formData, disponibilidade: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="imediata">Imediata</SelectItem>
                      <SelectItem value="15_dias">15 dias</SelectItem>
                      <SelectItem value="30_dias">30 dias</SelectItem>
                      <SelectItem value="60_dias">60 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Modalidade de Trabalho</label>
                  <Select value={formData.modalidadeTrabalho} onValueChange={(value) => setFormData({...formData, modalidadeTrabalho: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="remoto">Remoto</SelectItem>
                      <SelectItem value="hibrido">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Portfólio</label>
                  <Input
                    type="url"
                    value={formData.portfolio}
                    onChange={(e) => setFormData({...formData, portfolio: e.target.value})}
                    placeholder="https://meuportfolio.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Resumo Profissional</label>
                <Textarea
                  value={formData.resumoProfissional}
                  onChange={(e) => setFormData({...formData, resumoProfissional: e.target.value})}
                  placeholder="Descreva brevemente sua experiência e objetivos profissionais..."
                  rows={4}
                />
              </div>
              
              {/* Habilidades */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Habilidades</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite uma habilidade e pressione Enter"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addHabilidade(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.habilidades.map((habilidade, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {habilidade}
                        <Button
                          type="button"
                          onClick={() => removeHabilidade(index)}
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-4 w-4 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Aba Experiência */}
            <TabsContent value="experiencia" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Experiências Profissionais</h3>
                <Button type="button" onClick={addExperiencia} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Experiência
                </Button>
              </div>
              
              {formData.experienciaProfissional.map((exp, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Experiência {index + 1}</h4>
                      <Button
                        type="button"
                        onClick={() => removeExperiencia(index)}
                        variant="ghost"
                        size="sm"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Empresa</label>
                        <Input
                          value={exp.empresa}
                          onChange={(e) => updateExperiencia(index, 'empresa', e.target.value)}
                          placeholder="Nome da empresa"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Cargo</label>
                        <Input
                          value={exp.cargo}
                          onChange={(e) => updateExperiencia(index, 'cargo', e.target.value)}
                          placeholder="Cargo ocupado"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Data de Início</label>
                        <Input
                          type="date"
                          value={exp.dataInicio}
                          onChange={(e) => updateExperiencia(index, 'dataInicio', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Data de Fim</label>
                        <Input
                          type="date"
                          value={exp.dataFim}
                          onChange={(e) => updateExperiencia(index, 'dataFim', e.target.value)}
                          disabled={exp.atual}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={exp.atual}
                          onChange={(e) => updateExperiencia(index, 'atual', e.target.checked)}
                        />
                        <span className="text-sm">Trabalho atual</span>
                      </label>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-1">Descrição</label>
                      <Textarea
                        value={exp.descricao}
                        onChange={(e) => updateExperiencia(index, 'descricao', e.target.value)}
                        placeholder="Descreva suas principais atividades e responsabilidades..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Educação */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Educação</h3>
                  <Button type="button" onClick={addEducacao} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Educação
                  </Button>
                </div>
                
                {formData.educacao.map((edu, index) => (
                  <Card key={index} className="mb-4">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">Educação {index + 1}</h4>
                        <Button
                          type="button"
                          onClick={() => removeEducacao(index)}
                          variant="ghost"
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Instituição</label>
                          <Input
                            value={edu.instituicao}
                            onChange={(e) => updateEducacao(index, 'instituicao', e.target.value)}
                            placeholder="Nome da instituição"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Curso</label>
                          <Input
                            value={edu.curso}
                            onChange={(e) => updateEducacao(index, 'curso', e.target.value)}
                            placeholder="Nome do curso"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Nível</label>
                          <Select value={edu.nivel} onValueChange={(value) => updateEducacao(index, 'nivel', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ensino_medio">Ensino Médio</SelectItem>
                              <SelectItem value="tecnico">Técnico</SelectItem>
                              <SelectItem value="graduacao">Graduação</SelectItem>
                              <SelectItem value="pos_graduacao">Pós-graduação</SelectItem>
                              <SelectItem value="mestrado">Mestrado</SelectItem>
                              <SelectItem value="doutorado">Doutorado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Status</label>
                          <Select value={edu.status} onValueChange={(value) => updateEducacao(index, 'status', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="concluido">Concluído</SelectItem>
                              <SelectItem value="cursando">Cursando</SelectItem>
                              <SelectItem value="trancado">Trancado</SelectItem>
                              <SelectItem value="incompleto">Incompleto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Salvando..." : (editingCandidato ? "Atualizar" : "Criar")}
            </Button>
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
  const [showStatusEticoModal, setShowStatusEticoModal] = useState(false);
  const [selectedCandidato, setSelectedCandidato] = useState<any>(null);
  
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
    // Verificar se resultadosDisc existe e não é vazio
    if (!resultadosDisc || typeof resultadosDisc !== 'object') {
      return (
        <div className="flex items-center gap-1">
          <Brain className="h-4 w-4 text-gray-500" />
          <Badge variant="outline">
            Não realizado
          </Badge>
        </div>
      );
    }
    
    // resultadosDisc é um objeto onde as chaves são candidatoId
    const resultado = (resultadosDisc as any)[candidatoId];
    
    if (!resultado) {
      return (
        <div className="flex items-center gap-1">
          <Brain className="h-4 w-4 text-gray-500" />
          <Badge variant="outline">
            Não realizado
          </Badge>
        </div>
      );
    }

    // resultado deve ter as propriedades do perfil DISC diretamente
    const perfil = resultado.perfilDominante;
    
    if (perfil) {
      const getPerfilInfo = (perfil: string) => {
        switch (perfil) {
          case "D": return { nome: "Dominante", color: "bg-red-100 text-red-800" };
          case "I": return { nome: "Influente", color: "bg-blue-100 text-blue-800" };
          case "S": return { nome: "Estável", color: "bg-green-100 text-green-800" };
          case "C": return { nome: "Cauteloso", color: "bg-purple-100 text-purple-800" };
          default: return { nome: perfil, color: "bg-gray-100 text-gray-800" };
        }
      };
      
      const perfilInfo = getPerfilInfo(perfil);
      
      return (
        <div className="flex items-center gap-1">
          <Brain className="h-4 w-4 text-blue-500" />
          <Badge className={perfilInfo.color}>
            {perfilInfo.nome}
          </Badge>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <Brain className="h-4 w-4 text-gray-500" />
        <Badge variant="outline">
          Não realizado
        </Badge>
      </div>
    );
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
                            <DropdownMenuItem onClick={() => {
                              setSelectedCandidato(candidato);
                              setShowStatusEticoModal(true);
                            }}>
                              <Shield className="h-4 w-4 mr-2" />
                              Status Ético
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

          {/* Modal de detalhes do candidato */}
          <CandidatoDetailModal
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedCandidatoId(null);
            }}
            candidatoId={selectedCandidatoId}
          />

          {/* Modal de status ético */}
          <StatusEticoModal
            isOpen={showStatusEticoModal}
            onClose={() => {
              setShowStatusEticoModal(false);
              setSelectedCandidato(null);
            }}
            candidato={selectedCandidato}
          />
    </div>
  );
}