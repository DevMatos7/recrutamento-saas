import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';
import { type CandidatoFilters } from '../services/candidatoService';
import { ValidatedField } from './ValidatedField';
import { useCandidatoValidation } from '../hooks/useCandidatoValidation';

interface CandidatoFiltersProps {
  filters: CandidatoFilters;
  onFiltersChange: (filters: Partial<CandidatoFilters>) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  activeFiltersCount: number;
}

export function CandidatoFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  hasActiveFilters,
  activeFiltersCount
}: CandidatoFiltersProps) {
  const { validateField, getFieldError, clearFieldError } = useCandidatoValidation();

  const handleFilterChange = (key: keyof CandidatoFilters, value: any) => {
    // Validar campo antes de aplicar filtro
    const error = validateField(key, value);
    if (error) {
      console.warn(`Erro de validação no filtro ${key}:`, error);
      return; // Não aplica filtro inválido
    }
    clearFieldError(key);
    onFiltersChange({ [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} ativo{activeFiltersCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <ValidatedField
              label="Buscar"
              name="search"
              type="text"
              value={filters.search || ''}
              onChange={(value) => handleFilterChange('search', value)}
              placeholder="Nome, email, cargo..."
              onBlur={() => {
                const error = validateField('search', filters.search);
                if (error) {
                  console.warn('Erro de validação no campo busca:', error);
                }
              }}
              error={getFieldError('search')}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={filters.status ?? undefined}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="statusEtico">Status Ético</Label>
            <Select
              value={filters.statusEtico ?? undefined}
              onValueChange={(value) => handleFilterChange('statusEtico', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="reprovado">Reprovado</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 