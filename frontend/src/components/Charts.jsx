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

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export function MacroDoughnutChart({ totals }) {
  const carbs = Number(totals?.carbohydrates || 0);
  const protein = Number(totals?.protein || 0);
  const fat = Number(totals?.fat || 0);
  const hasValues = carbs + protein + fat > 0;

  if (!hasValues) {
    return (
      <div className="empty-state" style={{ padding: '28px 16px' }}>
        <p style={{ margin: 0 }}>Log food items to see your macronutrient breakdown chart.</p>
      </div>
    );
  }

  const data = {
    labels: [`Carbohydrates (${carbs}g)`, `Protein (${protein}g)`, `Fat (${fat}g)`],
    datasets: [
      {
        data: [carbs, protein, fat],
        backgroundColor: ['#0ea5e9', '#2d6a4f', '#f59e0b'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 16,
          font: { size: 13 },
        },
      },
    },
  };

  return (
    <div style={{ height: 270 }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}

export function WeeklyCaloriesChart({ days = [], goalCalories = 2000 }) {
  if (!days.length) {
    return (
      <div className="empty-state" style={{ padding: '28px 16px' }}>
        <p style={{ margin: 0 }}>No weekly calorie data yet.</p>
      </div>
    );
  }

  const labels = days.map((d) => {
    const [, m, day] = d.date.split('-');
    return `${m}/${day}`;
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'Calories Consumed (kcal)',
        data: days.map((d) => d.calories),
        backgroundColor: days.map((d) =>
          goalCalories > 0 && d.calories > goalCalories ? '#dc2626' : '#2d6a4f'
        ),
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          afterLabel(ctx) {
            return goalCalories ? `Goal: ${goalCalories} kcal` : '';
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: Math.max(goalCalories || 2000, ...days.map((d) => d.calories), 500),
      },
    },
  };

  return (
    <div style={{ height: 270 }}>
      <Bar data={data} options={options} />
    </div>
  );
}
