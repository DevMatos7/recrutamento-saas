import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Mail, Send, RefreshCw, Trash2, Eye, Plus, Filter, Clock, CheckCircle, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";


const comunicacaoFormSchema = z.object({
  candidatoId: z.string().min(1, "Candidato é obrigatório"),
  tipo: z.enum(["whatsapp", "email"]),
  canal: z.enum(["inscricao", "pipeline", "entrevista", "teste", "outros"]),
  assunto: z.string().optional(),
  mensagem: z.string().min(1, "Mensagem é obrigatória"),
  dataAgendada: z.string().optional(),
});

type ComunicacaoFormData = z.infer<typeof comunicacaoFormSchema>;

const STATUS_CONFIG = {
  pendente: { label: "Pendente", color: "bg-yellow-500 text-white", icon: Clock },
  enviado: { label: "Enviado", color: "bg-green-500 text-white", icon: CheckCircle },
  erro: { label: "Erro", color: "bg-red-500 text-white", icon: XCircle },
};

const TIPO_CONFIG = {
  whatsapp: { label: "WhatsApp", color: "bg-green-600 text-white", icon: MessageSquare },
  email: { label: "E-mail", color: "bg-blue-600 text-white", icon: Mail },
};

const CANAL_CONFIG = {
  inscricao: { label: "Inscrição", color: "bg-blue-100 text-blue-800" },
  pipeline: { label: "Pipeline", color: "bg-purple-100 text-purple-800" },
  entrevista: { label: "Entrevista", color: "bg-orange-100 text-orange-800" },
  teste: { label: "Teste", color: "bg-indigo-100 text-indigo-800" },
  outros: { label: "Outros", color: "bg-gray-100 text-gray-800" },
};

export default function ComunicacoesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [filters, setFilters] = useState({
    status: "all",
    tipo: "all", 
    canal: "all"
  });

  const form = useForm<ComunicacaoFormData>({
    resolver: zodResolver(comunicacaoFormSchema),
    defaultValues: {
      candidatoId: "",
      tipo: "email",
      canal: "outros",
      assunto: "",
      mensagem: "",
      dataAgendada: "",
    }
  });

  const { data: comunicacoes, isLoading } = useQuery({
    queryKey: ["/api/comunicacoes", filters],
    enabled: !!user
  });

  const { data: candidatos } = useQuery({
    queryKey: ["/api/candidatos"],
    enabled: !!user
  });

  const { data: templates } = useQuery({
    queryKey: ["/api/comunicacoes/templates"],
    enabled: !!user
  });

  const enviarComunicacaoMutation = useMutation({
    mutationFn: async (data: ComunicacaoFormData & { variables?: any }) => {
      const response = await fetch("/api/comunicacoes/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao enviar comunicação");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comunicacoes"] });
      setCreateModalOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Comunicação enviada com sucesso!",
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

  const reenviarMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/comunicacoes/${id}/reenviar`, {
        method: "PATCH",
        credentials: "include"
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao reenviar comunicação");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comunicacoes"] });
      toast({
        title: "Sucesso",
        description: "Comunicação reenviada!",
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

  const deleteComunicacaoMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/comunicacoes/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao deletar comunicação");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comunicacoes"] });
      toast({
        title: "Sucesso",
        description: "Comunicação removida!",
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

  const onSubmit = (data: ComunicacaoFormData) => {
    const candidato = Array.isArray(candidatos) ? candidatos.find((c: any) => c.id === data.candidatoId) : null;
    
    const variables = candidato ? {
      nome: candidato.nome,
      email: candidato.email,
      telefone: candidato.telefone,
    } : {};

    enviarComunicacaoMutation.mutate({
      ...data,
      dataAgendada: data.dataAgendada || undefined,
      variables
    });
  };

  const applyTemplate = (template: any, tipo: "whatsapp" | "email") => {
    if (template && template[tipo]) {
      const templateData = template[tipo];
      if (typeof templateData === 'string') {
        form.setValue("mensagem", templateData);
      } else {
        form.setValue("assunto", templateData.assunto || "");
        form.setValue("mensagem", templateData.mensagem || "");
      }
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusIcon = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    const Icon = config?.icon || Clock;
    return <Icon className="w-4 h-4" />;
  };

  const getTipoIcon = (tipo: string) => {
    const config = TIPO_CONFIG[tipo as keyof typeof TIPO_CONFIG];
    const Icon = config?.icon || MessageSquare;
    return <Icon className="w-4 h-4" />;
  };

  const canManageCommunications = user && ["admin", "recrutador"].includes(user.perfil);

  if (!user) {
    return <div>Carregando...</div>;
  }

  const filteredComunicacoes = Array.isArray(comunicacoes) ? comunicacoes.filter((comm: any) => {
    return (filters.status === "all" || comm.statusEnvio === filters.status) &&
           (filters.tipo === "all" || comm.tipo === filters.tipo) &&
           (filters.canal === "all" || comm.canal === filters.canal);
  }) : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Comunicações WhatsApp e E-mail</h1>
          <p className="text-muted-foreground">
            Gerencie o envio de mensagens automáticas e manuais para candidatos
          </p>
        </div>
        
        {canManageCommunications && (
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Comunicação
          </Button>
        )}
      </div>
      
      <div className="space-y-6">
        <Tabs defaultValue="historico" className="space-y-6">
            <TabsList>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
              <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
              <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
            </TabsList>

            <TabsContent value="historico" className="space-y-4">
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filtros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === "all" ? "" : value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="enviado">Enviado</SelectItem>
                        <SelectItem value="erro">Erro</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filters.tipo} onValueChange={(value) => setFilters(prev => ({ ...prev, tipo: value === "all" ? "" : value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filters.canal} onValueChange={(value) => setFilters(prev => ({ ...prev, canal: value === "all" ? "" : value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Canal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os canais</SelectItem>
                        <SelectItem value="inscricao">Inscrição</SelectItem>
                        <SelectItem value="pipeline">Pipeline</SelectItem>
                        <SelectItem value="entrevista">Entrevista</SelectItem>
                        <SelectItem value="teste">Teste</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Communications List */}
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredComunicacoes.length > 0 ? (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Destinatário</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Canal</TableHead>
                          <TableHead>Assunto/Mensagem</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data Envio</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredComunicacoes.map((comunicacao: any) => (
                          <TableRow key={comunicacao.id}>
                            <TableCell className="font-medium">
                              {comunicacao.candidato?.nome}
                              <div className="text-sm text-muted-foreground">
                                {comunicacao.tipo === 'email' ? comunicacao.candidato?.email : comunicacao.candidato?.telefone}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={TIPO_CONFIG[comunicacao.tipo as keyof typeof TIPO_CONFIG]?.color}>
                                <div className="flex items-center gap-1">
                                  {getTipoIcon(comunicacao.tipo)}
                                  {TIPO_CONFIG[comunicacao.tipo as keyof typeof TIPO_CONFIG]?.label}
                                </div>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={CANAL_CONFIG[comunicacao.canal as keyof typeof CANAL_CONFIG]?.color}>
                                {CANAL_CONFIG[comunicacao.canal as keyof typeof CANAL_CONFIG]?.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              {comunicacao.assunto && (
                                <div className="font-medium text-sm truncate">{comunicacao.assunto}</div>
                              )}
                              <div className="text-sm text-muted-foreground truncate">
                                {comunicacao.mensagem}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={STATUS_CONFIG[comunicacao.statusEnvio as keyof typeof STATUS_CONFIG]?.color}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(comunicacao.statusEnvio)}
                                  {STATUS_CONFIG[comunicacao.statusEnvio as keyof typeof STATUS_CONFIG]?.label}
                                </div>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {comunicacao.dataEnvio ? formatDateTime(comunicacao.dataEnvio) : 
                               comunicacao.dataAgendada ? `Agendado: ${formatDateTime(comunicacao.dataAgendada)}` : 
                               "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {comunicacao.statusEnvio === 'erro' && canManageCommunications && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => reenviarMutation.mutate(comunicacao.id)}
                                    disabled={reenviarMutation.isPending}
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                  </Button>
                                )}
                                {canManageCommunications && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => deleteComunicacaoMutation.mutate(comunicacao.id)}
                                    disabled={deleteComunicacaoMutation.isPending}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma comunicação encontrada</h3>
                    <p className="text-muted-foreground mb-4">
                      Não há comunicações que correspondam aos filtros selecionados
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="pendentes">
              <Card>
                <CardContent className="text-center py-12">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Comunicações Pendentes</h3>
                  <p className="text-muted-foreground">
                    Funcionalidade em desenvolvimento para mostrar mensagens agendadas
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="estatisticas">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="w-5 h-5" />
                      Total Enviadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Array.isArray(comunicacoes) ? comunicacoes.filter((c: any) => c.statusEnvio === 'enviado').length : 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Pendentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Array.isArray(comunicacoes) ? comunicacoes.filter((c: any) => c.statusEnvio === 'pendente').length : 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <XCircle className="w-5 h-5" />
                      Com Erro
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Array.isArray(comunicacoes) ? comunicacoes.filter((c: any) => c.statusEnvio === 'erro').length : 0}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
        </Tabs>
      </div>

      {/* Create Communication Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Comunicação</DialogTitle>
            <DialogDescription>
              Envie uma mensagem manual ou agendada para um candidato
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="candidatoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Candidato</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o candidato" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(candidatos) && candidatos.map((candidato: any) => (
                            <SelectItem key={candidato.id} value={candidato.id}>
                              {candidato.nome} - {candidato.email}
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
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">E-mail</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="canal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Canal</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o canal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="inscricao">Inscrição</SelectItem>
                          <SelectItem value="pipeline">Pipeline</SelectItem>
                          <SelectItem value="entrevista">Entrevista</SelectItem>
                          <SelectItem value="teste">Teste</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataAgendada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agendar para (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Template Selection */}
              {templates && (
                <div className="space-y-2">
                  <FormLabel>Templates Pré-definidos</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {templates && Object.entries(templates as Record<string, any>).map(([key, template]) => (
                      <Button
                        key={key}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template);
                          applyTemplate(template, form.getValues("tipo"));
                        }}
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {form.watch("tipo") === "email" && (
                <FormField
                  control={form.control}
                  name="assunto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assunto</FormLabel>
                      <FormControl>
                        <Input placeholder="Assunto do e-mail" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="mensagem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Digite sua mensagem aqui. Você pode usar variáveis como {{nome}}, {{vaga}}, {{empresa}}"
                        className="min-h-[120px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-sm text-muted-foreground">
                <p><strong>Variáveis disponíveis:</strong></p>
                <p>{`{{nome}}, {{email}}, {{telefone}}, {{vaga}}, {{empresa}}, {{data_entrevista}}, {{link_teste}}`}</p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={enviarComunicacaoMutation.isPending}
                >
                  {enviarComunicacaoMutation.isPending ? "Enviando..." : "Enviar Comunicação"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}