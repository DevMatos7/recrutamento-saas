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

  const mutation = useMutation({
    mutationFn: async (vagaData: InsertVaga) => {
      const url = editingVaga ? `/api/vagas/${editingVaga.id}` : "/api/vagas";
      const method = editingVaga ? "PUT" : "POST";
      const res = await apiRequest(method, url, vagaData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vagas"] });
      toast({
        title: "Sucesso",
        description: editingVaga ? "Vaga atualizada com sucesso!" : "Vaga criada com sucesso!",
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

  const onSubmit = (data: InsertVaga) => {
    mutation.mutate(data);
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informações Básicas</h3>
                
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

              {/* Organization */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Organização</h3>

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
                        {...field}
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
                        {...field}
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