import React from "react";
import { useParams } from "wouter";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { MatchingConfig } from "@/components/matching-config";
import { apiRequest } from "@/lib/queryClient";

export default function VagaMatchingConfigPage() {
  const { vagaId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar dados da vaga
  const { data: vaga, isLoading } = useQuery({
    queryKey: ['/api/vagas', vagaId],
    enabled: !!vagaId,
  });

  // Mutation para atualizar configuração
  const updateConfigMutation = useMutation({
    mutationFn: async (config: any) => {
      const response = await apiRequest(`/api/vagas/${vagaId}/matching-config`, {
        method: 'PATCH',
        body: JSON.stringify({ criteriosMatching: config })
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Configuração atualizada",
        description: "Os critérios de matching foram salvos com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vagas', vagaId] });
      navigate(`/vagas/${vagaId}/matches`);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar a configuração.",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  if (!vaga) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Vaga não encontrada</p>
        <Button variant="outline" onClick={() => navigate("/vagas")} className="mt-4">
          Voltar para Vagas
        </Button>
      </div>
    );
  }

  const handleSave = (config: any) => {
    updateConfigMutation.mutate(config);
  };

  // Configuração atual ou padrão
  const currentConfig = vaga.criteriosMatching || {
    competenciasPeso: 40,
    experienciaPeso: 20,
    formacaoPeso: 10,
    localizacaoPeso: 10,
    salarioPeso: 10,
    discPeso: 10,
    scoreMinimo: 70
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate("/vagas")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Configurar Matching</h1>
          <p className="text-muted-foreground">
            Vaga: <span className="font-medium">{vaga.titulo}</span>
          </p>
        </div>
      </div>

      {/* Configuração */}
      <div className="flex justify-center">
        <MatchingConfig
          initialConfig={currentConfig}
          onSave={handleSave}
          isLoading={updateConfigMutation.isPending}
        />
      </div>
    </div>
  );
}