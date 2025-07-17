import React from 'react';

interface DashboardCardProps {
  title: string;
  ideal: number;
  atual: number;
  gap: number;
  status: string;
  cor: string;
}

export function DashboardCard({ title, ideal, atual, gap, status, cor }: DashboardCardProps) {
  const borderColor =
    cor === 'vermelho' ? 'border-red-500' :
    cor === 'amarelo' ? 'border-yellow-400' :
    cor === 'azul' ? 'border-blue-500' :
    'border-green-500';
  const textColor =
    cor === 'vermelho' ? 'text-red-600' :
    cor === 'amarelo' ? 'text-yellow-600' :
    cor === 'azul' ? 'text-blue-600' :
    'text-green-600';
  return (
    <div className={`rounded shadow p-4 border-l-8 ${borderColor} bg-white`}> 
      <h3 className="font-bold text-lg">{title}</h3>
      <div className="flex gap-4 mt-2">
        <div>Ideal: <b>{ideal}</b></div>
        <div>Atual: <b>{atual}</b></div>
        <div>Gap: <b>{gap}</b></div>
      </div>
      <div className={`mt-2 text-sm font-semibold ${textColor}`}>Status: {status}</div>
    </div>
  );
} 