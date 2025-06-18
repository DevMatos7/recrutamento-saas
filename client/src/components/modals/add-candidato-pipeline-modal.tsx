import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AddCandidatoPipelineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vagaId: string;
}

export default function AddCandidatoPipelineModal({ open, onOpenChange, vagaId }: AddCandidatoPipelineModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [candidatoId, setCandidatoId] = useState("");
  const [comentarios, setComentarios] = useState("");

  const { data: candidatos } = useQuery({
    queryKey: ["/api/candidatos"],
  });

  const addCandidatoMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/vagas/${vagaId}/candidatos`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Candidato adicionado ao pipeline com sucesso!" });
      queryClient.invalidateQueries({ queryKey: [`/api/vagas/${vagaId}/candidatos`] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao adicionar candidato", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setCandidatoId("");
    setComentarios("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidatoId) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione um candidato",
        variant: "destructive"
      });
      return;
    }

    addCandidatoMutation.mutate({
      candidatoId,
      etapa: "recebido",
      comentarios
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Candidato ao Pipeline</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="candidato">Candidato *</Label>
            <Select value={candidatoId} onValueChange={setCandidatoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o candidato" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(candidatos) && candidatos.map((candidato: any) => (
                  <SelectItem key={candidato.id} value={candidato.id}>
                    {candidato.nome} - {candidato.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="comentarios">Comentários</Label>
            <Textarea
              id="comentarios"
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              placeholder="Observações sobre a adição do candidato..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={addCandidatoMutation.isPending}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {addCandidatoMutation.isPending ? "Adicionando..." : "Adicionar ao Pipeline"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}