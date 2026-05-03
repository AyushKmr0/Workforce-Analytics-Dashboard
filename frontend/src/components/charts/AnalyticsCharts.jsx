import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Legend, Tooltip);

const colors = ['#2563eb', '#0ea5e9', '#059669', '#d97706', '#dc2626', '#64748b'];

function datasetFromMap(map, label) {
  return {
    labels: Object.keys(map || {}),
    datasets: [
      {
        label,
        data: Object.values(map || {}),
        backgroundColor: colors,
        borderRadius: 8,
      },
    ],
  };
}

export function BarChartCard({ title, values }) {
  return (
    <div className="card p-5">
      <h3 className="mb-4 text-base font-bold text-slate-950">{title}</h3>
      <div className="h-72">
        <Bar
          data={datasetFromMap(values, title)}
          options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }}
        />
      </div>
    </div>
  );
}

export function PieChartCard({ title, values }) {
  return (
    <div className="card p-5">
      <h3 className="mb-4 text-base font-bold text-slate-950">{title}</h3>
      <div className="h-72">
        <Doughnut data={datasetFromMap(values, title)} options={{ responsive: true, maintainAspectRatio: false }} />
      </div>
    </div>
  );
}
