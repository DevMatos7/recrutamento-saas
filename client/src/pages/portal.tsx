import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Briefcase, 
  MapPin, 
  Clock,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Award,
  Languages, 
  Building2, 
  FileText, 
  Calendar,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
  Brain,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CandidatePortalProps {
  isAuthenticated: boolean;
  candidate?: any;
  onLogin: (candidate: any) => void;
  onLogout: () => void;
}

export default function CandidatePortal({ isAuthenticated, candidate, onLogin, onLogout }: CandidatePortalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Multi-step registration form component
  const CurriculumRegistrationForm = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<{
      nome: string;
      email: string;
      telefone: string;
      password: string;
      cpf: string;
      dataNascimento: string;
      endereco: string;
      cidade: string;
      estado: string;
      cep: string;
      cargo: string;
      resumoProfissional: string;
      experienciaProfissional: Array<{
        empresa: string;
        cargo: string;
        dataInicio: string;
        dataFim: string;
        descricao: string;
        atual: boolean;
      }>;
      educacao: Array<{
        instituicao: string;
        curso: string;
        nivel: string;
        dataInicio: string;
        dataConclusao: string;
        status: string;
      }>;
      habilidades: string[];
      idiomas: Array<{
        idioma: string;
        nivel: string;
      }>;
      certificacoes: Array<{
        nome: string;
        instituicao: string;
        dataEmissao: string;
        dataVencimento: string;
      }>;
      linkedin: string;
      portfolio: string;
      pretensoSalarial: string;
      disponibilidade: string;
      modalidadeTrabalho: string;
    }>({
      // Basic info
      nome: "",
      email: "",
      telefone: "",
      password: "",
      
      // Personal info
      cpf: "",
      dataNascimento: "",
      endereco: "",
      cidade: "",
      estado: "",
      cep: "",
      
      // Professional info
      cargo: "",
      resumoProfissional: "",
      experienciaProfissional: [],
      educacao: [],
      habilidades: [],
      idiomas: [],
      certificacoes: [],
      
      // Links
      linkedin: "",
      portfolio: "",
      
      // Preferences
      pretensoSalarial: "",
      disponibilidade: "",
      modalidadeTrabalho: ""
    });

    const addExperience = () => {
      setFormData(prev => ({
        ...prev,
        experienciaProfissional: [...prev.experienciaProfissional, {
          empresa: "",
          cargo: "",
          dataInicio: "",
          dataFim: "",
          descricao: "",
          atual: false
        }]
      }));
    };

    const removeExperience = (index: number) => {
      setFormData(prev => ({
        ...prev,
        experienciaProfissional: prev.experienciaProfissional.filter((_, i) => i !== index)
      }));
    };

    const updateExperience = (index: number, field: string, value: any) => {
      setFormData(prev => ({
        ...prev,
        experienciaProfissional: prev.experienciaProfissional.map((exp, i) => 
          i === index ? { ...exp, [field]: value } : exp
        )
      }));
    };

    const addEducation = () => {
      setFormData(prev => ({
        ...prev,
        educacao: [...prev.educacao, {
          instituicao: "",
          curso: "",
          nivel: "",
          dataInicio: "",
          dataConclusao: "",
          status: ""
        }]
      }));
    };

    const removeEducation = (index: number) => {
      setFormData(prev => ({
        ...prev,
        educacao: prev.educacao.filter((_, i) => i !== index)
      }));
    };

    const updateEducation = (index: number, field: string, value: any) => {
      setFormData(prev => ({
        ...prev,
        educacao: prev.educacao.map((edu, i) => 
          i === index ? { ...edu, [field]: value } : edu
        )
      }));
    };

    const addSkill = (skill: string) => {
      if (skill && !formData.habilidades.includes(skill)) {
        setFormData(prev => ({
          ...prev,
          habilidades: [...prev.habilidades, skill]
        }));
      }
    };

    const removeSkill = (skill: string) => {
      setFormData(prev => ({
        ...prev,
        habilidades: prev.habilidades.filter(s => s !== skill)
      }));
    };

    const addLanguage = () => {
      setFormData(prev => ({
        ...prev,
        idiomas: [...prev.idiomas, { idioma: "", nivel: "" }]
      }));
    };

    const removeLanguage = (index: number) => {
      setFormData(prev => ({
        ...prev,
        idiomas: prev.idiomas.filter((_, i) => i !== index)
      }));
    };

    const updateLanguage = (index: number, field: string, value: any) => {
      setFormData(prev => ({
        ...prev,
        idiomas: prev.idiomas.map((lang, i) => 
          i === index ? { ...lang, [field]: value } : lang
        )
      }));
    };

    const addCertification = () => {
      setFormData(prev => ({
        ...prev,
        certificacoes: [...prev.certificacoes, {
          nome: "",
          instituicao: "",
          dataEmissao: "",
          dataVencimento: ""
        }]
      }));
    };

    const removeCertification = (index: number) => {
      setFormData(prev => ({
        ...prev,
        certificacoes: prev.certificacoes.filter((_, i) => i !== index)
      }));
    };

    const updateCertification = (index: number, field: string, value: any) => {
      setFormData(prev => ({
        ...prev,
        certificacoes: prev.certificacoes.map((cert, i) => 
          i === index ? { ...cert, [field]: value } : cert
        )
      }));
    };

    const handleSubmit = () => {
      const registrationData = {
        ...formData,
        empresaId: "d09726b8-601d-4676-aad3-ff25a877467d" // Default company for demo
      };
      
      registerMutation.mutate(registrationData);
    };

    const nextStep = () => {
      if (currentStep < 5) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
      if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const steps = [
      { id: 1, title: "Dados Básicos", icon: Building2 },
      { id: 2, title: "Experiência", icon: Briefcase },
      { id: 3, title: "Educação", icon: GraduationCap },
      { id: 4, title: "Competências", icon: Award },
      { id: 5, title: "Preferências", icon: FileText }
    ];

    return (
      <div className="space-y-6">
        {/* Progress indicator */}
        <div className="flex justify-between items-center">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.id} 
                className={`flex flex-col items-center text-xs ${
                  currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                  currentStep >= step.id ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span>{step.title}</span>
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="space-y-4">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dados Básicos</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input 
                    id="nome" 
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input 
                    id="telefone" 
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="password">Senha *</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input 
                    id="cpf" 
                    value={formData.cpf}
                    onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                  <Input 
                    id="dataNascimento" 
                    type="date" 
                    value={formData.dataNascimento}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataNascimento: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input 
                  id="endereco" 
                  value={formData.endereco}
                  onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input 
                    id="cidade" 
                    value={formData.cidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Input 
                    id="estado" 
                    value={formData.estado}
                    onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input 
                    id="cep" 
                    value={formData.cep}
                    onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Experiência Profissional</h3>
                <Button type="button" onClick={addExperience} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              
              <div>
                <Label htmlFor="cargo">Cargo Atual/Desejado</Label>
                <Input 
                  id="cargo" 
                  value={formData.cargo}
                  onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="resumoProfissional">Resumo Profissional</Label>
                <Textarea 
                  id="resumoProfissional"
                  value={formData.resumoProfissional}
                  onChange={(e) => setFormData(prev => ({ ...prev, resumoProfissional: e.target.value }))}
                  rows={3}
                  placeholder="Descreva brevemente sua experiência e objetivos profissionais..."
                />
              </div>

              {formData.experienciaProfissional.map((exp, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium">Experiência {index + 1}</h4>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeExperience(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Empresa</Label>
                      <Input 
                        value={exp.empresa}
                        onChange={(e) => updateExperience(index, 'empresa', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Cargo</Label>
                      <Input 
                        value={exp.cargo}
                        onChange={(e) => updateExperience(index, 'cargo', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Data Início</Label>
                      <Input 
                        type="date"
                        value={exp.dataInicio}
                        onChange={(e) => updateExperience(index, 'dataInicio', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Data Fim</Label>
                      <Input 
                        type="date"
                        value={exp.dataFim}
                        onChange={(e) => updateExperience(index, 'dataFim', e.target.value)}
                        disabled={exp.atual}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <Label>Descrição das Atividades</Label>
                    <Textarea 
                      value={exp.descricao}
                      onChange={(e) => updateExperience(index, 'descricao', e.target.value)}
                      rows={2}
                    />
                  </div>
                  
                  <div className="mt-3">
                    <label className="flex items-center space-x-2">
                      <input 
                        type="checkbox"
                        checked={exp.atual}
                        onChange={(e) => updateExperience(index, 'atual', e.target.checked)}
                      />
                      <span>Trabalho atualmente nesta empresa</span>
                    </label>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Educação</h3>
                <Button type="button" onClick={addEducation} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              {formData.educacao.map((edu, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium">Formação {index + 1}</h4>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeEducation(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Instituição</Label>
                      <Input 
                        value={edu.instituicao}
                        onChange={(e) => updateEducation(index, 'instituicao', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Curso</Label>
                      <Input 
                        value={edu.curso}
                        onChange={(e) => updateEducation(index, 'curso', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Nível</Label>
                      <Select 
                        value={edu.nivel}
                        onValueChange={(value) => updateEducation(index, 'nivel', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o nível" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ensino_medio">Ensino Médio</SelectItem>
                          <SelectItem value="tecnico">Técnico</SelectItem>
                          <SelectItem value="superior">Superior</SelectItem>
                          <SelectItem value="pos_graduacao">Pós-graduação</SelectItem>
                          <SelectItem value="mestrado">Mestrado</SelectItem>
                          <SelectItem value="doutorado">Doutorado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select 
                        value={edu.status}
                        onValueChange={(value) => updateEducation(index, 'status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="concluido">Concluído</SelectItem>
                          <SelectItem value="cursando">Cursando</SelectItem>
                          <SelectItem value="trancado">Trancado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Data Início</Label>
                      <Input 
                        type="date"
                        value={edu.dataInicio}
                        onChange={(e) => updateEducation(index, 'dataInicio', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Data Conclusão</Label>
                      <Input 
                        type="date"
                        value={edu.dataConclusao}
                        onChange={(e) => updateEducation(index, 'dataConclusao', e.target.value)}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Competências e Habilidades</h3>
              
              <div>
                <Label>Habilidades/Competências</Label>
                <div className="flex gap-2 mb-2">
                  <Input 
                    placeholder="Digite uma habilidade e pressione Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        addSkill(target.value);
                        target.value = '';
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.habilidades.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer">
                      {skill}
                      <button 
                        onClick={() => removeSkill(skill)}
                        className="ml-2 text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label>Idiomas</Label>
                  <Button type="button" onClick={addLanguage} size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                
                {formData.idiomas.map((lang, index) => (
                  <div key={index} className="flex gap-3 items-end mb-2">
                    <div className="flex-1">
                      <Label>Idioma</Label>
                      <Input 
                        value={lang.idioma}
                        onChange={(e) => updateLanguage(index, 'idioma', e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <Label>Nível</Label>
                      <Select 
                        value={lang.nivel}
                        onValueChange={(value) => updateLanguage(index, 'nivel', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Nível" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basico">Básico</SelectItem>
                          <SelectItem value="intermediario">Intermediário</SelectItem>
                          <SelectItem value="avancado">Avançado</SelectItem>
                          <SelectItem value="fluente">Fluente</SelectItem>
                          <SelectItem value="nativo">Nativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeLanguage(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label>Certificações</Label>
                  <Button type="button" onClick={addCertification} size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                
                {formData.certificacoes.map((cert, index) => (
                  <Card key={index} className="p-3 mb-3">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium">Certificação {index + 1}</h4>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeCertification(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Nome da Certificação</Label>
                        <Input 
                          value={cert.nome}
                          onChange={(e) => updateCertification(index, 'nome', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Instituição</Label>
                        <Input 
                          value={cert.instituicao}
                          onChange={(e) => updateCertification(index, 'instituicao', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Data Emissão</Label>
                        <Input 
                          type="date"
                          value={cert.dataEmissao}
                          onChange={(e) => updateCertification(index, 'dataEmissao', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Data Vencimento</Label>
                        <Input 
                          type="date"
                          value={cert.dataVencimento}
                          onChange={(e) => updateCertification(index, 'dataVencimento', e.target.value)}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Preferências Profissionais</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input 
                    id="linkedin" 
                    type="url"
                    value={formData.linkedin}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                    placeholder="https://linkedin.com/in/seu-perfil"
                  />
                </div>
                <div>
                  <Label htmlFor="portfolio">Portfólio/Site</Label>
                  <Input 
                    id="portfolio" 
                    type="url"
                    value={formData.portfolio}
                    onChange={(e) => setFormData(prev => ({ ...prev, portfolio: e.target.value }))}
                    placeholder="https://seu-portfolio.com"
                  />
                </div>
                <div>
                  <Label htmlFor="pretensoSalarial">Pretensão Salarial</Label>
                  <Input 
                    id="pretensoSalarial" 
                    value={formData.pretensoSalarial}
                    onChange={(e) => setFormData(prev => ({ ...prev, pretensoSalarial: e.target.value }))}
                    placeholder="Ex: R$ 5.000 - R$ 8.000"
                  />
                </div>
                <div>
                  <Label htmlFor="disponibilidade">Disponibilidade</Label>
                  <Select 
                    value={formData.disponibilidade}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, disponibilidade: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione sua disponibilidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="imediata">Imediata</SelectItem>
                      <SelectItem value="15_dias">15 dias</SelectItem>
                      <SelectItem value="30_dias">30 dias</SelectItem>
                      <SelectItem value="60_dias">60 dias</SelectItem>
                      <SelectItem value="a_combinar">A combinar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="modalidadeTrabalho">Modalidade de Trabalho</Label>
                  <Select 
                    value={formData.modalidadeTrabalho}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, modalidadeTrabalho: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a modalidade preferida" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="remoto">Remoto</SelectItem>
                      <SelectItem value="hibrido">Híbrido</SelectItem>
                      <SelectItem value="indiferente">Indiferente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
          
          {currentStep < 5 ? (
            <Button 
              type="button" 
              onClick={nextStep}
              disabled={
                (currentStep === 1 && (!formData.nome || !formData.email || !formData.telefone || !formData.password))
              }
            >
              Próximo
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={handleSubmit}
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Cadastrando..." : "Finalizar Cadastro"}
            </Button>
          )}
        </div>
      </div>
    );
  };
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // Authentication mutations
  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/candidate-portal/login", data);
      return await res.json();
    },
    onSuccess: (data) => {
      onLogin(data.candidate);
      toast({ title: "Login realizado com sucesso!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro no login", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/candidate-portal/register", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Cadastro realizado com sucesso! Faça login para continuar." });
      setAuthMode('login');
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro no cadastro", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/candidate-portal/logout");
      return await res.json();
    },
    onSuccess: () => {
      onLogout();
      toast({ title: "Logout realizado com sucesso!" });
    }
  });

  // Portal data queries
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["/api/candidate-portal/vagas"],
    enabled: !isAuthenticated
  });

  const { data: dashboard } = useQuery({
    queryKey: ["/api/candidate-portal/dashboard"],
    enabled: isAuthenticated
  });

  const { data: profileData } = useQuery({
    queryKey: ["/api/candidate-portal/profile"],
    enabled: isAuthenticated
  });

  const myApplications = Array.isArray(profileData?.candidaturas) ? profileData.candidaturas : [];

  const { data: pendingTests } = useQuery({
    queryKey: ["/api/candidate-portal/tests"],
    enabled: isAuthenticated
  });

  const { data: interviews } = useQuery({
    queryKey: ["/api/candidate-portal/interviews"],
    enabled: isAuthenticated
  });

  const { data: notifications } = useQuery({
    queryKey: ["/api/candidate-portal/notifications"],
    enabled: isAuthenticated
  });

  // Application mutation
  const applyMutation = useMutation({
    mutationFn: async (vagaId: string) => {
      const res = await apiRequest("POST", "/api/candidate-portal/apply", { vagaId });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Candidatura realizada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/candidate-portal/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/candidate-portal/profile"] });
      setSelectedJob(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro na candidatura", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Authentication forms
  const AuthForms = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-between items-center mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setAuthMode(null)}
              className="text-gray-500"
            >
              ← Voltar às Vagas
            </Button>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Portal do Candidato
          </CardTitle>
          <p className="text-gray-600">
            {authMode === 'login' ? 'Acesse sua conta' : 'Crie sua conta'}
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={authMode || 'login'} onValueChange={(value) => setAuthMode(value as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Cadastro</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                loginMutation.mutate({
                  email: formData.get('email') as string,
                  password: formData.get('password') as string
                });
              }} className="space-y-4">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <CurriculumRegistrationForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );

  // Public jobs view
  const PublicJobsView = () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Vagas Disponíveis</h1>
            <Button onClick={() => setAuthMode('login')}>
              Fazer Login
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {jobsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando vagas...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.isArray(jobs) && jobs.map((job: any) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{job.titulo}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4" />
                    {job.empresa}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {job.local}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                    {job.descricao}
                  </p>
                  <div className="flex justify-between items-center">
                    <Badge variant="secondary">{job.tipoContratacao}</Badge>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl" aria-describedby="job-details-description">
                        <DialogHeader>
                          <DialogTitle>{job.titulo}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4" id="job-details-description">
                          <div>
                            <h4 className="font-semibold">Descrição</h4>
                            <p className="text-gray-700">{job.descricao}</p>
                          </div>
                          {job.requisitos && (
                            <div>
                              <h4 className="font-semibold">Requisitos</h4>
                              <p className="text-gray-700">{job.requisitos}</p>
                            </div>
                          )}
                          <div className="pt-4">
                            <p className="text-sm text-gray-600 mb-2">
                              Para se candidatar, faça login ou crie uma conta.
                            </p>
                            <Button 
                              onClick={() => {
                                setAuthMode('register');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }} 
                              className="w-full"
                            >
                              Criar Conta e Candidatar-se
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );

  // Authenticated dashboard
  const AuthenticatedDashboard = () => {
    const queryClient = useQueryClient();
    
    // Buscar dados do candidato
    const { data: candidateData } = useQuery({
      queryKey: ["/api/candidate-portal/profile"],
    });

    // Verificar se precisa fazer o teste DISC
    const { data: historicoDisc = [] } = useQuery({
      queryKey: ["/api/avaliacoes/disc/candidato", candidateData?.candidaturas?.[0]?.candidatoId],
      enabled: !!candidateData?.candidaturas?.[0]?.candidatoId,
    });

    const precisaFazerTesteDISC = historicoDisc.length === 0 || 
      !historicoDisc.some((av: any) => av.status === "finalizada");

    const logoutMutation = useMutation({
      mutationFn: async () => {
        await apiRequest("POST", "/api/candidate-portal/logout");
      },
      onSuccess: () => {
        queryClient.clear();
        onLogout();
        toast({ title: "Logout realizado com sucesso!" });
      },
    });

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Olá, {candidate?.nome}!
                </h1>
                <p className="text-gray-600">Bem-vindo ao seu painel</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Alerta do Teste DISC */}
          {precisaFazerTesteDISC && (
            <div className="mb-6">
              <Card className="border-orange-400 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <Brain className="h-5 w-5" />
                    ⚠️ Teste DISC Obrigatório Pendente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-orange-700 mb-4">
                    Você precisa completar o teste DISC para continuar no processo seletivo. 
                    Este teste é obrigatório para todos os candidatos.
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/portal/disc'}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Fazer Teste DISC Agora
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="jobs">Vagas</TabsTrigger>
              <TabsTrigger value="applications">Minhas Candidaturas</TabsTrigger>
              <TabsTrigger value="tests">Testes</TabsTrigger>
              <TabsTrigger value="interviews">Entrevistas</TabsTrigger>
              <TabsTrigger value="messages">Mensagens</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Candidaturas</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {candidateData?.candidaturas?.length || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Testes Pendentes</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{precisaFazerTesteDISC ? 1 : 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Entrevistas</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Notificações</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="jobs">
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Explore vagas disponíveis
                </h3>
                <p className="text-gray-500">
                  Navegue pelas oportunidades e candidate-se às vagas que interessam.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="applications">
              <div className="space-y-4">
                {candidateData?.candidaturas?.map((candidatura: any) => (
                  <Card key={candidatura.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{candidatura.vaga?.titulo}</h4>
                          <p className="text-sm text-gray-600">{candidatura.vaga?.empresa}</p>
                          <p className="text-sm text-gray-500">
                            Aplicado em: {new Date(candidatura.dataInscricao).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {candidatura.etapa || 'Recebido'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )) || (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      Nenhuma candidatura ainda
                    </h3>
                    <p className="text-gray-500">
                      Candidate-se às vagas para acompanhar seu progresso aqui.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="tests">
              <div className="space-y-4">
                {precisaFazerTesteDISC ? (
                  <Card className="border-orange-400 bg-orange-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Brain className="h-8 w-8 text-orange-600" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-orange-800">Teste DISC Obrigatório</h4>
                          <p className="text-sm text-orange-700">
                            Complete este teste para continuar no processo seletivo.
                          </p>
                        </div>
                        <Button 
                          onClick={() => window.location.href = '/portal/disc'}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          Fazer Teste
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      Todos os testes concluídos
                    </h3>
                    <p className="text-gray-500">
                      Você completou todos os testes obrigatórios.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="interviews">
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Nenhuma entrevista agendada
                </h3>
                <p className="text-gray-500">
                  Suas entrevistas aparecerão aqui quando forem agendadas.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="messages">
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Nenhuma mensagem
                </h3>
                <p className="text-gray-500">
                  Comunicações dos recrutadores aparecerão aqui.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    );
  };

  // Public jobs view  
  const PublicJobsView = () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Vagas Disponíveis</h1>
            <Button onClick={() => setAuthMode('login')}>
              Fazer Login
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {jobsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando vagas...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.isArray(jobs) && jobs.map((job: any) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{job.titulo}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4" />
                    {job.empresa}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 text-sm mb-4">{job.descricao}</p>
                  <Button 
                    onClick={() => setSelectedJob(job)}
                    className="w-full"
                  >
                    Candidatar-se
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
              {Array.isArray(jobs) && jobs.map((job: any) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{job.titulo}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="h-4 w-4" />
                      {job.empresa}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 text-sm mb-4">{job.descricao}</p>
                    <Button 
                      onClick={() => setSelectedJob(job)}
                      className="w-full"
                    >
                      Candidatar-se
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="applications">
            <div className="space-y-4">
              {Array.isArray(myApplications) && myApplications.map((application: any) => (
                <Card key={application.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{application.vaga.titulo}</CardTitle>
                        <p className="text-gray-600">{application.vaga.empresa}</p>
                      </div>
                      <Badge variant={
                        application.etapa === 'aprovado' ? 'default' :
                        application.etapa === 'reprovado' ? 'destructive' : 'secondary'
                      }>
                        {application.etapa}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Aplicado em {new Date(application.dataInscricao).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    {application.comentarios && (
                      <p className="mt-2 text-sm text-gray-700">{application.comentarios}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tests">
            <div className="space-y-4">
              {Array.isArray(pendingTests) && pendingTests.map((test: any) => (
                <Card key={test.id}>
                  <CardHeader>
                    <CardTitle>Teste para {test.vaga.titulo}</CardTitle>
                    <p className="text-gray-600">{test.vaga.empresa}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">{test.status}</Badge>
                      <Button size="sm">Realizar Teste</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!pendingTests || (pendingTests as any[])?.length === 0) && (
                <p className="text-center py-8 text-gray-500">Nenhum teste pendente</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="interviews">
            <div className="space-y-4">
              {Array.isArray(interviews) && interviews.map((interview: any) => (
                <Card key={interview.id}>
                  <CardHeader>
                    <CardTitle>Entrevista - {interview.vaga.titulo}</CardTitle>
                    <p className="text-gray-600">{interview.vaga.empresa}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(interview.dataHora).toLocaleString('pt-BR')}
                      </div>
                      {interview.local && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {interview.local}
                        </div>
                      )}
                      <Badge variant={
                        interview.status === 'agendada' ? 'secondary' :
                        interview.status === 'realizada' ? 'default' : 'destructive'
                      }>
                        {interview.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!interviews || (interviews as any[])?.length === 0) && (
                <p className="text-center py-8 text-gray-500">Nenhuma entrevista agendada</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <div className="space-y-4">
              {Array.isArray(notifications) && notifications.map((notification: any) => (
                <Card key={notification.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{notification.assunto}</CardTitle>
                      <Badge variant={
                        notification.statusEnvio === 'enviado' ? 'default' : 'secondary'
                      }>
                        {notification.tipo}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{notification.mensagem}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(notification.dataEnvio).toLocaleString('pt-BR')}
                    </p>
                  </CardContent>
                </Card>
              ))}
              {(!notifications || (notifications as any[])?.length === 0) && (
                <p className="text-center py-8 text-gray-500">Nenhuma mensagem</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Application Modal */}
      {selectedJob && (
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent aria-describedby="application-dialog-description">
            <DialogHeader>
              <DialogTitle>Candidatar-se à vaga</DialogTitle>
            </DialogHeader>
            <div className="space-y-4" id="application-dialog-description">
              <div>
                <h4 className="font-semibold">{selectedJob.titulo}</h4>
                <p className="text-gray-600">{selectedJob.empresa}</p>
              </div>
              <p className="text-gray-700">{selectedJob.descricao}</p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => applyMutation.mutate(selectedJob.id)}
                  disabled={applyMutation.isPending}
                  className="flex-1"
                >
                  {applyMutation.isPending ? "Enviando..." : "Confirmar Candidatura"}
                </Button>
                <Button variant="outline" onClick={() => setSelectedJob(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  // Show different views based on authentication state
  if (!isAuthenticated) {
    if (authMode !== null) {
      return <AuthForms />;
    }
    return <PublicJobsView />;
  }

  return <AuthenticatedDashboard />;
}
}