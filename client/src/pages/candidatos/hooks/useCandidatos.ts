import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CandidatoService, type CandidatoFilters } from '../services/candidatoService';
import { useToast } from '@/hooks/use-toast';

export const useCandidatos = (filters?: CandidatoFilters) => {
  return useQuery({
    queryKey: ['candidatos', filters],
    queryFn: () => CandidatoService.getCandidatos(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (anteriormente cacheTime)
    refetchOnWindowFocus: false,
  });
};

export const useCandidato = (id: string) => {
  return useQuery({
    queryKey: ['candidato', id],
    queryFn: () => CandidatoService.getCandidato(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

export const useCandidatoHistorico = (id: string) => {
  return useQuery({
    queryKey: ['candidato-historico', id],
    queryFn: () => CandidatoService.getCandidatoHistorico(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

export const useCandidatoTestes = (id: string) => {
  return useQuery({
    queryKey: ['candidato-testes', id],
    queryFn: () => CandidatoService.getCandidatoTestes(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useCandidatoEntrevistas = (id: string) => {
  return useQuery({
    queryKey: ['candidato-entrevistas', id],
    queryFn: () => CandidatoService.getCandidatoEntrevistas(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

export const useCreateCandidato = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: CandidatoService.createCandidato,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidatos'] });
      toast({
        title: "Sucesso",
        description: "Candidato criado com sucesso!",
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
};

export const useUpdateCandidato = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      CandidatoService.updateCandidato(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['candidatos'] });
      queryClient.invalidateQueries({ queryKey: ['candidato', id] });
      toast({
        title: "Sucesso",
        description: "Candidato atualizado com sucesso!",
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
};

export const useDeleteCandidato = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: CandidatoService.deleteCandidato,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidatos'] });
      toast({
        title: "Sucesso",
        description: "Candidato excluído com sucesso!",
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
};

export const useUpdateStatusEtico = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, statusEtico, motivo }: { id: string; statusEtico: string; motivo?: string }) =>
      CandidatoService.updateStatusEtico(id, statusEtico, motivo),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['candidatos'] });
      queryClient.invalidateQueries({ queryKey: ['candidato', id] });
      toast({
        title: "Sucesso",
        description: "Status ético atualizado com sucesso!",
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
}; 