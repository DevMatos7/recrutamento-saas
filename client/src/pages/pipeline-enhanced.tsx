import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  UserPlus, 
  ChevronRight, 
  MessageSquare, 
  Star, 
  Clock, 
  CheckCircle2,
  XCircle,
  ArrowRight,
  Mail,
  Phone,
  Linkedin,
  FileText,
  Filter,
  Eye
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Vaga, type Candidato, type VagaCandidato, type Usuario } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "recebido",
    name: "Recebidos",
    color: "bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300",
    icon: UserPlus,
    description: "Candidatos que se candidataram"
  },
  {
    id: "em_triagem",
    name: "Triagem",
    color: "bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-300",
    icon: Filter,
    description: "Em análise inicial"
  },
  {
    id: "entrevista_agendada",
    name: "Entrevista",
    color: "bg-yellow-100 border-yellow-300 text-yellow-700 dark:bg-yellow-900 dark:border-yellow-600 dark:text-yellow-300",
    icon: Clock,
    description: "Entrevista agendada"
  },
  {
    id: "avaliacao",
    name: "Avaliação",
    color: "bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900 dark:border-purple-600 dark:text-purple-300",
    icon: Star,
    description: "Em avaliação final"
  },
  {
    id: "aprovado",
    name: "Aprovado",
    color: "bg-green-100 border-green-300 text-green-700 dark:bg-green-900 dark:border-green-600 dark:text-green-300",
    icon: CheckCircle2,
    description: "Candidato aprovado"
  },
  {
    id: "reprovado",
    name: "Reprovado",
    color: "bg-red-100 border-red-300 text-red-700 dark:bg-red-900 dark:border-red-600 dark:text-red-300",
    icon: XCircle,
    description: "Candidato reprovado"
  }
];

interface CandidateWithDetails extends VagaCandidato {
  candidato: Candidato;
}

// Candidate Card Component
function CandidateCard({ 
  candidate, 
  onMoveCandidate, 
  onViewDetails 
}: { 
  candidate: CandidateWithDetails; 
  onMoveCandidate: (candidateId: string, newStage: string, note?: string) => void;
  onViewDetails: (candidate: CandidateWithDetails) => void;
}) {
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [selectedStage, setSelectedStage] = useState("");
  const [note, setNote] = useState("");

  const handleMove = () => {
    if (selectedStage && selectedStage !== candidate.etapa) {
      onMoveCandidate(candidate.candidatoId, selectedStage, note);
      setShowMoveDialog(false);
      setNote("");
      setSelectedStage("");
    }
  };

  const availableStages = PIPELINE_STAGES.filter(stage => stage.id !== candidate.etapa);

  return (
    <>
      <Card className="mb-3 cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
              {candidate.candidato.nome}
            </h4>
            <Badge variant="outline" className="text-xs">
              {format(new Date(candidate.dataMovimentacao), "dd/MM", { locale: ptBR })}
            </Badge>
          </div>
          
          <div className="space-y-1 mb-3">
            {candidate.candidato.email && (
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <Mail className="w-3 h-3 mr-1" />
                {candidate.candidato.email}
              </div>
            )}
            {candidate.candidato.telefone && (
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <Phone className="w-3 h-3 mr-1" />
                {candidate.candidato.telefone}
              </div>
            )}
            {candidate.candidato.linkedin && (
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <Linkedin className="w-3 h-3 mr-1" />
                LinkedIn
              </div>
            )}
          </div>

          {candidate.nota && (
            <div className="mb-3">
              <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                {candidate.nota}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewDetails(candidate)}
              className="text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              Detalhes
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMoveDialog(true)}
              className="text-xs"
            >
              <ArrowRight className="w-3 h-3 mr-1" />
              Mover
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover Candidato</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Candidato: {candidate.candidato.nome}</Label>
            </div>
            
            <div>
              <Label htmlFor="stage">Nova Etapa</Label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a nova etapa..." />
                </SelectTrigger>
                <SelectContent>
                  {availableStages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name} - {stage.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="note">Observações (opcional)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Adicione comentários sobre esta movimentação..."
                className="min-h-[80px]"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleMove} disabled={!selectedStage}>
                Mover Candidato
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Candidate Details Modal
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
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Informações Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <p className="text-sm font-medium">{candidate.candidato.nome}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-sm">{candidate.candidato.email}</p>
              </div>
              <div>
                <Label>Telefone</Label>
                <p className="text-sm">{candidate.candidato.telefone}</p>
              </div>
              <div>
                <Label>Status</Label>
                <Badge className="mt-1">{candidate.candidato.status}</Badge>
              </div>
            </div>
          </div>

          {/* Professional Info */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Informações Profissionais</h3>
            <div className="space-y-3">
              {candidate.candidato.linkedin && (
                <div>
                  <Label>LinkedIn</Label>
                  <a 
                    href={candidate.candidato.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline block"
                  >
                    {candidate.candidato.linkedin}
                  </a>
                </div>
              )}
              
              {candidate.candidato.curriculoUrl && (
                <div>
                  <Label>Currículo</Label>
                  <a 
                    href={candidate.candidato.curriculoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Visualizar Currículo
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Pipeline Info */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Processo Seletivo</h3>
            <div className="space-y-3">
              <div>
                <Label>Etapa Atual</Label>
                <div className="mt-1">
                  {(() => {
                    const stage = PIPELINE_STAGES.find(s => s.id === candidate.etapa);
                    const Icon = stage?.icon || Users;
                    return (
                      <div className={`inline-flex items-center px-3 py-1 rounded-full border ${stage?.color}`}>
                        <Icon className="w-4 h-4 mr-2" />
                        {stage?.name}
                      </div>
                    );
                  })()}
                </div>
              </div>
              
              <div>
                <Label>Data de Movimentação</Label>
                <p className="text-sm">
                  {format(new Date(candidate.dataMovimentacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              {candidate.nota && (
                <div>
                  <Label>Observações</Label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <p className="text-sm">{candidate.nota}</p>
                  </div>
                </div>
              )}

              {candidate.comentarios && (
                <div>
                  <Label>Comentários</Label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <p className="text-sm">{candidate.comentarios}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline could be added here in the future */}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Pipeline Column Component
function PipelineColumn({ 
  stage, 
  candidates, 
  onMoveCandidate,
  onViewDetails
}: { 
  stage: PipelineStage;
  candidates: CandidateWithDetails[];
  onMoveCandidate: (candidateId: string, newStage: string, note?: string) => void;
  onViewDetails: (candidate: CandidateWithDetails) => void;
}) {
  const Icon = stage.icon;

  return (
    <div className="flex-1 min-w-80">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className={`flex items-center justify-between p-3 rounded-lg border ${stage.color}`}>
            <div className="flex items-center">
              <Icon className="w-5 h-5 mr-2" />
              <div>
                <CardTitle className="text-sm font-medium">{stage.name}</CardTitle>
                <p className="text-xs opacity-75">{stage.description}</p>
              </div>
            </div>
            <Badge variant="secondary" className="ml-2">
              {candidates.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="max-h-96 overflow-y-auto">
          {candidates.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum candidato</p>
            </div>
          ) : (
            candidates.map((candidate) => (
              <CandidateCard
                key={`${candidate.vagaId}-${candidate.candidatoId}`}
                candidate={candidate}
                onMoveCandidate={onMoveCandidate}
                onViewDetails={onViewDetails}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Main Pipeline Component
export default function PipelineEnhancedPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedVaga, setSelectedVaga] = useState<string>("");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateWithDetails | null>(null);
  const [showCandidateDetails, setShowCandidateDetails] = useState(false);

  const { data: vagas = [] } = useQuery<Vaga[]>({ queryKey: ["/api/vagas"] });
  const { data: candidatos = [] } = useQuery<Candidato[]>({ queryKey: ["/api/candidatos"] });
  
  const { data: vagaCandidatos = [], isLoading } = useQuery<VagaCandidato[]>({
    queryKey: ["/api/vaga-candidatos", selectedVaga],
    enabled: !!selectedVaga,
    queryFn: () => apiRequest("GET", `/api/vagas/${selectedVaga}/candidatos`).then(res => res.json()),
  });

  const moveCandidateMutation = useMutation({
    mutationFn: async ({ candidateId, newStage, note }: { candidateId: string; newStage: string; note?: string }) => {
      const res = await apiRequest("PATCH", `/api/vagas/${selectedVaga}/candidatos/${candidateId}/move`, {
        etapa: newStage,
        comentarios: note
      });
      if (!res.ok) throw new Error("Erro ao mover candidato");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vaga-candidatos", selectedVaga] });
      toast({
        title: "Sucesso",
        description: "Candidato movido com sucesso!",
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

  // Combine candidates with their details
  const candidatesWithDetails: CandidateWithDetails[] = vagaCandidatos.map(vc => ({
    ...vc,
    candidato: candidatos.find(c => c.id === vc.candidatoId) || {} as Candidato
  })).filter(c => c.candidato.id); // Filter out candidates without details

  // Group candidates by pipeline stage
  const candidatesByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.id] = candidatesWithDetails.filter(c => c.etapa === stage.id);
    return acc;
  }, {} as Record<string, CandidateWithDetails[]>);

  const handleMoveCandidate = (candidateId: string, newStage: string, note?: string) => {
    moveCandidateMutation.mutate({ candidateId, newStage, note });
  };

  const handleViewDetails = (candidate: CandidateWithDetails) => {
    setSelectedCandidate(candidate);
    setShowCandidateDetails(true);
  };

  const selectedVagaData = vagas.find(v => v.id === selectedVaga);

  // Filter vagas based on user permissions
  const filteredVagas = vagas.filter(vaga => {
    if (user?.perfil === "admin") return true;
    if (user?.perfil === "recrutador") return vaga.empresaId === user.empresaId;
    if (user?.perfil === "gestor") return vaga.gestorId === user.id;
    return false;
  });

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Pipeline de Candidatos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie os candidatos nas diferentes etapas do processo seletivo
            </p>
          </div>

          {/* Job Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Selecionar Vaga</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Select value={selectedVaga} onValueChange={setSelectedVaga}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma vaga para visualizar o pipeline..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredVagas.map((vaga) => (
                        <SelectItem key={vaga.id} value={vaga.id}>
                          {vaga.titulo} - {vaga.local}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedVagaData && (
                  <div className="flex items-center space-x-2">
                    <Badge className={
                      selectedVagaData.status === "aberta" ? "bg-green-100 text-green-800" :
                      selectedVagaData.status === "em_triagem" ? "bg-blue-100 text-blue-800" :
                      selectedVagaData.status === "entrevistas" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }>
                      {selectedVagaData.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                )}
              </div>

              {selectedVagaData && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {selectedVagaData.titulo}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {selectedVagaData.descricao}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>📍 {selectedVagaData.local}</span>
                    <span>💼 {selectedVagaData.tipoContratacao}</span>
                    {selectedVagaData.salario && <span>💰 {selectedVagaData.salario}</span>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pipeline View */}
          {selectedVaga ? (
            <div className="space-y-4">
              {/* Summary Stats */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {PIPELINE_STAGES.map((stage) => {
                      const count = candidatesByStage[stage.id]?.length || 0;
                      return (
                        <div key={stage.id} className="text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {count}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {stage.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Pipeline Columns */}
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 dark:text-gray-400">Carregando pipeline...</p>
                  </div>
                </div>
              ) : (
                <div className="flex space-x-4 overflow-x-auto pb-4">
                  {PIPELINE_STAGES.map((stage) => (
                    <PipelineColumn
                      key={stage.id}
                      stage={stage}
                      candidates={candidatesByStage[stage.id] || []}
                      onMoveCandidate={handleMoveCandidate}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Selecione uma vaga
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Escolha uma vaga acima para visualizar o pipeline de candidatos
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <CandidateDetailsModal
        candidate={selectedCandidate}
        isOpen={showCandidateDetails}
        onClose={() => setShowCandidateDetails(false)}
      />
    </div>
  );
}