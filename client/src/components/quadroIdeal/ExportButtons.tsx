import React from 'react';
import axios from 'axios';

interface ExportButtonsProps {
  className?: string;
}

export function ExportButtons({ className }: ExportButtonsProps) {
  async function handleExport(tipo: 'quadro-ideal' | 'gaps', formato: 'excel' | 'pdf') {
    const url = tipo === 'quadro-ideal'
      ? `/api/relatorios/quadro-ideal/exportar?formato=${formato}`
      : `/api/relatorios/gaps/exportar?formato=${formato}`;
    const res = await axios.get(url, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: formato === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = tipo + (formato === 'pdf' ? '.pdf' : '.xlsx');
    link.click();
  }

  return (
    <div className={className || ''}>
      <div className="flex gap-2 mb-2">
        <button className="bg-gray-700 text-white px-3 py-1 rounded text-xs" onClick={() => handleExport('quadro-ideal', 'excel')}>Exportar Quadro Ideal (.xlsx)</button>
        <button className="bg-gray-700 text-white px-3 py-1 rounded text-xs" onClick={() => handleExport('quadro-ideal', 'pdf')}>Exportar Quadro Ideal (.pdf)</button>
      </div>
      <div className="flex gap-2">
        <button className="bg-gray-500 text-white px-3 py-1 rounded text-xs" onClick={() => handleExport('gaps', 'excel')}>Exportar Gaps (.xlsx)</button>
        <button className="bg-gray-500 text-white px-3 py-1 rounded text-xs" onClick={() => handleExport('gaps', 'pdf')}>Exportar Gaps (.pdf)</button>
      </div>
    </div>
  );
} 