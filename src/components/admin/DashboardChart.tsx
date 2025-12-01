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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function DashboardChart({ data }: any) {
  // x-axis: date labels
  const labels = data.map((x: any) =>
    new Date(x.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  );

  // y-axis: transaction count
  const counts = data.map((x: any) => x.count);

  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: "Transactions",
            data: counts,
            borderWidth: 2,
            pointRadius: 3,
          },
        ],
      }}
      options={{
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: { ticks: { color: "#ccc" } },
          y: { ticks: { color: "#ccc" } },
        },
      }}
    />
  );
}
