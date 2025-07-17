import React from 'react';

interface FiltrosQuadroIdealProps {
  empresas: { id: string; nome: string }[];
  departamentos: { id: string; nome: string }[];
  cargos: string[];
  statusList: string[];
  filtros: {
    empresaId?: string;
    departamentoId?: string;
    cargo?: string;
    status?: string;
  };
  onChange: (filtros: any) => void;
}

export function FiltrosQuadroIdeal({
  empresas = [],
  departamentos = [],
  cargos = [],
  statusList,
  filtros,
  onChange
}: FiltrosQuadroIdealProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-6 items-end">
      <div>
        <label className="block text-xs font-semibold mb-1">Empresa</label>
        <select
          className="border rounded px-2 py-1"
          value={filtros.empresaId || ''}
          onChange={e => onChange({ ...filtros, empresaId: e.target.value })}
        >
          <option value="">Todas</option>
          {(empresas || []).map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Departamento</label>
        <select
          className="border rounded px-2 py-1"
          value={filtros.departamentoId || ''}
          onChange={e => onChange({ ...filtros, departamentoId: e.target.value })}
        >
          <option value="">Todos</option>
          {(departamentos || []).map(dep => <option key={dep.id} value={dep.id}>{dep.nome}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Cargo</label>
        <select
          className="border rounded px-2 py-1"
          value={filtros.cargo || ''}
          onChange={e => onChange({ ...filtros, cargo: e.target.value })}
        >
          <option value="">Todos</option>
          {(cargos || []).map(cargo => <option key={cargo} value={cargo}>{cargo}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Status</label>
        <select
          className="border rounded px-2 py-1"
          value={filtros.status || ''}
          onChange={e => onChange({ ...filtros, status: e.target.value })}
        >
          <option value="">Todos</option>
          {(statusList || []).map(status => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>
    </div>
  );
} 