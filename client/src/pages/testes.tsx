import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Brain, Trash2, Edit, Users, TrendingUp } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Teste, InsertTeste } from "@shared/schema";

const testeFormSchema = z.object({
  tipo: z.enum(["DISC", "tecnico"]),
  titulo: z.string().min(1, "Título é obrigatório"),
  descricao: z.string().optional(),
  questoes: z.array(z.object({
    enunciado: z.string().min(1, "Enunciado é obrigatório"),
    alternativas: z.array(z.string()).min(2, "Mínimo 2 alternativas"),
    respostaCorreta: z.number().optional(),
  })).min(1, "Pelo menos uma questão é obrigatória"),
});

type TesteFormData = z.infer<typeof testeFormSchema>;

const defaultDISCQuestions = [
  {
    enunciado: "Como você prefere trabalhar?",
    alternativas: [
      "Tomo decisões rápidas e assumo o controle",
      "Trabalho bem em equipe e influencio positivamente",
      "Prefiro estabilidade e colaboração harmoniosa",
      "Analiso cuidadosamente antes de agir"
    ]
  },
  {
    enunciado: "Em situações de pressão, você:",
    alternativas: [
      "Mantém o foco e age decisivamente",
      "Motiva a equipe e busca soluções criativas",
      "Oferece apoio e mantém a calma",
      "Analisa a situação metodicamente"
    ]
  },
  {
    enunciado: "Seu estilo de comunicação é:",
    alternativas: [
      "Direto e objetivo",
      "Entusiástico e persuasivo",
      "Paciente e empático",
      "Preciso e detalhado"
    ]
  },
  {
    enunciado: "Você prefere ambientes de trabalho:",
    alternativas: [
      "Dinâmicos com desafios constantes",
      "Sociais com interação frequente",
      "Estáveis e previsíveis",
      "Organizados e estruturados"
    ]
  }
];

export default function TestesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingTeste, setEditingTeste] = useState<Teste | null>(null);
  const [questaoAtual, setQuestaoAtual] = useState(0);

  const form = useForm<TesteFormData>({
    resolver: zodResolver(testeFormSchema),
    defaultValues: {
      tipo: "DISC",
      titulo: "",
      descricao: "",
      questoes: [{ enunciado: "", alternativas: ["", ""], respostaCorreta: undefined }]
    }
  });

  const { data: testes, isLoading } = useQuery({
    queryKey: ["/api/testes"],
    enabled: !!user
  });

  const createTesteMutation = useMutation({
    mutationFn: async (data: TesteFormData) => {
      const response = await fetch("/api/testes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar teste");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/testes"] });
      setCreateModalOpen(false);
      setEditingTeste(null);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Teste criado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteTesteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/testes/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao deletar teste");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/testes"] });
      toast({
        title: "Sucesso",
        description: "Teste desativado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: TesteFormData) => {
    createTesteMutation.mutate(data);
  };

  const handleCreateDISC = () => {
    form.reset({
      tipo: "DISC",
      titulo: "Teste DISC - Perfil Comportamental",
      descricao: "Avalia o perfil comportamental do candidato baseado na metodologia DISC",
      questoes: defaultDISCQuestions
    });
    setCreateModalOpen(true);
  };

  const handleCreateTecnico = () => {
    form.reset({
      tipo: "tecnico",
      titulo: "",
      descricao: "",
      questoes: [{ enunciado: "", alternativas: ["", ""], respostaCorreta: 0 }]
    });
    setCreateModalOpen(true);
  };

  const addQuestao = () => {
    const currentQuestoes = form.getValues("questoes");
    form.setValue("questoes", [
      ...currentQuestoes,
      { enunciado: "", alternativas: ["", ""], respostaCorreta: undefined }
    ]);
  };

  const removeQuestao = (index: number) => {
    const currentQuestoes = form.getValues("questoes");
    if (currentQuestoes.length > 1) {
      form.setValue("questoes", currentQuestoes.filter((_, i) => i !== index));
    }
  };

  const addAlternativa = (questaoIndex: number) => {
    const currentQuestoes = form.getValues("questoes");
    const questao = currentQuestoes[questaoIndex];
    questao.alternativas.push("");
    form.setValue(`questoes.${questaoIndex}.alternativas`, questao.alternativas);
  };

  const removeAlternativa = (questaoIndex: number, altIndex: number) => {
    const currentQuestoes = form.getValues("questoes");
    const questao = currentQuestoes[questaoIndex];
    if (questao.alternativas.length > 2) {
      questao.alternativas.splice(altIndex, 1);
      form.setValue(`questoes.${questaoIndex}.alternativas`, questao.alternativas);
    }
  };

  if (!user) {
    return <div>Carregando...</div>;
  }

  const canManageTests = ["admin"].includes(user.perfil);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Testes DISC e Técnicos</h1>
          <p className="text-muted-foreground">
            Gerencie testes comportamentais e técnicos para avaliação de candidatos
          </p>
        </div>
        
        {canManageTests && (
          <div className="flex gap-2">
            <Button onClick={handleCreateDISC} variant="outline">
              <Brain className="w-4 h-4 mr-2" />
              Criar Teste DISC
            </Button>
            <Button onClick={handleCreateTecnico}>
              <FileText className="w-4 h-4 mr-2" />
              Criar Teste Técnico
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.isArray(testes) && testes.map((teste: Teste) => (
            <Card key={teste.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{teste.titulo}</CardTitle>
                    <CardDescription className="mt-1">{teste.descricao}</CardDescription>
                  </div>
                  <Badge variant={teste.tipo === "DISC" ? "default" : "secondary"}>
                    {teste.tipo === "DISC" ? "DISC" : "Técnico"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {Array.isArray(teste.questoes) ? teste.questoes.length : 0} questões
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    0 aplicações
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {canManageTests && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingTeste(teste)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTesteMutation.mutate(teste.id)}
                        disabled={deleteTesteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="secondary" className="ml-auto">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Ver Resultados
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Test Modal */}
      <Dialog open={createModalOpen || !!editingTeste} onOpenChange={(open) => {
        if (!open) {
          setCreateModalOpen(false);
          setEditingTeste(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTeste ? "Editar Teste" : "Criar Novo Teste"}
            </DialogTitle>
            <DialogDescription>
              Configure as questões e alternativas do teste
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo do Teste</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DISC">DISC (Comportamental)</SelectItem>
                          <SelectItem value="tecnico">Técnico</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do teste" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva o objetivo do teste"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Questões</h3>
                  <Button type="button" onClick={addQuestao} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Questão
                  </Button>
                </div>

                {form.watch("questoes").map((questao, questaoIndex) => (
                  <Card key={questaoIndex} className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Questão {questaoIndex + 1}</h4>
                      {form.watch("questoes").length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeQuestao(questaoIndex)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name={`questoes.${questaoIndex}.enunciado`}
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Enunciado</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Digite a pergunta"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <FormLabel>Alternativas</FormLabel>
                        <Button
                          type="button"
                          onClick={() => addAlternativa(questaoIndex)}
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar
                        </Button>
                      </div>

                      {questao.alternativas.map((_, altIndex) => (
                        <div key={altIndex} className="flex gap-2 items-center">
                          <span className="w-8 text-center font-medium">
                            {String.fromCharCode(65 + altIndex)}
                          </span>
                          <FormField
                            control={form.control}
                            name={`questoes.${questaoIndex}.alternativas.${altIndex}`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input
                                    placeholder={`Alternativa ${String.fromCharCode(65 + altIndex)}`}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {form.watch("tipo") === "tecnico" && (
                            <FormField
                              control={form.control}
                              name={`questoes.${questaoIndex}.respostaCorreta`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Button
                                      type="button"
                                      variant={field.value === altIndex ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => field.onChange(altIndex)}
                                    >
                                      Correta
                                    </Button>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          )}
                          {questao.alternativas.length > 2 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeAlternativa(questaoIndex, altIndex)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateModalOpen(false);
                    setEditingTeste(null);
                    form.reset();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createTesteMutation.isPending}
                >
                  {createTesteMutation.isPending ? "Salvando..." : "Salvar Teste"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}