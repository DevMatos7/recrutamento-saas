import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PerfilVagaModal from "@/components/modals/perfil-vaga-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CargoAutocomplete from "@/components/cargo-autocomplete";
import { Textarea } from "@/components/ui/textarea";

function IACriarPerfilModal({ isOpen, onClose, onPerfilGerado }: { isOpen: boolean; onClose: () => void; onPerfilGerado: (perfil: any) => void }) {
  const [form, setForm] = useState({
    cargo: "",
    tipo_contratacao: "CLT",
    local: "",
    jornada: "Integral",
    departamento: "",
    nivel: "Pleno",
    info_adicional: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Para selects
  const tipoContratacaoOpcoes = ["CLT", "PJ", "Estágio", "Temporário", "Freelancer"];
  const jornadaOpcoes = ["Integral", "Parcial", "Escala 12x36", "Escala 6x1"];
  const nivelOpcoes = ["Júnior", "Pleno", "Sênior", "Especialista", "Coordenador"];

  // Buscar departamentos
  const { data: departamentos = [] } = useQuery({ queryKey: ["/api/departamentos"] }) as { data: any[] };
  // Buscar empresas
  const { data: empresas = [] } = useQuery({ queryKey: ["/api/empresas"] }) as { data: any[] };
  // Buscar jornadas detalhadas
  const { data: jornadas = [] } = useQuery({ queryKey: ["/api/jornadas"] });

  const handleChange = (e: any) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/ia/criar-perfil-vaga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error(await res.text());
      const perfil = await res.json();
      onPerfilGerado(perfil);
      onClose();
    } catch (err: any) {
      setError("Erro ao gerar perfil com IA: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-lg w-full mx-4">
        <h2 className="text-lg font-semibold mb-4">Criar Perfil com Ajuda da IA</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Cargo */}
          <label htmlFor="cargo" className="block font-medium">Cargo</label>
          <CargoAutocomplete
            value={form.cargo}
            onChange={v => setForm(f => ({ ...f, cargo: v }))}
            placeholder="Nome do Cargo"
          />

          {/* Tipo de contratação: Select + Input */}
          <label htmlFor="tipo_contratacao" className="block font-medium">Tipo de Contratação</label>
          <div className="flex gap-2">
            <Select
              value={tipoContratacaoOpcoes.includes(form.tipo_contratacao) ? form.tipo_contratacao : ""}
              onValueChange={v => setForm(f => ({ ...f, tipo_contratacao: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Contratação" />
              </SelectTrigger>
              <SelectContent>
                {tipoContratacaoOpcoes.map(op => (
                  <SelectItem key={op} value={op}>{op}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              name="tipo_contratacao"
              placeholder="Outro (digite se necessário)"
              value={form.tipo_contratacao}
              onChange={handleChange}
            />
          </div>

          {/* Local de atuação: Select de empresas */}
          <label htmlFor="local" className="block font-medium">Local de Atuação</label>
          <Select
            value={form.local}
            onValueChange={v => setForm(f => ({ ...f, local: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a empresa/filial" />
            </SelectTrigger>
            <SelectContent>
              {empresas.map((e: any) => (
                <SelectItem key={e.id} value={e.nome}>{e.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Jornada: Select de jornadas detalhadas */}
          <label htmlFor="jornada" className="block font-medium">Jornada</label>
          <Select
            value={form.jornada}
            onValueChange={v => setForm(f => ({ ...f, jornada: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a jornada" />
            </SelectTrigger>
            <SelectContent>
              {jornadas.map((j: any) => (
                <SelectItem key={j.id} value={j.id}>
                  {j.nome} ({Array.isArray(j.horarios) ? j.horarios.map((h: any) => `${h.label}: ${h.hora}`).join(" | ") : ""})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Exibir detalhes da jornada selecionada */}
          {form.jornada && jornadas.length > 0 && (
            <div className="text-xs text-gray-600 border rounded p-2 mt-1">
              {(() => {
                const j = jornadas.find((j: any) => j.id === form.jornada);
                if (!j) return null;
                return <>
                  <div><b>{j.nome}</b> - {j.descricao}</div>
                  <div>Horários: {Array.isArray(j.horarios) ? j.horarios.map((h: any) => `${h.label}: ${h.hora}`).join(" | ") : ""}</div>
                  <div>Total de horas: {j.totalHoras}</div>
                </>;
              })()}
            </div>
          )}

          {/* Departamento: Select */}
          <label htmlFor="departamento" className="block font-medium">Departamento</label>
          <Select
            value={form.departamento}
            onValueChange={v => setForm(f => ({ ...f, departamento: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              {departamentos.map((d: any) => (
                <SelectItem key={d.id} value={d.nome}>{d.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Nível: Select + Input */}
          <label htmlFor="nivel" className="block font-medium">Nível</label>
          <div className="flex gap-2">
            <Select
              value={nivelOpcoes.includes(form.nivel) ? form.nivel : ""}
              onValueChange={v => setForm(f => ({ ...f, nivel: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Nível" />
              </SelectTrigger>
              <SelectContent>
                {nivelOpcoes.map(op => (
                  <SelectItem key={op} value={op}>{op}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              name="nivel"
              placeholder="Outro (digite se necessário)"
              value={form.nivel}
              onChange={handleChange}
            />
          </div>

          {/* Informações adicionais */}
          <label htmlFor="info_adicional" className="block font-medium">Informações Adicionais</label>
          <Textarea
            name="info_adicional"
            value={form.info_adicional}
            onChange={handleChange}
            placeholder="Observações adicionais"
          />

          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Gerando..." : "Gerar Perfil"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PerfisVagaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerfil, setEditingPerfil] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isIAModalOpen, setIsIAModalOpen] = useState(false);
  const [perfilGeradoIA, setPerfilGeradoIA] = useState<any | null>(null);

  const { data: perfis = [], isLoading } = useQuery({
    queryKey: ["/api/perfis-vaga"],
  });

  const { data: empresas = [] } = useQuery({ queryKey: ["/api/empresas"] }) as { data: any[] };
  const { data: departamentos = [] } = useQuery({ queryKey: ["/api/departamentos"] });

  // Mapa de departamentos para exibir nome ao invés do ID
  const departamentoMap = Object.fromEntries((departamentos as any[]).map((d: any) => [d.id, d]));

  const [filtros, setFiltros] = useState({
    nome: "",
    titulo: "",
    empresaId: "",
    departamentoId: "",
    local: "",
  });

  const deleteMutation = useMutation({
    mutationFn: async (perfilId: string) => {
      await apiRequest("DELETE", `/api/perfis-vaga/${perfilId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/perfis-vaga"] });
      toast({ title: "Sucesso", description: "Perfil excluído com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const filteredPerfis = (perfis as any[]).filter(perfil => {
    const matchNome = filtros.nome === "" || perfil.nomePerfil.toLowerCase().includes(filtros.nome.toLowerCase());
    const matchTitulo = filtros.titulo === "" || perfil.tituloVaga.toLowerCase().includes(filtros.titulo.toLowerCase());
    const matchEmpresa = filtros.empresaId === "" || perfil.empresaId === filtros.empresaId;
    const matchDepartamento = filtros.departamentoId === "" || perfil.departamentoId === filtros.departamentoId;
    const matchLocal = filtros.local === "" || (perfil.localAtuacao || "").toLowerCase().includes(filtros.local.toLowerCase());
    return matchNome && matchTitulo && matchEmpresa && matchDepartamento && matchLocal;
  });

  const handleEditPerfil = (perfil: any) => {
    setEditingPerfil(perfil);
    setIsModalOpen(true);
  };

  const handleNewPerfil = () => {
    setEditingPerfil(null);
    setIsModalOpen(true);
  };

  const handleDeletePerfil = (perfilId: string) => {
    if (confirm("Tem certeza que deseja excluir este perfil?")) {
      deleteMutation.mutate(perfilId);
    }
  };

  const handlePerfilGeradoIA = (perfil: any) => {
    // Mapeamento dos campos do JSON da IA para o formato do formulário
    setPerfilGeradoIA({
      nomePerfil: perfil.cargo || perfil.nomePerfil || "",
      tituloVaga: perfil["Título da vaga"] || perfil.tituloVaga || "",
      descricaoFuncao: perfil["Descrição da função"] || perfil.descricaoFuncao || "",
      requisitosObrigatorios: Array.isArray(perfil["Requisitos obrigatórios"]) ? perfil["Requisitos obrigatórios"].join("\n") : (perfil["Requisitos obrigatórios"] || perfil.requisitosObrigatorios || ""),
      requisitosDesejaveis: Array.isArray(perfil["Requisitos desejáveis"]) ? perfil["Requisitos desejáveis"].join("\n") : (perfil["Requisitos desejáveis"] || perfil.requisitosDesejaveis || ""),
      competenciasTecnicas: Array.isArray(perfil["Competências técnicas"]) ? perfil["Competências técnicas"] : (perfil["Competências técnicas"] ? [perfil["Competências técnicas"]] : (perfil.competenciasTecnicas || [])),
      competenciasComportamentais: Array.isArray(perfil["Competências comportamentais"]) ? perfil["Competências comportamentais"] : (perfil["Competências comportamentais"] ? [perfil["Competências comportamentais"]] : (perfil.competenciasComportamentais || [])),
      beneficios: Array.isArray(perfil["Benefícios sugeridos"]) ? perfil["Benefícios sugeridos"].join("\n") : (perfil["Benefícios sugeridos"] || perfil.beneficios || ""),
      tipoContratacao: perfil["Tipo de contratação"] || perfil.tipoContratacao || "CLT",
      faixaSalarial: perfil["Faixa salarial estimada"] || perfil.faixaSalarial || "",
      empresaId: perfil.empresaId || "",
      departamentoId: perfil.departamentoId || "",
      localAtuacao: perfil["Local"] || perfil.localAtuacao || "",
      modeloTrabalho: perfil["Modelo de trabalho"] || perfil.modeloTrabalho || "",
      observacoesInternas: perfil["Observações internas"] || perfil.observacoesInternas || "",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Perfis de Vaga</h1>
          <p className="text-gray-600 mt-1">Modelos de vaga para facilitar a abertura de novas oportunidades</p>
        </div>
        <div className="flex gap-2">
          {user?.perfil === "admin" && (
            <Button onClick={() => setIsIAModalOpen(true)} className="flex items-center gap-2" variant="secondary">
              🤖 Criar com Ajuda da IA
            </Button>
          )}
          <Button onClick={handleNewPerfil} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Novo Perfil
          </Button>
        </div>
      </div>
      {/* Filtros avançados */}
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <Input
          placeholder="Nome do perfil"
          value={filtros.nome}
          onChange={e => setFiltros(f => ({ ...f, nome: e.target.value }))}
          className="max-w-xs"
        />
        <Input
          placeholder="Título da vaga"
          value={filtros.titulo}
          onChange={e => setFiltros(f => ({ ...f, titulo: e.target.value }))}
          className="max-w-xs"
        />
        <Select value={filtros.empresaId} onValueChange={v => setFiltros(f => ({ ...f, empresaId: v === 'all' ? '' : v }))}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas empresas</SelectItem>
            {(empresas as any[]).map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtros.departamentoId} onValueChange={v => setFiltros(f => ({ ...f, departamentoId: v === 'all' ? '' : v }))}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos departamentos</SelectItem>
            {(departamentos as any[]).map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Local de atuação"
          value={filtros.local}
          onChange={e => setFiltros(f => ({ ...f, local: e.target.value }))}
          className="max-w-xs"
        />
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Perfil</TableHead>
              <TableHead>Título da Vaga</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Tipo de Contratação</TableHead>
              <TableHead>Faixa Salarial</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPerfis.map(perfil => (
              <TableRow key={perfil.id}>
                <TableCell>{perfil.nomePerfil}</TableCell>
                <TableCell>{perfil.tituloVaga}</TableCell>
                <TableCell>{departamentoMap[perfil.departamentoId]?.nome || '-'}</TableCell>
                <TableCell>{perfil.localAtuacao}</TableCell>
                <TableCell>{perfil.tipoContratacao}</TableCell>
                <TableCell>{perfil.faixaSalarial}</TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => handleEditPerfil(perfil)}><Edit className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDeletePerfil(perfil.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <IACriarPerfilModal isOpen={isIAModalOpen} onClose={() => setIsIAModalOpen(false)} onPerfilGerado={handlePerfilGeradoIA} />
      <PerfilVagaModal isOpen={isModalOpen || !!perfilGeradoIA} onClose={() => { setIsModalOpen(false); setPerfilGeradoIA(null); }} editingPerfil={editingPerfil || perfilGeradoIA} />
    </div>
  );
} 