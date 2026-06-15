import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const API = "http://127.0.0.1:8000";

export default function AnalyticsDashboard({ refreshKey }) {
  const [history, setHistory] = useState([]);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  useEffect(() => {
    fetchHistory();
  }, [refreshKey]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/history`, {
        headers: getAuthHeaders(),
      });

      setHistory(res.data.history || []);
    } catch {
      setHistory([]);
    }
  };

  if (!history.length) {
    return null;
  }

  const trendData = [...history]
    .reverse()
    .map((item, index) => ({
      name: `Interview ${index + 1}`,
      score: item.overall_score || 0,
    }));

  const latest = history[0];

  const skillData = [
    {
      name: "Communication",
      score: latest.communication || 0,
    },
    {
      name: "Technical",
      score: latest.technical_depth || 0,
    },
    {
      name: "Confidence",
      score: latest.confidence || 0,
    },
    {
      name: "Problem Solving",
      score: latest.problem_solving || 0,
    },
  ];

  const scoreDistribution = [
    {
      name: "Excellent",
      value: history.filter((h) => h.overall_score >= 85).length,
    },
    {
      name: "Good",
      value: history.filter(
        (h) => h.overall_score >= 70 && h.overall_score < 85
      ).length,
    },
    {
      name: "Average",
      value: history.filter(
        (h) => h.overall_score >= 50 && h.overall_score < 70
      ).length,
    },
    {
      name: "Needs Work",
      value: history.filter((h) => h.overall_score < 50).length,
    },
  ];

  const COLORS = ["#2563eb", "#7c3aed", "#f59e0b", "#ef4444"];

  return (
    <section className="analytics-section">
      <h2>📊 Interview Analytics Dashboard</h2>
      <p>
        Track your interview performance, skill growth, and score distribution.
      </p>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Score Trend</h3>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#2563eb"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="analytics-card">
          <h3>Latest Skill Breakdown</h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={skillData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="score" fill="#7c3aed" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="analytics-card">
          <h3>Score Distribution</h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={scoreDistribution}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                {scoreDistribution.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="analytics-card insights-card">
          <h3>AI Progress Insights</h3>

          <ul>
            <li>
              Best Score:{" "}
              <strong>
                {Math.max(...history.map((h) => h.overall_score || 0))}/100
              </strong>
            </li>

            <li>
              Average Score:{" "}
              <strong>
                {Math.round(
                  history.reduce(
                    (sum, h) => sum + (h.overall_score || 0),
                    0
                  ) / history.length
                )}
                /100
              </strong>
            </li>

            <li>
              Total Interview Attempts:{" "}
              <strong>{history.length}</strong>
            </li>

            <li>
              Latest Technical Depth:{" "}
              <strong>{latest.technical_depth || 0}/100</strong>
            </li>

            <li>
              Latest Confidence:{" "}
              <strong>{latest.confidence || 0}/100</strong>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}