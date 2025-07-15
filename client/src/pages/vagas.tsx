import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Eye, Square, Users, Target, Settings, History, MoreHorizontal } from "lucide-react";
import { Link } from "wouter";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Vaga } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import VagaAuditoria from "@/components/VagaAuditoria";
import PipelineEtapasConfig from "@/components/PipelineEtapasConfig";
import { VagaModal } from "@/components/modals/vaga-modal";

export default function VagasPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVaga, setEditingVaga] = useState<Vaga | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [auditoriaVagaId, setAuditoriaVagaId] = useState<string | null>(null);
  const [pipelineConfigVagaId, setPipelineConfigVagaId] = useState<string | null>(null);

  const { data: vagas = [], isLoading } = useQuery({
    queryKey: ["/api/vagas"],
  });

  const { data: empresas = [] } = useQuery({
    queryKey: ["/api/empresas"],
  });

  const { data: departamentos = [] } = useQuery({
    queryKey: ["/api/departamentos"],
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ["/api/usuarios"],
  });

  const { data: jornadas = [] } = useQuery({ queryKey: ["/api/jornadas"] });
  const jornadaMap = Object.fromEntries((jornadas as any[]).map(j => [j.id, j]));

  const encerrarVagaMutation = useMutation({
    mutationFn: async (vagaId: string) => {
      const res = await apiRequest("PATCH", `/api/vagas/${vagaId}/encerrar`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vagas"] });
      toast({
        title: "Sucesso",
        description: "Vaga encerrada com sucesso!",
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

  const deleteMutation = useMutation({
    mutationFn: async (vagaId: string) => {
      await apiRequest("DELETE", `/api/vagas/${vagaId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vagas"] });
      toast({
        title: "Sucesso",
        description: "Vaga excluída com sucesso!",
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

  // Create lookup maps
  const empresaMap = Object.fromEntries((empresas as any[]).map(e => [e.id, e]));
  const departamentoMap = Object.fromEntries((departamentos as any[]).map(d => [d.id, d]));
  const usuarioMap = Object.fromEntries((usuarios as any[]).map(u => [u.id, u]));

  // Filter vagas
  const filteredVagas = (vagas as any[]).filter(vaga => {
    const matchesStatus = statusFilter === "todos" || vaga.status === statusFilter;
    const matchesSearch = vaga.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vaga.local.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleEditVaga = (vaga: Vaga) => {
    setEditingVaga(vaga);
    setIsModalOpen(true);
  };

  const handleNewVaga = () => {
    setEditingVaga(null);
    setIsModalOpen(true);
  };

  const handleEncerrarVaga = (vagaId: string) => {
    if (confirm("Tem certeza que deseja encerrar esta vaga?")) {
      encerrarVagaMutation.mutate(vagaId);
    }
  };

  const handleDeleteVaga = (vagaId: string) => {
    if (confirm("Tem certeza que deseja excluir esta vaga?")) {
      deleteMutation.mutate(vagaId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberta": return "bg-green-100 text-green-800";
      case "em_triagem": return "bg-blue-100 text-blue-800";
      case "entrevistas": return "bg-yellow-100 text-yellow-800";
      case "encerrada": return "bg-gray-100 text-gray-800";
      case "cancelada": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "aberta": return "Aberta";
      case "em_triagem": return "Em Triagem";
      case "entrevistas": return "Entrevistas";
      case "encerrada": return "Encerrada";
      case "cancelada": return "Cancelada";
      default: return status;
    }
  };

  const canManageVagas = user && ["admin", "recrutador"].includes(user.perfil);

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
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Vagas</h1>
          <p className="text-gray-600 mt-1">Gerencie todas as vagas da sua empresa</p>
        </div>
        {canManageVagas && (
          <Button onClick={handleNewVaga} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova Vaga
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por título ou local..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Status</SelectItem>
                      <SelectItem value="aberta">Aberta</SelectItem>
                      <SelectItem value="em_triagem">Em Triagem</SelectItem>
                      <SelectItem value="entrevistas">Entrevistas</SelectItem>
                      <SelectItem value="encerrada">Encerrada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
      </Card>

      {/* Vagas Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Vagas ({filteredVagas.length})</CardTitle>
        </CardHeader>
        <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Gestor</TableHead>
                    <TableHead>Data Abertura</TableHead>
                    <TableHead>Jornada</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVagas.map((vaga: any) => (
                    <TableRow key={vaga.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{vaga.titulo}</div>
                          <div className="text-sm text-gray-500">
                            {departamentoMap[vaga.departamentoId]?.nome || '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{vaga.local}</TableCell>
                      <TableCell>{vaga.tipoContratacao}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(vaga.status)}>
                          {getStatusLabel(vaga.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {usuarioMap[vaga.gestorId]?.nome || '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(vaga.dataAbertura).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {vaga.jornadaId && jornadaMap[vaga.jornadaId] ? (
                          <>
                            <div className="font-medium">{jornadaMap[vaga.jornadaId].nome}</div>
                            <div className="text-xs text-gray-500">
                              {jornadaMap[vaga.jornadaId].horarios?.map((h: any) => `${h.label}: ${h.hora}`).join(", ")}
                            </div>
                          </>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link href={`/pipeline/${vaga.id}`}>
                                  <Button variant="ghost" size="sm" aria-label="Ver Pipeline">
                                    <Users className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>Ver Pipeline</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => handleEditVaga(vaga)} aria-label="Visualizar">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Visualizar vaga</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => window.location.href = `/vagas/${vaga.id}/matches`} aria-label="Ver matches compatíveis">
                                <Target className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver matches compatíveis</TooltipContent>
                          </Tooltip>
                          {canManageVagas && vaga.status === "aberta" && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => handleEditVaga(vaga)} aria-label="Editar">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar vaga</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => handleEncerrarVaga(vaga.id)} aria-label="Encerrar">
                                    <Square className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Encerrar vaga</TooltipContent>
                              </Tooltip>
                            </>
                          )}
                          {canManageVagas && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPipelineConfigVagaId(vaga.id)}
                              aria-label="Configurar Pipeline"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          )}
                          {/* Dropdown para ações secundárias */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" aria-label="Mais ações">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/vagas/${vaga.id}/configurar-matching`}>
                                  <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Configurar Matching
                                  </div>
                                </Link>
                              </DropdownMenuItem>
                              {user?.perfil === "admin" && (
                                <>
                                  <DropdownMenuItem onClick={() => setAuditoriaVagaId(vaga.id)}>
                                    <History className="h-4 w-4 text-yellow-600" />
                                    Histórico de Auditoria
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleDeleteVaga(vaga.id)} className="text-red-600 focus:bg-red-50">
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                    Excluir vaga
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredVagas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Nenhuma vaga encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
        </CardContent>
      </Card>

      <VagaModal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false);
        setEditingVaga(null);
      }} editingVaga={editingVaga} />
      
      {auditoriaVagaId && (
        <VagaAuditoria
          vagaId={auditoriaVagaId}
          onClose={() => setAuditoriaVagaId(null)}
        />
      )}

      {pipelineConfigVagaId && (
        <PipelineEtapasConfig
          vagaId={pipelineConfigVagaId}
          open={!!pipelineConfigVagaId}
          onClose={() => setPipelineConfigVagaId(null)}
        />
      )}
    </div>
  );
}