import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Plus, Users, Download, Upload } from 'lucide-react';
import { useCandidatos, useDeleteCandidato, useUpdateStatusEtico } from './hooks/useCandidatos';
import { useCandidatoFilters } from './hooks/useCandidatoFilters';
import { CandidatoFilters } from './components/CandidatoFilters';
import { CandidatoList } from './components/CandidatoList';
import { CandidatoPagination } from './components/CandidatoPagination';
import { CandidatoDetailModal } from '@/components/candidato-detail-modal';
import { StatusEticoModal } from '@/components/status-etico-modal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { type Candidato } from '@shared/schema';
import { CandidatoModal } from './components/CandidatoModal';

export default function CandidatosPage() {
  const { user } = useAuth();
  const [selectedCandidatoId, setSelectedCandidatoId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusEticoModal, setShowStatusEticoModal] = useState(false);
  const [selectedCandidato, setSelectedCandidato] = useState<Candidato | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCandidato, setEditingCandidato] = useState<Candidato | null>(null);

  // Hooks customizados
  const {
    filters,
    updateFilters,
    clearFilters,
    setPage,
    hasActiveFilters,
    activeFiltersCount,
  } = useCandidatoFilters();

  const { data: candidatosData, isLoading } = useCandidatos(filters);
  const deleteMutation = useDeleteCandidato();
  const updateStatusEticoMutation = useUpdateStatusEtico();

  // Query para obter resultados DISC de todos os candidatos
  const { data: resultadosDisc } = useQuery({
    queryKey: ['/api/avaliacoes/disc/resultados-todos'],
  }) as { data: Record<string, any> | undefined };

  const candidatos = Array.isArray(candidatosData)
    ? candidatosData
    : candidatosData?.candidatos || [];
  const totalItems = candidatosData?.total || 0;
  const totalPages = candidatosData?.totalPages || 1;

  const canManageCandidatos = Boolean(user && ["admin", "recrutador"].includes(user.perfil || ""));

  const handleViewCandidato = (candidato: Candidato) => {
    setSelectedCandidatoId(candidato.id);
    setShowDetailModal(true);
  };

  const handleEditCandidato = (candidato: Candidato) => {
    setEditingCandidato(candidato);
    setIsModalOpen(true);
  };

  const handleNewCandidato = () => {
    setEditingCandidato(null);
    setIsModalOpen(true);
  };

  const handleDeleteCandidato = (candidatoId: string) => {
    if (confirm("Tem certeza que deseja excluir este candidato?")) {
      deleteMutation.mutate(candidatoId);
    }
  };

  const handleUpdateStatusEtico = (id: string, status: string, motivo?: string) => {
    if (status === 'reprovado') {
      setSelectedCandidato(candidatos.find(c => c.id === id) || null);
      setShowStatusEticoModal(true);
    } else {
      updateStatusEticoMutation.mutate({ id, statusEtico: status, motivo });
    }
  };

  const handleStatusEticoSubmit = (motivo: string) => {
    if (selectedCandidato) {
      updateStatusEticoMutation.mutate({ 
        id: selectedCandidato.id, 
        statusEtico: 'reprovado', 
        motivo 
      });
      setShowStatusEticoModal(false);
      setSelectedCandidato(null);
    }
  };

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    updateFilters({ limit: itemsPerPage, page: 1 });
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Gestão de Candidatos
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie todos os candidatos da sua empresa
            </p>
          </div>
          
          {canManageCandidatos && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button onClick={handleNewCandidato} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Candidato
              </Button>
            </div>
          )}
        </div>

        {/* Filtros */}
        <CandidatoFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          activeFiltersCount={activeFiltersCount}
        />

        {/* Lista de Candidatos */}
        <CandidatoList
          candidatos={candidatos}
          isLoading={isLoading}
          onViewCandidato={handleViewCandidato}
          onEditCandidato={handleEditCandidato}
          onDeleteCandidato={handleDeleteCandidato}
          onUpdateStatusEtico={handleUpdateStatusEtico}
          canManageCandidatos={canManageCandidatos}
          resultadosDisc={resultadosDisc}
        />

        {/* Paginação */}
        {!isLoading && candidatos.length > 0 && (
          <CandidatoPagination
            currentPage={filters.page || 1}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={filters.limit || 20}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}

        {/* Modais */}
        <CandidatoDetailModal
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          candidato={candidatos.find(c => c.id === selectedCandidatoId) || null}
        />

        <StatusEticoModal
          isOpen={showStatusEticoModal}
          onClose={() => setShowStatusEticoModal(false)}
          candidato={selectedCandidato}
        />

        <CandidatoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          editingCandidato={editingCandidato}
        />
      </div>
    </ErrorBoundary>
  );
} 