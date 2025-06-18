import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CreateCandidatoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateCandidatoModal({ open, onOpenChange }: CreateCandidatoModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    endereco: "",
    resumoProfissional: "",
    experienciaProfissional: "",
    habilidades: "",
    idiomas: ""
  });

  const createCandidatoMutation = useMutation({
    mutationFn: async (data: any) => {
      const processedData = {
        ...data,
        habilidades: data.habilidades ? data.habilidades.split(",").map((h: string) => h.trim()) : [],
        idiomas: data.idiomas ? data.idiomas.split(",").map((i: string) => {
          const parts = i.trim().split("-");
          return {
            idioma: parts[0]?.trim() || i.trim(),
            nivel: parts[1]?.trim() || "Básico"
          };
        }) : []
      };
      
      const res = await apiRequest("POST", "/api/candidatos", processedData);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Candidato adicionado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/candidatos"] });
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
    setFormData({
      nome: "",
      email: "",
      telefone: "",
      endereco: "",
      resumoProfissional: "",
      experienciaProfissional: "",
      habilidades: "",
      idiomas: ""
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.email) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome e email",
        variant: "destructive"
      });
      return;
    }
    createCandidatoMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Candidato</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Ex: João Silva Santos"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="joao@email.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                placeholder="São Paulo, SP"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="resumo">Resumo Profissional</Label>
            <Textarea
              id="resumo"
              value={formData.resumoProfissional}
              onChange={(e) => setFormData({...formData, resumoProfissional: e.target.value})}
              placeholder="Breve descrição do perfil profissional..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="experiencia">Experiência Profissional</Label>
            <Textarea
              id="experiencia"
              value={formData.experienciaProfissional}
              onChange={(e) => setFormData({...formData, experienciaProfissional: e.target.value})}
              placeholder="Descreva a experiência profissional relevante..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="habilidades">Habilidades</Label>
            <Input
              id="habilidades"
              value={formData.habilidades}
              onChange={(e) => setFormData({...formData, habilidades: e.target.value})}
              placeholder="React, JavaScript, Node.js, Python (separadas por vírgula)"
            />
            <p className="text-xs text-gray-500 mt-1">Separe as habilidades por vírgula</p>
          </div>

          <div>
            <Label htmlFor="idiomas">Idiomas</Label>
            <Input
              id="idiomas"
              value={formData.idiomas}
              onChange={(e) => setFormData({...formData, idiomas: e.target.value})}
              placeholder="Inglês-Avançado, Espanhol-Intermediário (separados por vírgula)"
            />
            <p className="text-xs text-gray-500 mt-1">Formato: Idioma-Nível, separados por vírgula</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={createCandidatoMutation.isPending}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {createCandidatoMutation.isPending ? "Adicionando..." : "Adicionar Candidato"}
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