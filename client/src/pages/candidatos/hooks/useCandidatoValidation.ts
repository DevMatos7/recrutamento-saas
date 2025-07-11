import { useState, useCallback } from 'react';
import { candidatoSchema, candidatoCreateSchema, candidatoUpdateSchema, type CandidatoFormData } from '../validations/candidatoSchema';
import { ZodError } from 'zod';

export interface ValidationErrors {
  [key: string]: string;
}

export const useCandidatoValidation = () => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateField = useCallback((field: string, value: any): string | null => {
    try {
      // Validação específica por campo
      switch (field) {
        case 'nome':
          candidatoSchema.shape.nome.parse(value);
          break;
        case 'email':
          candidatoSchema.shape.email.parse(value);
          break;
        case 'telefone':
          candidatoSchema.shape.telefone.parse(value);
          break;
        case 'cpf':
          if (value) candidatoSchema.shape.cpf.parse(value);
          break;
        case 'cep':
          if (value) candidatoSchema.shape.cep.parse(value);
          break;
        case 'dataNascimento':
          if (value) candidatoSchema.shape.dataNascimento.parse(value);
          break;
        case 'curriculoUrl':
          if (value) candidatoSchema.shape.curriculoUrl.parse(value);
          break;
        case 'linkedin':
          if (value) candidatoSchema.shape.linkedin.parse(value);
          break;
        case 'portfolio':
          if (value) candidatoSchema.shape.portfolio.parse(value);
          break;
        default:
          break;
      }
      return null;
    } catch (error) {
      if (error instanceof ZodError) {
        return error.errors[0]?.message || 'Campo inválido';
      }
      return 'Erro de validação';
    }
  }, []);

  const validateForm = useCallback((data: Partial<CandidatoFormData>, isUpdate = false): boolean => {
    try {
      const schema = isUpdate ? candidatoUpdateSchema : candidatoCreateSchema;
      schema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: ValidationErrors = {};
        error.errors.forEach((err) => {
          const field = err.path.join('.');
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const getFieldError = useCallback((field: string): string | undefined => {
    return errors[field];
  }, [errors]);

  const hasErrors = useCallback((): boolean => {
    return Object.keys(errors).length > 0;
  }, [errors]);

  const getErrorCount = useCallback((): number => {
    return Object.keys(errors).length;
  }, [errors]);

  return {
    errors,
    validateField,
    validateForm,
    clearFieldError,
    clearAllErrors,
    getFieldError,
    hasErrors,
    getErrorCount,
  };
}; 