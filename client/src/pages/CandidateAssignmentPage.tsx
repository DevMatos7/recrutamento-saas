import React from 'react';
import CandidateAssignment from '../components/CandidateAssignment';
import { 
  Users, 
  UserCheck,
  Building,
  Briefcase
} from 'lucide-react';

const CandidateAssignmentPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header da página */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Atribuição de Candidatos
              </h1>
              <p className="text-gray-600">
                Vincule candidatos a vagas e recrutadores responsáveis
              </p>
            </div>
          </div>
        </div>

        {/* Componente principal */}
        <CandidateAssignment />

        {/* Informações adicionais */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-4">
              <UserCheck className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Como Funciona</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <p>• Selecione um recrutador para cada candidato</p>
              <p>• Use atribuição em lote para distribuir rapidamente</p>
              <p>• Monitore a distribuição de carga de trabalho</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Building className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Recrutadores Disponíveis</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <p>• Administrador Master (Padrão)</p>
              <p>• Gleydson (Real Supermercado)</p>
              <p>• Outros recrutadores do sistema</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Briefcase className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Benefícios</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <p>• Melhor distribuição de trabalho</p>
              <p>• Acompanhamento de produtividade</p>
              <p>• Responsabilidade clara por candidato</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateAssignmentPage; 