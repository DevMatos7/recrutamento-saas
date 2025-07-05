import { apiRequest } from "@/lib/queryClient";
import { type Candidato, type InsertCandidato } from "@shared/schema";
import { candidatoCreateSchema, candidatoUpdateSchema, candidatoFiltersSchema } from "../validations/candidatoSchema";

export interface CandidatoFilters {
  search?: string;
  status?: string[];
  origem?: string[];
  statusEtico?: string[];
  dataInicio?: string;
  dataFim?: string;
  habilidades?: string[];
  experienciaMinima?: number;
  disponibilidade?: string;
  modalidadeTrabalho?: string;
  perfilDisc?: string[];
  empresaId?: string;
  page?: number;
  limit?: number;
}

export interface CandidatoListResponse {
  candidatos: Candidato[];
  total: number;
  page: number;
  totalPages: number;
}

export class CandidatoService {
  static async getCandidatos(filters?: CandidatoFilters): Promise<CandidatoListResponse> {
    // Validação dos filtros
    if (filters) {
      try {
        candidatoFiltersSchema.parse(filters);
      } catch (error) {
        throw new Error('Filtros inválidos: ' + (error as any).message);
      }
    }

    const params = new URLSearchParams();
    let hasAnyFilter = false;
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)) {
          hasAnyFilter = true;
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const url = hasAnyFilter ? `/api/candidatos?${params}` : '/api/candidatos';
    console.log('[DEBUG] URL de busca de candidatos:', url);
    const response = await apiRequest('GET', url);
    if (!response.ok) {
      throw new Error('Erro ao buscar candidatos');
    }
    
    return response.json();
  }
  
  static async getCandidato(id: string): Promise<Candidato> {
    const response = await apiRequest('GET', `/api/candidatos/${id}`);
    if (!response.ok) {
      throw new Error('Candidato não encontrado');
    }
    
    return response.json();
  }
  
  static async createCandidato(data: InsertCandidato): Promise<Candidato> {
    // Validação do lado cliente
    try {
      candidatoCreateSchema.parse(data);
    } catch (error) {
      throw new Error('Dados inválidos: ' + (error as any).message);
    }

    const response = await apiRequest('POST', '/api/candidatos', data);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar candidato');
    }
    
    return response.json();
  }
  
  static async updateCandidato(id: string, data: Partial<InsertCandidato>): Promise<Candidato> {
    // Validação do lado cliente
    try {
      candidatoUpdateSchema.parse(data);
    } catch (error) {
      throw new Error('Dados inválidos: ' + (error as any).message);
    }

    const response = await apiRequest('PUT', `/api/candidatos/${id}`, data);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao atualizar candidato');
    }
    
    return response.json();
  }
  
  static async deleteCandidato(id: string): Promise<void> {
    const response = await apiRequest('DELETE', `/api/candidatos/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao deletar candidato');
    }
  }
  
  static async updateStatusEtico(id: string, statusEtico: string, motivo?: string): Promise<Candidato> {
    const response = await apiRequest('PUT', `/api/candidatos/${id}/status-etico`, {
      statusEtico,
      motivoReprovacaoEtica: motivo
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao atualizar status ético');
    }
    
    return response.json();
  }
  
  static async getCandidatoHistorico(id: string): Promise<any[]> {
    const response = await apiRequest('GET', `/api/candidatos/${id}/historico`);
    if (!response.ok) {
      throw new Error('Erro ao buscar histórico do candidato');
    }
    
    return response.json();
  }
  
  static async getCandidatoTestes(id: string): Promise<any[]> {
    const response = await apiRequest('GET', `/api/candidatos/${id}/historico-testes`);
    if (!response.ok) {
      throw new Error('Erro ao buscar testes do candidato');
    }
    
    return response.json();
  }
  
  static async getCandidatoEntrevistas(id: string): Promise<any[]> {
    const response = await apiRequest('GET', `/api/entrevistas/candidato/${id}`);
    if (!response.ok) {
      throw new Error('Erro ao buscar entrevistas do candidato');
    }
    
    return response.json();
  }
} 