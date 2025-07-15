import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PerfilVagaModal({ isOpen, onClose, editingPerfil }: { isOpen: boolean; onClose: () => void; editingPerfil?: any | null }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<{
    nomePerfil: string;
    tituloVaga: string;
    descricaoFuncao: string;
    requisitosObrigatorios: string;
    requisitosDesejaveis: string;
    competenciasTecnicas: string[];
    competenciasComportamentais: string[];
    beneficios: string;
    tipoContratacao: string;
    faixaSalarial: string;
    empresaId: string;
    departamentoId: string;
    localAtuacao: string;
    modeloTrabalho: string;
    observacoesInternas: string;
  }>({
    nomePerfil: "",
    tituloVaga: "",
    descricaoFuncao: "",
    requisitosObrigatorios: "",
    requisitosDesejaveis: "",
    competenciasTecnicas: [],
    competenciasComportamentais: [],
    beneficios: "",
    tipoContratacao: "CLT",
    faixaSalarial: "",
    empresaId: user?.empresaId || "",
    departamentoId: "",
    localAtuacao: "",
    modeloTrabalho: "",
    observacoesInternas: "",
  });

  const { data: departamentos = [] } = useQuery({ queryKey: ["/api/departamentos"] });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingPerfil && editingPerfil.id ? `/api/perfis-vaga/${editingPerfil.id}` : "/api/perfis-vaga";
      const method = editingPerfil && editingPerfil.id ? "PUT" : "POST";
      const res = await apiRequest(method, url, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/perfis-vaga"] });
      toast({
        title: "Sucesso",
        description: editingPerfil ? "Perfil atualizado!" : "Perfil criado!",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  // Mapeamento simples de cargos para perfis DISC e competências comportamentais
  const perfilDiscSugestoes: Record<string, { perfil: string; competencias: string[] }> = {
    "comercial": { perfil: "Dominante/Influente", competencias: ["Proatividade", "Persuasão", "Resiliência", "Comunicação"] },
    "vendas": { perfil: "Influente", competencias: ["Relacionamento interpessoal", "Entusiasmo", "Negociação"] },
    "financeiro": { perfil: "Consciente/Estável", competencias: ["Organização", "Atenção a detalhes", "Confiabilidade"] },
    "rh": { perfil: "Estável/Influente", competencias: ["Empatia", "Trabalho em equipe", "Comunicação"] },
    "tecnologia": { perfil: "Consciente", competencias: ["Análise crítica", "Resolução de problemas", "Atenção a detalhes"] },
    "engenharia": { perfil: "Consciente/Dominante", competencias: ["Planejamento", "Foco em resultados", "Raciocínio lógico"] },
    "marketing": { perfil: "Influente", competencias: ["Criatividade", "Comunicação", "Flexibilidade"] },
    // ... outros cargos
  };

  // Sugestão DISC e competências comportamentais
  const [discSugestao, setDiscSugestao] = useState<{ perfil: string; competencias: string[] } | null>(null);

  useEffect(() => {
    if (editingPerfil) {
      setFormData({
        ...editingPerfil,
        competenciasTecnicas: Array.isArray(editingPerfil.competenciasTecnicas)
          ? editingPerfil.competenciasTecnicas
          : (typeof editingPerfil.competenciasTecnicas === 'string' ? editingPerfil.competenciasTecnicas.split(',').map((s: string) => s.trim()).filter(Boolean) : []),
        competenciasComportamentais: Array.isArray(editingPerfil.competenciasComportamentais)
          ? editingPerfil.competenciasComportamentais
          : (typeof editingPerfil.competenciasComportamentais === 'string' ? editingPerfil.competenciasComportamentais.split(',').map((s: string) => s.trim()).filter(Boolean) : []),
      });
    } else if (isOpen) {
      setFormData({
        nomePerfil: "",
        tituloVaga: "",
        descricaoFuncao: "",
        requisitosObrigatorios: "",
        requisitosDesejaveis: "",
        competenciasTecnicas: [],
        competenciasComportamentais: [],
        beneficios: "",
        tipoContratacao: "CLT",
        faixaSalarial: "",
        empresaId: user?.empresaId || "",
        departamentoId: "",
        localAtuacao: "",
        modeloTrabalho: "",
        observacoesInternas: "",
      });
    }

    // Sugere perfil DISC e competências ao digitar título/cargo
    const titulo = (formData.tituloVaga || "").toLowerCase();
    let sugestao: { perfil: string; competencias: string[] } | null = null;
    Object.keys(perfilDiscSugestoes).forEach((chave) => {
      if (titulo.includes(chave)) {
        sugestao = perfilDiscSugestoes[chave];
      }
    });
    setDiscSugestao(sugestao);
  }, [editingPerfil, isOpen, user, formData.tituloVaga]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomePerfil || !formData.tituloVaga || !formData.descricaoFuncao) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    // Corrigir tipos para o backend
    const payload = {
      ...formData,
      requisitosObrigatorios: Array.isArray(formData.requisitosObrigatorios) ? formData.requisitosObrigatorios.join(", ") : formData.requisitosObrigatorios,
      requisitosDesejaveis: Array.isArray(formData.requisitosDesejaveis) ? formData.requisitosDesejaveis.join(", ") : formData.requisitosDesejaveis,
      beneficios: Array.isArray(formData.beneficios) ? formData.beneficios.join(", ") : formData.beneficios,
      empresaId: formData.empresaId || (user?.empresaId || ""),
      departamentoId: formData.departamentoId,
    };
    createMutation.mutate(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {editingPerfil ? "Editar Perfil de Vaga" : "Novo Perfil de Vaga"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome do Perfil *</label>
              <Input type="text" value={formData.nomePerfil} onChange={e => setFormData({ ...formData, nomePerfil: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Título da Vaga *</label>
              <Input type="text" value={formData.tituloVaga} onChange={e => setFormData({ ...formData, tituloVaga: e.target.value })} required />
              {discSugestao && (
                <div className="text-xs text-blue-700 mt-1">
                  Sugestão DISC: <b>{discSugestao.perfil}</b> | Competências: {discSugestao.competencias.join(", ")}
                  <Button size="sm" variant="outline" className="ml-2" onClick={() => setFormData(f => ({ ...f, competenciasComportamentais: discSugestao!.competencias }))}>
                    Usar competências sugeridas
                  </Button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Departamento *</label>
              <select value={formData.departamentoId} onChange={e => setFormData({ ...formData, departamentoId: e.target.value })} className="w-full p-2 border rounded" required>
                <option value="">Selecionar departamento</option>
                {(departamentos as any[]).map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Local de Atuação</label>
              <Input type="text" value={formData.localAtuacao} onChange={e => setFormData({ ...formData, localAtuacao: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Contratação *</label>
              <select value={formData.tipoContratacao} onChange={e => setFormData({ ...formData, tipoContratacao: e.target.value })} className="w-full p-2 border rounded" required>
                <option value="CLT">CLT</option>
                <option value="PJ">PJ</option>
                <option value="Estágio">Estágio</option>
                <option value="Temporário">Temporário</option>
                <option value="Freelancer">Freelancer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Faixa Salarial</label>
              <Input type="text" value={formData.faixaSalarial} onChange={e => setFormData({ ...formData, faixaSalarial: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Modelo de Trabalho</label>
              <select value={formData.modeloTrabalho} onChange={e => setFormData({ ...formData, modeloTrabalho: e.target.value })} className="w-full p-2 border rounded">
                <option value="">Selecionar</option>
                <option value="presencial">Presencial</option>
                <option value="remoto">Remoto</option>
                <option value="hibrido">Híbrido</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descrição da Função *</label>
            <textarea value={formData.descricaoFuncao} onChange={e => setFormData({ ...formData, descricaoFuncao: e.target.value })} className="w-full p-2 border rounded h-24" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Requisitos Obrigatórios</label>
            <textarea value={formData.requisitosObrigatorios} onChange={e => setFormData({ ...formData, requisitosObrigatorios: e.target.value })} className="w-full p-2 border rounded h-20" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Requisitos Desejáveis</label>
            <textarea value={formData.requisitosDesejaveis} onChange={e => setFormData({ ...formData, requisitosDesejaveis: e.target.value })} className="w-full p-2 border rounded h-20" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Competências Técnicas (separar por vírgula)</label>
            <Input type="text" value={formData.competenciasTecnicas.join(", ")} onChange={e => setFormData({ ...formData, competenciasTecnicas: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Competências Comportamentais (separar por vírgula)</label>
            <Input type="text" value={formData.competenciasComportamentais.join(", ")} onChange={e => setFormData({ ...formData, competenciasComportamentais: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Benefícios</label>
            <textarea value={formData.beneficios} onChange={e => setFormData({ ...formData, beneficios: e.target.value })} className="w-full p-2 border rounded h-20" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Observações Internas</label>
            <textarea value={formData.observacoesInternas} onChange={e => setFormData({ ...formData, observacoesInternas: e.target.value })} className="w-full p-2 border rounded h-20" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              {createMutation.isPending ? "Salvando..." : editingPerfil ? "Atualizar" : "Criar Perfil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 