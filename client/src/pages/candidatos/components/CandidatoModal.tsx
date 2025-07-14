import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Badge } from '@/components/ui/badge';
import { X, Plus, Trash2, Save, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { ValidatedField, CPFField, CEPField, PhoneField } from './ValidatedField';
import { useCandidatoValidation } from '../hooks/useCandidatoValidation';
import { useCreateCandidato, useUpdateCandidato } from '../hooks/useCandidatos';
import { type Candidato } from '@shared/schema';
import { type CandidatoFormData } from '../validations/candidatoSchema';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MultiSelect } from '@/components/ui/multiselect';
import SkillsAutocomplete from '@/components/skills-autocomplete';
import CargoAutocomplete from '@/components/cargo-autocomplete';
import { type Skill } from '@shared/schema';

interface CandidatoModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCandidato?: Candidato | null;
}

type FormData = {
  nome: string;
  email: string;
  telefone: string;
  curriculoUrl: string;
  linkedin: string;
  status: 'ativo' | 'inativo';
  origem: 'manual' | 'portal_candidato' | 'importado';
  empresaId: string;
  password: string;
  cpf: string;
  dataNascimento: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  cargo: string;
  resumoProfissional: string;
  pretensoSalarial: string;
  disponibilidade: 'imediata' | '15_dias' | '30_dias' | '60_dias' | 'a_combinar';
  modalidadeTrabalho: 'presencial' | 'remoto' | 'hibrido' | 'indiferente';
  portfolio: string;
  experienciaProfissional: { empresa: string; cargo: string; dataInicio: string; dataFim: string; descricao: string; atual: boolean }[];
  educacao: { status: 'concluido' | 'cursando' | 'trancado'; dataInicio: string; instituicao: string; curso: string; nivel: 'superior' | 'tecnico' | 'pos_graduacao' | 'mestrado' | 'doutorado'; dataConclusao?: string }[];
  habilidades: string[];
  idiomas: { idioma: string; nivel: 'basico' | 'intermediario' | 'avancado' | 'fluente' | 'nativo' }[];
  certificacoes: { nome: string; instituicao: string; dataEmissao: string; dataVencimento: string }[];
  novaHabilidade: string;
  genero: 'masculino' | 'feminino' | 'nao_binario' | 'prefiro_nao_informar' | 'outro';
  cidadesMorou: { cidade: string; estado: string }[];
  contatosAdicionais: { nome: string; telefone: string; parentesco: string }[];
  referencias: { nome: string; telefone: string; empresa?: string }[];
};

const INITIAL_FORM_DATA: FormData = {
  nome: '',
  email: '',
  telefone: '',
  curriculoUrl: '',
  linkedin: '',
  status: 'ativo',
  origem: 'manual',
  empresaId: '',
  password: '',
  cpf: '',
  dataNascimento: '',
  endereco: '',
  cidade: '',
  estado: '',
  cep: '',
  cargo: '',
  resumoProfissional: '',
  pretensoSalarial: '',
  disponibilidade: 'a_combinar',
  modalidadeTrabalho: 'indiferente',
  portfolio: '',
  experienciaProfissional: [],
  educacao: [],
  habilidades: [],
  idiomas: [],
  certificacoes: [],
  novaHabilidade: '',
  genero: 'prefiro_nao_informar',
  cidadesMorou: [],
  contatosAdicionais: [
    { nome: '', telefone: '', parentesco: '' },
    { nome: '', telefone: '', parentesco: '' },
  ],
  referencias: [],
};

const HABILIDADES_OPTIONS = [
  'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Node.js',
  'Python', 'Java', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
  'SQL', 'MongoDB', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes',
  'AWS', 'Azure', 'GCP', 'Git', 'CI/CD', 'Agile', 'Scrum',
  'UI/UX', 'Figma', 'Adobe Creative Suite', 'Marketing Digital',
  'Vendas', 'Atendimento ao Cliente', 'Gestão de Projetos'
];

// Substitua o array ESTADOS por uma versão completa com todos os estados brasileiros
const ESTADOS = [
  { sigla: 'AC', nome: 'Acre', cidades: [] },
  { sigla: 'AL', nome: 'Alagoas', cidades: [] },
  { sigla: 'AP', nome: 'Amapá', cidades: [] },
  { sigla: 'AM', nome: 'Amazonas', cidades: [] },
  { sigla: 'BA', nome: 'Bahia', cidades: [] },
  { sigla: 'CE', nome: 'Ceará', cidades: [] },
  { sigla: 'DF', nome: 'Distrito Federal', cidades: [] },
  { sigla: 'ES', nome: 'Espírito Santo', cidades: [] },
  { sigla: 'GO', nome: 'Goiás', cidades: [] },
  { sigla: 'MA', nome: 'Maranhão', cidades: [] },
  { sigla: 'MT', nome: 'Mato Grosso', cidades: [] },
  { sigla: 'MS', nome: 'Mato Grosso do Sul', cidades: [] },
  { sigla: 'MG', nome: 'Minas Gerais', cidades: [] },
  { sigla: 'PA', nome: 'Pará', cidades: [] },
  { sigla: 'PB', nome: 'Paraíba', cidades: [] },
  { sigla: 'PR', nome: 'Paraná', cidades: [] },
  { sigla: 'PE', nome: 'Pernambuco', cidades: [] },
  { sigla: 'PI', nome: 'Piauí', cidades: [] },
  { sigla: 'RJ', nome: 'Rio de Janeiro', cidades: [] },
  { sigla: 'RN', nome: 'Rio Grande do Norte', cidades: [] },
  { sigla: 'RS', nome: 'Rio Grande do Sul', cidades: [] },
  { sigla: 'RO', nome: 'Rondônia', cidades: [] },
  { sigla: 'RR', nome: 'Roraima', cidades: [] },
  { sigla: 'SC', nome: 'Santa Catarina', cidades: [] },
  { sigla: 'SP', nome: 'São Paulo', cidades: [] },
  { sigla: 'SE', nome: 'Sergipe', cidades: [] },
  { sigla: 'TO', nome: 'Tocantins', cidades: [] },
];

// Habilidades sugeridas por formação (exemplo)
const HABILIDADES_POR_CURSO: Record<string, string[]> = {
  'Ciências da Computação': ['Programação', 'Banco de Dados', 'Algoritmos', 'Estrutura de Dados', 'Desenvolvimento Web'],
  'Administração': ['Gestão de Pessoas', 'Finanças', 'Planejamento', 'Negociação'],
  'Contabilidade': ['Contabilidade Geral', 'Análise de Balanços', 'Fiscal', 'Tributário'],
  // ...adicionar mais cursos e habilidades
};

// Funções de formatação
const formatCurrency = (value: string) => {
  if (!value) return '';
  const numericValue = value.replace(/\D/g, '');
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(numericValue) / 100);
};

const formatPhone = (value: string) => {
  if (!value) return '';
  const numericValue = value.replace(/\D/g, '');
  if (numericValue.length === 11) {
    return `(${numericValue.slice(0, 2)}) ${numericValue.slice(2, 7)}-${numericValue.slice(7)}`;
  }
  if (numericValue.length === 10) {
    return `(${numericValue.slice(0, 2)}) ${numericValue.slice(2, 6)}-${numericValue.slice(6)}`;
  }
  return numericValue;
};

const formatDate = (value: string) => {
  if (!value) return '';
  try {
    return format(parseISO(value), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return value;
  }
};

export function CandidatoModal({ isOpen, onClose, editingCandidato }: CandidatoModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [activeTab, setActiveTab] = useState('basico');
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<{ [key: string]: boolean }>({});
  const [triedSubmit, setTriedSubmit] = useState(false);
  // skillsOptions deve ser Skill[]
  const [skillsOptions, setSkillsOptions] = useState<Skill[]>([]);
  const [skillsIds, setSkillsIds] = useState<string[]>([]);

  // Buscar skills da API para autocomplete
  useEffect(() => {
    if (isOpen) {
      axios.get('/api/skills').then(res => {
        setSkillsOptions(res.data.map((s: any) => ({ value: s.id, label: s.nome })));
      });
    }
  }, [isOpen]);

  // Preencher skillsIds ao editar
  useEffect(() => {
    if (editingCandidato && isOpen) {
      // Buscar skills do candidato (se vierem no objeto, senão buscar via API)
      axios.get(`/api/candidatos/${editingCandidato.id}/skills`).then(res => {
        setSkillsIds(res.data.map((s: any) => s.id));
      }).catch(() => setSkillsIds([]));
    } else if (isOpen) {
      setSkillsIds([]);
    }
  }, [editingCandidato, isOpen]);

  // Calcular progresso do preenchimento
  const calculateProgress = () => {
    const requiredFields = ['nome', 'email', 'telefone', 'empresaId'];
    const filledRequired = requiredFields.filter(field => formData[field as keyof FormData]).length;
    return (filledRequired / requiredFields.length) * 100;
  };
  
  const { validateForm, validateField, getFieldError, clearFieldError, hasErrors, getErrorCount } = useCandidatoValidation();
  const createMutation = useCreateCandidato();
  const updateMutation = useUpdateCandidato();
  const { data: empresas } = useQuery({
    queryKey: ['/api/empresas'],
    enabled: isOpen,
  });

  const isEditing = !!editingCandidato;

  useEffect(() => {
    if (editingCandidato && isOpen) {
      setFormData({
        nome: editingCandidato.nome ?? '',
        email: editingCandidato.email ?? '',
        telefone: editingCandidato.telefone ?? '',
        curriculoUrl: editingCandidato.curriculoUrl ?? '',
        linkedin: editingCandidato.linkedin ?? '',
        status: ['ativo', 'inativo'].includes(editingCandidato.status ?? '') ? (editingCandidato.status as 'ativo' | 'inativo') : 'ativo',
        origem: ['manual', 'portal_candidato', 'importado'].includes(editingCandidato.origem ?? '') ? (editingCandidato.origem as 'manual' | 'portal_candidato' | 'importado') : 'manual',
        empresaId: editingCandidato.empresaId ?? '',
        password: editingCandidato.password ?? '',
        cpf: editingCandidato.cpf ?? '',
        dataNascimento: editingCandidato.dataNascimento ?? '',
        endereco: editingCandidato.endereco ?? '',
        cidade: editingCandidato.cidade ?? '',
        estado: editingCandidato.estado ?? '',
        cep: editingCandidato.cep ?? '',
        cargo: editingCandidato.cargo ?? '',
        resumoProfissional: editingCandidato.resumoProfissional ?? '',
        pretensoSalarial: editingCandidato.pretensoSalarial ?? '',
        disponibilidade: ['imediata', '15_dias', '30_dias', '60_dias', 'a_combinar'].includes(editingCandidato.disponibilidade ?? '') ? (editingCandidato.disponibilidade as any) : 'a_combinar',
        modalidadeTrabalho: ['presencial', 'remoto', 'hibrido', 'indiferente'].includes(editingCandidato.modalidadeTrabalho ?? '') ? (editingCandidato.modalidadeTrabalho as any) : 'indiferente',
        portfolio: editingCandidato.portfolio ?? '',
        experienciaProfissional: Array.isArray(editingCandidato.experienciaProfissional) ? editingCandidato.experienciaProfissional.map(exp => ({ ...exp, atual: true })) : [],
        educacao: Array.isArray(editingCandidato.educacao)
          ? editingCandidato.educacao.map((eduObj) => ({
              ...eduObj,
              nivel: ['superior', 'tecnico', 'pos_graduacao', 'mestrado', 'doutorado'].includes(eduObj.nivel)
                ? (eduObj.nivel as 'superior' | 'tecnico' | 'pos_graduacao' | 'mestrado' | 'doutorado')
                : 'superior',
            }))
          : [],
        habilidades: Array.isArray(editingCandidato.habilidades) ? editingCandidato.habilidades : [],
        idiomas: Array.isArray(editingCandidato.idiomas)
          ? editingCandidato.idiomas.map((idiomaObj) => ({
              idioma: idiomaObj.idioma,
              nivel: ['basico', 'intermediario', 'avancado', 'fluente', 'nativo'].includes(idiomaObj.nivel)
                ? (idiomaObj.nivel as 'basico' | 'intermediario' | 'avancado' | 'fluente' | 'nativo')
                : 'basico',
            }))
          : [],
        certificacoes: Array.isArray(editingCandidato.certificacoes) ? editingCandidato.certificacoes : [],
        novaHabilidade: '',
        genero: 'prefiro_nao_informar',
        cidadesMorou: Array.isArray(editingCandidato.cidadesMorou) ? editingCandidato.cidadesMorou : [],
        contatosAdicionais: Array.isArray(editingCandidato.contatosAdicionais) ? editingCandidato.contatosAdicionais : [],
        referencias: Array.isArray(editingCandidato.referencias) ? editingCandidato.referencias : [],
      });
    } else {
      setFormData(INITIAL_FORM_DATA);
    }
  }, [editingCandidato, isOpen]);

  const handleFieldChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  const handleFieldBlur = (field: keyof FormData) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    if (error) {
      console.warn(`Erro de validação no campo ${field}:`, error);
    }
  };

  const shouldShowError = (field: string) => {
    return (touchedFields[field] || triedSubmit) && !!getFieldError(field);
  };

  // Função para atualizar campos dinâmicos de formação acadêmica
  const handleEducacaoChange = (
    idx: number,
    field: keyof FormData['educacao'][number],
    value: string
  ) => {
    setFormData(prev => {
      const educacao = [...prev.educacao];
      educacao[idx] = { ...educacao[idx], [field]: value };
      return { ...prev, educacao };
    });
  };

  // Adicione a função para atualizar certificações
  const handleCertificacaoChange = (
    idx: number,
    field: keyof FormData['certificacoes'][number],
    value: string
  ) => {
    setFormData(prev => {
      const certificacoes = [...prev.certificacoes];
      certificacoes[idx] = { ...certificacoes[idx], [field]: value };
      return { ...prev, certificacoes };
    });
  };

  // Handler para buscar cidade e estado pelo CEP
  const handleCepBlur = async () => {
    setCepError(null);
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await resp.json();
      if (data.erro) {
        setCepError('CEP não encontrado.');
        return;
      }
      setFormData(prev => ({
        ...prev,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
      }));
    } catch (e) {
      setCepError('Erro ao buscar CEP.');
    } finally {
      setCepLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBackendError(null);
    setTriedSubmit(true);
    // Garante que todos os campos obrigatórios estejam preenchidos
    const requiredFields = ['nome', 'email', 'telefone', 'password', 'status', 'origem', 'empresaId'];
    const missingFields = requiredFields.filter((field) => !(formData as any)[field] || (formData as any)[field] === '');
    if (missingFields.length > 0) {
      setBackendError('Por favor, preencha todos os campos obrigatórios antes de salvar.');
      return;
    }
    // Corrigir campos de data vazios para undefined
    const dataToSubmit = {
      ...formData,
      password: formData.password || '',
      dataNascimento: formData.dataNascimento === '' ? undefined : formData.dataNascimento,
      skillsIds,
    };
    // Validar formulário completo
    const isValid = validateForm(dataToSubmit, isEditing);
    if (!isValid) {
      setBackendError('Por favor, corrija os campos destacados em vermelho.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (isEditing && editingCandidato) {
        await updateMutation.mutateAsync({ id: editingCandidato.id, data: dataToSubmit });
      } else {
        await createMutation.mutateAsync(dataToSubmit);
      }
      setSubmitSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000); // Fecha após 1 segundo
    } catch (error: any) {
      // Tenta extrair mensagem amigável do backend
      let msg = 'Erro ao salvar candidato.';
      if (error?.message?.includes('invalid input syntax for type date')) {
        msg = 'Preencha a data de nascimento corretamente.';
      } else if (error?.message) {
        try {
          const parsed = JSON.parse(error.message);
          msg = parsed.message || msg;
        } catch {}
      }
      setBackendError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addHabilidade = () => {
    const novaHabilidade = prompt('Digite a nova habilidade:');
    if (novaHabilidade && novaHabilidade.trim()) {
      handleFieldChange('habilidades', [...formData.habilidades, novaHabilidade.trim()]);
    }
  };

  const removeHabilidade = (index: number) => {
    const novasHabilidades = formData.habilidades.filter((_, i) => i !== index);
    handleFieldChange('habilidades', novasHabilidades);
  };

  // Função para atualizar campos de idioma
  const handleIdiomaChange = (
    idx: number,
    field: keyof FormData['idiomas'][number],
    value: string
  ) => {
    setFormData(prev => {
      const idiomas = [...prev.idiomas];
      idiomas[idx] = { ...idiomas[idx], [field]: value };
      return { ...prev, idiomas };
    });
  };

  // Função para atualizar o cargo de uma experiência profissional
  function handleExperienceFieldChange(idx: number, field: string, value: string) {
    setFormData(prev => {
      const arr = [...prev.experienciaProfissional];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...prev, experienciaProfissional: arr };
    });
  }

  // getFieldError é uma função, precisamos obter todos os campos e coletar os erros
  const errorFields = Object.keys(formData);
  const errorMessages = errorFields
    .map((field) => getFieldError(field))
    .filter((msg) => !!msg);

  // Função para formatar valor monetário
  function formatCurrency(value: string) {
    const onlyNums = value.replace(/\D/g, '');
    if (!onlyNums) return '';
    const number = parseFloat(onlyNums) / 100;
    return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // Remova ou comente as funções de upload não utilizadas
  // const handleCurriculoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  //   // ... código comentado
  // };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-3xl sm:max-w-lg md:max-w-2xl lg:max-w-3xl bg-white p-0 rounded-xl shadow-xl">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center justify-between">
            <span className="text-xl font-semibold">{isEditing ? 'Editar Candidato' : 'Novo Candidato'}</span>
            {submitSuccess && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4 mr-1" />
                Salvo com sucesso!
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progresso do preenchimento</span>
            <span className="text-sm text-gray-500">{Math.round(calculateProgress())}%</span>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
          </div>

        <div className="px-6 pt-4 pb-6 bg-white max-h-[90vh] overflow-y-auto">
          <TooltipProvider>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Primeira linha de abas */}
              <TabsList className="flex w-full bg-gradient-to-r from-gray-50 to-gray-100 border-b rounded-t text-base mb-0 shadow-sm">
                <TabsTrigger 
                  value="basico" 
                  className="px-4 py-2 transition-all duration-300 ease-in-out data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-blue-500 text-gray-500 bg-transparent hover:bg-gray-200 hover:text-gray-700"
                >
                  Básico
                </TabsTrigger>
                <TabsTrigger 
                  value="pessoal" 
                  className="px-4 py-2 transition-all duration-300 ease-in-out data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-blue-500 text-gray-500 bg-transparent hover:bg-gray-200 hover:text-gray-700"
                >
                  Pessoal
                </TabsTrigger>
                <TabsTrigger 
                  value="profissional" 
                  className="px-4 py-2 transition-all duration-300 ease-in-out data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-blue-500 text-gray-500 bg-transparent hover:bg-gray-200 hover:text-gray-700"
                >
                  Profissional
                </TabsTrigger>
                <TabsTrigger 
                  value="habilidades" 
                  className="px-4 py-2 transition-all duration-300 ease-in-out data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-blue-500 text-gray-500 bg-transparent hover:bg-gray-200 hover:text-gray-700"
                >
                  Habilidades
                </TabsTrigger>
              </TabsList>
              {/* Segunda linha de abas */}
              <TabsList className="flex w-full bg-gradient-to-r from-gray-50 to-gray-100 border-b text-base mb-6 shadow-sm rounded-none">
                <TabsTrigger 
                  value="experiencia" 
                  className="px-4 py-2 transition-all duration-300 ease-in-out data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-blue-500 text-gray-500 bg-transparent hover:bg-gray-200 hover:text-gray-700"
                >
                  Experiência
                </TabsTrigger>
                <TabsTrigger 
                  value="formacao" 
                  className="px-4 py-2 transition-all duration-300 ease-in-out data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-blue-500 text-gray-500 bg-transparent hover:bg-gray-200 hover:text-gray-700"
                >
                  Formação
                </TabsTrigger>
                <TabsTrigger 
                  value="idiomas" 
                  className="px-4 py-2 transition-all duration-300 ease-in-out data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-blue-500 text-gray-500 bg-transparent hover:bg-gray-200 hover:text-gray-700"
                >
                  Idiomas
                </TabsTrigger>
                <TabsTrigger 
                  value="certificacoes" 
                  className="px-4 py-2 transition-all duration-300 ease-in-out data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-blue-500 text-gray-500 bg-transparent hover:bg-gray-200 hover:text-gray-700"
                >
                  Certificações
                </TabsTrigger>
                <TabsTrigger 
                  value="adicionais" 
                  className="px-4 py-2 transition-all duration-300 ease-in-out data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-blue-500 text-gray-500 bg-transparent hover:bg-gray-200 hover:text-gray-700"
                >
                  Dados Adicionais
                </TabsTrigger>
            </TabsList>

              <TabsContent value="basico" className="pt-6 space-y-6 animate-in fade-in-0 slide-in-from-right-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Nome Completo
                      </label>
                      <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Digite o nome completo do candidato</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <input
                  type="text"
                      className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        shouldShowError('nome') ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      value={formData.nome}
                      onChange={(e) => handleFieldChange('nome', e.target.value)}
                  onBlur={() => handleFieldBlur('nome')}
                    />
                    {shouldShowError('nome') && (
                      <div className="flex items-center gap-1 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {getFieldError('nome')}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Email válido para contato</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <input
                  type="email"
                      className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        shouldShowError('email') ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                  onBlur={() => handleFieldBlur('email')}
                    />
                    {shouldShowError('email') && (
                      <div className="flex items-center gap-1 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {getFieldError('email')}
                      </div>
                    )}
              </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Telefone
                      </label>
                      <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Telefone com DDD</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <input
                      type="tel"
                      className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        shouldShowError('telefone') ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      value={formatPhone(formData.telefone)}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, '');
                        handleFieldChange('telefone', rawValue);
                      }}
                  onBlur={() => handleFieldBlur('telefone')}
                      placeholder="(11) 99999-9999"
                    />
                    {shouldShowError('telefone') && (
                      <div className="flex items-center gap-1 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {getFieldError('telefone')}
                      </div>
                    )}
              </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Empresa
                      </label>
                      <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Selecione a empresa do candidato</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <select
                      className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        shouldShowError('empresaId') ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      value={formData.empresaId}
                      onChange={(e) => handleFieldChange('empresaId', e.target.value)}
                  onBlur={() => handleFieldBlur('empresaId')}
                    >
                      <option value="">Selecione uma empresa</option>
                      {Array.isArray(empresas) && empresas.map((empresa: any) => (
                        <option key={empresa.id} value={empresa.id}>
                          {empresa.nome}
                        </option>
                      ))}
                    </select>
                    {shouldShowError('empresaId') && (
                      <div className="flex items-center gap-1 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {getFieldError('empresaId')}
              </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Senha
                      </label>
                      <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Defina uma senha para o candidato acessar o portal</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <input
                      type="password"
                      className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        shouldShowError('password') ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      value={formData.password}
                      onChange={(e) => handleFieldChange('password', e.target.value)}
                      onBlur={() => handleFieldBlur('password')}
                      placeholder="Digite a senha"
                    />
                    {shouldShowError('password') && (
                      <div className="flex items-center gap-1 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {getFieldError('password')}
                      </div>
                    )}
                  </div>
              </div>
            </TabsContent>

              <TabsContent value="pessoal" className="pt-6 space-y-6 animate-in fade-in-0 slide-in-from-right-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Gênero
                      </label>
                      <Badge variant="secondary" className="text-xs">Opcional</Badge>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Identificação de gênero do candidato</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <select
                      className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        shouldShowError('genero') ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      value={formData.genero}
                      onChange={(e) => handleFieldChange('genero', e.target.value as FormData['genero'])}
                      onBlur={() => handleFieldBlur('genero')}
                    >
                      <option value="prefiro_nao_informar">Prefiro não informar</option>
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                      <option value="nao_binario">Não-binário</option>
                      <option value="outro">Outro</option>
                    </select>
                    {shouldShowError('genero') && (
                      <div className="flex items-center gap-1 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {getFieldError('genero')}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="block text-sm font-medium text-gray-700">
                        CPF
                      </label>
                      <Badge variant="secondary" className="text-xs">Opcional</Badge>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Número do CPF do candidato (opcional)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                <CPFField
                      value={formData.cpf}
                  onChange={(value) => handleFieldChange('cpf', value)}
                  onBlur={() => handleFieldBlur('cpf')}
                  error={getFieldError('cpf')}
                      name="cpf"
                      label="CPF"
                    />
                    {shouldShowError('cpf') && (
                      <div className="flex items-center gap-1 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {getFieldError('cpf')}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Data de Nascimento
                      </label>
                      <Badge variant="secondary" className="text-xs">Opcional</Badge>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Data de nascimento do candidato (opcional)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <input
                  type="date"
                      className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        shouldShowError('dataNascimento') ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      value={formData.dataNascimento}
                      onChange={(e) => handleFieldChange('dataNascimento', e.target.value)}
                  onBlur={() => handleFieldBlur('dataNascimento')}
                    />
                    {shouldShowError('dataNascimento') && (
                      <div className="flex items-center gap-1 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {getFieldError('dataNascimento')}
                      </div>
                    )}
                  </div>
              </div>

              <ValidatedField
                label="Endereço"
                name="endereco"
                type="text"
                value={formData.endereco || ''}
                onChange={(value) => handleFieldChange('endereco', value)}
                onBlur={() => handleFieldBlur('endereco')}
                error={getFieldError('endereco')}
                placeholder="Rua, número, complemento"
              />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                <CEPField
                      value={formData.cep}
                  onChange={(value) => handleFieldChange('cep', value)}
                      onBlur={() => { handleFieldBlur('cep'); handleCepBlur(); }}
                  error={getFieldError('cep')}
                      name="cep"
                      label="CEP"
                    />
                    {cepLoading && <span className="text-xs text-blue-600">Buscando CEP...</span>}
                    {cepError && <span className="text-xs text-red-600">{cepError}</span>}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Cidade</label>
                    <input
                      type="text"
                      className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        shouldShowError('cidade') ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      value={formData.cidade}
                      onChange={(e) => handleFieldChange('cidade', e.target.value)}
                      onBlur={() => handleFieldBlur('cidade')}
                    />
                    {shouldShowError('cidade') && (
                      <div className="flex items-center gap-1 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {getFieldError('cidade')}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <select
                      className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        shouldShowError('estado') ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      value={formData.estado}
                      onChange={(e) => {
                        handleFieldChange('estado', e.target.value);
                        handleFieldChange('cidade', ''); // Limpa cidade ao trocar estado
                      }}
                      onBlur={() => handleFieldBlur('estado')}
                    >
                      <option value="">Selecione o estado</option>
                      {ESTADOS.map(e => (
                        <option key={e.sigla} value={e.sigla}>{e.nome}</option>
                      ))}
                    </select>
                    {shouldShowError('estado') && (
                      <div className="flex items-center gap-1 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {getFieldError('estado')}
                      </div>
                    )}
                  </div>
              </div>
            </TabsContent>

              <TabsContent value="profissional" className="pt-6 space-y-6 animate-in fade-in-0 slide-in-from-right-2 duration-300">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Cargo Desejado</label>
                <CargoAutocomplete
                  value={formData.cargo}
                  onChange={value => handleFieldChange('cargo', value)}
                  placeholder="Digite ou selecione o cargo desejado..."
                />
              </div>

              <ValidatedField
                label="Resumo Profissional"
                name="resumoProfissional"
                type="textarea"
                value={formData.resumoProfissional || ''}
                onChange={(value) => handleFieldChange('resumoProfissional', value)}
                onBlur={() => handleFieldBlur('resumoProfissional')}
                error={getFieldError('resumoProfissional')}
                placeholder="Breve descrição da sua experiência e objetivos profissionais..."
              />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Pretensão Salarial
                      </label>
                      <Badge variant="secondary" className="text-xs">Opcional</Badge>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Valor da pretensão salarial do candidato (opcional)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <input
                  type="text"
                      className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        shouldShowError('pretensoSalarial') ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      value={formatCurrency(formData.pretensoSalarial)}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, '');
                        handleFieldChange('pretensoSalarial', rawValue);
                  }}
                  onBlur={() => handleFieldBlur('pretensoSalarial')}
                  placeholder="R$ 5.000,00"
                />
                    {shouldShowError('pretensoSalarial') && (
                      <div className="flex items-center gap-1 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {getFieldError('pretensoSalarial')}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Disponibilidade
                      </label>
                      <Badge variant="secondary" className="text-xs">Opcional</Badge>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Período de disponibilidade do candidato (opcional)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                <ValidatedField
                  label="Disponibilidade"
                  name="disponibilidade"
                  type="select"
                  value={formData.disponibilidade ?? undefined}
                  onChange={(value) => handleFieldChange('disponibilidade', value)}
                  options={[
                    { value: 'imediata', label: 'Imediata' },
                    { value: '15_dias', label: '15 dias' },
                    { value: '30_dias', label: '30 dias' },
                    { value: '60_dias', label: '60 dias' },
                    { value: 'a_combinar', label: 'A combinar' }
                  ]}
                      error={getFieldError('disponibilidade')}
                    />
                    {shouldShowError('disponibilidade') && (
                      <div className="flex items-center gap-1 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {getFieldError('disponibilidade')}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Modalidade de Trabalho
                      </label>
                      <Badge variant="secondary" className="text-xs">Opcional</Badge>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Preferência de modalidade de trabalho do candidato (opcional)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                <ValidatedField
                  label="Modalidade de Trabalho"
                  name="modalidadeTrabalho"
                  type="select"
                  value={formData.modalidadeTrabalho ?? undefined}
                  onChange={(value) => handleFieldChange('modalidadeTrabalho', value)}
                  options={[
                    { value: 'presencial', label: 'Presencial' },
                    { value: 'remoto', label: 'Remoto' },
                    { value: 'hibrido', label: 'Híbrido' },
                    { value: 'indiferente', label: 'Indiferente' }
                  ]}
                      error={getFieldError('modalidadeTrabalho')}
                    />
                    {shouldShowError('modalidadeTrabalho') && (
                      <div className="flex items-center gap-1 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {getFieldError('modalidadeTrabalho')}
                      </div>
                    )}
                  </div>
              </div>

              <ValidatedField
                label="Portfolio"
                name="portfolio"
                type="url"
                value={formData.portfolio || ''}
                onChange={(value) => handleFieldChange('portfolio', value)}
                onBlur={() => handleFieldBlur('portfolio')}
                error={getFieldError('portfolio')}
                placeholder="https://..."
              />
              </TabsContent>

              <TabsContent value="habilidades" className="pt-6 space-y-6 animate-in fade-in-0 slide-in-from-right-2 duration-300">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <label className="block text-sm font-medium text-gray-700">Competências Técnicas</label>
                    <Badge variant="secondary" className="text-xs">Opcional</Badge>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Selecione as competências técnicas do candidato</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  
                  <SkillsAutocomplete
                    selectedSkills={skillsOptions.filter(opt => skillsIds.includes(opt.id))}
                    onSkillsChange={skills => {
                      setSkillsIds(skills.map(s => s.id));
                      // Atualiza também skillsOptions se necessário
                      setSkillsOptions(prev => {
                        const ids = new Set(skills.map(s => s.id));
                        // Mantém opções já existentes e adiciona novas
                        const novas = skills.filter(s => !prev.some(p => p.id === s.id));
                        return [...prev.filter(p => ids.has(p.id)), ...novas];
                      });
                    }}
                    placeholder="Busque e selecione competências..."
                    maxSkills={20}
                  />
                </div>
              </TabsContent>

              <TabsContent value="experiencia" className="pt-6 space-y-6 animate-in fade-in-0 slide-in-from-right-2 duration-300">
                <div className="space-y-4">
                  {formData.experienciaProfissional.map((exp, idx) => (
                    <div key={idx} className="border p-3 rounded mb-2">
                      <ValidatedField label="Empresa" name={`experienciaProfissional[${idx}].empresa`} value={exp.empresa} onChange={val => {
                        const arr = [...formData.experienciaProfissional];
                        arr[idx].empresa = val;
                        setFormData(prev => ({ ...prev, experienciaProfissional: arr }));
                      }} />
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Cargo</label>
                        <CargoAutocomplete
                          value={exp.cargo}
                          onChange={value => handleExperienceFieldChange(idx, 'cargo', value)}
                          placeholder="Digite ou selecione o cargo..."
                        />
                      </div>
                      <ValidatedField label="Data Início" name={`experienciaProfissional[${idx}].dataInicio`} type="date"
                        value={exp.dataInicio}
                        onChange={val => {
                          const arr = [...formData.experienciaProfissional];
                          arr[idx].dataInicio = val;
                          setFormData(prev => ({ ...prev, experienciaProfissional: arr }));
                        }}
                      />
                      <ValidatedField label="Data Fim" name={`experienciaProfissional[${idx}].dataFim`} type="date"
                        value={exp.dataFim}
                        onChange={val => {
                          const arr = [...formData.experienciaProfissional];
                          arr[idx].dataFim = val;
                          setFormData(prev => ({ ...prev, experienciaProfissional: arr }));
                        }}
                      />
                      <ValidatedField label="Descrição" name={`experienciaProfissional[${idx}].descricao`} value={exp.descricao} onChange={val => {
                        const arr = [...formData.experienciaProfissional];
                        arr[idx].descricao = val;
                        setFormData(prev => ({ ...prev, experienciaProfissional: arr }));
                      }} />
                      <Button variant="destructive" size="sm" onClick={() => {
                        setFormData(prev => ({ ...prev, experienciaProfissional: prev.experienciaProfissional.filter((_, i) => i !== idx) }));
                      }}>Remover</Button>
                  </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => {
                    setFormData(prev => ({ ...prev, experienciaProfissional: [...prev.experienciaProfissional, { empresa: '', cargo: '', dataInicio: '', dataFim: '', descricao: '', atual: true }] }));
                  }}>Adicionar Experiência</Button>
                </div>
              </TabsContent>

              <TabsContent value="formacao" className="pt-6 space-y-6 animate-in fade-in-0 slide-in-from-right-2 duration-300">
                <div className="space-y-4">
                  {formData.educacao.map((edu, idx) => (
                    <div key={idx} className="p-4 border rounded-lg bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Instituição</label>
                    <input
                      type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            value={edu.instituicao}
                            onChange={(e) => handleEducacaoChange(idx, 'instituicao', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Curso</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            value={edu.curso}
                            onChange={(e) => handleEducacaoChange(idx, 'curso', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Nível</label>
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400"
                            value={edu.nivel}
                            onChange={(e) => handleEducacaoChange(idx, 'nivel', e.target.value as 'superior' | 'tecnico' | 'pos_graduacao' | 'mestrado' | 'doutorado')}
                          >
                            <option value="superior">Superior</option>
                            <option value="tecnico">Técnico</option>
                            <option value="pos_graduacao">Pós-graduação</option>
                            <option value="mestrado">Mestrado</option>
                            <option value="doutorado">Doutorado</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400"
                            value={edu.status}
                            onChange={(e) => handleEducacaoChange(idx, 'status', e.target.value as 'concluido' | 'cursando' | 'trancado')}
                          >
                            <option value="cursando">Cursando</option>
                            <option value="concluido">Concluído</option>
                            <option value="trancado">Trancado</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Data de Início</label>
                          <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            value={edu.dataInicio}
                            onChange={(e) => handleEducacaoChange(idx, 'dataInicio', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Data de Conclusão</label>
                          <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            value={edu.dataConclusao || ''}
                            onChange={(e) => handleEducacaoChange(idx, 'dataConclusao', e.target.value)}
                          />
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                      onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            educacao: prev.educacao.filter((_, i) => i !== idx)
                          }));
                        }}
                        className="mt-2"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                  </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      educacao: [
                        ...prev.educacao,
                        {
                          status: 'cursando',
                          dataInicio: '',
                          instituicao: '',
                          curso: '',
                          nivel: 'superior',
                          dataConclusao: ''
                        }
                      ]
                    }));
                  }}>Adicionar Formação</Button>
              </div>
            </TabsContent>

              <TabsContent value="idiomas" className="pt-6 space-y-6 animate-in fade-in-0 slide-in-from-right-2 duration-300">
                <div className="space-y-4">
                  {formData.idiomas.map((idioma, idx) => (
                    <div key={idx} className="p-4 border rounded-lg bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Idioma</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            value={idioma.idioma}
                            onChange={(e) => handleIdiomaChange(idx, 'idioma', e.target.value)}
                          />
                </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Nível</label>
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400"
                            value={idioma.nivel}
                            onChange={(e) => handleIdiomaChange(idx, 'nivel', e.target.value as 'basico' | 'intermediario' | 'avancado' | 'fluente' | 'nativo')}
                          >
                            <option value="basico">Básico</option>
                            <option value="intermediario">Intermediário</option>
                            <option value="avancado">Avançado</option>
                            <option value="fluente">Fluente</option>
                            <option value="nativo">Nativo</option>
                          </select>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                          onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            idiomas: prev.idiomas.filter((_, i) => i !== idx)
                          }));
                        }}
                        className="mt-2"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      idiomas: [
                        ...prev.idiomas,
                        {
                          idioma: '',
                          nivel: 'basico'
                        }
                      ]
                    }));
                  }}>Adicionar Idioma</Button>
                  </div>
              </TabsContent>

              <TabsContent value="certificacoes" className="pt-6 space-y-6 animate-in fade-in-0 slide-in-from-right-2 duration-300">
                <div className="space-y-4">
                  {formData.certificacoes.map((cert, idx) => (
                    <div key={idx} className="border p-3 rounded mb-2">
                      <ValidatedField label="Nome" name={`certificacoes[${idx}].nome`} value={cert.nome} onChange={val => {
                        const arr = [...formData.certificacoes];
                        arr[idx].nome = val;
                        setFormData(prev => ({ ...prev, certificacoes: arr }));
                      }} />
                      <ValidatedField label="Instituição" name={`certificacoes[${idx}].instituicao`} value={cert.instituicao} onChange={val => {
                        const arr = [...formData.certificacoes];
                        arr[idx].instituicao = val;
                        setFormData(prev => ({ ...prev, certificacoes: arr }));
                      }} />
                      <ValidatedField
                        label="Data Emissão"
                        name={`certificacoes[${idx}].dataEmissao`}
                        type="date"
                        value={cert.dataEmissao}
                        onChange={val => {
                          const arr = [...formData.certificacoes];
                          arr[idx].dataEmissao = val;
                          setFormData(prev => ({ ...prev, certificacoes: arr }));
                        }}
                        error={getFieldError(`certificacoes[${idx}].dataEmissao`)}
                      />
                      <ValidatedField
                        label="Data Vencimento"
                        name={`certificacoes[${idx}].dataVencimento`}
                        type="date"
                        value={cert.dataVencimento}
                        onChange={val => {
                          const arr = [...formData.certificacoes];
                          arr[idx].dataVencimento = val;
                          setFormData(prev => ({ ...prev, certificacoes: arr }));
                        }}
                        error={getFieldError(`certificacoes[${idx}].dataVencimento`)}
                      />
                      <Button variant="destructive" size="sm" onClick={() => {
                        setFormData(prev => ({ ...prev, certificacoes: prev.certificacoes.filter((_, i) => i !== idx) }));
                      }}>Remover</Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => {
                    setFormData(prev => ({ ...prev, certificacoes: [...prev.certificacoes, { nome: '', instituicao: '', dataEmissao: '', dataVencimento: '' }] }));
                  }}>Adicionar Certificação</Button>
              </div>
            </TabsContent>

            <TabsContent value="adicionais" className="pt-6 space-y-6 animate-in fade-in-0 slide-in-from-right-2 duration-300">
              <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Últimas cidades em que morou</label>
                  {(formData.cidadesMorou || []).map((item, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        value={item.cidade}
                        onChange={e => {
                          const arr = [...formData.cidadesMorou];
                          arr[idx].cidade = e.target.value;
                          setFormData(prev => ({ ...prev, cidadesMorou: arr }));
                        }}
                        placeholder="Cidade"
                      />
                      <select
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                        value={item.estado}
                        onChange={e => {
                          const arr = [...formData.cidadesMorou];
                          arr[idx].estado = e.target.value;
                          setFormData(prev => ({ ...prev, cidadesMorou: arr }));
                        }}
                      >
                        <option value="">Estado</option>
                        {ESTADOS.map(e => (
                          <option key={e.sigla} value={e.sigla}>{e.nome}</option>
                        ))}
                      </select>
                      <Button variant="destructive" size="sm" onClick={() => {
                        setFormData(prev => ({ ...prev, cidadesMorou: prev.cidadesMorou.filter((_, i) => i !== idx) }));
                      }}>Remover</Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => {
                    setFormData(prev => ({ ...prev, cidadesMorou: [...prev.cidadesMorou, { cidade: '', estado: '' }] }));
                  }}>Adicionar Cidade</Button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contatos Adicionais</label>
                  {formData.contatosAdicionais.map((contato, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                      <input
                        type="text"
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                        value={contato.nome}
                        onChange={e => {
                          const arr = [...formData.contatosAdicionais];
                          arr[idx].nome = e.target.value;
                          setFormData(prev => ({ ...prev, contatosAdicionais: arr }));
                        }}
                        placeholder="Nome"
                      />
                      <input
                        type="text"
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                        value={contato.telefone}
                        onChange={e => {
                          const arr = [...formData.contatosAdicionais];
                          arr[idx].telefone = e.target.value;
                          setFormData(prev => ({ ...prev, contatosAdicionais: arr }));
                        }}
                        placeholder="Telefone"
                      />
                      <select
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                        value={contato.parentesco}
                        onChange={e => {
                          const arr = [...formData.contatosAdicionais];
                          arr[idx].parentesco = e.target.value;
                          setFormData(prev => ({ ...prev, contatosAdicionais: arr }));
                        }}
                      >
                        <option value="">Parentesco</option>
                        <option value="Pai">Pai</option>
                        <option value="Mãe">Mãe</option>
                        <option value="Irmão">Irmão</option>
                        <option value="Irmã">Irmã</option>
                        <option value="Cônjuge">Cônjuge</option>
                        <option value="Amigo">Amigo</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contatos de Referências</label>
                  {formData.referencias.map((ref, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                      <input
                        type="text"
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                        value={ref.nome}
                        onChange={e => {
                          const arr = [...formData.referencias];
                          arr[idx].nome = e.target.value;
                          setFormData(prev => ({ ...prev, referencias: arr }));
                        }}
                        placeholder="Nome"
                      />
                      <input
                        type="text"
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                        value={ref.telefone}
                        onChange={e => {
                          const arr = [...formData.referencias];
                          arr[idx].telefone = e.target.value;
                          setFormData(prev => ({ ...prev, referencias: arr }));
                        }}
                        placeholder="Telefone"
                      />
                      <input
                        type="text"
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                        value={ref.empresa || ''}
                        onChange={e => {
                          const arr = [...formData.referencias];
                          arr[idx].empresa = e.target.value;
                          setFormData(prev => ({ ...prev, referencias: arr }));
                        }}
                        placeholder="Empresa (opcional)"
                      />
                      <Button variant="destructive" size="sm" onClick={() => {
                        setFormData(prev => ({ ...prev, referencias: prev.referencias.filter((_, i) => i !== idx) }));
                      }}>Remover</Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => {
                    setFormData(prev => ({ ...prev, referencias: [...prev.referencias, { nome: '', telefone: '', empresa: '' }] }));
                  }}>Adicionar Referência</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          </TooltipProvider>
        </div>

        <DialogFooter className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {backendError && (
                <div className="flex items-center gap-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {backendError}
            </div>
          )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isEditing ? 'Atualizar' : 'Cadastrar'}
                  </>
                )}
            </Button>
          </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 