import React, { useRef, useState } from 'react';
import axios from 'axios';

interface ImportCSVModalProps {
  open: boolean;
  onClose: () => void;
  tipo: 'ideal' | 'real';
  onSuccess?: (msg: string) => void;
}

export function ImportCSVModal({ open, onClose, tipo, onSuccess }: ImportCSVModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!fileRef.current?.files?.[0]) {
      setError('Selecione um arquivo CSV.');
      return;
    }
    setLoading(true);
    setError('');
    setMsg('');
    const formData = new FormData();
    formData.append('file', fileRef.current.files[0]);
    try {
      const url = tipo === 'ideal' ? '/api/quadro-ideal/importar-csv' : '/api/quadro-real/importar-csv';
      const res = await axios.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg(res.data.message || 'Importação concluída!');
      if (onSuccess) onSuccess(res.data.message);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao importar CSV.');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>×</button>
        <h2 className="text-lg font-bold mb-4">Importar CSV ({tipo === 'ideal' ? 'Quadro Ideal' : 'Quadro Real'})</h2>
        <form onSubmit={handleImport}>
          <input type="file" accept=".csv" ref={fileRef} className="mb-3" />
          {error && <div className="text-red-600 mb-2">{error}</div>}
          {msg && <div className="text-green-600 mb-2">{msg}</div>}
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Importando...' : 'Importar'}</button>
        </form>
        <div className="mt-4 text-xs text-gray-500">
          Formato esperado:<br />
          {tipo === 'ideal'
            ? 'departamentoId,cargo,quantidadeIdeal'
            : 'departamentoId,cargo,quantidadeAtual'}
        </div>
      </div>
    </div>
  );
} 