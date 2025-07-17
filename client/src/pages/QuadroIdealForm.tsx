import React, { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import axios from 'axios';
import { QuadroIdealForm } from '../components/quadroIdeal/QuadroIdealForm';

export default function QuadroIdealFormPage() {
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const [match, params] = useRoute('/quadro-ideal/:id');
  const isEdit = Boolean(match && params && params.id && params.id !== 'novo');
  const [initialData, setInitialData] = useState<any>(() => (isEdit ? null : {}));

  // Estados para empresas e departamentos reais
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/empresas').then(res => setEmpresas(res.data));
    axios.get('/api/departamentos').then(res => setDepartamentos(res.data));
  }, []);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      axios.get(`/api/quadro-ideal/${params.id}`)
        .then(res => setInitialData(res.data))
        .catch(() => alert('Erro ao carregar dados para edição.'))
        .finally(() => setLoading(false));
    }
  }, [isEdit, params]);

  async function handleSubmit(data: any) {
    setLoading(true);
    try {
      if (isEdit) {
        await axios.put(`/api/quadro-ideal/${params.id}`, data);
      } else {
        await axios.post('/api/quadro-ideal', data);
      }
      navigate('/quadro-ideal');
    } catch (err) {
      alert('Erro ao salvar quadro ideal.');
    } finally {
      setLoading(false);
    }
  }

  if (isEdit && loading && !initialData) return <div>Carregando...</div>;

  return (
    <div className="p-6">
      <QuadroIdealForm
        initialData={initialData}
        empresas={empresas}
        departamentos={departamentos}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  );
} 