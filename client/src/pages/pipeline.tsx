import React, { useState } from "react";
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
import { Users, ArrowRight, Mail, Phone, Star, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";

const PIPELINE_STAGES = [
  { id: "recebido", title: "Recebidos", color: "bg-blue-500 text-white" },
  { id: "triagem", title: "Em Triagem", color: "bg-yellow-500 text-white" },
  { id: "entrevista", title: "Entrevista", color: "bg-purple-500 text-white" },
  { id: "avaliacao", title: "Avaliação", color: "bg-orange-500 text-white" },
  { id: "aprovado", title: "Aprovados", color: "bg-green-500 text-white" },
  { id: "reprovado", title: "Reprovados", color: "bg-red-500 text-white" },
];

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
  onMoveCandidate 
}: { 
  candidate: CandidateWithDetails; 
  onMoveCandidate: (candidate: CandidateWithDetails) => void;
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

        <Button 
          variant="outline" 
          size="sm"
          className="w-full"
          onClick={() => onMoveCandidate(candidate)}
        >
          <ArrowRight className="h-3 w-3 mr-1" />
          Mover Etapa
        </Button>
      </CardContent>
    </Card>
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

  const handleSubmit = () => {
    if (!etapa) return;
    onMove(etapa, comentarios, nota ? parseFloat(nota) : undefined);
    onClose();
    setEtapa("");
    setComentarios("");
    setNota("");
  };

  if (!candidate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mover: {candidate.candidato.nome}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="etapa">Nova Etapa</Label>
            <Select value={etapa} onValueChange={setEtapa}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a nova etapa" />
              </SelectTrigger>
              <SelectContent>
                {PIPELINE_STAGES.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.title}
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
            <Select value={selectedVaga} onValueChange={setSelectedVaga}>
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
          </div>

          {/* Pipeline */}
          {selectedVaga && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {PIPELINE_STAGES.map((stage) => {
                const stageCandidates = pipeline?.[stage.id] || [];
                
                return (
                  <div key={stage.id} className="space-y-4">
                    <div className={`${stage.color} p-3 rounded-lg text-center`}>
                      <h3 className="font-semibold">{stage.title}</h3>
                      <Badge variant="secondary" className="mt-1 bg-white/20 text-white">
                        {stageCandidates.length}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3 min-h-[400px]">
                      {pipelineLoading ? (
                        <div className="text-center text-gray-500 py-8">
                          Carregando...
                        </div>
                      ) : stageCandidates.length > 0 ? (
                        stageCandidates.map((candidate: CandidateWithDetails) => (
                          <CandidateCard
                            key={candidate.id}
                            candidate={candidate}
                            onMoveCandidate={handleMoveCandidate}
                          />
                        ))
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhum candidato</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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

      {/* Move Modal */}
      <MoveModal
        candidate={selectedCandidate}
        isOpen={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        onMove={handleMove}
      />
    </div>
  );
}