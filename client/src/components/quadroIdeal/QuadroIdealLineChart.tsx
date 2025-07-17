import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface LineChartProps {
  data: Array<{ data: string; ideal: number }>;
}

export function QuadroIdealLineChart({ data }: LineChartProps) {
  const chartData = {
    labels: data.map(d => d.data),
    datasets: [
      {
        label: 'Ideal',
        data: data.map(d => d.ideal),
        borderColor: 'rgba(34,197,94,1)',
        backgroundColor: 'rgba(34,197,94,0.2)',
        tension: 0.3,
      },
    ],
  };
  return (
    <div className="bg-white rounded shadow p-4 mb-6">
      <h2 className="font-bold mb-2">Evolução Histórica do Quadro Ideal</h2>
      <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
    </div>
  );
} 