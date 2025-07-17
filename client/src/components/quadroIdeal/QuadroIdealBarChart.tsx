import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BarChartProps {
  data: Array<{ cargo: string; ideal: number; atual: number }>;
}

export function QuadroIdealBarChart({ data }: BarChartProps) {
  const chartData = {
    labels: data.map(d => d.cargo),
    datasets: [
      {
        label: 'Ideal',
        data: data.map(d => d.ideal),
        backgroundColor: 'rgba(34,197,94,0.7)', // verde
      },
      {
        label: 'Atual',
        data: data.map(d => d.atual),
        backgroundColor: 'rgba(59,130,246,0.7)', // azul
      },
    ],
  };
  return (
    <div className="bg-white rounded shadow p-4 mb-6">
      <h2 className="font-bold mb-2">Comparativo Ideal x Real por Cargo</h2>
      <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
    </div>
  );
} 