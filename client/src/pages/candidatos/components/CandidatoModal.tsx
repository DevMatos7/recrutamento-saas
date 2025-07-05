import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { ValidatedField, CPFField, CEPField, PhoneField } from './ValidatedField';
import { useCandidatoValidation } from '../hooks/useCandidatoValidation';
import { useCreateCandidato, useUpdateCandidato } from '../hooks/useCandidatos';
import { type Candidato } from '@shared/schema';
import { type CandidatoFormData } from '../validations/candidatoSchema';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface CandidatoModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCandidato?: Candidato | null;
}

const INITIAL_FORM_DATA: CandidatoFormData = {
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
};

const HABILIDADES_OPTIONS = [
  'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Node.js',
  'Python', 'Java', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
  'SQL', 'MongoDB', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes',
  'AWS', 'Azure', 'GCP', 'Git', 'CI/CD', 'Agile', 'Scrum',
  'UI/UX', 'Figma', 'Adobe Creative Suite', 'Marketing Digital',
  'Vendas', 'Atendimento ao Cliente', 'Gestão de Projetos'
];

// Lista de estados e cidades (exemplo simplificado, pode ser expandido)
const ESTADOS = [
  { sigla: 'AC', nome: 'Acre', cidades: ['Rio Branco', 'Cruzeiro do Sul'] },
  { sigla: 'MT', nome: 'Mato Grosso', cidades: ['Cuiabá', 'Campo Novo do Parecis', 'Várzea Grande'] },
  { sigla: 'SP', nome: 'São Paulo', cidades: ['São Paulo', 'Campinas', 'Santos'] },
  // ...adicionar todos os estados e cidades relevantes
];

// Habilidades sugeridas por formação (exemplo)
const HABILIDADES_POR_CURSO: Record<string, string[]> = {
  'Ciências da Computação': ['Programação', 'Banco de Dados', 'Algoritmos', 'Estrutura de Dados', 'Desenvolvimento Web'],
  'Administração': ['Gestão de Pessoas', 'Finanças', 'Planejamento', 'Negociação'],
  'Contabilidade': ['Contabilidade Geral', 'Análise de Balanços', 'Fiscal', 'Tributário'],
  // ...adicionar mais cursos e habilidades
};

export function CandidatoModal({ isOpen, onClose, editingCandidato }: CandidatoModalProps) {
  const [formData, setFormData] = useState<CandidatoFormData>(INITIAL_FORM_DATA);
  const [activeTab, setActiveTab] = useState('basico');
  const [backendError, setBackendError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const { validateForm, validateField, getFieldError, clearFieldError, hasErrors, getErrorCount } = useCandidatoValidation();
  const createMutation = useCreateCandidato();
  const updateMutation = useUpdateCandidato();
  const { data: empresas = [] } = useQuery({ queryKey: ["/api/empresas"] });

  const isEditing = !!editingCandidato;

  useEffect(() => {
    if (editingCandidato) {
      setFormData({
        nome: editingCandidato.nome ?? '',
        email: editingCandidato.email ?? '',
        telefone: editingCandidato.telefone ?? '',
        curriculoUrl: editingCandidato.curriculoUrl ?? '',
        linkedin: editingCandidato.linkedin ?? '',
        status: editingCandidato.status === 'ativo' ? 'ativo' : 'inativo',
        origem: ['manual', 'portal_candidato', 'importado'].includes(editingCandidato.origem ?? '') ? (editingCandidato.origem as any) : 'manual',
        empresaId: editingCandidato.empresaId ?? '',
        password: '',
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
        experienciaProfissional: Array.isArray(editingCandidato.experienciaProfissional) ? editingCandidato.experienciaProfissional : [],
        educacao: Array.isArray(editingCandidato.educacao) ? editingCandidato.educacao : [],
        habilidades: Array.isArray(editingCandidato.habilidades) ? editingCandidato.habilidades : [],
        idiomas: Array.isArray(editingCandidato.idiomas) ? editingCandidato.idiomas : [],
        certificacoes: Array.isArray(editingCandidato.certificacoes) ? editingCandidato.certificacoes : [],
      });
    } else {
      setFormData(INITIAL_FORM_DATA);
    }
  }, [editingCandidato, isOpen]);

  const handleFieldChange = (field: keyof CandidatoFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  const handleFieldBlur = (field: keyof CandidatoFormData) => {
    const error = validateField(field, formData[field]);
    if (error) {
      console.warn(`Erro de validação no campo ${field}:`, error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBackendError(null);
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
    };
    // Validar formulário completo
    const isValid = validateForm(dataToSubmit, isEditing);
    if (!isValid) {
      setBackendError('Por favor, corrija os campos destacados em vermelho.');
      return;
    }
    try {
      if (isEditing && editingCandidato) {
        await updateMutation.mutateAsync({ id: editingCandidato.id, data: dataToSubmit });
      } else {
        await createMutation.mutateAsync(dataToSubmit);
      }
      onClose();
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

  // Função para upload e parsing automático do currículo
  const handleCurriculoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await axios.post('/api/curriculos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const dados = resp.data;
      // Verifica se algum campo relevante foi extraído
      const camposExtraidos = [dados.nome, dados.email, dados.telefone, dados.experiencia, dados.formacao].filter(Boolean);
      if (camposExtraidos.length === 0) {
        setUploadError('Nenhum dado relevante foi extraído do currículo. Preencha os campos manualmente.');
      } else {
        setFormData(prev => ({
          ...prev,
          nome: dados.nome || prev.nome,
          email: dados.email || prev.email,
          telefone: dados.telefone || prev.telefone,
          resumoProfissional: dados.experiencia || prev.resumoProfissional,
          // Se quiser preencher outros campos, adicione aqui
        }));
      }
    } catch (err: any) {
      setUploadError('Erro ao processar o currículo. Tente outro arquivo ou preencha manualmente.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{isEditing ? 'Editar Candidato' : 'Novo Candidato'}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        {backendError && (
          <div className="bg-red-100 border border-red-300 text-red-700 rounded p-3 mb-4">
            <strong>{backendError}</strong>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload de Currículo */}
          <div>
            <label className="block font-medium mb-1">Currículo (PDF ou DOCX)</label>
            <input type="file" accept=".pdf,.doc,.docx" onChange={handleCurriculoUpload} disabled={uploading} />
            {uploading && <span className="text-blue-600 text-sm ml-2">Processando currículo...</span>}
            {uploadError && <span className="text-red-600 text-sm ml-2">{uploadError}</span>}
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basico">Básico</TabsTrigger>
              <TabsTrigger value="pessoal">Pessoal</TabsTrigger>
              <TabsTrigger value="profissional">Profissional</TabsTrigger>
              <TabsTrigger value="habilidades">Habilidades</TabsTrigger>
            </TabsList>

            <TabsContent value="basico" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedField
                  label="Nome"
                  name="nome"
                  type="text"
                  value={formData.nome || ''}
                  onChange={(value) => handleFieldChange('nome', value)}
                  onBlur={() => handleFieldBlur('nome')}
                  error={getFieldError('nome')}
                  required
                  placeholder="Nome completo"
                />
                
                <ValidatedField
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(value) => handleFieldChange('email', value)}
                  onBlur={() => handleFieldBlur('email')}
                  error={getFieldError('email')}
                  required
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PhoneField
                  label="Telefone"
                  name="telefone"
                  value={formData.telefone || ''}
                  onChange={(value) => handleFieldChange('telefone', value)}
                  onBlur={() => handleFieldBlur('telefone')}
                  error={getFieldError('telefone')}
                  required
                />
                
                <ValidatedField
                  label="Status"
                  name="status"
                  type="select"
                  value={formData.status ?? undefined}
                  onChange={(value) => handleFieldChange('status', value)}
                  options={[
                    { value: 'ativo', label: 'Ativo' },
                    { value: 'inativo', label: 'Inativo' }
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedField
                  label="Empresa"
                  name="empresaId"
                  type="select"
                  value={formData.empresaId || ''}
                  onChange={(value) => handleFieldChange('empresaId', value)}
                  onBlur={() => handleFieldBlur('empresaId')}
                  error={getFieldError('empresaId')}
                  required
                  options={empresas.map((empresa: any) => ({ value: empresa.id, label: empresa.nome }))}
                  placeholder="Selecione a empresa"
                />
                
                <ValidatedField
                  label="Senha"
                  name="password"
                  type="password"
                  value={formData.password || ''}
                  onChange={(value) => handleFieldChange('password', value)}
                  onBlur={() => handleFieldBlur('password')}
                  error={getFieldError('password')}
                  required
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedField
                  label="LinkedIn"
                  name="linkedin"
                  type="url"
                  value={formData.linkedin || ''}
                  onChange={(value) => handleFieldChange('linkedin', value)}
                  onBlur={() => handleFieldBlur('linkedin')}
                  error={getFieldError('linkedin')}
                  placeholder="https://linkedin.com/in/..."
                />
                
                <ValidatedField
                  label="URL do Currículo"
                  name="curriculoUrl"
                  type="url"
                  value={formData.curriculoUrl || ''}
                  onChange={(value) => handleFieldChange('curriculoUrl', value)}
                  onBlur={() => handleFieldBlur('curriculoUrl')}
                  error={getFieldError('curriculoUrl')}
                  placeholder="https://..."
                />
              </div>
            </TabsContent>

            <TabsContent value="pessoal" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CPFField
                  label="CPF"
                  name="cpf"
                  value={formData.cpf || ''}
                  onChange={(value) => handleFieldChange('cpf', value)}
                  onBlur={() => handleFieldBlur('cpf')}
                  error={getFieldError('cpf')}
                  placeholder="000.000.000-00"
                />
                
                <ValidatedField
                  label="Data de Nascimento"
                  name="dataNascimento"
                  type="date"
                  value={formData.dataNascimento || ''}
                  onChange={(value) => handleFieldChange('dataNascimento', value)}
                  onBlur={() => handleFieldBlur('dataNascimento')}
                  error={getFieldError('dataNascimento')}
                />
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ValidatedField
                  label="Cidade"
                  name="cidade"
                  type="select"
                  value={formData.cidade || ''}
                  onChange={(value) => handleFieldChange('cidade', value)}
                  options={
                    (ESTADOS.find(e => e.sigla === formData.estado)?.cidades || []).map(cidade => ({ value: cidade, label: cidade }))
                  }
                  disabled={!formData.estado}
                  placeholder="Selecione o estado primeiro"
                />
                
                <ValidatedField
                  label="Estado"
                  name="estado"
                  type="select"
                  value={formData.estado || ''}
                  onChange={(value) => {
                    handleFieldChange('estado', value);
                    handleFieldChange('cidade', ''); // Limpa cidade ao trocar estado
                  }}
                  options={ESTADOS.map(e => ({ value: e.sigla, label: e.nome }))}
                  placeholder="Selecione o estado"
                />
                
                <CEPField
                  label="CEP"
                  name="cep"
                  value={formData.cep || ''}
                  onChange={(value) => handleFieldChange('cep', value)}
                  onBlur={() => handleFieldBlur('cep')}
                  error={getFieldError('cep')}
                  placeholder="00000-000"
                />
              </div>
            </TabsContent>

            <TabsContent value="profissional" className="space-y-4">
              <ValidatedField
                label="Cargo Atual"
                name="cargo"
                type="text"
                value={formData.cargo || ''}
                onChange={(value) => handleFieldChange('cargo', value)}
                onBlur={() => handleFieldBlur('cargo')}
                error={getFieldError('cargo')}
                placeholder="Ex: Desenvolvedor Frontend"
              />

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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ValidatedField
                  label="Pretensão Salarial"
                  name="pretensoSalarial"
                  type="text"
                  value={formatCurrency(formData.pretensoSalarial || '')}
                  onChange={(value) => {
                    // Salva apenas os números, mas exibe formatado
                    const onlyNums = value.replace(/\D/g, '');
                    handleFieldChange('pretensoSalarial', onlyNums);
                  }}
                  onBlur={() => handleFieldBlur('pretensoSalarial')}
                  error={getFieldError('pretensoSalarial')}
                  placeholder="R$ 5.000,00"
                />
                
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
                />
                
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
                />
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

              {/* Habilidades sugeridas conforme formação */}
              <div>
                <label className="block text-sm font-medium mb-1">Habilidades</label>
                {/* Sugerir habilidades conforme curso/educação principal */}
                {(() => {
                  // Pega o curso principal informado
                  const curso = formData.educacao && formData.educacao[0]?.curso;
                  const habilidadesSugeridas = curso && HABILIDADES_POR_CURSO[curso] ? HABILIDADES_POR_CURSO[curso] : HABILIDADES_OPTIONS;
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2 max-h-40 overflow-y-auto">
                      {habilidadesSugeridas.map(habilidade => (
                        <label key={habilidade} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.habilidades?.includes(habilidade) || false}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const current = formData.habilidades || [];
                              const newHabilidades = checked
                                ? [...current, habilidade]
                                : current.filter(h => h !== habilidade);
                              handleFieldChange('habilidades', newHabilidades);
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{habilidade}</span>
                        </label>
                      ))}
                      {/* Opção Outros */}
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.habilidades?.some(h => !habilidadesSugeridas.includes(h))}
                          onChange={(e) => {
                            if (!e.target.checked) {
                              // Remove habilidades customizadas
                              const novas = (formData.habilidades || []).filter(h => habilidadesSugeridas.includes(h));
                              handleFieldChange('habilidades', novas);
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">Outros</span>
                      </label>
                    </div>
                  );
                })()}
                {/* Campo para digitar habilidade personalizada se Outros estiver selecionado */}
                {formData.habilidades?.some(h => !HABILIDADES_OPTIONS.includes(h)) && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      className="border rounded px-2 py-1 w-full"
                      placeholder="Digite uma habilidade personalizada"
                      value={formData.habilidades?.find(h => !HABILIDADES_OPTIONS.includes(h)) || ''}
                      onChange={e => {
                        // Substitui ou adiciona a habilidade customizada
                        const custom = e.target.value;
                        const semCustom = (formData.habilidades || []).filter(h => HABILIDADES_OPTIONS.includes(h));
                        handleFieldChange('habilidades', custom ? [...semCustom, custom] : semCustom);
                      }}
                    />
                    <button
                      type="button"
                      className="px-3 py-1 bg-red-100 text-red-700 rounded"
                      onClick={() => {
                        // Remove habilidade customizada
                        const semCustom = (formData.habilidades || []).filter(h => HABILIDADES_OPTIONS.includes(h));
                        handleFieldChange('habilidades', semCustom);
                      }}
                    >Remover</button>
                  </div>
                )}
                {formData.habilidades && formData.habilidades.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.habilidades.map(habilidade => (
                      <Badge key={habilidade} variant="secondary" className="text-xs">
                        {habilidade}
                        <button
                          onClick={() => {
                            const newHabilidades = formData.habilidades.filter(h => h !== habilidade);
                            handleFieldChange('habilidades', newHabilidades);
                          }}
                          className="ml-1 hover:bg-red-100 rounded-full w-4 h-4 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="habilidades" className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Habilidades</h3>
                  <Button type="button" onClick={addHabilidade} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Habilidade
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {formData.habilidades.map((habilidade, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {habilidade}
                      <button
                        type="button"
                        onClick={() => removeHabilidade(index)}
                        className="hover:bg-red-100 rounded-full w-4 h-4 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                
                {formData.habilidades.length === 0 && (
                  <p className="text-gray-500 text-sm">Nenhuma habilidade adicionada</p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {hasErrors() && (
            <div className="bg-red-100 border border-red-300 text-red-700 rounded p-3 mt-4">
              <strong>Por favor, corrija os seguintes erros:</strong>
              <ul className="list-disc pl-5 mt-1">
                {errorMessages.length > 0 ? (
                  errorMessages.map((msg, idx) => <li key={idx}>{msg}</li>)
                ) : (
                  <li>Preencha todos os campos obrigatórios corretamente.</li>
                )}
              </ul>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending || hasErrors()}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {createMutation.isPending || updateMutation.isPending 
                ? "Salvando..." 
                : (isEditing ? "Atualizar" : "Criar Candidato")
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 