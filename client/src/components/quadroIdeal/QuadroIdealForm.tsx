import React, { useState } from 'react';

interface QuadroIdealFormProps {
  initialData?: {
    empresaId?: string;
    departamentoId?: string;
    cargo?: string;
    quantidadeIdeal?: number;
  };
  empresas: { id: string; nome: string }[];
  departamentos: { id: string; nome: string }[];
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export function QuadroIdealForm({ initialData = {}, empresas, departamentos, onSubmit, onCancel, loading }: QuadroIdealFormProps) {
  initialData = initialData || {};
  const [form, setForm] = useState({
    empresaId: initialData.empresaId || '',
    departamentoId: initialData.departamentoId || '',
    cargo: initialData.cargo || '',
    quantidadeIdeal: initialData.quantidadeIdeal || 1
  });
  const [error, setError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.departamentoId || !form.cargo || !form.quantidadeIdeal) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    setError('');
    onSubmit({ ...form, quantidadeIdeal: Number(form.quantidadeIdeal) });
  }

  return (
    <form className="bg-white rounded shadow p-6 max-w-md mx-auto" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold mb-4">{initialData ? 'Editar' : 'Novo'} Quadro Ideal</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="mb-3">
        <label className="block text-xs font-semibold mb-1">Empresa</label>
        <select name="empresaId" value={form.empresaId} onChange={handleChange} className="border rounded px-2 py-1 w-full">
          <option value="">Selecione</option>
          {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
        </select>
      </div>
      <div className="mb-3">
        <label className="block text-xs font-semibold mb-1">Departamento</label>
        <select name="departamentoId" value={form.departamentoId} onChange={handleChange} className="border rounded px-2 py-1 w-full">
          <option value="">Selecione</option>
          {departamentos.map(dep => <option key={dep.id} value={dep.id}>{dep.nome}</option>)}
        </select>
      </div>
      <div className="mb-3">
        <label className="block text-xs font-semibold mb-1">Cargo</label>
        <input name="cargo" value={form.cargo} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
      </div>
      <div className="mb-3">
        <label className="block text-xs font-semibold mb-1">Quantidade Ideal</label>
        <input name="quantidadeIdeal" type="number" min={1} value={form.quantidadeIdeal} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
      </div>
      <div className="flex gap-2 mt-4">
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
        {onCancel && <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={onCancel}>Cancelar</button>}
      </div>
    </form>
  );
} 