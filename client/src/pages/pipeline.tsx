import React, { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Plus, MoreVertical } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

// Pipeline stages
const PIPELINE_STAGES = [
  { id: "recebidos", title: "Recebidos", color: "bg-blue-500" },
  { id: "em_triagem", title: "Em Triagem", color: "bg-yellow-500" },
  { id: "entrevista_agendada", title: "Entrevista Agendada", color: "bg-purple-500" },
  { id: "em_avaliacao", title: "Em Avaliação", color: "bg-orange-500" },
  { id: "aprovados", title: "Aprovados", color: "bg-green-500" },
  { id: "reprovados", title: "Reprovados", color: "bg-red-500" },
];

// Mock candidate data - in a real app this would come from the API
const mockCandidates = [
  {
    id: "1",
    nome: "Ana Silva",
    email: "ana.silva@email.com",
    telefone: "(11) 99999-9999",
    etapa: "recebidos",
    dataAplicacao: "2024-01-15",
    experiencia: "3 anos",
  },
  {
    id: "2",
    nome: "Carlos Santos",
    email: "carlos.santos@email.com",
    telefone: "(11) 88888-8888",
    etapa: "em_triagem",
    dataAplicacao: "2024-01-14",
    experiencia: "5 anos",
  },
  {
    id: "3",
    nome: "Maria Oliveira",
    email: "maria.oliveira@email.com",
    telefone: "(11) 77777-7777",
    etapa: "entrevista_agendada",
    dataAplicacao: "2024-01-13",
    experiencia: "2 anos",
  },
];

function CandidateCard({ candidate, onMoveCandidate }: { candidate: any; onMoveCandidate: (candidateId: string, newStage: string) => void }) {
  const [isMoving, setIsMoving] = useState(false);

  const handleMove = async (newStage: string) => {
    setIsMoving(true);
    await onMoveCandidate(candidate.id, newStage);
    setIsMoving(false);
  };

  return (
    <Card className="mb-3 cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-sm">{candidate.nome}</h4>
            <p className="text-xs text-gray-600 mt-1">{candidate.email}</p>
            <p className="text-xs text-gray-500">{candidate.telefone}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {candidate.experiencia}
              </Badge>
              <span className="text-xs text-gray-500">{candidate.dataAplicacao}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {candidate.nome.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Quick action buttons */}
        <div className="mt-3 flex gap-1">
          {PIPELINE_STAGES.filter(stage => stage.id !== candidate.etapa).slice(0, 2).map(stage => (
            <Button
              key={stage.id}
              variant="outline"
              size="sm"
              className="text-xs h-6"
              onClick={() => handleMove(stage.id)}
              disabled={isMoving}
            >
              {stage.title}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PipelineColumn({ stage, candidates, onMoveCandidate }: { 
  stage: any; 
  candidates: any[]; 
  onMoveCandidate: (candidateId: string, newStage: string) => void;
}) {
  return (
    <div className="flex-1 min-w-[280px]">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
              <CardTitle className="text-sm font-medium">{stage.title}</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              {candidates.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {candidates.map(candidate => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onMoveCandidate={onMoveCandidate}
              />
            ))}
            
            {candidates.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Nenhum candidato</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PipelinePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [candidates, setCandidates] = useState(mockCandidates);

  // Fetch job details
  const { data: vaga, isLoading } = useQuery({
    queryKey: [`/api/vagas/${id}`],
    enabled: !!id,
  });

  const handleMoveCandidate = async (candidateId: string, newStage: string) => {
    try {
      // Update local state immediately for better UX
      setCandidates(prev => 
        prev.map(candidate => 
          candidate.id === candidateId 
            ? { ...candidate, etapa: newStage }
            : candidate
        )
      );

      // In a real app, this would make an API call to update the candidate
      // await apiRequest("PUT", `/api/candidatos/${candidateId}`, { etapa: newStage });

      toast({
        title: "Candidato movido",
        description: "Candidato movido com sucesso para a nova etapa",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao mover candidato",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Carregando pipeline...</p>
        </div>
      </div>
    );
  }

  if (!vaga) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Vaga não encontrada</p>
          <Link href="/vagas">
            <Button className="mt-4">Voltar para vagas</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/vagas">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{(vaga as any)?.titulo || 'Carregando...'}</h1>
          <p className="text-gray-600">{(vaga as any)?.local || ''} • {(vaga as any)?.tipoContratacao || ''}</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Candidato
        </Button>
      </div>

      {/* Pipeline Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map(stage => {
          const stageCandidates = candidates.filter(candidate => candidate.etapa === stage.id);
          return (
            <PipelineColumn
              key={stage.id}
              stage={stage}
              candidates={stageCandidates}
              onMoveCandidate={handleMoveCandidate}
            />
          );
        })}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{candidates.length}</div>
            <p className="text-sm text-gray-600">Total de Candidatos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {candidates.filter(c => c.etapa === "aprovados").length}
            </div>
            <p className="text-sm text-gray-600">Aprovados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {candidates.filter(c => c.etapa === "em_triagem" || c.etapa === "entrevista_agendada").length}
            </div>
            <p className="text-sm text-gray-600">Em Processo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {candidates.filter(c => c.etapa === "reprovados").length}
            </div>
            <p className="text-sm text-gray-600">Reprovados</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}