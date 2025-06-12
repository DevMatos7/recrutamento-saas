import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  UserCheck, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Star,
  Clock,
  Mail,
  Phone,
  Linkedin,
  FileText,
  ArrowRight,
  Plus
} from "lucide-react";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

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

const pipelineStages: PipelineStage[] = [
  {
    id: "recebido",
    name: "Recebidos",
    color: "bg-blue-100 border-blue-300 text-blue-800",
    icon: Users,
    description: "Novos candidatos recebidos"
  },
  {
    id: "triagem",
    name: "Em Triagem",
    color: "bg-yellow-100 border-yellow-300 text-yellow-800",
    icon: UserCheck,
    description: "Análise de currículos"
  },
  {
    id: "entrevista",
    name: "Entrevista",
    color: "bg-purple-100 border-purple-300 text-purple-800",
    icon: Calendar,
    description: "Entrevistas agendadas"
  },
  {
    id: "avaliacao",
    name: "Avaliação",
    color: "bg-orange-100 border-orange-300 text-orange-800",
    icon: Star,
    description: "Avaliação final"
  },
  {
    id: "aprovado",
    name: "Aprovado",
    color: "bg-green-100 border-green-300 text-green-800",
    icon: CheckCircle,
    description: "Candidatos aprovados"
  },
  {
    id: "reprovado",
    name: "Reprovado",
    color: "bg-red-100 border-red-300 text-red-800",
    icon: XCircle,
    description: "Candidatos reprovados"
  }
];

function CandidateCard({ 
  candidate, 
  onViewDetails 
}: { 
  candidate: CandidateWithDetails; 
  onViewDetails: (candidate: CandidateWithDetails) => void;
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getNotaColor = (nota: string | null) => {
    if (!nota) return "";
    const value = parseFloat(nota);
    if (value >= 8) return "text-green-600";
    if (value >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card className="mb-3 cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-sm truncate">{candidate.candidato.nome}</h4>
          {candidate.nota && (
            <Badge variant="outline" className={getNotaColor(candidate.nota)}>
              {candidate.nota}
            </Badge>
          )}
        </div>
        
        <div className="space-y-1 text-xs text-gray-600">
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
            <span>Movido em {formatDate(candidate.dataMovimentacao)}</span>
          </div>
        </div>

        <div className="flex justify-between items-center mt-3">
          <div className="flex gap-1">
            {candidate.candidato.linkedin && (
              <LinkedIn className="h-4 w-4 text-blue-600" />
            )}
            {candidate.candidato.curriculoUrl && (
              <FileText className="h-4 w-4 text-gray-600" />
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(candidate);
            }}
          >
            Ver detalhes
          </Button>
        </div>

        {candidate.comentarios && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
            <MessageSquare className="h-3 w-3 inline mr-1" />
            {candidate.comentarios}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CandidateDetailsModal({ 
  candidate, 
  isOpen, 
  onClose 
}: { 
  candidate: CandidateWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!candidate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Candidato</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Nome</Label>
              <p className="text-sm">{candidate.candidato.nome}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <p className="text-sm">{candidate.candidato.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Telefone</Label>
              <p className="text-sm">{candidate.candidato.telefone}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Badge variant="outline">{candidate.candidato.status}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Data de Inscrição</Label>
              <p className="text-sm">{new Date(candidate.dataInscricao).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Última Movimentação</Label>
              <p className="text-sm">{new Date(candidate.dataMovimentacao).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          {candidate.nota && (
            <div>
              <Label className="text-sm font-medium">Nota</Label>
              <p className="text-sm">{candidate.nota}/10</p>
            </div>
          )}

          {candidate.comentarios && (
            <div>
              <Label className="text-sm font-medium">Comentários</Label>
              <p className="text-sm bg-gray-50 p-3 rounded">{candidate.comentarios}</p>
            </div>
          )}

          <div className="flex gap-2">
            {candidate.candidato.linkedin && (
              <Button variant="outline" size="sm" asChild>
                <a href={candidate.candidato.linkedin} target="_blank" rel="noopener noreferrer">
                  <LinkedIn className="h-4 w-4 mr-2" />
                  LinkedIn
                </a>
              </Button>
            )}
            {candidate.candidato.curriculoUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={candidate.candidato.curriculoUrl} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4 mr-2" />
                  Currículo
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MoveModal({ 
  candidate, 
  isOpen, 
  onClose, 
  onMove 
}: { 
  candidate: CandidateWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onMove: (etapa: string, comentarios: string, nota?: number) => void;
}) {
  const [etapa, setEtapa] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [nota, setNota] = useState("");

  useEffect(() => {
    if (candidate) {
      setEtapa(candidate.etapa);
      setComentarios(candidate.comentarios || "");
      setNota(candidate.nota || "");
    }
  }, [candidate]);

  const handleSubmit = () => {
    onMove(etapa, comentarios, nota ? parseFloat(nota) : undefined);
    onClose();
  };

  if (!candidate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mover Candidato: {candidate.candidato.nome}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="etapa">Nova Etapa</Label>
            <Select value={etapa} onValueChange={setEtapa}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a etapa" />
              </SelectTrigger>
              <SelectContent>
                {pipelineStages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="nota">Nota (0-10)</Label>
            <Input
              id="nota"
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Nota opcional"
            />
          </div>

          <div>
            <Label htmlFor="comentarios">Comentários</Label>
            <Textarea
              id="comentarios"
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              placeholder="Observações sobre a movimentação..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSubmit}>Mover Candidato</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PipelineColumn({ 
  stage, 
  candidates, 
  onViewDetails,
  onMoveCandidate 
}: { 
  stage: PipelineStage;
  candidates: CandidateWithDetails[];
  onViewDetails: (candidate: CandidateWithDetails) => void;
  onMoveCandidate: (candidate: CandidateWithDetails) => void;
}) {
  const StageIcon = stage.icon;

  return (
    <div className="bg-gray-50 rounded-lg p-4 min-h-[600px] w-80">
      <div className="flex items-center gap-2 mb-4">
        <StageIcon className="h-5 w-5" />
        <h3 className="font-semibold">{stage.name}</h3>
        <Badge variant="secondary">{candidates.length}</Badge>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">{stage.description}</p>

      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[400px] ${
              snapshot.isDraggingOver ? "bg-blue-50 border-2 border-dashed border-blue-300" : ""
            }`}
          >
            {candidates.map((candidate, index) => (
              <Draggable
                key={candidate.id}
                draggableId={candidate.id}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={snapshot.isDragging ? "opacity-50" : ""}
                    onClick={() => onMoveCandidate(candidate)}
                  >
                    <CandidateCard
                      candidate={candidate}
                      onViewDetails={onViewDetails}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default function PipelineKanbanPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedVaga, setSelectedVaga] = useState<string>("");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateWithDetails | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);

  // Fetch available jobs
  const { data: vagas, isLoading: vagasLoading } = useQuery({
    queryKey: ["/api/vagas"],
    enabled: !!user,
  });

  // Fetch pipeline data for selected job
  const { data: pipeline, isLoading: pipelineLoading } = useQuery({
    queryKey: ["/api/vagas", selectedVaga, "pipeline"],
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
      return apiRequest(`/api/vagas/${vagaId}/candidatos/${candidatoId}/mover`, {
        method: "PATCH",
        body: { etapa, comentarios, nota },
      });
    },
    onSuccess: () => {
      toast({ title: "Candidato movido com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/vagas", selectedVaga, "pipeline"] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erro ao mover candidato", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleDragEnd = (result: any) => {
    if (!result.destination || !selectedCandidate) return;
    
    const newEtapa = result.destination.droppableId;
    if (newEtapa === selectedCandidate.etapa) return;

    moveCandidateMutation.mutate({
      vagaId: selectedCandidate.vagaId,
      candidatoId: selectedCandidate.candidatoId,
      etapa: newEtapa,
      comentarios: `Movido via drag & drop para ${newEtapa}`,
    });
  };

  const handleViewDetails = (candidate: CandidateWithDetails) => {
    setSelectedCandidate(candidate);
    setDetailsModalOpen(true);
  };

  const handleMoveCandidate = (candidate: CandidateWithDetails) => {
    setSelectedCandidate(candidate);
    setMoveModalOpen(true);
  };

  const handleMove = (etapa: string, comentarios: string, nota?: number) => {
    if (!selectedCandidate) return;

    moveCandidateMutation.mutate({
      vagaId: selectedCandidate.vagaId,
      candidatoId: selectedCandidate.candidatoId,
      etapa,
      comentarios,
      nota,
    });
  };

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Users className="h-8 w-8" />
                Pipeline de Seleção
              </h1>
              <p className="text-gray-600 mt-2">
                Gerencie candidatos através das etapas do processo seletivo
              </p>
            </div>
          </div>

          {/* Job selector */}
          <div className="mb-6">
            <Label htmlFor="vaga-select">Selecione a Vaga</Label>
            <Select value={selectedVaga} onValueChange={setSelectedVaga}>
              <SelectTrigger className="w-[400px]">
                <SelectValue placeholder="Escolha uma vaga para visualizar o pipeline" />
              </SelectTrigger>
              <SelectContent>
                {vagas?.map((vaga: any) => (
                  <SelectItem key={vaga.id} value={vaga.id}>
                    {vaga.titulo} - {vaga.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pipeline */}
          {selectedVaga && (
            <div className="overflow-x-auto">
              {pipelineLoading ? (
                <div className="text-center py-8">Carregando pipeline...</div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <div className="flex gap-6 pb-4">
                    {pipelineStages.map((stage) => (
                      <PipelineColumn
                        key={stage.id}
                        stage={stage}
                        candidates={pipeline?.[stage.id] || []}
                        onViewDetails={handleViewDetails}
                        onMoveCandidate={handleMoveCandidate}
                      />
                    ))}
                  </div>
                </DragDropContext>
              )}
            </div>
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
        </div>
      </div>

      {/* Modals */}
      <CandidateDetailsModal
        candidate={selectedCandidate}
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
      />

      <MoveModal
        candidate={selectedCandidate}
        isOpen={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        onMove={handleMove}
      />
    </div>
  );
}