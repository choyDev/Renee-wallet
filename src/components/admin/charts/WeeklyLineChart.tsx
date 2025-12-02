"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

// Helper: get all dates of current week (Mon–Sun)
function getCurrentWeekDates() {
  const today = new Date();
  const day = today.getDay(); // 0=Sun, 1=Mon...
  const monday = new Date(today);

  // Shift to Monday
  monday.setDate(today.getDate() - ((day + 6) % 7));

  // Build the array for 7 days
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    days.push(
      d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    );
  }
  return days;
}

export default function WeeklyLineChart() {
  const labels = getCurrentWeekDates();
  const values = labels.map(() => Math.floor(Math.random() * 1000) + 100);

  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: "Weekly Float (USD)",
            data: values,
            borderColor: "#4ade80",
            backgroundColor: "rgba(74,222,128,0.25)",
            borderWidth: 2,
            tension: 0.4,
            fill: true,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: "#ccc" } },
          y: { ticks: { color: "#ccc" } },
        },
      }}
    />
  );
}
