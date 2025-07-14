import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Users, ArrowRight, Mail, Phone, Star, Clock, Plus, Trash2, Brain, FileText, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import PipelineEtapasConfig from "@/components/PipelineEtapasConfig";


const PIPELINE_STAGES = [
  { id: "recebido", title: "Recebidos", color: "bg-blue-500 text-white" },
  { id: "triagem", title: "Em Triagem", color: "bg-yellow-500 text-white" },
  { id: "entrevista", title: "Entrevista", color: "bg-purple-500 text-white" },
  { id: "avaliacao", title: "Avaliação", color: "bg-orange-500 text-white" },
  { id: "aprovado", title: "Aprovados", color: "bg-green-500 text-white" },
  { id: "reprovado", title: "Reprovados", color: "bg-red-500 text-white" },
];

// Descrições explicativas para cada etapa do pipeline
const PIPELINE_STAGE_DESCRIPTIONS: Record<string, string> = {
  recebido: "Candidatos recém-inscritos aguardando triagem inicial.",
  triagem: "Análise de currículos e pré-requisitos pela equipe de RH.",
  entrevista: "Candidatos em fase de entrevistas com recrutadores ou gestores.",
  avaliacao: "Avaliação técnica, comportamental ou testes online.",
  aprovado: "Candidatos aprovados para proposta ou contratação.",
  reprovado: "Candidatos que não seguirão no processo seletivo.",
};

interface CandidateWithDetails {
  id: string;
  vagaId: string;
  candidatoId: string;
  etapa: string;
  nota: string | null;
  comentarios: string | null;
  dataMovimentacao: string;
  dataInscricao: string;
  responsavelId: string | null;
  candidato: {
    id: string;
    nome: string;
    email: string;
    telefone: string;
    curriculoUrl: string | null;
    linkedin: string | null;
    status: string;
  };
}

function CandidateCard({ 
  candidate, 
  onMoveCandidate,
  onRemoveCandidate
}: { 
  candidate: CandidateWithDetails; 
  onMoveCandidate: (candidate: CandidateWithDetails) => void;
  onRemoveCandidate: (candidate: CandidateWithDetails) => void;
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Card className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-sm">{candidate.candidato.nome}</h4>
          {candidate.nota && (
            <Badge variant="outline">
              <Star className="h-3 w-3 mr-1" />
              {candidate.nota}
            </Badge>
          )}
        </div>
        
        <div className="space-y-1 text-xs text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            <span className="truncate">{candidate.candidato.email}</span>
          </div>
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            <span>{candidate.candidato.telefone}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Atualizado em {formatDate(candidate.dataMovimentacao)}</span>
          </div>
        </div>

        {candidate.comentarios && (
          <div className="text-xs bg-gray-50 p-2 rounded mb-3">
            {candidate.comentarios}
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1"
            onClick={() => onMoveCandidate(candidate)}
          >
            <ArrowRight className="h-3 w-3 mr-1" />
            Mover
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onRemoveCandidate(candidate)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MoveModal({ 
  candidate, 
  isOpen, 
  onClose, 
  onMove,
  errorMessage,
  etapas // <-- NOVO: etapas personalizadas
}: { 
  candidate: CandidateWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onMove: (etapa: string, comentarios: string, nota?: number) => void;
  errorMessage?: string | null;
  etapas: any[]; // <-- NOVO: etapas personalizadas
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [etapa, setEtapa] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [nota, setNota] = useState("");
  const [error, setError] = useState<string | null>(errorMessage ?? null);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);

  // Buscar campos obrigatórios da etapa atual ao abrir o modal
  useEffect(() => {
    async function fetchRequiredFields() {
      if (candidate && candidate.vagaId && candidate.etapa) {
        const res = await fetch(`/api/vagas/${candidate.vagaId}/etapas`);
        if (res.ok) {
          const etapas = await res.json();
          const etapaAtual = etapas.find((e: any) => e.nome === candidate.etapa);
          if (etapaAtual && Array.isArray(etapaAtual.camposObrigatorios)) {
            setRequiredFields(etapaAtual.camposObrigatorios);
          } else {
            setRequiredFields([]);
          }
        }
      }
    }
    if (isOpen) {
      fetchRequiredFields();
    }
  }, [candidate, isOpen]);

  // Atualizar requiredFields ao mudar a etapa de destino (opcional: buscar da API se etapas customizadas)
  useEffect(() => {
    async function fetchRequiredFieldsForNewStage() {
      if (candidate && candidate.vagaId && etapa) {
        const res = await fetch(`/api/vagas/${candidate.vagaId}/etapas`);
        if (res.ok) {
          const etapas = await res.json();
          const etapaDestino = etapas.find((e: any) => e.nome === etapa);
          if (etapaDestino && Array.isArray(etapaDestino.camposObrigatorios)) {
            setRequiredFields(etapaDestino.camposObrigatorios);
          } else {
            setRequiredFields([]);
          }
        }
      }
    }
    if (etapa) {
      fetchRequiredFieldsForNewStage();
    }
  }, [etapa, candidate]);

  const handleSubmit = () => {
    if (!etapa) {
      setError("Por favor, selecione uma etapa");
      return;
    }
    setError(null);
    onMove(etapa, comentarios, nota ? parseFloat(nota) : undefined);
  };

  const handleClose = () => {
    setEtapa("");
    setComentarios("");
    setNota("");
    setError(null);
    onClose();
  };

  if (!candidate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mover: {candidate.candidato.nome}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && <div className="text-red-600 text-sm font-medium">{error}</div>}
          <div>
            <Label htmlFor="etapa">Nova Etapa</Label>
            <Select value={etapa} onValueChange={setEtapa}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a nova etapa" />
              </SelectTrigger>
              <SelectContent>
                {etapas.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.nome || stage.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="nota">
              Nota (0-10)
              {requiredFields.includes("score") && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id="nota"
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Nota opcional"
              required={requiredFields.includes("score")}
            />
          </div>

          <div>
            <Label htmlFor="comentarios">
              Comentários
              {requiredFields.includes("observacao") && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id="comentarios"
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              placeholder="Observações sobre a movimentação..."
              rows={3}
              required={requiredFields.includes("observacao")}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!etapa}>Mover</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PipelinePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedVaga, setSelectedVaga] = useState<string>("");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateWithDetails | null>(null);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [addCandidateModalOpen, setAddCandidateModalOpen] = useState(false);
  const [moveModalError, setMoveModalError] = useState<string | null>(null);
  // Novo estado para armazenar etapa de destino do drag and drop
  const [dragTargetStage, setDragTargetStage] = useState<string | null>(null);
  // Novo estado para armazenar etapas detalhadas (com responsáveis)
  const [etapasDetalhadas, setEtapasDetalhadas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [reloadEtapas, setReloadEtapas] = useState(0);

  // Buscar etapas detalhadas e usuários ao selecionar vaga
  useEffect(() => {
    if (selectedVaga) {
      console.log('Buscando etapas para vaga:', selectedVaga);
      fetch(`/api/vagas/${selectedVaga}/etapas`)
        .then(r => r.json())
        .then(data => {
          console.log('API etapas retornou:', data);
          console.log('Número de etapas:', data.length);
          setEtapasDetalhadas(data);
        })
        .catch(error => {
          console.error('Erro ao buscar etapas:', error);
        });
      if (user?.empresaId) {
        fetch(`/api/usuarios?empresaId=${user.empresaId}`)
          .then(r => r.json())
          .then(setUsuarios);
      }
    }
  }, [selectedVaga, user?.empresaId, reloadEtapas]);

  // Função utilitária para pegar responsáveis da etapa
  const getResponsaveis = (etapa: any) =>
    (etapa.responsaveis || [])
      .map((id: string) => usuarios.find((u: any) => u.id === id))
      .filter(Boolean);

  // Fetch available jobs
  const { data: vagas, isLoading: vagasLoading } = useQuery({
    queryKey: ["/api/vagas"],
    enabled: !!user,
  });

  // Fetch available candidates
  const { data: candidatos } = useQuery<any[]>({
    queryKey: ["/api/candidatos"],
    enabled: !!user,
  });

  // Fetch pipeline data for selected job
  const { data: pipeline, isLoading: pipelineLoading, error: pipelineError } = useQuery<any>({
    queryKey: [`/api/vagas/${selectedVaga}/pipeline`],
    enabled: !!selectedVaga,
  });

  // Move candidate mutation
  const moveCandidateMutation = useMutation({
    mutationFn: async ({ vagaId, candidatoId, etapa, comentarios, nota }: {
      vagaId: string;
      candidatoId: string;
      etapa: string;
      comentarios: string;
      nota?: number;
    }) => {
      const response = await fetch(`/api/vagas/${vagaId}/candidatos/${candidatoId}/mover`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etapa, comentarios, nota }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao mover candidato');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Candidato movido com sucesso!" });
      queryClient.invalidateQueries({ queryKey: [`/api/vagas/${selectedVaga}/pipeline`] });
      setMoveModalOpen(false);
      setSelectedCandidate(null);
    },
    onError: (error: any) => {
      setMoveModalError(error.message);
      toast({
        title: "Erro ao mover candidato",
        description: error.message,
        variant: error.message?.toLowerCase().includes('permissão') ? "destructive" : "default"
      });
    },
  });

  // Add candidate to job mutation
  const addCandidateMutation = useMutation({
    mutationFn: async ({ vagaId, candidatoId, etapa, comentarios }: {
      vagaId: string;
      candidatoId: string;
      etapa: string;
      comentarios?: string;
    }) => {
      const response = await fetch(`/api/vagas/${vagaId}/candidatos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidatoId, etapa, comentarios }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao adicionar candidato');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vagas/${selectedVaga}/pipeline`] });
      setAddCandidateModalOpen(false);
      toast({
        title: "Candidato adicionado à vaga com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar candidato",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove candidate from job mutation
  const removeCandidateMutation = useMutation({
    mutationFn: async ({ vagaId, candidatoId }: {
      vagaId: string;
      candidatoId: string;
    }) => {
      const response = await fetch(`/api/vagas/${vagaId}/candidatos/${candidatoId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao remover candidato');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Candidato removido da vaga com sucesso!" });
      queryClient.invalidateQueries({ queryKey: [`/api/vagas/${selectedVaga}/pipeline`] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erro ao remover candidato", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleMoveCandidate = (candidate: CandidateWithDetails) => {
    setSelectedCandidate(candidate);
    setMoveModalOpen(true);
  };

  // Função chamada ao finalizar o drag and drop
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const sourceStage = result.source.droppableId;
    const destStage = result.destination.droppableId;
    if (sourceStage === destStage) return;
    const candidateId = result.draggableId;
    // Encontrar o candidato arrastado
    const candidate = pipeline?.[sourceStage]?.find((c: any) => c.id === candidateId);
    if (candidate) {
      setSelectedCandidate(candidate);
      setDragTargetStage(destStage);
      setMoveModalOpen(true);
    }
  };

  // Modificar handleMove para usar dragTargetStage se existir
  const handleMove = (etapa: string, comentarios: string, nota?: number) => {
    let etapaFinal: string = etapa;
    if (dragTargetStage !== null && dragTargetStage !== undefined && typeof dragTargetStage === 'string') {
      etapaFinal = dragTargetStage;
    }
    if (!selectedCandidate || !etapaFinal) return;
    moveCandidateMutation.mutate({
      vagaId: selectedCandidate.vagaId,
      candidatoId: selectedCandidate.candidatoId,
      etapa: etapaFinal,
      comentarios: comentarios || "",
      nota,
    });
    setDragTargetStage(null);
  };

  const handleRemoveCandidate = (candidate: CandidateWithDetails) => {
    if (confirm(`Tem certeza que deseja remover ${candidate.candidato.nome} desta vaga?`)) {
      removeCandidateMutation.mutate({
        vagaId: candidate.vagaId,
        candidatoId: candidate.candidatoId,
      });
    }
  };

  // Ao adicionar candidato à vaga, usar o id da primeira etapa personalizada
  const handleAddCandidate = (formData: FormData) => {
    const candidatoId = formData.get('candidatoId') as string;
    const comentarios = formData.get('comentarios') as string;
    if (candidatoId && selectedVaga && etapasDetalhadas.length > 0) {
      addCandidateMutation.mutate({
        vagaId: selectedVaga,
        candidatoId,
        etapa: etapasDetalhadas[0].id, // Usar o id da primeira etapa personalizada
        comentarios: comentarios || undefined,
      } as any); // Forçar tipagem para evitar erro do TypeScript
    }
  };

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Users className="h-8 w-8" />
                Pipeline de Candidatos
              </h1>
              <p className="text-gray-600 mt-2">
                Visualize e gerencie candidatos através das etapas do processo seletivo
              </p>
        </div>
      </div>

      {/* Job selector */}
      <div className="mb-6">
        <Label htmlFor="vaga-select">Selecionar Vaga</Label>
        <div className="flex gap-4 items-end">
          <Select {...(typeof selectedVaga === 'string' ? { value: selectedVaga } : {})} onValueChange={setSelectedVaga}>
                <SelectTrigger className="w-[400px]">
                  <SelectValue placeholder="Escolha uma vaga para visualizar o pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(vagas) && vagas.map((vaga: any) => (
                    <SelectItem key={vaga.id} value={vaga.id}>
                      {vaga.titulo} ({vaga.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedVaga && (
                <>
                  <Button 
                    onClick={() => setAddCandidateModalOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Candidato
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => window.open(`/api/vagas/${selectedVaga}/pipeline/export`, '_blank')}
                  >
                    Exportar Pipeline (XLSX)
                  </Button>
                  {/* Botão de engrenagem para configurar etapas do pipeline */}
                  {["admin", "recrutador"].includes(user?.perfil || "") && (
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2"
                      title="Configurar etapas do pipeline"
                      onClick={() => setConfigModalOpen(true)}
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  )}
                </>
              )}
        </div>
      </div>

      {/* Pipeline */}
      {selectedVaga && (
        <TooltipProvider>
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {(() => {
                console.log('Renderizando pipeline com etapas:', etapasDetalhadas);
                console.log('Pipeline data:', pipeline);
                return etapasDetalhadas.length > 0 ? etapasDetalhadas.map((stage) => {
                  const stageCandidates = (pipeline && typeof pipeline === 'object' && !Array.isArray(pipeline) && pipeline[stage.id]) ? pipeline[stage.id] : [];
                  console.log(`Etapa ${stage.nome} (${stage.id}) tem ${stageCandidates.length} candidatos`);
                  return (
                    <Droppable droppableId={stage.id} key={stage.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`space-y-4 ${snapshot.isDraggingOver ? 'bg-orange-50' : ''}`}
                        >
                          <div style={{ background: stage.cor, color: '#fff', borderRadius: '12px 12px 0 0', padding: '12px', textAlign: 'center' }}>
                            <h3 className="font-semibold flex items-center justify-center gap-2">
                              {stage.nome}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="ml-1 cursor-pointer align-middle inline-flex"><HelpCircle className="w-4 h-4" /></span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs text-left">
                                  {stage.descricao || PIPELINE_STAGE_DESCRIPTIONS[stage.id] || "Etapa do pipeline."}
                                </TooltipContent>
                              </Tooltip>
                            </h3>
                            {/* Exibir responsáveis */}
                            {getResponsaveis(stage).length > 0 && (
                              <div className="flex flex-wrap justify-center gap-1 mt-1">
                                {getResponsaveis(stage).map((resp: any) => (
                                  <span key={resp.id} className="text-xs bg-gray-100 rounded px-2 py-0.5" title={resp.email} style={{ color: '#222' }}>
                                    {resp.nome.split(' ')[0]}
                                  </span>
                                ))}
                              </div>
                            )}
                            <Badge variant="secondary" className="mt-1 bg-white/20 text-white">
                              {stageCandidates.length}
                            </Badge>
                          </div>
                          <div className="space-y-3 min-h-[400px]">
                            {pipelineLoading ? (
                              <div className="text-center text-gray-500 py-8">
                                Carregando...
                              </div>
                            ) : Array.isArray(stageCandidates) && stageCandidates.length > 0 ? (
                              stageCandidates.map((candidate: CandidateWithDetails, idx: number) => (
                                <Draggable draggableId={candidate.id} index={idx} key={candidate.id}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={snapshot.isDragging ? 'opacity-70' : ''}
                                    >
                                      <CandidateCard
                                        candidate={candidate}
                                        onMoveCandidate={handleMoveCandidate}
                                        onRemoveCandidate={handleRemoveCandidate}
                                      />
                                    </div>
                                  )}
                                </Draggable>
                              ))
                            ) : (
                              <div className="text-center text-gray-500 py-8">
                                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Nenhum candidato</p>
                              </div>
                            )}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  );
                }) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500">Nenhuma etapa configurada para esta vaga</p>
                  </div>
                );
              })()}
            </div>
          </DragDropContext>
        </TooltipProvider>
      )}

      {!selectedVaga && (
            <div className="text-center py-16">
              <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecione uma vaga
              </h3>
              <p className="text-gray-600">
                Escolha uma vaga acima para visualizar o pipeline de candidatos
              </p>
        </div>
      )}

      {/* Move Modal */}
      <MoveModal
        candidate={selectedCandidate}
        isOpen={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        onMove={handleMove}
        errorMessage={moveModalError}
        etapas={etapasDetalhadas} // <-- Passe as etapas personalizadas
      />

      {/* Add Candidate Modal */}
      <Dialog open={addCandidateModalOpen} onOpenChange={setAddCandidateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Candidato à Vaga</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleAddCandidate(new FormData(e.target as HTMLFormElement));
          }} className="space-y-4">
            <div>
              <Label htmlFor="candidato">Candidato</Label>
              {(() => {
                if (!Array.isArray(candidatos)) return null;
                
                const availableCandidatos = candidatos.filter((candidato: any) => {
                  // Filter out candidates already in this job
                  if (!pipeline || typeof pipeline !== 'object') return true;
                  
                  const existingIds = Object.values(pipeline).flat().map((c: any) => c.candidato?.id);
                  return !existingIds.includes(candidato.id);
                });

                if (availableCandidatos.length === 0) {
                  return (
                    <div className="p-3 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                      Todos os candidatos já estão inscritos nesta vaga
                    </div>
                  );
                }

                return (
                  <Select name="candidatoId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um candidato..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCandidatos.map((candidato: any) => (
                        <SelectItem key={candidato.id} value={candidato.id}>
                          {candidato.nome} - {candidato.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              })()}
            </div>
            
            <div>
              <Label htmlFor="comentarios">Comentários (opcional)</Label>
              <Textarea
                name="comentarios"
                placeholder="Adicione observações sobre a candidatura..."
                className="resize-none"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddCandidateModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={addCandidateMutation.isPending || (() => {
                  if (!Array.isArray(candidatos)) return true;
                  const availableCandidatos = candidatos.filter((candidato: any) => {
                    if (!pipeline || typeof pipeline !== 'object') return true;
                    const existingIds = Object.values(pipeline).flat().map((c: any) => c.candidato?.id);
                    return !existingIds.includes(candidato.id);
                  });
                  return availableCandidatos.length === 0;
                })()}
              >
                {addCandidateMutation.isPending ? "Adicionando..." : "Adicionar"}
              </Button>
            </div>
        </form>
      </DialogContent>
    </Dialog>

      {/* Modal de configuração de etapas do pipeline */}
      {selectedVaga && configModalOpen && (
        <PipelineEtapasConfig
          vagaId={selectedVaga}
          open={configModalOpen}
          onClose={() => {
            console.log('Fechando modal, forçando reload das etapas');
            setConfigModalOpen(false);
            setReloadEtapas(re => re + 1);
          }}
        />
      )}
    </div>
  );
}