import { useState, useCallback, useMemo } from 'react';
import { type CandidatoFilters } from '../services/candidatoService';

const DEFAULT_FILTERS: CandidatoFilters = {
  search: '',
  status: undefined,
  origem: undefined,
  statusEtico: undefined,
  dataInicio: undefined,
  dataFim: undefined,
  habilidades: [],
  experienciaMinima: undefined,
  disponibilidade: undefined,
  modalidadeTrabalho: undefined,
  perfilDisc: undefined,
  page: 1,
  limit: 20,
};

export const useCandidatoFilters = () => {
  const [filters, setFilters] = useState<CandidatoFilters>(DEFAULT_FILTERS);

  const updateFilter = useCallback((key: keyof CandidatoFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset page when filters change
    }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<CandidatoFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset page when filters change
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'page' || key === 'limit') return false;
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== '';
    });
  }, [filters]);

  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).reduce((count, [key, value]) => {
      if (key === 'page' || key === 'limit') return count;
      if (Array.isArray(value)) return count + (value.length > 0 ? 1 : 0);
      return count + (value !== undefined && value !== null && value !== '' ? 1 : 0);
    }, 0);
  }, [filters]);

  return {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    setPage,
    hasActiveFilters,
    activeFiltersCount,
  };
}; 