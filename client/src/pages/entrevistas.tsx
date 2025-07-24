import { useState, useEffect } from "react";
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
import { Calendar as LucideCalendar, Clock, Users, Plus, Edit, Trash2, CheckCircle, XCircle, UserX } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
// @ts-ignore
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as UiCalendar } from "@/components/ui/calendar";
import React from "react";

import type { Entrevista, InsertEntrevista } from "@shared/schema";

const entrevistaFormSchema = z.object({
  vagaId: z.string().min(1, "Vaga é obrigatória"),
  candidatoId: z.string().min(1, "Candidato é obrigatório"),
  entrevistadorId: z.string().min(1, "Entrevistador é obrigatório"),
  dataHora: z.string().min(1, "Data e hora são obrigatórias"),
  local: z.string().optional(),
  observacoes: z.string().optional(),
  plataforma: z.string().optional(),
});

type EntrevistaFormData = z.infer<typeof entrevistaFormSchema>;

const STATUS_CONFIG = {
  agendada: { label: "Agendada", color: "bg-blue-500 text-white", icon: LucideCalendar },
  realizada: { label: "Realizada", color: "bg-green-500 text-white", icon: CheckCircle },
  cancelada: { label: "Cancelada", color: "bg-red-500 text-white", icon: XCircle },
  faltou: { label: "Faltou", color: "bg-yellow-500 text-white", icon: UserX },
};

const locales = {
  'pt-BR': ptBR,
};
const localizer = dateFnsLocalizer({
  format,
  parse: parseISO,
  startOfWeek: () => new Date(),
  getDay: (date: Date) => date.getDay(),
  locales,
});

export default function EntrevistasPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingEntrevista, setEditingEntrevista] = useState<any | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedEntrevista, setSelectedEntrevista] = useState<any | null>(null);
  const [slotsLivres, setSlotsLivres] = useState<{inicio: string, fim: string}[]>([]);

  const form = useForm<EntrevistaFormData>({
    resolver: zodResolver(entrevistaFormSchema),
    defaultValues: {
      vagaId: "",
      candidatoId: "",
      entrevistadorId: "",
      dataHora: "",
      local: "",
      observacoes: "",
      plataforma: "",
    }
  });

  const { data: entrevistas, isLoading } = useQuery({
    queryKey: ["/api/entrevistas"],
    enabled: !!user
  });

  const { data: vagas } = useQuery({
    queryKey: ["/api/vagas"],
    enabled: !!user
  });

  const { data: candidatos } = useQuery({
    queryKey: ["/api/candidatos"],
    enabled: !!user
  });

  const { data: usuarios } = useQuery({
    queryKey: ["/api/usuarios"],
    enabled: !!user
  });

  const createEntrevistaMutation = useMutation({
    mutationFn: async (data: EntrevistaFormData) => {
      const response = await fetch("/api/entrevistas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao agendar entrevista");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/entrevistas"] });
      setCreateModalOpen(false);
      setEditingEntrevista(null);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Entrevista agendada com sucesso!",
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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, observacoes }: { id: string; status: string; observacoes?: string }) => {
      const response = await fetch(`/api/entrevistas/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, observacoes })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao atualizar status");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/entrevistas"] });
      setStatusModalOpen(false);
      setSelectedEntrevista(null);
      toast({
        title: "Sucesso",
        description: "Status da entrevista atualizado!",
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

  const deleteEntrevistaMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/entrevistas/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao deletar entrevista");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/entrevistas"] });
      toast({
        title: "Sucesso",
        description: "Entrevista removida com sucesso!",
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

  const onSubmit = (data: EntrevistaFormData) => {
    createEntrevistaMutation.mutate(data);
  };

  const handleStatusChange = (status: string) => {
    if (selectedEntrevista) {
      updateStatusMutation.mutate({
        id: selectedEntrevista.id,
        status,
        observacoes: selectedEntrevista.observacoes
      });
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', { timeZone: 'America/Cuiaba' });
  };

  const getStatusIcon = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    const Icon = config?.icon || LucideCalendar;
    return <Icon className="w-4 h-4" />;
  };

  const canManageInterviews = user && ["admin", "recrutador"].includes(user.perfil);
  const canEditInterviews = user && ["admin", "recrutador", "gestor"].includes(user.perfil);

  useEffect(() => {
    const entrevistadorId = form.watch('entrevistadorId');
    const candidatoId = form.watch('candidatoId');
    // Defina o range de datas conforme sua necessidade
    const dataInicio = new Date();
    const dataFim = new Date();
    dataFim.setDate(dataInicio.getDate() + 7);
    if (entrevistadorId && candidatoId) {
      fetch(`/api/entrevistas/slots-livres?entrevistadorId=${entrevistadorId}&candidatoId=${candidatoId}&dataInicio=${dataInicio.toISOString()}&dataFim=${dataFim.toISOString()}`)
        .then(res => res.json())
        .then(setSlotsLivres);
    } else {
      setSlotsLivres([]);
    }
  }, [form.watch('entrevistadorId'), form.watch('candidatoId')]);

  // Mapeia entrevistas para eventos do calendário
  const eventos = (Array.isArray(entrevistas) ? entrevistas : []).map((e: any) => ({
    id: e.id,
    title: `${e.candidato?.nome || ''} - ${e.vaga?.titulo || ''}`,
    start: new Date(e.dataHora),
    end: new Date(e.dataHora), // ajuste se quiser duração
    resource: e,
  }));

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agenda de Entrevistas</h1>
          <p className="text-muted-foreground">
            Gerencie o agendamento e acompanhamento de entrevistas dos candidatos
          </p>
        </div>
            
            {canManageInterviews && (
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agendar Entrevista
              </Button>
            )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Entrevistas Agendadas
            </CardTitle>
            <CardDescription>
              Lista de todas as entrevistas do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BigCalendar
              localizer={localizer}
              events={eventos}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500, marginBottom: 32 }}
              onSelectEvent={(evento: any) => {
                setSelectedEntrevista(evento.resource);
                setStatusModalOpen(true);
              }}
            />
            {Array.isArray(entrevistas) && entrevistas.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidato</TableHead>
                    <TableHead>Vaga</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Entrevistador</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entrevistas.map((entrevista: any) => (
                    <TableRow key={entrevista.id}>
                      <TableCell className="font-medium">
                        {entrevista.candidato?.nome}
                      </TableCell>
                      <TableCell>{entrevista.vaga?.titulo}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          {formatDateTime(entrevista.dataHora)}
                        </div>
                      </TableCell>
                      <TableCell>{entrevista.entrevistador?.nome}</TableCell>
                      <TableCell>
                        {entrevista.local || "Não especificado"}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_CONFIG[entrevista.status as keyof typeof STATUS_CONFIG]?.color}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(entrevista.status)}
                            {STATUS_CONFIG[entrevista.status as keyof typeof STATUS_CONFIG]?.label}
                          </div>
                        </Badge>
                        <div className="flex flex-col mt-1 text-xs gap-1">
                          <span className="flex items-center gap-1">
                            {entrevista.confirmadoCandidato ? (
                              <CheckCircle className="w-3 h-3 text-green-600" />
                            ) : (
                              <Clock className="w-3 h-3 text-yellow-500" />
                            )}
                            Candidato: {entrevista.confirmadoCandidato ? 'Confirmado' : 'Pendente'}
                          </span>
                          <span className="flex items-center gap-1">
                            {entrevista.confirmadoEntrevistador ? (
                              <CheckCircle className="w-3 h-3 text-green-600" />
                            ) : (
                              <Clock className="w-3 h-3 text-yellow-500" />
                            )}
                            Entrevistador: {entrevista.confirmadoEntrevistador ? 'Confirmado' : 'Pendente'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {canEditInterviews && entrevista.status === 'agendada' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedEntrevista(entrevista);
                                  setStatusModalOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteEntrevistaMutation.mutate(entrevista.id)}
                                disabled={deleteEntrevistaMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {canEditInterviews && entrevista.status === 'agendada' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange('realizada')}
                            >
                              Marcar como Realizada
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <LucideCalendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma entrevista agendada</h3>
                <p className="text-muted-foreground mb-4">
                  Comece agendando a primeira entrevista com um candidato
                </p>
                {canManageInterviews && (
                  <Button onClick={() => setCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agendar Primeira Entrevista
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Interview Modal */}
      <Dialog open={createModalOpen || !!editingEntrevista} onOpenChange={(open) => {
        if (!open) {
          setCreateModalOpen(false);
          setEditingEntrevista(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEntrevista ? "Editar Entrevista" : "Agendar Nova Entrevista"}
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes da entrevista com o candidato
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vagaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vaga</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a vaga" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(vagas) && vagas.map((vaga: any) => (
                            <SelectItem key={vaga.id} value={vaga.id}>
                              {vaga.titulo}
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
                              {candidato.nome}
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
                  name="entrevistadorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entrevistador</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o entrevistador" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(usuarios) && usuarios
                            .filter((usuario: any) => ['admin', 'recrutador', 'gestor'].includes(usuario.perfil))
                            .map((usuario: any) => (
                              <SelectItem key={usuario.id} value={usuario.id}>
                                {usuario.nome} ({usuario.perfil})
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
                  name="dataHora"
                  render={({ field }) => {
                    // Separar data e hora para facilitar a seleção
                    const valueDate = field.value ? new Date(field.value) : undefined;
                    const [date, setDate] = React.useState<Date | undefined>(valueDate);
                    const [time, setTime] = React.useState<string>(valueDate ? valueDate.toISOString().substring(11, 16) : "");
                    // Estado para controlar abertura do calendário
                    const [calendarOpen, setCalendarOpen] = React.useState(false);

                    React.useEffect(() => {
                      if (date && time) {
                        // Montar string ISO
                        const [hours, minutes] = time.split(":");
                        const newDate = new Date(date);
                        newDate.setHours(Number(hours));
                        newDate.setMinutes(Number(minutes));
                        newDate.setSeconds(0);
                        newDate.setMilliseconds(0);
                        field.onChange(newDate.toISOString()); // Enviar string ISO
                      }
                    }, [date, time]);

                    return (
                      <FormItem>
                        <FormLabel>Data e Hora</FormLabel>
                        <div className="flex gap-2 items-center">
                          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-[180px] justify-start text-left font-normal" onClick={() => setCalendarOpen((v) => !v)}>
                                <LucideCalendar className="mr-2 h-4 w-4" />
                                {date ? date.toLocaleDateString('pt-BR') : <span>Selecione a data</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <UiCalendar
                                mode="single"
                                selected={date}
                                onSelect={d => { setDate(d); setCalendarOpen(false); }}
                                captionLayout="dropdown"
                                locale={ptBR}
                              />
                            </PopoverContent>
                          </Popover>
                          <Input
                            type="time"
                            value={time}
                            onChange={e => setTime(e.target.value)}
                            className="w-[110px]"
                            step="60"
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="plataforma"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plataforma</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Zoom, Meet, Jitsi"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="local"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Google Meet, Sala de Reuniões 1, Skype"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Instruções adicionais, pontos a avaliar, etc."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateModalOpen(false);
                    setEditingEntrevista(null);
                    form.reset();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createEntrevistaMutation.isPending}
                >
                  {createEntrevistaMutation.isPending ? "Agendando..." : "Agendar Entrevista"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Status Update Modal */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Status da Entrevista</DialogTitle>
            <DialogDescription>
              Altere o status da entrevista conforme necessário
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => handleStatusChange('realizada')}
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span>Realizada</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStatusChange('cancelada')}
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <XCircle className="w-6 h-6 text-red-600" />
                <span>Cancelada</span>
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => handleStatusChange('faltou')}
              className="w-full h-auto p-4 flex flex-col items-center gap-2"
            >
              <UserX className="w-6 h-6 text-yellow-600" />
              <span>Candidato Faltou</span>
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusModalOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}