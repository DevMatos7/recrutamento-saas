import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertVagaSchema, type InsertVaga, type Vaga } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { MultiSelect } from '@/components/ui/multiselect';
import axios from 'axios';
import SkillsAutocomplete from '@/components/skills-autocomplete';

// Modelo padrão do sistema
const MODELO_PADRAO_SISTEMA = [
  { nome: "Triagem de Currículos", cor: "#1976d2", ordem: 1 },
  { nome: "Entrevista com o Candidato", cor: "#fbc02d", ordem: 2 },
  { nome: "Resultado da Entrevista – Aprovado", cor: "#388e3c", ordem: 3 },
  { nome: "Resultado da Entrevista – Reprovado", cor: "#d32f2f", ordem: 4 },
  { nome: "Recebimento da Documentação Admissional", cor: "#7b1fa2", ordem: 5 },
  { nome: "Realização de Exames Médicos", cor: "#0288d1", ordem: 6 },
  { nome: "Contratado", cor: "#388e3c", ordem: 7 },
  { nome: "Integração e Ambientação", cor: "#ffa000", ordem: 8 },
  { nome: "Período de Experiência – Fase 1", cor: "#455a64", ordem: 9 },
  { nome: "Prorrogação do Contrato de Experiência", cor: "#8d6e63", ordem: 10 },
  { nome: "Efetivação – Após 90 dias", cor: "#388e3c", ordem: 11 },
  { nome: "Avaliação de Desempenho – 6 meses", cor: "#1976d2", ordem: 12 }
];

interface Skill { id: string; nome: string; categoria?: string; codigoExterno?: string; }

interface VagaModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingVaga?: Vaga | null;
}

export function VagaModal({ isOpen, onClose, editingVaga }: VagaModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: empresas = [] } = useQuery({
    queryKey: ["/api/empresas"],
  });

  const { data: departamentos = [] } = useQuery({
    queryKey: ["/api/departamentos"],
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ["/api/usuarios"],
  });

  const { data: jornadas = [] } = useQuery({ queryKey: ["/api/jornadas"] });

  const form = useForm<InsertVaga>({
    resolver: zodResolver(insertVagaSchema),
    defaultValues: {
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
      gestorId: "",
    },
  });

  const [skillsOptions, setSkillsOptions] = React.useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = React.useState<Skill[]>([]);

  // Buscar skills da API para autocomplete
  React.useEffect(() => {
    if (isOpen) {
      axios.get('/api/skills').then(res => {
        setSkillsOptions(res.data);
      });
    }
  }, [isOpen]);

  // Preencher selectedSkills ao editar
  React.useEffect(() => {
    if (editingVaga && isOpen) {
      axios.get(`/api/vagas/${editingVaga.id}/skills`).then(res => {
        setSelectedSkills(res.data);
      }).catch(() => setSelectedSkills([]));
    } else if (isOpen) {
      setSelectedSkills([]);
    }
  }, [editingVaga, isOpen]);

  // Reset form when modal opens/closes or editing vaga changes
  React.useEffect(() => {
    if (editingVaga) {
      form.reset({
        titulo: editingVaga.titulo,
        descricao: editingVaga.descricao,
        requisitos: editingVaga.requisitos,
        local: editingVaga.local,
        salario: editingVaga.salario ?? "",
        beneficios: editingVaga.beneficios ?? "",
        tipoContratacao: editingVaga.tipoContratacao as any,
        status: editingVaga.status as any,
        empresaId: editingVaga.empresaId,
        departamentoId: editingVaga.departamentoId,
        gestorId: editingVaga.gestorId,
      });
    } else if (isOpen) {
      form.reset({
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
        gestorId: "",
      });
    }
  }, [editingVaga, isOpen, form, user?.empresaId]);

  // Buscar perfis de vaga
  const { data: perfisVaga = [] } = useQuery({
    queryKey: ["/api/perfis-vaga"],
    enabled: isOpen && !editingVaga, // Só busca ao criar nova vaga
  });

  // Função para aplicar modelo padrão
  const aplicarModeloPadrao = async (vagaId: string, empresaId: string) => {
    try {
      // 1. Buscar modelo padrão da empresa
      const resModelo = await fetch(`/api/empresas/${empresaId}/modelos-pipeline?padrao=true`);
      
      if (resModelo.ok) {
        const modelos = await resModelo.json();
        const modeloPadrao = modelos.find((m: any) => m.padrao);
        
        if (modeloPadrao && modeloPadrao.etapas && modeloPadrao.etapas.length > 0) {
          // Aplicar modelo padrão da empresa
          const resEtapas = await fetch(`/api/vagas/${vagaId}/etapas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ etapas: modeloPadrao.etapas })
          });
          return { tipo: 'empresa', modelo: modeloPadrao.nome };
        }
      }
      
      // 2. Se não tem modelo padrão, aplicar modelo básico do sistema
      const resEtapas = await fetch(`/api/vagas/${vagaId}/etapas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etapas: MODELO_PADRAO_SISTEMA })
      });
      
      return { tipo: 'sistema', modelo: 'Modelo Básico do Sistema' };
    } catch (error) {
      console.error('Erro ao aplicar modelo padrão:', error);
      return null;
    }
  };

  // Handler para preencher campos a partir do perfil selecionado
  const handlePerfilVagaChange = (perfilId: string) => {
    const perfil = (perfisVaga as any[]).find((p) => p.id === perfilId);
    if (perfil) {
      form.reset({
        titulo: perfil.tituloVaga,
        descricao: perfil.descricaoFuncao,
        requisitos: perfil.requisitosObrigatorios || "",
        local: perfil.localAtuacao || "",
        salario: perfil.faixaSalarial || "",
        beneficios: perfil.beneficios || "",
        tipoContratacao: perfil.tipoContratacao,
        status: "aberta",
        empresaId: perfil.empresaId,
        departamentoId: perfil.departamentoId,
        gestorId: user?.id || "",
      });
      // Se desejar, pode também sugerir skills/competências técnicas
    }
  };

  const mutation = useMutation({
    mutationFn: async (vagaData: InsertVaga) => {
      const url = editingVaga ? `/api/vagas/${editingVaga.id}` : "/api/vagas";
      const method = editingVaga ? "PUT" : "POST";
      const res = await apiRequest(method, url, vagaData);
      const vagaCriada = await res.json();
      
      // Se é uma nova vaga, aplicar modelo padrão
      if (!editingVaga && vagaCriada.id) {
              const resultadoModelo = await aplicarModeloPadrao(vagaCriada.id, vagaData.empresaId);
        if (resultadoModelo) {
          vagaCriada.modeloAplicado = resultadoModelo;
        }
      }
      
      return vagaCriada;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vagas"] });
      
      // Mostrar mensagem específica sobre o modelo aplicado
      if (data.modeloAplicado) {
        if (data.modeloAplicado.tipo === 'empresa') {
          toast({
            title: "Sucesso",
            description: `Vaga criada com sucesso! Modelo padrão "${data.modeloAplicado.modelo}" aplicado automaticamente.`,
          });
        } else {
          toast({
            title: "Sucesso",
            description: `Vaga criada com sucesso! ${data.modeloAplicado.modelo} aplicado automaticamente.`,
          });
        }
      } else {
        toast({
          title: "Sucesso",
          description: editingVaga ? "Vaga atualizada com sucesso!" : "Vaga criada com sucesso!",
        });
      }
      
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

  const onSubmit = (data: InsertVaga) => {
    if (selectedSkills.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos uma competência técnica para a vaga.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate({ ...data, skillsIds: selectedSkills.map(s => s.id) });
  };

  // Filter usuarios to show only gestors and admins
  const gestores = (usuarios as any[]).filter(u => 
    ["admin", "gestor", "recrutador"].includes(u.perfil)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingVaga ? "Editar Vaga" : "Nova Vaga"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Importar Perfil de Vaga */}
            {!editingVaga && (
              <div className="mb-4">
                <FormLabel>Importar Perfil de Vaga</FormLabel>
                <select
                  className="w-full p-2 border rounded"
                  defaultValue=""
                  onChange={e => handlePerfilVagaChange(e.target.value)}
                >
                  <option value="">Selecionar um perfil cadastrado...</option>
                  {(perfisVaga as any[]).map((perfil) => (
                    <option key={perfil.id} value={perfil.id}>
                      {perfil.nomePerfil} - {perfil.tituloVaga}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Informações Básicas</h3>
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título da Vaga</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Desenvolvedor Frontend React" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="local"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: São Paulo - SP, Remoto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipoContratacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Contratação</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CLT">CLT</SelectItem>
                          <SelectItem value="PJ">PJ</SelectItem>
                          <SelectItem value="Estágio">Estágio</SelectItem>
                          <SelectItem value="Temporário">Temporário</SelectItem>
                          <SelectItem value="Freelancer">Freelancer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Faixa Salarial (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: R$ 5.000 - R$ 8.000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Organização</h3>
                <FormField
                  control={form.control}
                  name="empresaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a empresa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(empresas as any[]).map((empresa) => (
                            <SelectItem key={empresa.id} value={empresa.id}>
                              {empresa.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="departamentoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departamento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o departamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(departamentos as any[]).map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gestorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gestor Responsável</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o gestor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {gestores.map((gestor) => (
                            <SelectItem key={gestor.id} value={gestor.id}>
                              {gestor.nome} ({gestor.perfil})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="aberta">Aberta</SelectItem>
                          <SelectItem value="em_triagem">Em Triagem</SelectItem>
                          <SelectItem value="entrevistas">Entrevistas</SelectItem>
                          <SelectItem value="encerrada">Encerrada</SelectItem>
                          <SelectItem value="cancelada">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="jornadaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jornada</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a jornada" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(jornadas as any[]).map((j) => (
                            <SelectItem key={j.id} value={j.id}>
                              <div>
                                <div className="font-medium">{j.nome}</div>
                                <div className="text-xs text-gray-500">{j.horarios?.map((h: any) => `${h.label}: ${h.hora}`).join(", ")}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="space-y-6 pt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Competências Técnicas</h3>
              <div>
                <FormLabel>Competências Técnicas</FormLabel>
                <SkillsAutocomplete
                  selectedSkills={selectedSkills}
                  onSkillsChange={setSelectedSkills}
                  placeholder="Busque e selecione as competências da vaga"
                  maxSkills={10}
                />
              </div>
            </div>
            {/* Description and Requirements */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Detalhes da Vaga</h3>
              
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição da Vaga</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva as responsabilidades e atividades da vaga..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requisitos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requisitos</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Liste os requisitos técnicos e experiências necessárias..."
                        className="min-h-[100px]"
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="beneficios"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benefícios (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Liste os benefícios oferecidos pela empresa..."
                        className="min-h-[100px]"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvando..." : editingVaga ? "Atualizar" : "Criar Vaga"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}