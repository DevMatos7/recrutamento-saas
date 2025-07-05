import { z } from 'zod';

// Schema para experiência profissional
export const experienciaProfissionalSchema = z.object({
  empresa: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres'),
  cargo: z.string().min(2, 'Cargo deve ter pelo menos 2 caracteres'),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().optional(),
  descricao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  atual: z.boolean().default(false),
});

// Schema para educação
export const educacaoSchema = z.object({
  instituicao: z.string().min(2, 'Nome da instituição deve ter pelo menos 2 caracteres'),
  curso: z.string().min(2, 'Nome do curso deve ter pelo menos 2 caracteres'),
  nivel: z.enum(['superior', 'tecnico', 'pos_graduacao', 'mestrado', 'doutorado']),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataConclusao: z.string().optional(),
  status: z.enum(['concluido', 'cursando', 'trancado']),
});

// Schema para idiomas
export const idiomaSchema = z.object({
  idioma: z.string().min(2, 'Nome do idioma deve ter pelo menos 2 caracteres'),
  nivel: z.enum(['basico', 'intermediario', 'avancado', 'fluente', 'nativo']),
});

// Schema para certificações
export const certificacaoSchema = z.object({
  nome: z.string().min(2, 'Nome da certificação deve ter pelo menos 2 caracteres'),
  instituicao: z.string().min(2, 'Nome da instituição deve ter pelo menos 2 caracteres'),
  dataEmissao: z.string().min(1, 'Data de emissão é obrigatória'),
  dataVencimento: z.string().optional(),
});

// Schema principal para candidatos
export const candidatoSchema = z.object({
  // Campos obrigatórios
  nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  
  email: z.string()
    .email('Email inválido')
    .min(5, 'Email deve ter pelo menos 5 caracteres')
    .max(100, 'Email deve ter no máximo 100 caracteres'),
  
  telefone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(15, 'Telefone deve ter no máximo 15 dígitos')
    .regex(/^[\d\s\(\)\-\+]+$/, 'Telefone deve conter apenas números, espaços, parênteses, hífens e +'),
  
  // Campos opcionais básicos
  curriculoUrl: z.string().url('URL do currículo deve ser válida').optional().or(z.literal('')),
  linkedin: z.string().url('URL do LinkedIn deve ser válida').optional().or(z.literal('')),
  status: z.enum(['ativo', 'inativo']).default('ativo'),
  origem: z.enum(['manual', 'portal_candidato', 'importado']).default('manual'),
  empresaId: z.string().min(1, 'Empresa é obrigatória'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
  
  // Informações pessoais
  cpf: z.string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato 000.000.000-00')
    .optional()
    .or(z.literal('')),
  
  dataNascimento: z.string()
    .refine((date) => {
      if (!date) return true;
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 16 && age <= 100;
    }, 'Data de nascimento inválida (idade entre 16 e 100 anos)')
    .optional()
    .or(z.literal('')),
  
  endereco: z.string().max(200, 'Endereço deve ter no máximo 200 caracteres').optional().or(z.literal('')),
  cidade: z.string().max(100, 'Cidade deve ter no máximo 100 caracteres').optional().or(z.literal('')),
  estado: z.string().length(2, 'Estado deve ter exatamente 2 caracteres').optional().or(z.literal('')),
  cep: z.string()
    .regex(/^\d{5}-\d{3}$/, 'CEP deve estar no formato 00000-000')
    .optional()
    .or(z.literal('')),
  
  // Informações profissionais
  cargo: z.string().max(100, 'Cargo deve ter no máximo 100 caracteres').optional().or(z.literal('')),
  resumoProfissional: z.string().max(1000, 'Resumo profissional deve ter no máximo 1000 caracteres').optional().or(z.literal('')),
  pretensoSalarial: z.string().max(50, 'Pretensão salarial deve ter no máximo 50 caracteres').optional().or(z.literal('')),
  disponibilidade: z.enum(['imediata', '15_dias', '30_dias', '60_dias', 'a_combinar']).optional(),
  modalidadeTrabalho: z.enum(['presencial', 'remoto', 'hibrido', 'indiferente']).optional(),
  portfolio: z.string().url('URL do portfolio deve ser válida').optional().or(z.literal('')),
  
  // Arrays
  experienciaProfissional: z.array(experienciaProfissionalSchema).default([]),
  educacao: z.array(educacaoSchema).default([]),
  habilidades: z.array(z.string().min(2, 'Habilidade deve ter pelo menos 2 caracteres')).default([]),
  idiomas: z.array(idiomaSchema).default([]),
  certificacoes: z.array(certificacaoSchema).default([]),
});

// Schema para atualização (campos opcionais)
export const candidatoUpdateSchema = candidatoSchema.partial().extend({
  nome: candidatoSchema.shape.nome.optional(),
  email: candidatoSchema.shape.email.optional(),
  telefone: candidatoSchema.shape.telefone.optional(),
});

// Schema para criação (campos obrigatórios)
export const candidatoCreateSchema = candidatoSchema.pick({
  nome: true,
  email: true,
  telefone: true,
  curriculoUrl: true,
  linkedin: true,
  status: true,
  origem: true,
  empresaId: true,
  password: true,
  cpf: true,
  dataNascimento: true,
  endereco: true,
  cidade: true,
  estado: true,
  cep: true,
  cargo: true,
  resumoProfissional: true,
  pretensoSalarial: true,
  disponibilidade: true,
  modalidadeTrabalho: true,
  portfolio: true,
  experienciaProfissional: true,
  educacao: true,
  habilidades: true,
  idiomas: true,
  certificacoes: true,
});

// Schema para filtros
export const candidatoFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['ativo', 'inativo']).optional(),
  origem: z.enum(['manual', 'portal_candidato', 'importado']).optional(),
  statusEtico: z.enum(['aprovado', 'reprovado', 'pendente']).optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  habilidades: z.array(z.string()).optional(),
  experienciaMinima: z.number().min(0).max(50).optional(),
  disponibilidade: z.enum(['imediata', '15_dias', '30_dias', '60_dias', 'a_combinar']).optional(),
  modalidadeTrabalho: z.enum(['presencial', 'remoto', 'hibrido', 'indiferente']).optional(),
  perfilDisc: z.enum(['D', 'I', 'S', 'C']).optional(),
  empresaId: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Tipos TypeScript derivados dos schemas
export type CandidatoFormData = z.infer<typeof candidatoSchema>;
export type CandidatoUpdateData = z.infer<typeof candidatoUpdateSchema>;
export type CandidatoCreateData = z.infer<typeof candidatoCreateSchema>;
export type CandidatoFilters = z.infer<typeof candidatoFiltersSchema>;
export type ExperienciaProfissional = z.infer<typeof experienciaProfissionalSchema>;
export type Educacao = z.infer<typeof educacaoSchema>;
export type Idioma = z.infer<typeof idiomaSchema>;
export type Certificacao = z.infer<typeof certificacaoSchema>; 