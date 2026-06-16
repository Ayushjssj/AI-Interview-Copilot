import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const API = import.meta.env.VITE_API_URL;

export default function DashboardStats({ refreshKey }) {
  const [stats, setStats] = useState({
    total_interviews: 0,
    average_score: 0,
    best_score: 0,
    total_reports: 0,
    latest_interview: "No interviews yet",
  });

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchHistoryForChart();
  }, [refreshKey]);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/dashboard-stats`);
      setStats(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchHistoryForChart = async () => {
    try {
      const res = await axios.get(`${API}/history`);

      const formatted = res.data.history
        .slice()
        .reverse()
        .map((item, index) => ({
          name: `Interview ${index + 1}`,
          score: item.overall_score || 0,
        }));

      setChartData(formatted);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <h2>{stats.total_interviews}</h2>
          <p>Total Interviews</p>
        </div>

        <div className="stat-card">
          <h2>{stats.average_score}%</h2>
          <p>Average Score</p>
        </div>

        <div className="stat-card">
          <h2>{stats.best_score}%</h2>
          <p>Best Score</p>
        </div>

        <div className="stat-card">
          <h2>{Math.round((stats.average_score + stats.best_score) / 2)}%</h2>
          <p>AI Readiness</p>
        </div>
      </div>

      <div className="chart-card">
        <h2>📊 Interview Performance Graph</h2>

        {chartData.length === 0 ? (
          <p>No score data available yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="score"
                strokeWidth={4}
                dot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  );
}